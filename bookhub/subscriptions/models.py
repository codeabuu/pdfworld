from django.db import models
from django.utils import timezone
from datetime import timedelta

def default_trial_end():
    return timezone.now() + timedelta(days=7)

class PaymentMethod(models.Model):
    """
    Stores Paystack payment authorization for a user
    (verified card, not necessarily charged yet).
    """
    user_id = models.UUIDField()  # Supabase user.id
    authorization_code = models.CharField(max_length=255, unique=True)
    customer_code = models.CharField(max_length=100)
    last4 = models.CharField(max_length=4, blank=True, null=True)
    card_type = models.CharField(max_length=50, blank=True, null=True)
    bank = models.CharField(max_length=100, blank=True, null=True)
    exp_month = models.CharField(max_length=2, blank=True, null=True)
    exp_year = models.CharField(max_length=4, blank=True, null=True)
    reusable = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']
    def __str__(self):
        return f"PaymentMethod for {self.user_id}, {self.card_type}, (****{self.last4})"

class Subscription(models.Model):
    """
    Represents a trial or paid subscription.
    """
    PLAN_CHOICES = [
        ("trial", "Free Trial"),
        ("monthly", "Monthly"),
        ("yearly", "Yearly"),
    ]

    STATUS_CHOICES = [
        ("trialing", "Trialing"),
        ("active", "Active"),
        ("past_due", "Past Due"),
        ("canceled", "Canceled"),
        ("inactive", "Inactive"),
        ("expired", "Expired"),
    ]

    user_id = models.UUIDField()  # Supabase user.id
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True)

    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="trial")
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # in dollars
    subscription_code = models.CharField(max_length=100, blank=True, null=True)

    trial_start = models.DateTimeField(null=True, blank=True, default=timezone.now)
    trial_end = models.DateTimeField(null=True, blank=True, default=default_trial_end)  # Changed from lambda to function reference
    trial_used = models.BooleanField(default=False)  # Track if trial was used
    trial_started_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="trialing")

    current_period_start = models.DateTimeField(default=timezone.now)
    current_period_end = models.DateTimeField(null=True, blank=True)  # set when subscription becomes active

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user_id', 'status']),
            models.Index(fields=['user_id', 'trial_used']),
            models.Index(fields=['subscription_code']),
        ]

    def in_trial(self):
        return self.status == "trialing" and timezone.now() < self.trial_end

    def trial_has_ended(self):
        return timezone.now() >= self.trial_end
    
    def is_active(self):
        """Check if subscription is currently active"""
        if self.status == "trialing":
            return timezone.now() < self.trial_end
        elif self.status == "active":
            if self.current_period_end:
                return timezone.now() < self.current_period_end
            return True
        return False
    
    def is_expired(self):
        """Check if subscription has expired"""
        if self.status == "expired":
            return True
        elif self.status == "trialing":
            return self.trial_has_ended()
        elif self.status == "active" and self.current_period_end:
            return timezone.now() > self.current_period_end
        return False
    
    def get_plan_amount(self):
        """Return amount in kobo for Paystack"""
        if self.plan == "monthly":
            return 50000  # $5 in kobo
        elif self.plan == "yearly":
            return 500000  # $50 in kobo
        return 0
    
    def can_start_trial(self):
        """Check if user is eligible for a free trial"""
        if self.trial_used:
            return False, "Trial already used"
        
        if self.status in ["active", "trialing"]:
            return False, "Already have an active subscription"
            
        return True, "Eligible for trial"

    def __str__(self):
        return f"Subscription for {self.user_id} ({self.status} - {self.plan})"