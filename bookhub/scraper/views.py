from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import scrape_search, scrape_book_details, scrape_new_releases, parse_search_results, parse_new_releases, scrape_magazines, parse_magazines, scrape_novels, parse_novels
from django.core.cache import cache
import requests
from django.http import FileResponse, HttpResponse, HttpResponseNotAllowed
from io import BytesIO
from django.conf import settings
from scraper.utils import scrape_search
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from bs4 import BeautifulSoup

@api_view(['GET'])
def search(request):
    query = request.GET.get('s', '').strip()
    
    if not query:
        return Response({'error': 'Query parameter "s" is required'}, status=400)

    results = scrape_search(query)
    # html = results.content.decode('utf-8', errors='replace')
    parsed_results = parse_search_results(results)
    return Response({'query': query, 'results': parsed_results if parsed_results else []})

@api_view(['GET'])
def new_releases(request):
    cache_key = 'new_releases'
    
    if cached := cache.get(cache_key):
        return Response(
            {
            'source': 'OceanofPF New Releases',
            'count': len(cached),
            'results': cached
        }
        )
    results = scrape_new_releases()
    parsed_results = parse_new_releases(results)
    cache.set(cache_key, parsed_results, timeout=60 * 60 * 4)

    return Response(
        {
            'source': 'OceanofPDF New Releases',
            'count': len(parsed_results),
            'results': parsed_results
        }
    )

@api_view(['GET'])
def magazines(request):
    cache_key = 'magazines'

    if cached := cache.get(cache_key):
        return Response(
            {
            'source': 'OceanofPF Magazines',
            'count': len(cached),
            'results': cached
        }
        )
    results = scrape_magazines()
    parsed_results = parse_magazines(results)
    cache.set(cache_key, parsed_results, timeout=60 * 60 * 4)

    return Response(
        {
            'source': 'OceanofPDF New Releases',
            'count': len(parsed_results),
            'results': parsed_results
        }
    )

@api_view(['GET'])
def mynovels(request):
    cache_key = 'my_novels'

    if cached := cache.get(cache_key):
        return Response(
            {
            'source': 'OceanofPF Magazines',
            'count': len(cached),
            'results': cached
        }
        )
    results = scrape_novels()
    parsed_results = parse_novels(results)
    cache.set(cache_key, parsed_results, timeout=60 * 60 * 4)

    return Response(
        {
            'source': 'OceanofPDF My Novels',
            'count': len(parsed_results),
            'results': parsed_results
        }
    )


