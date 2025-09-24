from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import timedelta
import json, hmac, hashlib

from django.conf import settings
from supabase_auth import User
from .models import Subscription, PaymentMethod
from .utils import initialize_transaction, verify_transaction, refund_transaction
from django_ratelimit.decorators import ratelimit
from django.shortcuts import redirect
import requests
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import re


PAYSTACK_SECRET_KEY = settings.PAYSTACK_SECRET_KEY

def is_valid_email(email: str) -> bool:
    """Simple email regex validation"""
    return bool(re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", str(email)))


def require_fields(data: dict, fields: list):
    """Ensure all required fields exist"""
    missing = [f for f in fields if not data.get(f)]
    if missing:
        return False, f"Missing required field(s): {', '.join(missing)}"
    return True, None


def check_trial_eligibility(user_id):
    """
    Check if user can start a free trial
    Returns: (is_eligible, error_message, error_code)
    """
    # Check existing subscriptions
    existing_subs = Subscription.objects.filter(user_id=user_id)
    
    # Check for active subscriptions
    active_subs = existing_subs.filter(status__in=["active", "trialing"])
    if active_subs.exists():
        return False, "You already have an active subscription", "ALREADY_ACTIVE"
    
    # Check if trial was already used
    trial_used = existing_subs.filter(trial_used=True).exists()
    if trial_used:
        return False, "Free trial already used", "TRIAL_USED"
    
    return True, "Eligible for free trial", None

@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='10/m', block=True)
def check_trial_eligibility_endpoint(request):
    """Check if user can start a free trial"""
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        
        if not user_id:
            return JsonResponse({"error": "user_id required"}, status=400)
        
        # Use the utility function
        is_eligible, message, error_code = check_trial_eligibility(user_id)
        
        if is_eligible:
            return JsonResponse({
                "eligible": True,
                "message": message
            })
        else:
            return JsonResponse({
                "eligible": False,
                "reason": error_code.lower(),
                "message": message
            })
            
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)


@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='10/h', block=True)
def start_trial(request):
    """
    1. User clicks "Start Free Trial".
    2. We initialize a Paystack transaction for card verification ($1.99).
    """
    try:
        data = json.loads(request.body)
        email = data.get("email")
        user_id = data.get("user_id")

        if not email or not user_id:
            return JsonResponse({"error": "Email and user_id are required"}, status=400)

        # Check trial eligibility
        is_eligible, error_message, error_code = check_trial_eligibility(user_id)
        if not is_eligible:
            return JsonResponse({
                "error": error_message,
                "code": error_code
            }, status=400)

        # Step 1: Initialize transaction with $1.99 (in kobo)
        resp = initialize_transaction(
            email=email,
            amount=19900,
            callback_url="http://127.0.0.1:8080/login/",
            metadata={"user_id": user_id, "plan": "trial", "type": "subscription_payment"}
        )
        
        if not resp.get("status"):
            error_msg = resp.get("message", "Failed to initialize transaction")
            return JsonResponse({"error": error_msg}, status=400)

        
        return JsonResponse({
            "authorization_url": resp["data"]["authorization_url"],
            "reference": resp["data"]["reference"],
            "message": "Proceed to payment to start trial"
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)


@csrf_exempt
@require_POST
def verify_card(request):
    """
    Called after Paystack redirects back with a reference.
    Save authorization_code for future charges.
    """
    try:
        data = json.loads(request.body)
        reference = data.get("reference")
        user_id = data.get("user_id")

        if not reference or not user_id:
            return JsonResponse({"error": "Reference and user_id are required"}, status=400)

        resp = verify_transaction(reference)
        if not resp.get("status"):
            return JsonResponse({"error": "Verification failed"}, status=400)

        tx_data = resp["data"]
        auth = tx_data["authorization"]
        customer = tx_data["customer"]

        # Save payment method
        pm = PaymentMethod.objects.create(
            user_id=user_id,
            authorization_code=auth["authorization_code"],
            customer_code=customer["customer_code"],
            last4=auth["last4"],
            card_type=auth["card_type"],
            bank=auth["bank"],
            exp_month=auth["exp_month"],
            exp_year=auth["exp_year"],
            reusable=auth["reusable"],
        )


        Subscription.objects.filter(user_id=user_id, status="trialing").update(payment_method=pm)

        return JsonResponse({"success": True, "card_last4": pm.last4})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)



