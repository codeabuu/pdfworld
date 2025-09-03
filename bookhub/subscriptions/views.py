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

PAYSTACK_SECRET_KEY = settings.PAYSTACK_SECRET_KEY

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
            callback_url=f"{settings.LIVE_URL}/api/payment-callback/",
            metadata={"user_id": user_id, "plan": "trial"}
        )
        
        if not resp.get("status"):
            error_msg = resp.get("message", "Failed to initialize transaction")
            return JsonResponse({"error": error_msg}, status=400)

        # DON'T create subscription here - wait for webhook confirmation
        # Just return the Paystack URL for payment

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

        # Attach to user subscription (if subscription exists from webhook)
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

@csrf_exempt
def payment_callback(request):
    """
    User gets redirected here after Paystack payment (success or failure)
    """
    reference = request.GET.get("reference")
    user_id = request.GET.get("user_id")
    trxref = request.GET.get("trxref")  # Paystack often uses trxref parameter

    if not reference:
        return JsonResponse({"error": "Missing reference"}, status=400)

    # Verify the transaction to check if it was successful
    resp = verify_transaction(reference)
    if not resp.get("status"):
        return JsonResponse({
            "success": False, 
            "message": "Payment verification failed",
            "status": "failed"
        })

    # Check if payment was successful - Paystack structure is different
    tx_data = resp["data"]
    
    # Paystack uses different status indicators
    if tx_data.get("status") == "success" or tx_data.get("gateway_response") == "Successful":
        return JsonResponse({
            "success": True, 
            "message": "Payment completed successfully. Your trial has started!",
            "reference": reference,
            "status": "success",
            "amount": tx_data.get("amount"),
            "currency": tx_data.get("currency")
        })
    else:
        # Payment failed or was abandoned
        return JsonResponse({
            "success": False,
            "message": f"Payment status: {tx_data.get('gateway_response', 'Unknown status')}",
            "reference": reference,
            "status": "failed",
            "gateway_response": tx_data.get("gateway_response")
        })
    


@csrf_exempt
def check_subscription_status(request):
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")

        if not user_id:
            return JsonResponse({"error": "user_id is required"}, status=400)

        # ✅ Skip User model — directly check subscriptions by user_id
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
            callback_url=f"{settings.LIVE_URL}/api/payment-callback/",
            metadata={
                "user_id": user_id,
                "plan_type": plan_type,
                # "plan_code": plan_code,
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