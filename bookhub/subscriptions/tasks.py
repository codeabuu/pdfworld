from background_task import background
from django.utils import timezone
from datetime import timedelta
from .models import Subscription
from .utils import charge_authorization

@background(schedule=60*60*24)  # Run every 24 hours
def handle_expired_trials_task():
    # Find all expired trials that haven't been converted yet
    expired_trials = Subscription.objects.filter(
        status="trialing",
        trial_end__lte=timezone.now(),
        trial_used=True
    )
    
    print(f"Found {expired_trials.count()} expired trials to process")
    
    success_count = 0
    fail_count = 0
    
    for subscription in expired_trials:
        try:
            # Check if user has a payment method
            if not subscription.payment_method:
                print(f"User {subscription.user_id} has no payment method. Subscription canceled.")
                subscription.status = "canceled"
                subscription.save()
                continue
            
            # Charge the user for the monthly plan (default)
            amount = 50000  # $5 in kobo
            
            # You need to get the user's email - you might need to store it in your model
            # For now, let's assume you have a way to get it
            user_email = get_user_email(subscription.user_id)  # You need to implement this
            
            resp = charge_authorization(
                subscription.payment_method.authorization_code,
                user_email,
                amount
            )
            
            if resp.get("status"):
                # Charge successful - convert to paid subscription
                subscription.plan = "monthly"
                subscription.status = "active"
                subscription.amount = 5.00
                subscription.current_period_start = timezone.now()
                subscription.current_period_end = timezone.now() + timedelta(days=30)
                subscription.save()
                
                print(f"Successfully charged user {subscription.user_id} and converted to monthly plan")
                success_count += 1
            else:
                # Charge failed
                print(f"Failed to charge user {subscription.user_id}: {resp.get('message')}")
                subscription.status = "past_due"
                subscription.save()
                fail_count += 1
                
        except Exception as e:
            print(f"Error processing subscription for user {subscription.user_id}: {str(e)}")
            fail_count += 1
    
    print(f"Process completed: {success_count} successful, {fail_count} failed")

# Helper function to get user email (you need to implement this based on your user model)
def get_user_email(user_id):
    # This depends on how you store user emails
    # If you have a User model, you might do:
    # from django.contrib.auth import get_user_model
    # User = get_user_model()
    # user = User.objects.get(id=user_id)
    # return user.email
    
    # For now, return a placeholder - you NEED to implement this properly
    return f"user_{user_id}@example.com"