@csrf_exempt
def paystack_webhook(request):
    # Verify signature
    paystack_signature = request.headers.get('X-Paystack-Signature')
    body = request.body
    
    if not paystack_signature:
        return HttpResponse(status=401)
        
    computed_signature = hmac.new(
        PAYSTACK_SECRET_KEY.encode('utf-8'),
        body,
        hashlib.sha512
    ).hexdigest()

    if computed_signature != paystack_signature:
        return HttpResponse(status=401)

    try:
        event = json.loads(body)
        event_type = event.get("event")
        data = event.get("data", {})

        if event_type == "charge.success":
            metadata = data.get("metadata", {})
            user_id = metadata.get("user_id")
            plan_type = metadata.get("plan_type")
            payment_type = metadata.get("type")
            
            if not user_id:
                return HttpResponse(status=400)
            
            # 🔥 CRITICAL: CAPTURE AND SAVE CARD AUTHORIZATION
            authorization_data = data.get("authorization", {})
            authorization_code = authorization_data.get("authorization_code")
            reusable = authorization_data.get("reusable", False)
            
            if authorization_code and reusable:
                # Save payment method to database
                customer_data = data.get("customer", {})
                
                try:
                    payment_method, created = PaymentMethod.objects.update_or_create(
                        authorization_code=authorization_code,
                        defaults={
                            'user_id': user_id,
                            'customer_code': customer_data.get('customer_code', ''),
                            'last4': authorization_data.get('last4', ''),
                            'card_type': authorization_data.get('card_type', ''),
                            'bank': authorization_data.get('bank', ''),
                            'exp_month': str(authorization_data.get('exp_month', '')),
                            'exp_year': str(authorization_data.get('exp_year', '')),
                            'reusable': reusable
                        }
                    )
                    
                    if created:
                        print(f"💳 NEW card saved for user {user_id}: ****{authorization_data.get('last4', '')}")
                    else:
                        print(f"💳 EXISTING card updated for user {user_id}: ****{authorization_data.get('last4', '')}")
                        
                except Exception as card_error:
                    print(f"❌ Error saving card: {card_error}")
            else:
                if authorization_code:
                    print(f"⚠️ Card not reusable: {authorization_code}")
                else:
                    print("⚠️ No authorization code in webhook")

            if payment_type == "subscription_payment" and plan_type in ["monthly", "yearly"]:
                # Handle paid subscription
                print(f"Processing paid subscription for user {user_id}, plan: {plan_type}")
                
                # Create or update subscription
                subscription, created = Subscription.objects.get_or_create(
                    user_id=user_id,
                    defaults={
                        "plan": plan_type,
                        "status": "active",
                        "amount": 5.00 if plan_type == "monthly" else 50.00,
                        "current_period_start": timezone.now(),
                        "current_period_end": timezone.now() + timedelta(days=30 if plan_type == "monthly" else 365),
                        "trial_used": True,
                    }
                )
                
                if not created:
                    subscription.plan = plan_type
                    subscription.status = "active"
                    subscription.amount = 5.00 if plan_type == "monthly" else 50.00
                    subscription.current_period_start = timezone.now()
                    subscription.current_period_end = timezone.now() + timedelta(days=30 if plan_type == "monthly" else 365)
                    subscription.trial_used = True
                    subscription.save()
                
                print(f"Paid subscription created for user {user_id}: {plan_type}")

            elif payment_type == "trial_verification" or not payment_type:
                # Handle trial verification
                tx_id = data.get("id")
                
                # Refund the trial verification payment
                refund_response = refund_transaction(tx_id)
                if refund_response.get("status"):
                    print(f"Refund successful for trial transaction {tx_id}")
                else:
                    print(f"Refund failed: {refund_response.get('message')}")

                # Create trial subscription
                trial_length_days = 7
                sub, created = Subscription.objects.get_or_create(
                    user_id=user_id,
                    defaults={
                        "plan": "trial",
                        "status": "trialing",
                        "amount": 0,
                        "trial_used": True,
                        "trial_end": timezone.now() + timedelta(days=trial_length_days),
                        "current_period_start": timezone.now(),
                    },
                )
                if not created:
                    sub.plan = "trial"
                    sub.status = "trialing"
                    sub.amount = 0
                    sub.trial_used = True
                    sub.trial_end = timezone.now() + timedelta(days=trial_length_days)
                    sub.current_period_start = timezone.now()
                    sub.current_period_end = None
                    sub.save()

                print(f"Trial subscription started for user {user_id}")

        elif event_type == "subscription.create":
            # Subscription created in Paystack
            subscription_code = data.get("subscription_code")
            customer_code = data.get("customer", {}).get("customer_code")
            
            # Find subscription by customer code or other means and update with subscription_code
            print(f"Subscription created: {subscription_code}")

        elif event_type == "invoice.payment_succeeded":
            # Recurring payment succeeded
            subscription_code = data.get("subscription", {}).get("subscription_code")
            
            # Update subscription period
            subscription = Subscription.objects.filter(subscription_code=subscription_code).first()
            if subscription:
                subscription.current_period_start = timezone.now()
                if subscription.plan == "monthly":
                    subscription.current_period_end = timezone.now() + timedelta(days=30)
                else:
                    subscription.current_period_end = timezone.now() + timedelta(days=365)
                subscription.save()
                print(f"Recurring payment succeeded for subscription: {subscription_code}")

        elif event_type == "subscription.disable":
            # Subscription disabled/cancelled
            subscription_code = data.get("subscription_code")
            Subscription.objects.filter(subscription_code=subscription_code).update(
                status="canceled"
            )
            print(f"Subscription disabled: {subscription_code}")

        return HttpResponse(status=200)
        
    except json.JSONDecodeError:
        return HttpResponse(status=400)
    except Exception as e:
        print(f"Webhook error: {e}")
        return HttpResponse(status=500)