@api_view(['GET'])
def book_detail(request, book_slug):
    """Enhanced book detail endpoint with safety checks"""
    try:
        book_url = f"{settings.API_BASE_URL}/authors/{book_slug}/"
        details = scrape_book_details(book_url)
        
        if not details:
            return Response({'error': 'Book not found'}, status=404)
        
        # Transform for frontend
        response_data = {
            'title': details['title'],
            'author': details['author'],
            'publish_date': details['publish_date'],
            'cover_image': details['cover_image'],
            'description': details['description'],
            'summary': details['summary'],
            'metadata': details['metadata'],
            'download_options': [
                {
                    'type': option['type'],
                    'method': option['method'],
                    'url': '/api/download-proxy/' if option['method'] == 'POST' else option.get('url'),
                    'data': option.get('inputs', {}),
                    'filename': option.get('filename')
                }
                for option in details['download_options']
            ]
        }
        
        return Response({
            'status': 'success',
            'data': response_data
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

from rest_framework.decorators import api_view
from django.http import HttpResponse, HttpResponseNotAllowed
import requests
import uuid
from .models import TempFile
from django.core.files.base import ContentFile


from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import StreamingHttpResponse
import requests
from bs4 import BeautifulSoup

import requests
import cloudscraper
from bs4 import BeautifulSoup
import time
from django.http import FileResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.files.base import ContentFile
from .models import TempFile
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os
from django.http import FileResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

import cloudscraper
from bs4 import BeautifulSoup
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import FileResponse
import time
from django.conf import settings

os.makedirs(settings.DOWNLOAD_DIR, exist_ok=True)

import os
import re
import uuid
import cloudscraper
from django.conf import settings
from django.http import FileResponse
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Configure in settings.py:
# DOWNLOAD_DIR = os.path.join(BASE_DIR, 'download_temp')
os.makedirs(settings.DOWNLOAD_DIR, exist_ok=True)

def extract_meta_refresh_url(html):
    """Extract redirect URL from meta refresh tag"""
    match = re.search(r'content="\d+;url=(.*?)"', html, re.IGNORECASE)
    return match.group(1) if match else None

@api_view(['POST'])
def download_proxy(request):
    """
    Endpoint that:
    1. Receives OceanofPDF book URL from frontend
    2. Handles the download process 
    3. Streams PDF back to user
    """
    temp_file = None
    try:
        # 1. Validate input
        book_url = request.data.get('url')
        if not book_url or 'oceanofpdf.com' not in book_url:
            raise ValueError("Valid OceanofPDF URL required")

        # 2. Configure scraper
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'desktop': True
            },
            delay=10
        )

        # 3. Fetch book page
        page = scraper.get(book_url)
        page.raise_for_status()

        # 4. Extract download form
        soup = BeautifulSoup(page.text, 'html.parser')
        form = soup.find('form', {'action': lambda x: x and 'Fetching_Resource' in x})
        if not form:
            raise ValueError("Download form not found")

        # 5. Submit form
        response = scraper.post(
            urljoin(book_url, form['action']),
            data={
                'id': form.find('input', {'name': 'id'})['value'],
                'filename': form.find('input', {'name': 'filename'})['value']
            }
        )
        response.raise_for_status()

        # 6. Get final PDF URL
        pdf_url = extract_meta_refresh_url(response.text)
        if not pdf_url:
            raise ValueError("Download link not found")

        # # 7. Stream download to temp file
        # temp_path = os.path.join(settings.DOWNLOAD_DIR, f"dl_{uuid.uuid4().hex}.pdf")
        # with open(temp_path, 'wb') as f:
        #     for chunk in scraper.get(pdf_url, stream=True).iter_content(chunk_size=8192):
        #         f.write(chunk)

        # # 8. Verify PDF
        # with open(temp_path, 'rb') as f:
        #     if f.read(4) != b'%PDF':
        #         raise ValueError("Invalid PDF file")

        # # 9. Return as download

        pdf_response = scraper.get(pdf_url)
        pdf_response.raise_for_status()
        pdf_content = pdf_response.content
        
        if not pdf_content.startswith(b'%PDF'):
            raise ValueError("Invalid PDF file")
        
        cleaned_pdf = remove_watermarks(pdf_content)
        return FileResponse(
            io.BytesIO(cleaned_pdf),
            as_attachment=True,
            filename=os.path.basename(pdf_url)[:100],
            content_type='application/pdf'
        )

    except Exception as e:
        return Response(
            {'error': str(e), 'status': 'download_failed'},
            status=400
        )

    finally:
        # Clean up temp file if exists
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except:
                pass

from urllib.parse import urljoin
import tempfile
import os
import re
@api_view(['POST'])
def test_download(request):
    def extract_meta_refresh_url(html):
        """Extract URL from <meta http-equiv="refresh"> tag"""
        match = re.search(r'<meta\s+http-equiv="refresh"\s+content="\d+;url=(.*?)"', html, re.IGNORECASE)
        return match.group(1) if match else None

    try:
        # Initialize test results
        test_results = {
            "status": "started",
            "steps": [],
            "debug_info": {}
        }

        # Initialize cloudscraper
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'mobile': False
            },
            delay=10
        )
        test_results['debug_info']['scraper_init'] = "Success"

        # Get test URL from request or use default
        test_url = request.data.get('url', "https://oceanofpdf.com/authors/robert-greene/pdf-epub-the-48-laws-of-power-download-28120987462/")
        is_magazine = '/magazines/' in test_url or '/newspapers/' in test_url
        
        test_results.update({
            "test_url": test_url,
            "is_magazine": is_magazine
        })

        # TEST 1: Verify we can get the page
        try:
            page_response = scraper.get(test_url)
            test_results['steps'].append({
                "name": "Get page",
                "status": page_response.status_code == 200,
                "status_code": page_response.status_code,
                "url": test_url,
                "message": "Success" if page_response.status_code == 200 else "Failed to get page"
            })
            test_results['debug_info']['last_url'] = test_url
            
            if page_response.status_code != 200:
                raise ValueError(f"Failed to get page: {page_response.status_code}")
        except Exception as e:
            test_results['steps'].append({
                "name": "Get page",
                "status": False,
                "error": str(e),
                "message": f"Failed to fetch page: {str(e)}"
            })
            raise

        # Parse the page content
        soup = BeautifulSoup(page_response.text, 'html.parser')
        test_results['debug_info']['page_title'] = soup.title.string if soup.title else "No title found"

        if is_magazine:
            # MAGAZINE-SPECIFIC TESTS
            # TEST M1: Verify magazine page structure
            try:
                img_tag = soup.find('img', {'src': lambda x: x and 'media.oceanofpdf.com' in x})
                test_results['steps'].append({
                    "name": "Find magazine image",
                    "status": bool(img_tag),
                    "message": "Found magazine cover" if img_tag else "No magazine cover found",
                    "image_url": img_tag['src'] if img_tag else None
                })
            except Exception as e:
                test_results['steps'].append({
                    "name": "Find magazine image",
                    "status": False,
                    "error": str(e),
                    "message": f"Error finding magazine image: {str(e)}"
                })
                raise

            # TEST M2: Find download button
            try:
                download_form = soup.find('form', {'action': lambda x: x and 'Fetching_Resource' in x})
                test_results['steps'].append({
                    "name": "Find download form",
                    "status": bool(download_form),
                    "message": "Found download form" if download_form else "No download form found",
                    "form_action": download_form['action'] if download_form else None
                })
                
                if not download_form:
                    raise ValueError("No download form found for magazine")
                    
                form_data = {
                    'id': download_form.find('input', {'name': 'id'})['value'],
                    'filename': download_form.find('input', {'name': 'filename'})['value']
                }
                form_action = urljoin(test_url, download_form['action'])
                
                test_results['debug_info'].update({
                    'form_data': form_data,
                    'form_action': form_action
                })
            except Exception as e:
                test_results['steps'].append({
                    "name": "Find download form",
                    "status": False,
                    "error": str(e),
                    "message": f"Error finding download form: {str(e)}"
                })
                raise
        else:
            # BOOK-SPECIFIC TESTS (your existing logic)
            pass

        # Continue with remaining tests...
        # (Include similar try-except blocks for each test step)

        return Response({
            "status": "success",
            "results": test_results
        })

    except Exception as e:
        test_results.update({
            "status": "error",
            "error": str(e),
            "solution": "Check the failed test step for debugging"
        })
        return Response(test_results, status=400)

