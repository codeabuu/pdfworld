from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import scrape_search, scrape_book_details, scrape_new_releases, parse_search_results, parse_new_releases
from django.core.cache import cache
import requests
from django.http import FileResponse
from io import BytesIO
from django.conf import settings
from scraper.utils import scrape_search

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
    """
    Handle book details with the new URL format:
    /authors/{author-name}/pdf-epub-{book-title}-download-{unique-id}/
    """
    book_url = f"{settings.API_BASE_URL}/authors/{book_slug}/"
    details = scrape_book_details(book_url)
    print("book slug", book_slug)
    
    if not details:
        return Response({'error': 'Book not found or could not be loaded'}, status=404)
    
    return Response({
        'status': 'success',
        'data': details
    })

@api_view(['GET'])
def download_proxy(request):
    download_url = request.GET.get('url')
    if not download_url:
        return Response({'error': 'Download URL is required'}, status=400)
    
    try:
        response = requests.get(download_url, stream=True)
        response.raise_for_status()
        
        # Create a file-like buffer to stream the content
        buffer = BytesIO()
        for chunk in response.iter_content(chunk_size=8192):
            buffer.write(chunk)
        buffer.seek(0)
        
        # Determine filename
        filename = download_url.split('/')[-1] or 'book.pdf'
        
        return FileResponse(
            buffer,
            as_attachment=True,
            filename=filename,
            content_type=response.headers.get('content-type', 'application/octet-stream')
        )
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
def debug_scrape(request):
    """Temporary debug endpoint to test scraping directly"""
    test_url = f"{settings.API_BASE_URL}/?s=harry+potter"
    print(f"\n=== Trying to scrape: {test_url} ===")
    
    response = requests.get(test_url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Length: {len(response.text)} chars")
    
    # Save the HTML for inspection
    with open('debug_scrape.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    
    return Response({
        'status': response.status_code,
        'length': len(response.text),
        'saved_to': 'debug_scrape.html'
    })