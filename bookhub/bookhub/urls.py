from scraper.views import (
    clean_and_download,
    download_magazine,
    search,
    new_releases,
    book_detail,
    download_proxy,
    test_download,
    magazines,
    genres,
    genre_books,
    genre_detail,
    popular_genres
)
from django.contrib import admin
from django.urls import path
from customers.views import me
from customers.auth_views import (
    signup, 
    login, 
    logout,
    refresh_token, 
    check_auth_status, 
    change_password, 
    forgot_password, 
    reset_password, 
    resend_confirmation_email, 
    check_email_confirmation
)
from subscriptions.views import (
    paystack_webhook, 
    start_trial, 
    payment_callback, 
    check_trial_eligibility_endpoint, 
    check_subscription_status, 
    start_paid_subscription, 
    create_recurring_subscription,
    cancel_subscription,
    create_test_payment,
    get_customer_cards,
    initialize_card_update,
    verify_card_update,
    set_default_card,
    remove_card,
    card_update_callback,
    test_add_card
    )
from customers import google_oauth
from customers.test_gauth import GoogleOAuthCallbackView, TestSupabaseConnectionView, GoogleOAuthInitView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/search/', search, name='search'),
    path('api/new-releases/', new_releases, name='new_releases'),
    path('api/book-detail/<path:book_slug>/', book_detail, name='book_detail'),
    path('api/download/', download_proxy, name='download_proxy'),
    # path('api/debug-scrape/', debug_scrape),
    path('test-download/', test_download, name='test_download'),
    path('api/clean-and-download/', clean_and_download, name='clean_and_download'),
    path('api/magazines/', magazines, name='magazines'),
    path('api/download-magazine/', download_magazine, name='download_magazine'),
    path('api/genres/', genres, name='genres'),
    path('api/genres/popular/', popular_genres, name='popular_genres'),
    path('api/genres/<str:genre_slug>/', genre_detail, name='genre_detail'),
    path('api/genres/<str:genre_slug>/books/', genre_books, name='genre_books'),

    path('api/me/', me, name='me'),
    path('api/signup/', signup, name='signup'),
    path('api/login/', login, name='login'),
    path('api/logout/', logout, name='logout'),

    path('api/check-trial-eligibility/', check_trial_eligibility_endpoint, name='check_trial_eligibility'),
    path('api/paystack-webhook/', paystack_webhook, name='paystack_webhook'),
    path("api/sub-starttrial/", start_trial, name="sub_start"),
    path("api/check-subscription/", check_subscription_status, name="check_subscription"),
    path('api/payment-callback/', payment_callback, name='payment_callback'),

    # Subs endpoints
    path('api/start-subscription/', start_paid_subscription, name='start_paid_subscription'),
    path('api/create-subscription/', create_recurring_subscription, name='create_recurring_subscription'),
    path('api/cancel-subscription', cancel_subscription, name='cancel_subscription'),

    path('api/refresh-token/', refresh_token, name='refresh_token'),
    path('api/check-auth/', check_auth_status, name='check_auth_status'),

    path('api/change-password/', change_password, name='change_password'),

    path('api/forgot-password/', forgot_password, name='forgot_password'),
    path('api/reset-password/', reset_password, name='reset_password'),

    path('payment/test/', create_test_payment, name='test_payment'),

    path('api/resend-confirmation-email/', resend_confirmation_email, name='resend_confirmation_email'),
    path('api/check-email-confirmation/', check_email_confirmation, name='check_email_confirmation'),

    path('api/cards/', get_customer_cards, name='get_customer_cards'),
    path('api/cards/initialize-update/', initialize_card_update, name='initialize_card_update'),
    path('api/cards/verify-update/', verify_card_update, name='verify_card_update'),
    path('api/cards/set-default/', set_default_card, name='set_default_card'),
    path('api/cards/remove/', remove_card, name='remove_card'),
    path('api/cards/update-callback/', card_update_callback, name='card_update_callback'),
    path('api/test-add/', test_add_card, name='test_add_card'),


    path('api/auth/google/init/', google_oauth.google_oauth_init, name='google-oauth-init'),
    path('api/auth/google/callback/', google_oauth.google_oauth_callback, name='google-oauth-callback'),

    path('test/supabase-connection/', TestSupabaseConnectionView.as_view(), name='test-supabase-connection'),
    path('auth/google/init/', GoogleOAuthInitView.as_view(), name='google-oauth-init'),
    path('auth/google/callback/', GoogleOAuthCallbackView.as_view(), name='google-oauth-callback'),
]
