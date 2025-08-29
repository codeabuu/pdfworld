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

@csrf_exempt
@require_POST
def check_trial_eligibility(request):
    """Check if user can start a free trial"""
    try:
        data = json.loads(request.body)
        user_id = data.get("user_id")
        
        if not user_id:
            return JsonResponse({"error": "user_id required"}, status=400)
        
        # Check existing subscriptions
        existing_subs = Subscription.objects.filter(user_id=user_id)
        
        # Check for active subscriptions
        active_subs = existing_subs.filter(status__in=["active", "trialing"])
        if active_subs.exists():
            return JsonResponse({
                "eligible": False,
                "reason": "already_active",
                "message": "You already have an active subscription"
            })
        
        # Check if trial was already used
        trial_used = existing_subs.filter(trial_used=True).exists()
        if trial_used:
            return JsonResponse({
                "eligible": False,
                "reason": "trial_used",
                "message": "Free trial already used"
            })
        
        return JsonResponse({
            "eligible": True,
            "message": "Eligible for free trial"
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

        # Check if user already has a subscription or used trial
        existing_subs = Subscription.objects.filter(user_id=user_id)
        
        # Check for active subscriptions
        active_subs = existing_subs.filter(status__in=["active", "trialing"])
        if active_subs.exists():
            return JsonResponse({
                "error": "You already have an active subscription",
                "code": "ALREADY_ACTIVE"
            }, status=400)
        
        # Check if user already used their trial
        trial_used = existing_subs.filter(trial_used=True).exists()
        if trial_used:
            return JsonResponse({
                "error": "Free trial already used",
                "code": "TRIAL_USED"
            }, status=400)

        # Step 1: Initialize transaction with $1.99 (in kobo)
        resp = initialize_transaction(
            email=email,
            amount=19900,
            callback_url="https://af402b4a2dd7.ngrok-free.app/api/payment-callback/",
            metadata={"user_id": user_id}
        )
        
        if not resp.get("status"):
            error_msg = resp.get("message", "Failed to initialize transaction")
            return JsonResponse({"error": error_msg}, status=400)

        # Step 2: Create Subscription entry in DB
        sub = Subscription.objects.create(
            user_id=user_id,
            status="trialing",
            trial_end=timezone.now() + timedelta(days=7),
            trial_started_at=timezone.now(),
            trial_used=True,  # Mark trial as used
        )

        return JsonResponse({
            "authorization_url": resp["data"]["authorization_url"],
            "reference": resp["data"]["reference"],
            "subscription_id": sub.id,
            "message": "Trial started successfully"
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
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    data = json.loads(request.body)
    reference = data.get("reference")
    user_id = data.get("user_id")

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

    # Attach to user subscription
    Subscription.objects.filter(user_id=user_id, status="trialing").update(payment_method=pm)

    return JsonResponse({"success": True, "card_last4": pm.last4})


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

            # Save PaymentMethod if not already
            user_sub = Subscription.objects.filter(
                user_id=user_id, 
                status="trialing"
            ).first()
            
            if user_sub:
                if not user_sub.payment_method:
                    pm = PaymentMethod.objects.create(
                        user_id=user_sub.user_id,
                        authorization_code=auth["authorization_code"],
                        customer_code=data["customer"]["customer_code"],
                        last4=auth["last4"],
                        card_type=auth["card_type"],
                        bank=auth["bank"],
                        exp_month=auth["exp_month"],
                        exp_year=auth["exp_year"],
                        reusable=auth["reusable"],
                    )
                    user_sub.payment_method = pm
                    user_sub.trial_used = True
                    user_sub.save()

                # Refund the $1.99 (trial check)
                refund_response = refund_transaction(tx_id)
                
                # Log refund result
                if refund_response.get("status"):
                    print(f"Refund successful for transaction {tx_id}")
                else:
                    print(f"Refund failed: {refund_response.get('message')}")

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
    User gets redirected here after Paystack payment
    """
    reference = request.GET.get("reference")
    user_id = request.GET.get("user_id")  # You might want to pass this in your callback URL

    if not reference:
        return JsonResponse({"error": "Missing reference"}, status=400)

    # Just verify and return success - webhook handles the rest
    resp = verify_transaction(reference)
    if not resp.get("status"):
        return JsonResponse({"error": "Verification failed"}, status=400)

    # Redirect to success page or return success
    return JsonResponse({
        "success": True, 
        "message": "Payment completed successfully. Refund will be processed shortly."
    })

@csrf_exempt
def payment_callback(request):
    """
    User gets redirected here after Paystack payment
    """
    reference = request.GET.get("reference")
    user_id = request.GET.get("user_id")

    if not reference:
        return JsonResponse({"error": "Missing reference"}, status=400)

    # Verify the transaction
    resp = verify_transaction(reference)
    if not resp.get("status"):
        return JsonResponse({"error": "Verification failed"}, status=400)

    # Redirect to success page or return success
    return JsonResponse({
        "success": True, 
        "message": "Payment completed successfully. Refund will be processed shortly.",
        "reference": reference
    })