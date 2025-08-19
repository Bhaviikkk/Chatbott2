import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
import re
import sys
from typing import Dict, List, Optional
import time

class WebsiteScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def scrape_website(self, url: str) -> Dict:
        """Scrape website metadata and content"""
        try:
            # Normalize URL
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract metadata
            metadata = self._extract_metadata(soup, url)
            
            # Extract main content
            content = self._extract_content(soup)
            
            # Extract navigation and structure
            navigation = self._extract_navigation(soup, url)
            
            return {
                'url': url,
                'status': 'success',
                'metadata': metadata,
                'content': content,
                'navigation': navigation,
                'scraped_at': time.time()
            }
            
        except Exception as e:
            return {
                'url': url,
                'status': 'error',
                'error': str(e),
                'scraped_at': time.time()
            }
    
    def _extract_metadata(self, soup: BeautifulSoup, url: str) -> Dict:
        """Extract website metadata"""
        metadata = {
            'title': '',
            'description': '',
            'keywords': '',
            'og_title': '',
            'og_description': '',
            'og_image': '',
            'twitter_title': '',
            'twitter_description': '',
            'favicon': '',
            'domain': urlparse(url).netloc
        }
        
        # Title
        title_tag = soup.find('title')
        if title_tag:
            metadata['title'] = title_tag.get_text().strip()
        
        # Meta tags
        meta_tags = soup.find_all('meta')
        for tag in meta_tags:
            name = tag.get('name', '').lower()
            property_attr = tag.get('property', '').lower()
            content = tag.get('content', '')
            
            if name == 'description':
                metadata['description'] = content
            elif name == 'keywords':
                metadata['keywords'] = content
            elif property_attr == 'og:title':
                metadata['og_title'] = content
            elif property_attr == 'og:description':
                metadata['og_description'] = content
            elif property_attr == 'og:image':
                metadata['og_image'] = content
            elif name == 'twitter:title':
                metadata['twitter_title'] = content
            elif name == 'twitter:description':
                metadata['twitter_description'] = content
        
        # Favicon
        favicon_link = soup.find('link', rel='icon') or soup.find('link', rel='shortcut icon')
        if favicon_link:
            metadata['favicon'] = urljoin(url, favicon_link.get('href', ''))
        
        return metadata
    
    def _extract_content(self, soup: BeautifulSoup) -> Dict:
        """Extract main content from the website"""
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        content = {
            'headings': [],
            'paragraphs': [],
            'links': [],
            'images': [],
            'text_content': ''
        }
        
        # Extract headings
        for i in range(1, 7):
            headings = soup.find_all(f'h{i}')
            for heading in headings:
                text = heading.get_text().strip()
                if text:
                    content['headings'].append({
                        'level': i,
                        'text': text
                    })
        
        # Extract paragraphs
        paragraphs = soup.find_all('p')
        for p in paragraphs:
            text = p.get_text().strip()
            if text and len(text) > 20:  # Filter out short/empty paragraphs
                content['paragraphs'].append(text)
        
        # Extract links
        links = soup.find_all('a', href=True)
        for link in links:
            text = link.get_text().strip()
            href = link.get('href')
            if text and href:
                content['links'].append({
                    'text': text,
                    'href': href
                })
        
        # Extract images
        images = soup.find_all('img', src=True)
        for img in images:
            alt = img.get('alt', '')
            src = img.get('src')
            if src:
                content['images'].append({
                    'src': src,
                    'alt': alt
                })
        
        # Extract all text content
        main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|main'))
        if main_content:
            content['text_content'] = main_content.get_text(separator=' ', strip=True)
        else:
            content['text_content'] = soup.get_text(separator=' ', strip=True)
        
        # Clean up text content
        content['text_content'] = re.sub(r'\s+', ' ', content['text_content'])[:8000]  # Limit to 8000 chars
        
        return content
    
    def _extract_navigation(self, soup: BeautifulSoup, base_url: str) -> List[Dict]:
        """Extract navigation structure"""
        navigation = []
        
        # Find navigation elements
        nav_elements = soup.find_all(['nav', 'div'], class_=re.compile(r'nav|menu|header'))
        
        for nav in nav_elements:
            links = nav.find_all('a', href=True)
            for link in links:
                text = link.get_text().strip()
                href = link.get('href')
                if text and href:
                    full_url = urljoin(base_url, href)
                    navigation.append({
                        'text': text,
                        'href': full_url
                    })
        
        return navigation[:20]  # Limit to 20 navigation items

# Handle command line input
if __name__ == "__main__":
    try:
        # Read from stdin for URL
        input_data = sys.stdin.read().strip()
        if input_data:
            data = json.loads(input_data)
            url = data.get('url', '')
        else:
            # Fallback to command line argument
            url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
        
        scraper = WebsiteScraper()
        result = scraper.scrape_website(url)
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'status': 'error',
            'error': str(e),
            'scraped_at': time.time()
        }
        print(json.dumps(error_result, indent=2))
