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
    """Enhanced book details extraction with safety checks"""
    cache_key = f"book_{book_url.split('/')[-2]}"
    
    if cached := cache.get(cache_key):
        return cached
    
    response = make_request(book_url)
    if not response:
        return None
    
    soup = BeautifulSoup(response.text, 'html.parser')
    entry_content = soup.find('div', class_='entry-content')
    
    # Extract core information with safety checks
    details = {
        'title': clean_text(soup.find('h1', class_='entry-title')),
        'author': extract_author(entry_content),
        'publish_date': clean_text(soup.find('time', class_='entry-time')),
        'cover_image': extract_cover_image(soup),
        'description': extract_description(entry_content),
        'summary': extract_summary(entry_content),
        'technical_details': extract_technical_details(entry_content),
        'download_options': extract_download_options(soup),
        'metadata': {}
    }
    
    # Combine metadata
    details['metadata'] = {
        **details['technical_details'],
        'publish_date': details['publish_date'],
        'cover_image': details['cover_image']
    }
    
    cache.set(cache_key, details, settings.SCRAPE_CACHE_TIMEOUT)
    return details

# Helper functions
def clean_text(element):
    return element.get_text(strip=True) if element else ''

def extract_author(entry_content):
    author_tag = entry_content.find('strong') if entry_content else None
    if author_tag and 'by' in author_tag.text:
        return clean_text(author_tag.next_sibling)
    return 'Unknown Author'

def extract_cover_image(soup):
    img = soup.find('img', class_='aligncenter')
    return img['src'] if img and 'src' in img.attrs else None

def extract_description(entry_content):
    if not entry_content:
        return []
    return [clean_text(p) for p in entry_content.find_all('p') 
            if p.text.strip() and not p.find_parent('form')]

def extract_summary(entry_content):
    if not entry_content:
        return ''
    summary_header = entry_content.find(lambda t: t.name == 'h2' and 'Brief Summary' in t.text)
    if summary_header:
        next_p = summary_header.find_next('p')
        return clean_text(next_p) if next_p else ''
    return ''

def extract_technical_details(entry_content):
    if not entry_content:
        return {}
    tech_header = entry_content.find(lambda t: t.name == 'h2' and 'eBook Details' in t.text)
    if tech_header:
        tech_list = tech_header.find_next('ul')
        if tech_list:
            return {
                item.text.split(':', 1)[0].strip().lower().replace(' ', '_'): 
                item.text.split(':', 1)[1].strip()
                for item in tech_list.find_all('li') if ':' in item.text
            }
    return {}

def extract_download_options(soup):
    options = []
    # Extract form-based downloads
    for form in soup.find_all('form', action=lambda x: x and 'Fetching_Resource.php' in x):
        filename = next(
            (input_tag['value'] for input_tag in form.find_all('input') 
             if input_tag.get('name') == 'filename'),
            'book.pdf'
        )
        options.append({
            'type': 'PDF' if 'pdf-button' in str(form) else 'EPUB',
            'method': 'POST',
            'action': form['action'],
            'inputs': {
                input_tag['name']: input_tag['value']
                for input_tag in form.find_all('input')
                if input_tag.get('name')
            },
            'filename': filename
        })
    
    # Extract direct download links
    for link in soup.select('a[href*="download"]'):
        if 'pdf' in link.text.lower() or 'epub' in link.text.lower():
            options.append({
                'type': link.text.strip().split()[0],
                'method': 'GET',
                'url': link['href']
            })
    
    return options

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

import re
def parse_search_results(html):
    soup = BeautifulSoup(html, "html.parser")
    books = []

    for article in soup.select("article"):  # Each book is inside an <article> tag
        title_tag = article.select_one("h2 a")
        img_tag = article.select_one("img")
        link = title_tag["href"] if title_tag else None
        title = title_tag.get_text(strip=True) if title_tag else None
        image = img_tag["src"] if img_tag else None

        author = "Unknown Author"
        if link:
            author_match = re.search(r'/authors/([^/]+)/', link)
            if author_match:
                author = ' '.join(
                    name.capitalize() 
                    for name in author_match.group(1).split('-')
                )
        books.append({
            "title": title,
            "author": author,
            "link": link,
            "image": image
        })

    return books

# def parse_new_releases(html):
#     soup = BeautifulSoup(html, "html.parser")
#     books = []

#     for item in soup.select("a.title-image"):  # selects all book cover links
#         link = item.get("href")
#         img_tag = item.select_one("img")
#         image = None
        
#         if img_tag:
#             # Prefer data-src over src (lazyload images)
#             image = img_tag.get("data-src") or img_tag.get("src")

#         # Try to find the title in the corresponding info div
#         title_div = item.find_next("div", class_="widget-event__info")
#         title_tag = title_div.select_one(".title a") if title_div else None
#         title = title_tag.get_text(strip=True) if title_tag else None