from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect
from django.http import JsonResponse
import requests
from subscriptions.models import PaymentMethod, Subscription
from subscriptions.utils import verify_transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

@csrf_exempt
def payment_callback(request):
    """
    Handle Paystack payment callback and capture authorization codes.
    """
    reference = request.GET.get('reference')
    
    if not reference:
        return redirect("/login?error=no_reference")
    
    # Verify the transaction with Paystack
    verification = verify_transaction(reference)
    
    if not verification.get('status'):
        return redirect(f"/login?error=verification_failed&message={verification.get('message', 'Unknown error')}")
    
    transaction_data = verification['data']
    
    if transaction_data['status'] != 'success':
        return redirect(f"/login?error=payment_failed&message={transaction_data.get('gateway_response', 'Payment failed')}")
    
    # Extract authorization code from successful transaction
    authorization_data = transaction_data.get('authorization', {})
    authorization_code = authorization_data.get('authorization_code')
    
    if not authorization_code:
        return redirect("/login?error=no_authorization_code")
    
    # Get user ID from metadata (you should set this during payment initialization)
    metadata = transaction_data.get('metadata', {})
    user_id = metadata.get('user_id')
    
    if not user_id:
        # Try to get user from customer email as fallback
        customer_email = transaction_data.get('customer', {}).get('email')
        if customer_email:
            try:
                user = User.objects.get(email=customer_email)
                user_id = user.id
            except User.DoesNotExist:
                pass
    
    if not user_id:
        return redirect("/login?error=user_not_found")
    
    try:
        # Create or update payment method
        payment_method, created = PaymentMethod.objects.update_or_create(
            user_id=user_id,
            defaults={
                'authorization_code': authorization_code,
                'customer_code': transaction_data.get('customer', {}).get('customer_code', ''),
                'last4': authorization_data.get('last4', ''),
                'card_type': authorization_data.get('card_type', ''),
                'bank': authorization_data.get('bank', ''),
                'exp_month': str(authorization_data.get('exp_month', '')),
                'exp_year': str(authorization_data.get('exp_year', '')),
                'reusable': authorization_data.get('reusable', False)
            }
        )
        
        # Create or update subscription
        subscription, sub_created = Subscription.objects.update_or_create(
            user_id=user_id,
            defaults={
                'payment_method': payment_method,
                'plan': 'trial',
                'status': 'trialing',
                'trial_start': timezone.now(),
                'trial_end': timezone.now() + timedelta(days=7),
                'trial_used': False,
                'current_period_start': timezone.now(),
            }
        )
        
        # Call logout API (assuming it's exposed at /api/logout/)
        try:
            logout_url = request.build_absolute_uri("/api/logout/")
            requests.post(logout_url, cookies=request.COOKIES, timeout=5)
        except Exception as e:
            print(f"Logout call failed: {e}")
        
        # Redirect to success page
        return redirect("/login?payment=success")
        
    except Exception as e:
        print(f"Error processing payment callback: {e}")
        return redirect(f"/login?error=processing_error&message={str(e)}")


