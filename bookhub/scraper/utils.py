import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from django.conf import settings
from django.core.cache import cache
import time
import random
from urllib.parse import quote
import cloudscraper


ua=UserAgent()

def make_request(url):
    try:
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'mobile': False
            }
        )
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/115.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
        }
        resp = scraper.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        if resp.encoding is None:
            resp.encoding = 'utf-8'
        return resp
    except Exception as e:
        print(f"Request failed: {e}")
        return None
    
def scrape_search(query):
    query = query.strip()
    if not query:
        return []
    cache_key = f"search_{query.lower().replace(' ', '_')}"

    if cached := cache.get(cache_key):
        return cached

    url = f"{settings.API_BASE_URL}/?s={quote(query)}"
    response = make_request(url)

    return response.content.decode('utf-8', errors='')

def scrape_book_details(book_url):
    """Scrape individual book page for download links with updated URL structure"""
    cache_key = f"book_{book_url.split('/')[-2]}"  # Uses the unique identifier at end of URL
    
    if cached := cache.get(cache_key):
        return cached
    
    response = make_request(book_url)
    if not response:
        return None
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract main book details
    details = {
        'title': soup.select_one('h1.entry-title').text.strip() if soup.select_one('h1.entry-title') else '',
        'author': soup.select_one('.book-author a').text.strip() if soup.select_one('.book-author a') else '',
        'description': '\n'.join([p.text.strip() for p in soup.select('.entry-content p') if p.text.strip()]),
        'download_links': [],
        'metadata': {},
        'cover_image': soup.select_one('.book-cover img')['src'] if soup.select_one('.book-cover img') else None
    }
    
    # Extract download links - now looking for specific buttons
    download_section = soup.select_one('.download-links')
    if download_section:
        for link in download_section.select('a'):
            if 'download' in link.text.lower() or 'pdf' in link.text.lower() or 'epub' in link.text.lower():
                details['download_links'].append({
                    'type': link.text.strip().split()[0],  # e.g. "PDF", "EPUB"
                    'url': link['href'],
                    'text': link.text.strip()
                })
    
    # Extract metadata from the information box
    info_box = soup.select_one('.book-info-box')
    if info_box:
        for row in info_box.select('tr'):
            cols = row.select('td')
            if len(cols) == 2:
                key = cols[0].text.strip().lower().replace(' ', '_')
                value = cols[1].text.strip()
                details['metadata'][key] = value
                
                # Special handling for certain fields
                if key == 'published_date':
                    details['year'] = value.split()[-1]  # Extract just the year
                elif key == 'isbn':
                    details['isbn'] = value
    
    cache.set(cache_key, details, settings.SCRAPE_CACHE_TIMEOUT)
    return details

def scrape_new_releases():
    cache_key = "new_releases"

    if cached := cache.get(cache_key):
        return cached

    url = f"{settings.API_BASE_URL}/new-releases/"
    response = make_request(url)

    if not response:
        return None  # or [] depending on your frontend expectations

    html_content = response.content.decode('utf-8', errors='ignore')

    cache.set(cache_key, html_content, settings.SCRAPE_CACHE_TIMEOUT)
    return html_content


def parse_search_results(html):
    soup = BeautifulSoup(html, "html.parser")
    books = []

    for article in soup.select("article"):  # Each book is inside an <article> tag
        title_tag = article.select_one("h2 a")
        img_tag = article.select_one("img")
        link = title_tag["href"] if title_tag else None
        title = title_tag.get_text(strip=True) if title_tag else None
        image = img_tag["src"] if img_tag else None

        books.append({
            "title": title,
            "link": link,
            "image": image
        })

    return books

def parse_new_releases(html):
    soup = BeautifulSoup(html, "html.parser")
    books = []

    for item in soup.select("a.title-image"):  # selects all book cover links
        link = item.get("href")
        img_tag = item.select_one("img")
        image = None
        
        if img_tag:
            # Prefer data-src over src (lazyload images)
            image = img_tag.get("data-src") or img_tag.get("src")

        # Try to find the title in the corresponding info div
        title_div = item.find_next("div", class_="widget-event__info")
        title_tag = title_div.select_one(".title a") if title_div else None
        title = title_tag.get_text(strip=True) if title_tag else None

        books.append({
            "title": title,
            "link": link,
            "image": image,
            "author": "Unknown",
            "date": "Unknown"
        })

    return books