#         author = "Unknown Author"
#         if link:
#             author_match = re.search(r'/authors/([^/]+)/', link)
#             if author_match:
#                 author = ' '.join(
#                     name.capitalize()
#                     for name in author_match.group(1).split('-')
#                 )
#         date = "Unknown"
#         if title_div:
#             date_tag = title_div.select_one(".meta")
#             if date_tag:
#                 date = date_tag.get_text(strip=True)
        
#         books.append({
#             "title": title,
#             "link": link,
#             "image": image,
#             "author": author,
#             "date": date
#         })

#     return books

def parse_new_releases(html):
    soup = BeautifulSoup(html, "html.parser")
    books = []

    for item in soup.select("a.title-image"):
        link = item.get("href")
        img_tag = item.select_one("img")
        image = None

        if img_tag:
            image = img_tag.get("data-src") or img_tag.get("src")

        # Title
        title_div = item.find_next("div", class_="widget-event__info")
        title_tag = title_div.select_one(".title a") if title_div else None
        title = title_tag.get_text(strip=True) if title_tag else None

        # Author
        author = "Unknown Author"
        if link:
            author_match = re.search(r'/authors/([^/]+)/', link)
            if author_match:
                author = ' '.join(
                    name.capitalize()
                    for name in author_match.group(1).split('-')
                )

        books.append({
            "title": title,
            "link": link,
            "image": image,
            "author": author,
        })

    return books

def scrape_magazines():
    cache_key = "magazines_html"

    if cached := cache.get(cache_key):
        return cached

    url = f"{settings.API_BASE_URL}/magazines-newspapers/"
    response = make_request(url)

    if not response:
        return None

    html_content = response.content.decode('utf-8', errors='ignore')

    cache.set(cache_key, html_content, settings.SCRAPE_CACHE_TIMEOUT)
    return html_content


def parse_magazines(html):
    soup = BeautifulSoup(html, "html.parser")
    books = []

    for item in soup.select("a.title-image"):
        link = item.get("href")
        img_tag = item.select_one("img")
        image = None

        if img_tag:
            image = img_tag.get("data-src") or img_tag.get("src")

        # Title
        title_div = item.find_next("div", class_="widget-event__info")
        title_tag = title_div.select_one(".title a") if title_div else None
        title = title_tag.get_text(strip=True) if title_tag else None

        # Author
        author = "Unknown Author"
        if link:
            author_match = re.search(r'/authors/([^/]+)/', link)
            if author_match:
                author = ' '.join(
                    name.capitalize()
                    for name in author_match.group(1).split('-')
                )

        books.append({
            "title": title,
            "link": link,
            "image": image,
            "author": author,
        })

    return books

def scrape_novels():
    cache_key = "novels_html"

    if cached := cache.get(cache_key):
        return cached

    url = f"{settings.API_BASE_URL}/webnovels/"
    response = make_request(url)

    if not response:
        return None

    html_content = response.content.decode('utf-8', errors='ignore')

    cache.set(cache_key, html_content, settings.SCRAPE_CACHE_TIMEOUT)
    return html_content


def parse_novels(html):
    soup = BeautifulSoup(html, "html.parser")
    books = []

    for item in soup.select("a.title-image"):
        link = item.get("href")
        img_tag = item.select_one("img")
        image = None

        if img_tag:
            image = img_tag.get("data-src") or img_tag.get("src")

        # Title
        title_div = item.find_next("div", class_="widget-event__info")
        title_tag = title_div.select_one(".title a") if title_div else None
        title = title_tag.get_text(strip=True) if title_tag else None

        # Author
        author = "Unknown Author"
        if link:
            author_match = re.search(r'/authors/([^/]+)/', link)
            if author_match:
                author = ' '.join(
                    name.capitalize()
                    for name in author_match.group(1).split('-')
                )

        books.append({
            "title": title,
            "link": link,
            "image": image,
            "author": author,
        })

    return books

def scrape_genres():
    """Scrape genres from Ocean of PDF"""
    cache_key = "genres_html"
    
    if cached := cache.get(cache_key):
        return cached
    
    # This is the main link you provided
    url = settings.API_BASE_URL + "/books-by-genre/"
    response = make_request(url)
    
    if not response:
        return None
    
    html_content = response.content.decode('utf-8', errors='ignore')
    cache.set(cache_key, html_content, settings.SCRAPE_CACHE_TIMEOUT)
    return html_content


