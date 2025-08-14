from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import scrape_search, scrape_book_details, scrape_new_releases, parse_search_results, parse_new_releases
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

        # 7. Stream download to temp file
        temp_path = os.path.join(settings.DOWNLOAD_DIR, f"dl_{uuid.uuid4().hex}.pdf")
        with open(temp_path, 'wb') as f:
            for chunk in scraper.get(pdf_url, stream=True).iter_content(chunk_size=8192):
                f.write(chunk)

        # 8. Verify PDF
        with open(temp_path, 'rb') as f:
            if f.read(4) != b'%PDF':
                raise ValueError("Invalid PDF file")

        # 9. Return as download
        return FileResponse(
            open(temp_path, 'rb'),
            as_attachment=True,
            filename=os.path.basename(pdf_url)[:100],  # Safe filename length
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
        # Initialize cloudscraper
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'mobile': False
            },
            delay=10
        )

        # TEST 1: Verify we can get the book page
        last_url = None
        book_url = "https://oceanofpdf.com/authors/robert-greene/pdf-epub-the-48-laws-of-power-download-28120987462/"
        last_url=book_url
        page_response = scraper.get(book_url)
        print(f"TEST 1 - Book page status: {page_response.status_code}")
        if page_response.status_code != 200:
            raise ValueError(f"Failed to get book page: {page_response.status_code}")

        # TEST 2: Verify we can find the download form
        soup = BeautifulSoup(page_response.text, 'html.parser')
        form = soup.find('form', {'action': lambda x: x and 'Fetching_Resource' in x})
        if not form:
            raise ValueError("TEST 2 - Download form not found")
        print("TEST 2 - Found download form")

        # TEST 3: Verify form submission
        form_data = {
            'id': form.find('input', {'name': 'id'})['value'],
            'filename': form.find('input', {'name': 'filename'})['value']
        }
        form_action = urljoin(book_url, form['action'])
        intermediate_response = scraper.post(form_action, data=form_data)
        print(f"TEST 3 - Form submission status: {intermediate_response.status_code}")
        if intermediate_response.status_code != 200:
            raise ValueError("Form submission failed")

        # TEST 4: Verify meta refresh extraction
        pdf_url = extract_meta_refresh_url(intermediate_response.text)
        if not pdf_url:
            with open('debug_intermediate.html', 'w') as f:
                f.write(intermediate_response.text)
            raise ValueError("TEST 4 - No meta refresh URL found. Saved debug_intermediate.html")
        print(f"TEST 4 - Extracted PDF URL: {pdf_url}")

        # TEST 5: Verify PDF download
        pdf_response = scraper.get(pdf_url, stream=True)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            for chunk in pdf_response.iter_content(chunk_size=8192):
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        # Verify the PDF content
        with open(temp_file_path, 'rb') as f:
            if not f.read(4) == b'%PDF':
                os.unlink(temp_file_path)
                raise ValueError("TEST 5 - Invalid PDF content")
        
        # Get file size
        file_size = os.path.getsize(temp_file_path)
        print(f"TEST 5 - Valid PDF saved to {temp_file_path}, size: {file_size} bytes")

        return Response({
            "status": "All tests passed",
            "steps": [
                "Got book page successfully",
                "Found download form",
                "Form submitted successfully",
                f"Extracted PDF URL: {pdf_url}",
                "Verified PDF content"
            ],
            "pdf_url": pdf_url,
            "temp_file_path": temp_file_path,
            "file_size": file_size
        })

    except Exception as e:
        return Response({
            "error": "Test failed",
            "failed_step": str(e),
            "debug_info": {
                "last_url": scraper.url if 'scraper' in locals() else None,
                "form_data": locals().get('form_data', None),
                "intermediate_response": intermediate_response.text[:500] if 'intermediate_response' in locals() else None
            },
            "solution": "Check the failed step and debug information"
        }, status=400)

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
        # Search for all watermark variations
        watermark_texts = [
            "OceanofPDF", "oceanofpdf.com",
            "www.oceanofpdf.com", "Downloaded from",
            "Ocean of PDF"
        ]
        
        # First pass: Remove all links/annotations
        for link in page.get_links():
            if "oceanofpdf" in str(link.get("uri", "")).lower():
                page.delete_link(link)
        
        # Second pass: Redact all text instances
        for text in watermark_texts:
            for inst in page.search_for(text):
                # Add padding around the found text
                padding = 5  # Adjust as needed
                area = fitz.Rect(
                    max(0, inst.x0 - padding),
                    max(0, inst.y0 - padding),
                    min(page.rect.width, inst.x1 + padding),
                    min(page.rect.height, inst.y1 + padding)
                )
                
                # Add redaction annotation (white rectangle)
                page.add_redact_annot(area, fill=(1, 1, 1))  # White fill
        
        # Apply all redactions
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