@csrf_exempt
def check_subscription_status(request):
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")

        if not user_id:
            return JsonResponse({"error": "user_id is required"}, status=400)
        active_sub = Subscription.objects.filter(user_id=user_id).order_by("-created_at").first()

        if not active_sub:
            return JsonResponse({
                "has_access": False,
                "status": "none",
                "plan": None,
                "amount": 0,
                "trial_end": None,
                "current_period_end": None,
                "in_trial": False,
                "trial_has_ended": False,
                "days_remaining": 0,
                "is_active": False,
                "subscription_code": None,
                "created_at": None,
            })

        now = timezone.now()
        days_remaining = 0
        in_trial = False
        trial_has_ended = False

        # Trial check
        if active_sub.status == "trialing" and active_sub.trial_end:
            delta = active_sub.trial_end - now
            days_remaining = max(0, delta.days)
            in_trial = True
            trial_has_ended = now > active_sub.trial_end

        # Active subscription check
        elif active_sub.status == "active" and active_sub.current_period_end:
            delta = active_sub.current_period_end - now
            days_remaining = max(0, delta.days)

        response = {
            "has_access": bool(active_sub.is_active() if callable(active_sub.is_active) else active_sub.is_active),
    "status": active_sub.status,
    "plan": active_sub.plan,
    "amount": float(active_sub.amount or 0),
    "trial_end": active_sub.trial_end.isoformat() if active_sub.trial_end else None,
    "current_period_end": active_sub.current_period_end.isoformat() if active_sub.current_period_end else None,
    "in_trial": in_trial,
    "trial_has_ended": trial_has_ended,
    "days_remaining": days_remaining,
    "is_active": bool(active_sub.is_active() if callable(active_sub.is_active) else active_sub.is_active),
    "subscription_code": active_sub.subscription_code,
    "created_at": active_sub.created_at.isoformat() if active_sub.created_at else None,
        }

        return JsonResponse(response)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": "Internal server error"}, status=500)


from .utils import create_subscription, disable_subscription, PAYSTACK_PLAN_CODES