def parse_genres(html):
    """Parse genres from HTML content with the specific Ocean of PDF structure"""
    soup = BeautifulSoup(html, "html.parser")
    genres = []
    
    # Find all h3 elements with class h3genres (based on your HTML sample)
    genre_elements = soup.select("h3.h3genres")
    
    for genre_element in genre_elements:
        # Find the link within the h3 element
        link_element = genre_element.find("a")
        if not link_element:
            continue
            
        href = link_element.get('href', '')
        name = link_element.get_text(strip=True)
        
        # Extract the book count from the text following the link
        genre_text = genre_element.get_text()
        book_count = 0
        
        # Use regex to extract the number in parentheses
        count_match = re.search(r'\((\d+)\)', genre_text)
        if count_match:
            book_count = int(count_match.group(1))
        
        # Extract genre slug from URL
        genre_slug = None
        if '/category/genres/' in href:
            genre_slug = href.split('/category/genres/')[-1].strip('/')
        elif '/genre/' in href:
            genre_slug = href.split('/genre/')[-1].strip('/')
        elif '/category/' in href:
            
            genre_slug = href.split('/category/')[-1].strip('/')
        else:
            
            genre_slug = href.split('/')[-2] if len(href.split('/')) > 2 else None
        
        genres.append({
            "name": name,
            "slug": genre_slug,
            "url": href,
            "book_count": book_count
        })
    
    # Sort alphabetically by name
    return sorted(genres, key=lambda x: x['name'])

def scrape_books_by_genre(genre_url, page=1):
    """Scrape books from a specific genre URL"""
    try:
        page = int(page)
        if page < 1:
            page = 1
    except (ValueError, TypeError):
        page = 1

    cache_key = f"books_{hash(genre_url)}_page_{page}"

    if cached := cache.get(cache_key):
        return cached
    
    # Handle pagination using Ocean of PDF's structure
    if page > 1:
        if genre_url.endswith('/'):
            url = f"{genre_url}page/{page}/"
        else:
            url = f"{genre_url}/page/{page}/"
    else:
        url = genre_url
    
    response = make_request(url)
    
    if not response:
        return None
    
    html_content = response.content.decode('utf-8', errors='ignore')
    cache.set(cache_key, html_content, settings.SCRAPE_CACHE_TIMEOUT)
    return html_content


def parse_books_from_genre(html, genre_name):
    """Parse books from genre page HTML using exact Ocean of PDF structure"""
    soup = BeautifulSoup(html, "html.parser")
    books = []
    
    # Use the exact selector for Ocean of PDF book articles
    book_elements = soup.select("article.post")
    
    for item in book_elements:
        # Extract title and link - exact selectors from the HTML
        title_element = item.select_one("h2.entry-title a.entry-title-link")
        if not title_element:
            continue
            
        title = title_element.get_text(strip=True)
        link = title_element.get('href', '')
        
        # Extract author from .postmetainfo (more reliable)
        author = "Unknown Author"
        meta_element = item.select_one(".postmetainfo")
        if meta_element:
            meta_text = meta_element.get_text()
            # Look for "Author: " pattern
            author_match = re.search(r'Author:\s*(.+?)(?:\n|$)', meta_text)
            if author_match:
                author = author_match.group(1).strip()
        
        # Extract image - use the exact image structure
        image = None
        img_element = item.select_one(".entry-image-link img")
        if img_element:
            image = img_element.get('data-src') or img_element.get('src')
            # Ensure absolute URL
            if image and not image.startswith('http'):
                image = f"{settings.BASE_URL}{image}"
        
        # Extract description from .entry-content
        description = None
        desc_element = item.select_one(".entry-content p")
        if desc_element:
            description = desc_element.get_text(strip=True)
            # Remove "Read more..." text if present
            description = re.sub(r'\[Read more…\]$', '', description).strip()
        
        # Extract date if available
        date = None
        date_element = item.select_one("time.entry-time")
        if date_element:
            date = date_element.get_text(strip=True)
        
        books.append({
            "title": title,
            "link": link if link.startswith('http') else f"{settings.BASE_URL}{link}",
            "author": author,
            "image": image,
            "description": description,
            "date": date,
            "genre": genre_name,
            "source": "Ocean of PDF"
        })
    
    return books


def get_total_pages_from_genre(html):
    """Extract total pages from pagination elements"""
    soup = BeautifulSoup(html, "html.parser")
    
    # Look for pagination in various locations
    pagination_elements = soup.select("div.pagination, nav.pagination, .page-numbers, .nav-links")
    
    max_page = 1
    
    for element in pagination_elements:
        # Look for page numbers in links
        page_links = element.select("a")
        for link in page_links:
            text = link.get_text(strip=True)
            if text.isdigit():
                max_page = max(max_page, int(text))
        
        # Look for page numbers in spans (current page)
        page_spans = element.select("span")
        for span in page_spans:
            text = span.get_text(strip=True)
            if text.isdigit():
                max_page = max(max_page, int(text))
    
    return max_page if max_page > 1 else 1


def get_genre_by_slug(slug):
    """Get a specific genre by its slug"""
    html_content = scrape_genres()
    if not html_content:
        return None
    
    genres = parse_genres(html_content)
    for genre in genres:
        if genre['slug'] == slug:
            return genre
    return None