from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from subscriptions.models import Subscription, PaymentMethod
from subscriptions.utils import charge_authorization

class Command(BaseCommand):
    help = 'Handle expired trials by charging users and converting to paid subscriptions'

    def handle(self, *args, **options):
        # Find all expired trials that haven't been converted yet
        expired_trials = Subscription.objects.filter(
            status="trialing",
            trial_end__lte=timezone.now(),
            trial_used=True
        )
        
        self.stdout.write(f"Found {expired_trials.count()} expired trials to process")
        
        success_count = 0
        fail_count = 0
        
        for subscription in expired_trials:
            try:
                # Check if user has a payment method
                if not subscription.payment_method:
                    self.stdout.write(
                        self.style.WARNING(
                            f"User {subscription.user_id} has no payment method. Subscription canceled."
                        )
                    )
                    subscription.status = "canceled"
                    subscription.save()
                    continue
                
                # Charge the user for the monthly plan (default)
                amount = 50000  # $5 in kobo
                resp = charge_authorization(
                    subscription.payment_method.authorization_code,
                    # You'll need to store user email in your model or get it from elsewhere
                    "user@example.com",  # Replace with actual email
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
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Successfully charged user {subscription.user_id} and converted to monthly plan"
                        )
                    )
                    success_count += 1
                else:
                    # Charge failed
                    self.stdout.write(
                        self.style.ERROR(
                            f"Failed to charge user {subscription.user_id}: {resp.get('message')}"
                        )
                    )
                    subscription.status = "past_due"
                    subscription.save()
                    fail_count += 1
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Error processing subscription for user {subscription.user_id}: {str(e)}"
                    )
                )
                fail_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Process completed: {success_count} successful, {fail_count} failed"
            )
        )