@csrf_exempt
@require_POST
@ratelimit(key='ip', rate='5/h', block=True)
def start_paid_subscription(request):
    """
    Start a monthly or yearly paid subscription
    """
    try:
        data = json.loads(request.body)
        email = data.get("email")
        user_id = data.get("user_id")
        plan_type = data.get("plan_type")  # "monthly" or "yearly"

        if not email or not user_id or not plan_type:
            return JsonResponse({"error": "Email, user_id, and plan_type are required"}, status=400)

        if plan_type not in ["monthly", "yearly"]:
            return JsonResponse({"error": "Invalid plan type"}, status=400)

        # Check if user already has an active subscription
        active_sub = Subscription.objects.filter(
            user_id=user_id,
            status__in=["active"]
        ).first()

        if active_sub and active_sub.status == "active":
            return JsonResponse({
                "error": "You already have an active subscription. Please Navigate to dashboard",
                "code": "ALREADY_ACTIVE"
            }, status=400)

        # Use Paystack plan code instead of raw amount
        plan_code = PAYSTACK_PLAN_CODES.get(plan_type)
        if not plan_code:
            return JsonResponse({"error": "Invalid plan type"}, status=400)

        # Initialize transaction (no need to pass amount, just plan code inside metadata)
        resp = initialize_transaction(
            email=email,
            plan=plan_code,  # amount will be tied to plan_code on Paystack
            callback_url="http://127.0.0.1:8080/login/",
            metadata={
                "user_id": user_id,
                "plan_type": plan_type,
                "type": "subscription_payment"
            }
        )

        if not resp.get("status"):
            error_msg = resp.get("message", "Failed to initialize transaction")
            return JsonResponse({"error": error_msg}, status=400)

        return JsonResponse({
            "authorization_url": resp["data"]["authorization_url"],
            "reference": resp["data"]["reference"],
            "message": f"Proceed to payment for {plan_type} subscription"
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception:
        return JsonResponse({"error": "Internal server error"}, status=500)

    

@csrf_exempt
@require_POST
def create_recurring_subscription(request):
    """
    Create recurring subscription after initial payment is verified
    """
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        plan_type = data.get("plan_type")
        authorization_code = data.get("authorization_code")
        customer_code = data.get("customer_code")

        if not all([user_id, plan_type, authorization_code, customer_code]):
            return JsonResponse({"error": "Missing required parameters"}, status=400)

        # Get the Paystack plan code
        plan_code = PAYSTACK_PLAN_CODES.get(plan_type)
        if not plan_code:
            return JsonResponse({"error": "Invalid plan type"}, status=400)

        # Create subscription in Paystack
        resp = create_subscription(customer_code, plan_code, authorization_code)
        
        if not resp.get("status"):
            error_msg = resp.get("message", "Failed to create subscription")
            return JsonResponse({"error": error_msg}, status=400)

        subscription_data = resp["data"]
        
        # Update our subscription record
        subscription = Subscription.objects.get(user_id=user_id, plan=plan_type)
        subscription.subscription_code = subscription_data["subscription_code"]
        subscription.status = "active"
        subscription.amount = 5.00 if plan_type == "monthly" else 50.00
        subscription.current_period_start = timezone.now()
        
        # Set period end based on plan type
        if plan_type == "monthly":
            subscription.current_period_end = timezone.now() + timedelta(days=30)
        else:
            subscription.current_period_end = timezone.now() + timedelta(days=365)
            
        subscription.save()

        return JsonResponse({
            "success": True,
            "subscription_code": subscription_data["subscription_code"],
            "message": f"{plan_type.capitalize()} subscription created successfully"
        })

    except Subscription.DoesNotExist:
        return JsonResponse({"error": "Subscription not found"}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)
    

@csrf_exempt
@require_POST
def cancel_subscription(request):
    """
    Cancel a subscription
    """
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        
        if not user_id:
            return JsonResponse({"error": "user_id required"}, status=400)

        # Get active subscription
        subscription = Subscription.objects.filter(
            user_id=user_id, 
            status__in=["active", "trialing"]
        ).first()
        
        if not subscription:
            return JsonResponse({"error": "No active subscription found"}, status=404)

        # If it's a Paystack subscription, disable it
        if subscription.subscription_code:
            resp = disable_subscription(subscription.subscription_code)
            if not resp.get("status"):
                print(f"Failed to disable Paystack subscription: {resp.get('message')}")

        # Update our record
        subscription.status = "canceled"
        subscription.save()

        return JsonResponse({
            "success": True,
            "message": "Subscription canceled successfully"
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)
    

@csrf_exempt
def create_test_payment(request):
    """Create a test payment (for development only)"""
    user = request.user
    
    # For test mode, we'll simulate a successful payment
    test_auth_codes = [
        "AUTH_72btv2fq12",  # Test visa card
        "AUTH_8dh2bafq93",  # Test mastercard
        "AUTH_x1p3h5fq47",  # Test verve card
    ]
    
    # Select a test auth code based on user ID
    import hashlib
    user_hash = hashlib.md5(str(user.id).encode()).hexdigest()
    test_index = int(user_hash, 16) % len(test_auth_codes)
    auth_code = test_auth_codes[test_index]
    
    try:
        # Create test payment method
        payment_method, created = PaymentMethod.objects.update_or_create(
            user_id=user.id,
            defaults={
                'authorization_code': auth_code,
                'customer_code': f"CUST_TEST_{user.id}",
                'last4': '1234',
                'card_type': 'visa',
                'bank': 'Test Bank',
                'exp_month': '12',
                'exp_year': '2025',
                'reusable': True
            }
        )
        
        # Create test subscription
        from django.utils import timezone
        from datetime import timedelta
        
        subscription, sub_created = Subscription.objects.update_or_create(
            user_id=user.id,
            defaults={
                'payment_method': payment_method,
                'plan': 'trial',
                'status': 'trialing',
                'trial_start': timezone.now(),
                'trial_end': timezone.now() + timedelta(days=7),
                'trial_used': False,
                'current_period_start': timezone.now(),
                'amount': 0.00
            }
        )
        
        return redirect("/login?payment=success&test_mode=true")
        
    except Exception as e:
        print(f"Error creating test payment: {e}")
        return redirect(f"/payment-error?error={str(e)}")
    
###################################################################################
# card management views
###################################################################################

import uuid
from django.core.cache import cache

# Add these views to your existing views.py
@csrf_exempt
@require_POST
def get_customer_cards(request):
    """
    Get customer's saved payment methods
    """
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        
        if not user_id:
            return JsonResponse({"error": "user_id is required"}, status=400)
            
        payment_methods = PaymentMethod.objects.filter(user_id=user_id, reusable=True)
        
        cards = []
        for pm in payment_methods:
            cards.append({
                "id": pm.id,
                "authorization_code": pm.authorization_code,
                "last4": pm.last4,
                "card_type": pm.card_type,
                "bank": pm.bank,
                "exp_month": pm.exp_month,
                "exp_year": pm.exp_year,
                "brand": pm.card_type,  # Same as card_type for Paystack
                "is_default": pm.is_default if hasattr(pm, 'is_default') else False,
                "created_at": pm.created_at.isoformat() if pm.created_at else None
            })
        
        return JsonResponse({
            "cards": cards,
            "card_count": len(cards),
            "max_cards": 3,
            "can_add_more": len(cards) < 3
            })
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)

@csrf_exempt
@require_POST
def initialize_card_update(request):
    """
    Initialize card update process - creates a verification payment
    """
    try:
        data = json.loads(request.body)
        email = data.get("email")
        user_id = data.get("user_id")
        action = data.get("action", "update")  # "update" or "add"
        
        if not email or not user_id:
            return JsonResponse({"error": "Email and user_id are required"}, status=400)

        current_card_count = PaymentMethod.objects.filter(user_id=user_id, reusable=True).count()
        MAX_CARDS_PER_USER = 3
        
        if current_card_count >= MAX_CARDS_PER_USER:
            return JsonResponse({
                "error": f"Maximum limit of {MAX_CARDS_PER_USER} payment methods reached. Please remove an existing card before adding a new one.",
                "code": "CARD_LIMIT_REACHED",
                "current_count": current_card_count,
                "max_limit": MAX_CARDS_PER_USER
            }, status=400)
        
        
        reference = f"card_update_{uuid.uuid4().hex[:10]}"
        
        # Small verification amount (100 kobo = 1 Naira)
        amount = 100  # 1 Naira for card verification
        
        # Initialize transaction for card authorization
        resp = initialize_transaction(
            email=email,
            amount=amount,
            callback_url=f"{settings.FRONTEND_URL}/dashboard/",
            metadata={
                "user_id": user_id,
                "action": action,
                "type": "card_verification",
                "reference": reference
            }
        )
        
        if not resp.get("status"):
            error_msg = resp.get("message", "Failed to initialize card update")
            return JsonResponse({"error": error_msg}, status=400)

        # Store the reference in cache for verification
        cache_key = f"card_update_{reference}"
        cache.set(cache_key, {
            "user_id": user_id,
            "email": email,
            "action": action,
            "timestamp": timezone.now().isoformat()
        }, timeout=3600)  # 1 hour expiration

        return JsonResponse({
            "authorization_url": resp["data"]["authorization_url"],
            "reference": reference,
            "access_code": resp["data"].get("access_code", ""),
            "message": "Proceed to card verification"
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)

@csrf_exempt
@require_POST
def verify_card_update(request):
    """
    Verify card update transaction and save the new card
    """
    try:
        data = json.loads(request.body)
        reference = data.get("reference")
        user_id = data.get("user_id")
        
        if not reference or not user_id:
            return JsonResponse({"error": "Reference and user_id are required"}, status=400)

        # Verify the transaction with Paystack
        resp = verify_transaction(reference)
        if not resp.get("status"):
            return JsonResponse({"error": "Card verification failed"}, status=400)

        tx_data = resp["data"]
        
        if tx_data['status'] != 'success':
            return JsonResponse({"error": "Payment failed"}, status=400)

        authorization_data = tx_data.get("authorization", {})
        customer_data = tx_data.get("customer", {})
        
        authorization_code = authorization_data.get("authorization_code")
        if not authorization_code:
            return JsonResponse({"error": "No authorization code received"}, status=400)

        # Check if this card already exists for the user
        existing_card = PaymentMethod.objects.filter(
            user_id=user_id, 
            authorization_code=authorization_code
        ).first()
        
        if existing_card:
            return JsonResponse({
                "success": True,
                "message": "Card already exists",
                "card_last4": existing_card.last4,
                "action": "existing"
            })

        # Create new payment method
        new_card = PaymentMethod.objects.create(
            user_id=user_id,
            authorization_code=authorization_code,
            customer_code=customer_data.get("customer_code", ""),
            last4=authorization_data.get("last4", ""),
            card_type=authorization_data.get("card_type", ""),
            bank=authorization_data.get("bank", ""),
            exp_month=str(authorization_data.get("exp_month", "")),
            exp_year=str(authorization_data.get("exp_year", "")),
            reusable=authorization_data.get("reusable", False)
        )

        # Refund the verification payment (optional)
        try:
            refund_response = refund_transaction(tx_data.get("id"))
            if refund_response.get("status"):
                print(f"Card verification refund successful for user {user_id}")
        except Exception as refund_error:
            print(f"Refund failed: {refund_error}")

        return JsonResponse({
            "success": True,
            "message": "Card added successfully",
            "card_last4": new_card.last4,
            "card_id": new_card.id,
            "action": "added"
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)

@csrf_exempt
@require_POST
def set_default_card(request):
    """
    Set a card as default for the user
    """
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        card_id = data.get("card_id")
        
        if not user_id or not card_id:
            return JsonResponse({"error": "user_id and card_id are required"}, status=400)

        # First, remove default status from all user's cards
        PaymentMethod.objects.filter(user_id=user_id).update(is_default=False)
        
        # Set the selected card as default
        updated = PaymentMethod.objects.filter(
            user_id=user_id, 
            id=card_id
        ).update(is_default=True)
        
        if not updated:
            return JsonResponse({"error": "Card not found"}, status=404)

        # Update any active subscription to use this card
        active_subscription = Subscription.objects.filter(
            user_id=user_id,
            status__in=["active", "trialing"]
        ).first()
        
        if active_subscription:
            new_card = PaymentMethod.objects.get(id=card_id)
            active_subscription.payment_method = new_card
            active_subscription.save()

        return JsonResponse({
            "success": True,
            "message": "Default card updated successfully"
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)

@csrf_exempt
@require_POST
def remove_card(request):
    """
    Remove a card from user's account
    """
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        card_id = data.get("card_id")
        
        if not user_id or not card_id:
            return JsonResponse({"error": "user_id and card_id are required"}, status=400)

        # Check if this card is being used in active subscription
        active_subscription = Subscription.objects.filter(
            user_id=user_id,
            payment_method_id=card_id,
            status__in=["active", "trialing"]
        ).first()
        
        if active_subscription:
            return JsonResponse({
                "error": "Cannot remove card that is used in active subscription"
            }, status=400)

        # Get the card before deletion to return info
        card = PaymentMethod.objects.filter(user_id=user_id, id=card_id).first()
        if not card:
            return JsonResponse({"error": "Card not found"}, status=404)

        card_last4 = card.last4
        card.delete()

        return JsonResponse({
            "success": True,
            "message": f"Card ending with {card_last4} removed successfully"
        })

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)

@csrf_exempt
def card_update_callback(request):
    """
    Handle Paystack callback for card updates
    """
    reference = request.GET.get('reference')
    
    if not reference:
        return redirect(f"{settings.FRONTEND_URL}/billing?error=no_reference")
    
    # Verify the transaction
    verification = verify_transaction(reference)
    
    if not verification.get('status'):
        return redirect(f"{settings.FRONTEND_URL}/billing?error=verification_failed")
    
    tx_data = verification['data']
    
    if tx_data['status'] != 'success':
        return redirect(f"{settings.FRONTEND_URL}/billing?error=payment_failed")
    
    # Extract metadata
    metadata = tx_data.get('metadata', {})
    user_id = metadata.get('user_id')
    action = metadata.get('action', 'update')
    
    if not user_id:
        return redirect(f"{settings.FRONTEND_URL}/billing?error=user_not_found")
    
    # Process the card update
    authorization_data = tx_data.get('authorization', {})
    customer_data = tx_data.get('customer', {})
    
    authorization_code = authorization_data.get('authorization_code')
    if not authorization_code:
        return redirect(f"{settings.FRONTEND_URL}/billing?error=no_authorization_code")
    
    try:
        # Save the new payment method
        new_card = PaymentMethod.objects.create(
            user_id=user_id,
            authorization_code=authorization_code,
            customer_code=customer_data.get('customer_code', ''),
            last4=authorization_data.get('last4', ''),
            card_type=authorization_data.get('card_type', ''),
            bank=authorization_data.get('bank', ''),
            exp_month=str(authorization_data.get('exp_month', '')),
            exp_year=str(authorization_data.get('exp_year', '')),
            reusable=authorization_data.get('reusable', False)
        )
        
        # Refund the verification payment
        try:
            refund_response = refund_transaction(tx_data.get("id"))
            if refund_response.get("status"):
                print(f"Card verification refund successful for user {user_id}")
        except Exception as refund_error:
            print(f"Refund failed: {refund_error}")
        
        return redirect(f"{settings.FRONTEND_URL}/billing?card_update=success&last4={new_card.last4}")
        
    except Exception as e:
        return redirect(f"{settings.FRONTEND_URL}/billing?error=processing_error")
    
@csrf_exempt
@require_POST
def test_add_card(request):
    """
    TEST ENDPOINT: Add a test card without Paystack
    """
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        
        if not user_id:
            return JsonResponse({"error": "user_id is required"}, status=400)

        # Create test payment method
        import uuid
        test_card = PaymentMethod.objects.create(
            user_id=user_id,
            authorization_code=f"AUTH_test_{uuid.uuid4().hex[:8]}",
            customer_code=f"CUST_test_{user_id}",
            last4="5050",
            card_type="visa",
            bank="Test Bank",
            exp_month="12",
            exp_year="2025",
            reusable=True,
            is_default=False
        )

        return JsonResponse({
            "success": True,
            "message": "Test card added successfully",
            "card": {
                "id": test_card.id,
                "last4": test_card.last4,
                "card_type": test_card.card_type,
                "bank": test_card.bank,
                "exp_month": test_card.exp_month,
                "exp_year": test_card.exp_year,
                "is_default": test_card.is_default
            }
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)