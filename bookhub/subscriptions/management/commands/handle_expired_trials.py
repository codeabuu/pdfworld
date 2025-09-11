from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from subscriptions.models import Subscription, PaymentMethod
from subscriptions.utils import charge_authorization
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q

User = get_user_model()

class Command(BaseCommand):
    help = 'Handle expired trials by charging users and converting to paid subscriptions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate the process without actually charging users',
        )
        parser.add_argument(
            '--debug',
            action='store_true',
            help='Show detailed debug information about subscriptions',
        )
        parser.add_argument(
            '--test-mode',
            action='store_true',
            help='Use test mode with test emails for Paystack',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        debug = options['debug']
        test_mode = options['test_mode']
        
        # Paystack test emails for test mode
        TEST_EMAILS = [
            "test@example.com",
            "customer@email.com", 
            "test@paystack.com",
            "test.customer@email.com"
        ]
        
        # First, let's see ALL trialing subscriptions
        all_trialing = Subscription.objects.filter(status="trialing")
        self.stdout.write(f"Found {all_trialing.count()} total trialing subscriptions")
        
        if debug:
            for sub in all_trialing:
                is_expired = sub.trial_end and sub.trial_end <= timezone.now() if sub.trial_end else False
                has_payment_method = sub.payment_method is not None
                self.stdout.write(
                    f"Subscription {sub.id}: user_id={sub.user_id}, "
                    f"trial_end={sub.trial_end}, "
                    f"trial_used={sub.trial_used}, "
                    f"is_expired={is_expired}, "
                    f"has_payment_method={has_payment_method}"
                )

        # Find ALL expired trials (regardless of trial_used status)
        expired_trials = Subscription.objects.filter(
            Q(status="trialing") &
            Q(trial_end__isnull=False) &
            Q(trial_end__lte=timezone.now())
        ).select_related('payment_method')
        
        self.stdout.write(f"Found {expired_trials.count()} expired trials to process")
        
        if test_mode:
            self.stdout.write(self.style.WARNING("TEST MODE - Using test emails for Paystack"))
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No actual changes will be made"))
        
        success_count = 0
        fail_count = 0
        skipped_count = 0
        marked_count = 0
        
        for subscription in expired_trials:
            try:
                if debug:
                    self.stdout.write(f"Processing subscription {subscription.id} for user {subscription.user_id}")
                
                # First, mark the trial as used if it hasn't been already
                if not subscription.trial_used:
                    if dry_run:
                        self.stdout.write(
                            f"[DRY RUN] Would mark trial as used for user {subscription.user_id}"
                        )
                    else:
                        subscription.trial_used = True
                        subscription.save()
                    marked_count += 1
                
                # Check if user has a payment method
                if not subscription.payment_method:
                    self.stdout.write(
                        self.style.WARNING(
                            f"User {subscription.user_id} has no payment method. "
                            f"Subscription canceled. (User might have signed up but never completed payment)"
                        )
                    )
                    if not dry_run:
                        subscription.status = "canceled"
                        subscription.save()
                    skipped_count += 1
                    continue
                
                # Get user email (handle test mode and missing users)
                user_email = None
                
                if test_mode:
                    # Use test email for Paystack test mode
                    import hashlib
                    user_hash = hashlib.md5(str(subscription.user_id).encode()).hexdigest()
                    test_index = int(user_hash, 16) % len(TEST_EMAILS)
                    user_email = TEST_EMAILS[test_index]
                    
                    self.stdout.write(
                        self.style.WARNING(
                            f"TEST MODE: Using test email {user_email} for user {subscription.user_id}"
                        )
                    )
                else:
                    # Try to get real user email
                    try:
                        user = User.objects.get(id=subscription.user_id)
                        user_email = user.email
                    except User.DoesNotExist:
                        # User doesn't exist in Django database but has a payment method
                        self.stdout.write(
                            self.style.WARNING(
                                f"User {subscription.user_id} does not exist in Django database. "
                                f"But they have payment method: {subscription.payment_method.authorization_code}"
                            )
                        )
                        
                        # Use a fallback email for charging
                        user_email = f"user_{subscription.user_id}@example.com"
                        self.stdout.write(f"Using fallback email: {user_email}")
                
                if not user_email:
                    self.stdout.write(
                        self.style.WARNING(
                            f"User {subscription.user_id} has no email address. Cannot process payment."
                        )
                    )
                    if not dry_run:
                        subscription.status = "past_due"
                        subscription.save()
                    fail_count += 1
                    continue
                
                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"[DRY RUN] Would charge user {subscription.user_id} ({user_email}) "
                            f"with auth code: {subscription.payment_method.authorization_code}"
                        )
                    )
                    success_count += 1
                    continue
                
                # Charge the user for the monthly plan
                amount = 50000  # ₦500 in kobo
                
                # For test mode, we might simulate success
                if test_mode:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"[TEST MODE] Simulating successful charge for user {subscription.user_id}"
                        )
                    )
                    
                    # Simulate success for testing
                    with transaction.atomic():
                        subscription.plan = "monthly"
                        subscription.status = "active"
                        subscription.amount = 500.00
                        subscription.current_period_start = timezone.now()
                        subscription.current_period_end = timezone.now() + timedelta(days=30)
                        subscription.last_payment_date = timezone.now()
                        subscription.save()
                    
                    success_count += 1
                    continue
                
                # Real charge attempt
                resp = charge_authorization(
                    subscription.payment_method.authorization_code,
                    user_email,
                    amount
                )
                
                if resp and resp.get("status"):
                    # Charge successful - convert to paid subscription
                    with transaction.atomic():
                        subscription.plan = "monthly"
                        subscription.status = "active"
                        subscription.amount = 500.00
                        subscription.current_period_start = timezone.now()
                        subscription.current_period_end = timezone.now() + timedelta(days=30)
                        subscription.last_payment_date = timezone.now()
                        subscription.save()
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Successfully charged user {subscription.user_id} ({user_email}) "
                            f"and converted to monthly plan"
                        )
                    )
                    success_count += 1
                else:
                    # Charge failed
                    error_message = resp.get('message', 'Unknown error') if resp else 'No response from Paystack'
                    self.stdout.write(
                        self.style.ERROR(
                            f"Failed to charge user {subscription.user_id} ({user_email}): {error_message}"
                        )
                    )
                    
                    # In test mode, we might want to simulate success for testing
                    if test_mode:
                        self.stdout.write(
                            self.style.WARNING(
                                "TEST MODE: Charge failed, but this is expected with test data"
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
                f"Process completed: {success_count} successful, {fail_count} failed, "
                f"{skipped_count} skipped, {marked_count} marked as used"
            )
        )