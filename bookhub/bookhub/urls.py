from scraper.views import search, new_releases, book_detail, download_proxy, debug_scrape
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/search/', search, name='search'),
    path('api/new-releases/', new_releases, name='new_releases'),
    path('api/book-detail/<path:book_slug>/', book_detail, name='book_detail'),
    path('api/download/', download_proxy, name='download_proxy'),
    path('api/debug-scrape/', debug_scrape),
]