from django.http import FileResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
import fitz  # PyMuPDF
import io

def remove_watermarks(input_pdf_bytes):
    input_buffer = io.BytesIO(input_pdf_bytes)
    output_buffer = io.BytesIO()
    
    doc = fitz.open(stream=input_buffer.read(), filetype="pdf")
    
    for page in doc:
        # Search watermarkss
        watermark_texts = [
            "OceanofPDF", "oceanofpdf.com",
            "www.oceanofpdf.com", "Downloaded from",
            "Ocean of PDF"
        ]
        
        # First pass: TO Remove all links
        for link in page.get_links():
            if "oceanofpdf" in str(link.get("uri", "")).lower():
                page.delete_link(link)
        
        # Second pass: Redact alltext instances
        for text in watermark_texts:
            for inst in page.search_for(text):
                # Add pad around the found texti
                padding = 5  # Adjust as needed
                area = fitz.Rect(
                    max(0, inst.x0 - padding),
                    max(0, inst.y0 - padding),
                    min(page.rect.width, inst.x1 + padding),
                    min(page.rect.height, inst.y1 + padding)
                )
                
                page.add_redact_annot(area, fill=(1, 1, 1))
        
       
        page.apply_redactions()
    
    doc.save(output_buffer)
    doc.close()
    return output_buffer.getvalue()

@api_view(['POST'])
def clean_and_download(request):
    try:
        if 'pdf_file' not in request.FILES:
            return Response({"error": "No PDF file provided"}, status=400)
        
        cleaned_pdf = remove_watermarks(request.FILES['pdf_file'].read())
        
        response = FileResponse(
            io.BytesIO(cleaned_pdf),
            content_type='application/pdf',
            as_attachment=True,
            filename='cleaned_document.pdf'
        )
        return response
        
    except Exception as e:
        return Response({"error": f"PDF processing failed: {str(e)}"}, status=500)
    

