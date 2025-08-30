from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils import timezone
from datetime import timedelta
import json, hmac, hashlib

from django.conf import settings
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
            metadata={"user_id": user_id}
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

        if event_type == "charge.success":
            data = event["data"]
            reference = data["reference"]
            email = data["customer"]["email"]
            tx_id = data["id"]
            auth = data["authorization"]
            user_id = data["metadata"].get("user_id")

            if not user_id:
                return HttpResponse(status=400)

            # Check if subscription already exists for this user
            existing_sub = Subscription.objects.filter(user_id=user_id).first()
            
            if existing_sub:
                # Update existing subscription if needed
                if not existing_sub.payment_method:
                    pm = PaymentMethod.objects.create(
                        user_id=existing_sub.user_id,
                        authorization_code=auth["authorization_code"],
                        customer_code=data["customer"]["customer_code"],
                        last4=auth["last4"],
                        card_type=auth["card_type"],
                        bank=auth["bank"],
                        exp_month=auth["exp_month"],
                        exp_year=auth["exp_year"],
                        reusable=auth["reusable"],
                    )
                    existing_sub.payment_method = pm
                    existing_sub.status = "trialing"
                    existing_sub.trial_used = True
                    existing_sub.trial_start = timezone.now()
                    existing_sub.trial_end = timezone.now() + timedelta(days=7)
                    existing_sub.save()
            else:
                # CREATE SUBSCRIPTION HERE - only after successful payment
                pm = PaymentMethod.objects.create(
                    user_id=user_id,
                    authorization_code=auth["authorization_code"],
                    customer_code=data["customer"]["customer_code"],
                    last4=auth["last4"],
                    card_type=auth["card_type"],
                    bank=auth["bank"],
                    exp_month=auth["exp_month"],
                    exp_year=auth["exp_year"],
                    reusable=auth["reusable"],
                )
                
                Subscription.objects.create(
                    user_id=user_id,
                    payment_method=pm,
                    status="trialing",
                    trial_end=timezone.now() + timedelta(days=7),
                    trial_started_at=timezone.now(),
                    trial_used=True,
                )

            # Refund the $1.99 (trial check)
            refund_response = refund_transaction(tx_id)
            
            # Log refund result
            if refund_response.get("status"):
                print(f"Refund successful for transaction {tx_id}")
            else:
                print(f"Refund failed: {refund_response.get('message')}")

        elif event_type == "charge.failed":
            # Payment failed - don't create subscription
            data = event["data"]
            user_id = data["metadata"].get("user_id")
            print(f"Payment failed for user {user_id}. No subscription created.")

        elif event_type == "invoice.create":
            # Paystack generated an invoice (end of trial / recurring charge)
            pass

        elif event_type == "invoice.payment_failed":
            subscription_code = event["data"]["subscription"]["subscription_code"]
            Subscription.objects.filter(subscription_code=subscription_code).update(
                status="inactive"
            )

        elif event_type == "subscription.disable":
            subscription_code = event["data"]["subscription_code"]
            Subscription.objects.filter(subscription_code=subscription_code).update(
                status="canceled"
            )

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
@require_POST
def check_subscription_status(request):
    """Check if user has an active subscription/trial"""
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        
        if not user_id:
            return JsonResponse({"error": "user_id required"}, status=400)
        
        # Get active subscription
        active_sub = Subscription.objects.filter(
            user_id=user_id, 
            status__in=["active", "trialing"]
        ).first()
        
        if active_sub:
            return JsonResponse({
                "has_access": True,
                "status": active_sub.status,
                "trial_end": active_sub.trial_end.isoformat() if active_sub.trial_end else None,
                "in_trial": active_sub.in_trial(),
                "trial_has_ended": active_sub.trial_has_ended()
            })
        else:
            return JsonResponse({
                "has_access": False,
                "status": "no_subscription",
                "message": "No active subscription found"
            })
            
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "Internal server error"}, status=500)