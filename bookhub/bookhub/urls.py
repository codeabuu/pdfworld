from scraper.views import clean_and_download, download_magazine, search, new_releases, book_detail, download_proxy, test_download, magazines, genres, genre_books, genre_detail, popular_genres
from django.contrib import admin
from django.urls import path
from customers.views import me
from customers.auth_views import signup, login, logout
from subscriptions.views import paystack_webhook, start_trial, verify_card, payment_callback, check_trial_eligibility

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

    path('api/check-trial-eligibility/', check_trial_eligibility, name='check_trial_eligibility'),
    path('api/paystack-webhook/', paystack_webhook, name='paystack_webhook'),
    path("api/sub-starttrial/", start_trial, name="sub_start"),
    path("api/sub-verify/", verify_card, name="sub_verify"),
    path('api/payment-callback/', payment_callback, name='payment_callback')
]