@api_view(['POST'])
def download_magazine(request):
    """
    Magazine-specific download endpoint following the same pattern as download_proxy
    but with magazine-specific enhancements
    """
    def extract_meta_refresh_url(html):
        match = re.search(r'<meta\s+http-equiv="refresh"\s+content="\d+;url=(.*?)"', html, re.IGNORECASE)
        return match.group(1) if match else None

    try:
        # 1. Validate input (same simple check as download_proxy)
        magazine_url = request.data.get('url')
        if not magazine_url or 'oceanofpdf.com' not in magazine_url:
            raise ValueError("Valid OceanofPDF URL required")

        # 2. Configure scraper (identical to download_proxy)
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'desktop': True
            },
            delay=10
        )

        # 3. Fetch magazine page
        page = scraper.get(magazine_url)
        page.raise_for_status()

        # 4. Extract download form (same as download_proxy)
        soup = BeautifulSoup(page.text, 'html.parser')
        form = soup.find('form', {'action': lambda x: x and 'Fetching_Resource' in x})
        if not form:
            raise ValueError("Download form not found")

        # Optional: Magazine-specific verification
        if '/magazines/' in magazine_url or '/newspapers/' in magazine_url:
            img_tag = soup.find('img', {'src': lambda x: x and 'media.oceanofpdf.com' in x})
            if not img_tag:
                raise ValueError("Magazine cover image not found - possible invalid page")

        # 5. Submit form (identical to download_proxy)
        response = scraper.post(
            urljoin(magazine_url, form['action']),
            data={
                'id': form.find('input', {'name': 'id'})['value'],
                'filename': form.find('input', {'name': 'filename'})['value']
            }
        )
        response.raise_for_status()

        # 6. Get final PDF URL (identical to download_proxy)
        pdf_url = extract_meta_refresh_url(response.text)
        if not pdf_url:
            raise ValueError("Download link not found")

        # 7. Download and verify PDF (identical to download_proxy)
        pdf_response = scraper.get(pdf_url)
        pdf_response.raise_for_status()
        pdf_content = pdf_response.content
        
        if not pdf_content.startswith(b'%PDF'):
            raise ValueError("Invalid PDF file")
        
        cleaned_pdf = remove_watermarks(pdf_content)
        return FileResponse(
            io.BytesIO(cleaned_pdf),
            as_attachment=True,
            filename=os.path.basename(pdf_url)[:100],
            content_type='application/pdf'
        )

    except Exception as e:
        return Response(
            {'error': str(e), 'status': 'download_failed'},
            status=400
        )
from .utils import scrape_genres, parse_genres, parse_books_from_genre, scrape_books_by_genre, get_genre_by_slug

@api_view(['GET'])
def genres(request):
    cache_key = 'genres_list'

    if cached := cache.get(cache_key):
        return Response({
            'source': 'OceanofPDF Genres',
            'count': len(cached),
            'results': cached
        })

    # This calls scrape_genres() which uses your main link
    results = scrape_genres()
    parsed_results = parse_genres(results)
    cache.set(cache_key, parsed_results, timeout=60 * 60 * 24)

    return Response({
        'source': 'OceanofPDF Genres',
        'count': len(parsed_results),
        'results': parsed_results
    })


@api_view(['GET'])
def genre_detail(request, genre_slug):
    """Get detailed information about a specific genre"""
    cache_key = f'genre_detail_{genre_slug}'
    
    if cached := cache.get(cache_key):
        return Response({
            'source': 'OceanofPDF Genre Detail',
            'genre': cached
        })
    
    genre = get_genre_by_slug(genre_slug)
    if not genre:
        return Response({
            'error': f'Genre with slug "{genre_slug}" not found'
        }, status=404)
    
    cache.set(cache_key, genre, timeout=60 * 60 * 12)
    
    return Response({
        'source': 'OceanofPDF Genre Detail',
        'genre': genre
    })

@api_view(['GET'])
def genre_books(request, genre_slug):
    """Get books for a specific genre using its URL"""
    try:
        # Convert page parameter to integer with error handling
        page_str = request.GET.get('page', '1')
        page = int(page_str)
        if page < 1:
            page = 1
    except (ValueError, TypeError):
        page = 1
    cache_key = f'genre_books_{genre_slug}_page_{page}'
    page = request.GET.get('page', 1)
    
    if cached := cache.get(cache_key):
        return Response({
            'source': f'OceanofPDF Books - {genre_slug}',
            'page': page,
            'count': len(cached),
            'results': cached
        })
    
    # Get the genre to access its URL
    genre = get_genre_by_slug(genre_slug)
    if not genre:
        return Response({
            'error': f'Genre with slug "{genre_slug}" not found'
        }, status=404)
    
    # Scrape books using the genre's URL
    html_content = scrape_books_by_genre(genre['url'], page)
    if not html_content:
        return Response({
            'error': f'Failed to fetch books for genre: {genre_slug}',
            'results': []
        }, status=503)
    
    books = parse_books_from_genre(html_content, genre['name'])
    # base_url = request.build_absolute_uri().split('?')[0]
    cache.set(cache_key, books, timeout=60 * 60 * 6)
    
    return Response({
        'source': f'OceanofPDF Books - {genre_slug}',
        'page': page,
        'count': len(books),
        'results': books
    })

@api_view(['GET'])
def popular_genres(request):
    """Get top genres by book count"""
    cache_key = 'genres_list'
    cached = cache.get(cache_key)
    
    if not cached:
        html_content = scrape_genres()
        if html_content:
            cached = parse_genres(html_content)
            cache.set(cache_key, cached, timeout=60 * 60 * 24)
    
    if not cached:
        return Response({'error': 'No genre data available'}, status=404)
    
    # Sort by book count descending and take top 20
    popular = sorted(cached, key=lambda x: x['book_count'], reverse=True)[:20]
    
    return Response({
        'source': 'OceanofPDF Popular Genres',
        'count': len(popular),
        'results': popular
    })