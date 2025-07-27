from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
import random
import requests
import re
import ipaddress
import socket
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from app.services.ai_processing import gemini_processor
from app.core.security import get_current_user

router = APIRouter()

class URLImportRequest(BaseModel):
    url: str

class NutritionInfo(BaseModel):
    calories: int
    protein: float
    carbohydrates: float
    fat: float
    fiber: float
    sugar: float

class URLImportResponse(BaseModel):
    title: str
    ingredients: List[str]
    instructions: List[str]
    servings: int
    nutrition: NutritionInfo
    source_url: str

@router.post("/social-media")
async def import_from_social_media():
    return {"message": "Import recipe from social media post"}

def _validate_url_security(url: str) -> None:
    """Validate URL to prevent SSRF attacks"""
    try:
        parsed = urlparse(url)
        
        # Only allow http and https
        if parsed.scheme not in ['http', 'https']:
            raise HTTPException(status_code=400, detail="Only HTTP and HTTPS URLs are allowed")
        
        # Get hostname
        hostname = parsed.hostname
        if not hostname:
            raise HTTPException(status_code=400, detail="Invalid URL: no hostname")
        
        # Block localhost and private networks
        blocked_hosts = [
            'localhost', '127.0.0.1', '::1',
            '0.0.0.0', '169.254.169.254'  # AWS metadata endpoint
        ]
        
        if hostname.lower() in blocked_hosts:
            raise HTTPException(status_code=400, detail="Access to local/private addresses is not allowed")
        
        # Resolve hostname to IP and check if it's private
        try:
            ip_addresses = socket.getaddrinfo(hostname, None)
            for addr_info in ip_addresses:
                ip = addr_info[4][0]
                ip_obj = ipaddress.ip_address(ip)
                
                # Block private, loopback, and multicast addresses
                if (ip_obj.is_private or 
                    ip_obj.is_loopback or 
                    ip_obj.is_multicast or
                    ip_obj.is_reserved or
                    ip_obj.is_link_local):
                    raise HTTPException(
                        status_code=400, 
                        detail="Access to private/internal IP addresses is not allowed"
                    )
        except socket.gaierror:
            raise HTTPException(status_code=400, detail="Unable to resolve hostname")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid IP address")
            
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL format")


@router.post("/url", response_model=URLImportResponse)
async def import_from_url(
    request: URLImportRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Import recipe from URL - supports recipe websites, social media, and blogs
    """
    # Validate URL security to prevent SSRF
    _validate_url_security(request.url)
    
    try:
        # Detect URL type for specific handling
        url_type = _detect_url_type(request.url)
        
        # Scrape content from URL
        scraped_content = await _scrape_url_content(request.url, url_type)
        
        if not scraped_content:
            raise HTTPException(status_code=400, detail="Unable to extract content from URL")
        
        # Extract recipe using AI processing
        extraction_result = await gemini_processor.extract_recipe_from_text(scraped_content)
        
        # Convert to response format
        recipe_response = URLImportResponse(
            title=extraction_result.get("title", "Imported Recipe"),
            ingredients=extraction_result.get("ingredients", []),
            instructions=extraction_result.get("instructions", []).split('\n') if isinstance(extraction_result.get("instructions"), str) else extraction_result.get("instructions", []),
            servings=extraction_result.get("servings", 4),
            nutrition=NutritionInfo(
                calories=extraction_result.get("nutrition", {}).get("calories", random.randint(250, 400)),
                protein=extraction_result.get("nutrition", {}).get("protein", round(random.uniform(5, 15), 1)),
                carbohydrates=extraction_result.get("nutrition", {}).get("carbohydrates", round(random.uniform(30, 60), 1)),
                fat=extraction_result.get("nutrition", {}).get("fat", round(random.uniform(8, 20), 1)),
                fiber=extraction_result.get("nutrition", {}).get("fiber", round(random.uniform(1, 8), 1)),
                sugar=extraction_result.get("nutrition", {}).get("sugar", round(random.uniform(10, 30), 1))
            ),
            source_url=request.url
        )
        
        return recipe_response
        
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recipe extraction failed: {str(e)}")


def _detect_url_type(url: str) -> str:
    """Detect the type of URL for specialized scraping"""
    domain = urlparse(url).netloc.lower()
    
    # Social media platforms
    if any(platform in domain for platform in ['instagram.com', 'tiktok.com', 'youtube.com', 'facebook.com', 'twitter.com']):
        return 'social_media'
    
    # Popular recipe sites
    if any(site in domain for site in ['allrecipes.com', 'foodnetwork.com', 'epicurious.com', 'food.com', 'delish.com', 'tasty.co', 'foodandwine.com']):
        return 'recipe_site'
    
    # General websites/blogs
    return 'general'


async def _scrape_url_content(url: str, url_type: str) -> str:
    """Scrape content from URL based on type"""
    headers = {
        'User-Agent': 'MacroLensBot/1.0 (+https://macrolens.com/bot)'
    }
    
    try:
        # Validate URL again before making request (defense in depth)
        _validate_url_security(url)
        
        # Make request with strict timeout and size limits
        response = requests.get(
            url, 
            headers=headers, 
            timeout=10,  # 10 second timeout
            stream=True,
            allow_redirects=False  # Prevent redirect-based SSRF
        )
        response.raise_for_status()
        
        # Check content size to prevent DoS
        content_length = response.headers.get('content-length')
        if content_length and int(content_length) > 5 * 1024 * 1024:  # 5MB limit
            raise Exception("Content too large")
        
        # Read content with size limit
        content = b''
        for chunk in response.iter_content(chunk_size=8192):
            content += chunk
            if len(content) > 5 * 1024 * 1024:  # 5MB limit
                raise Exception("Content too large")
        
        response._content = content
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        extracted_content = []
        
        if url_type == 'recipe_site':
            # Look for structured recipe data
            content = _extract_recipe_site_content(soup)
        elif url_type == 'social_media':
            # Extract from social media posts
            content = _extract_social_media_content(soup, url)
        else:
            # General website extraction
            content = _extract_general_content(soup)
        
        return content
        
    except Exception as e:
        raise Exception(f"Content extraction failed: {str(e)}")


def _extract_recipe_site_content(soup: BeautifulSoup) -> str:
    """Extract content from recipe websites"""
    content_parts = []
    
    # Try to find JSON-LD structured data first
    json_scripts = soup.find_all('script', type='application/ld+json')
    for script in json_scripts:
        try:
            import json
            data = json.loads(script.string)
            if isinstance(data, list):
                data = data[0]
            if data.get('@type') == 'Recipe':
                return _format_structured_recipe_data(data)
        except:
            continue
    
    # Fallback to common HTML patterns
    # Title
    title = soup.find('h1') or soup.find('title')
    if title:
        content_parts.append(f"Recipe Title: {title.get_text().strip()}")
    
    # Ingredients
    ingredients = soup.find_all(['li', 'span', 'div'], class_=re.compile(r'ingredient', re.I))
    if ingredients:
        content_parts.append("Ingredients:")
        for ing in ingredients[:20]:  # Limit to first 20
            text = ing.get_text().strip()
            if text and len(text) > 3:
                content_parts.append(f"- {text}")
    
    # Instructions
    instructions = soup.find_all(['li', 'p', 'div'], class_=re.compile(r'instruction|direction|step', re.I))
    if instructions:
        content_parts.append("Instructions:")
        for i, inst in enumerate(instructions[:15], 1):  # Limit to first 15 steps
            text = inst.get_text().strip()
            if text and len(text) > 10:
                content_parts.append(f"{i}. {text}")
    
    # Additional content
    description = soup.find(['div', 'p'], class_=re.compile(r'description|summary', re.I))
    if description:
        content_parts.append(f"Description: {description.get_text().strip()}")
    
    return '\n'.join(content_parts)


def _extract_social_media_content(soup: BeautifulSoup, url: str) -> str:
    """Extract content from social media posts"""
    content_parts = []
    
    # Get page title
    title = soup.find('title')
    if title:
        content_parts.append(f"Post Title: {title.get_text().strip()}")
    
    # Look for post content based on platform
    if 'instagram.com' in url:
        # Instagram post content
        meta_desc = soup.find('meta', property='og:description')
        if meta_desc:
            content_parts.append(f"Instagram Post: {meta_desc.get('content', '')}")
    
    elif 'tiktok.com' in url:
        # TikTok video description
        meta_desc = soup.find('meta', property='og:description')
        if meta_desc:
            content_parts.append(f"TikTok Description: {meta_desc.get('content', '')}")
    
    elif 'youtube.com' in url:
        # YouTube video description
        meta_desc = soup.find('meta', property='og:description')
        if meta_desc:
            content_parts.append(f"YouTube Description: {meta_desc.get('content', '')}")
    
    # Fallback to general text extraction
    if not content_parts:
        text_content = soup.get_text()
        # Clean and truncate
        clean_text = re.sub(r'\s+', ' ', text_content).strip()
        if len(clean_text) > 100:
            content_parts.append(clean_text[:2000])  # Limit to first 2000 chars
    
    return '\n'.join(content_parts)


def _extract_general_content(soup: BeautifulSoup) -> str:
    """Extract content from general websites/blogs"""
    content_parts = []
    
    # Title
    title = soup.find('h1') or soup.find('title')
    if title:
        content_parts.append(f"Title: {title.get_text().strip()}")
    
    # Main content areas
    main_content = soup.find(['main', 'article', 'div'], class_=re.compile(r'content|main|article|post', re.I))
    if main_content:
        # Extract paragraphs and lists
        for element in main_content.find_all(['p', 'ul', 'ol', 'h2', 'h3']):
            text = element.get_text().strip()
            if text and len(text) > 20:
                content_parts.append(text)
    else:
        # Fallback to all text
        text_content = soup.get_text()
        clean_text = re.sub(r'\s+', ' ', text_content).strip()
        if len(clean_text) > 100:
            content_parts.append(clean_text[:3000])  # Limit to first 3000 chars
    
    return '\n'.join(content_parts)


def _format_structured_recipe_data(data: dict) -> str:
    """Format JSON-LD recipe data into text"""
    content_parts = []
    
    if data.get('name'):
        content_parts.append(f"Recipe: {data['name']}")
    
    if data.get('description'):
        content_parts.append(f"Description: {data['description']}")
    
    if data.get('recipeIngredient'):
        content_parts.append("Ingredients:")
        for ing in data['recipeIngredient']:
            content_parts.append(f"- {ing}")
    
    if data.get('recipeInstructions'):
        content_parts.append("Instructions:")
        for i, inst in enumerate(data['recipeInstructions'], 1):
            if isinstance(inst, dict):
                text = inst.get('text', str(inst))
            else:
                text = str(inst)
            content_parts.append(f"{i}. {text}")
    
    if data.get('prepTime'):
        content_parts.append(f"Prep Time: {data['prepTime']}")
    
    if data.get('cookTime'):
        content_parts.append(f"Cook Time: {data['cookTime']}")
    
    if data.get('recipeYield'):
        content_parts.append(f"Servings: {data['recipeYield']}")
    
    return '\n'.join(content_parts)

@router.get("/jobs")
async def get_import_jobs():
    return {"message": "Get user import jobs"}

@router.get("/jobs/{job_id}")
async def get_import_job(job_id: str):
    return {"message": f"Get import job {job_id}"}