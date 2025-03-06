from typing import List, Dict, Optional
import validators
import requests
from bs4 import BeautifulSoup
from scrapy import Spider, Request
from scrapy.crawler import CrawlerProcess
from utils.logger import setup_logger
import json
import asyncio
import aiohttp
import ssl
from urllib.parse import urlparse

class BaseCrawler:
    def __init__(self, name: str):
        self.logger = setup_logger(name)
        self.session = None
        
    async def setup_session(self):
        """Set up an aiohttp session for async requests."""
        if not self.session:
            # Create SSL context that doesn't verify certificates
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            self.session = aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_context))
            
    async def close_session(self):
        """Close the aiohttp session."""
        if self.session:
            await self.session.close()
            self.session = None
            
    def validate_url(self, url: str) -> bool:
        """
        Validate if the URL is properly formatted and accessible.
        
        Args:
            url (str): URL to validate
            
        Returns:
            bool: True if URL is valid and accessible, False otherwise
        """
        try:
            if not validators.url(url):
                self.logger.error(f"Invalid URL format: {url}")
                return False
                
            # Check if URL is accessible with SSL verification disabled
            response = requests.head(url, timeout=5, verify=False)
            if response.status_code != 200:
                self.logger.error(f"URL not accessible (status code: {response.status_code}): {url}")
                return False
                
            return True
        except Exception as e:
            self.logger.error(f"Error validating URL {url}: {str(e)}")
            return False
            
    async def fetch_with_bs4(self, url: str) -> Optional[str]:
        """
        Fetch page content using BeautifulSoup.
        
        Args:
            url (str): URL to fetch
            
        Returns:
            Optional[str]: Page content if successful, None otherwise
        """
        try:
            await self.setup_session()
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    self.logger.error(f"Failed to fetch URL with BeautifulSoup (status: {response.status}): {url}")
                    return None
        except Exception as e:
            self.logger.error(f"Error fetching with BeautifulSoup: {str(e)}")
            return None
            
    def parse_with_bs4(self, html: str, selectors: Dict[str, str]) -> List[Dict]:
        """
        Parse HTML content using BeautifulSoup.
        
        Args:
            html (str): HTML content to parse
            selectors (Dict[str, str]): Dictionary of CSS selectors for different elements
            
        Returns:
            List[Dict]: List of parsed stock information
        """
        try:
            soup = BeautifulSoup(html, 'lxml')
            stocks = []
            
            # Find the main container
            container = soup.select_one(selectors['container'])
            if not container:
                self.logger.warning("Main container not found in HTML")
                return []
                
            # Find all stock rows
            rows = container.select(selectors['rows'])
            
            for row in rows[:10]:  # Get top 10 stocks
                try:
                    stock = {
                        'name': row.select_one(selectors['name']).text.strip(),
                        'sector': row.select_one(selectors['sector']).text.strip(),
                        'percentage': row.select_one(selectors['percentage']).text.strip()
                    }
                    stocks.append(stock)
                except Exception as e:
                    self.logger.warning(f"Error parsing stock row: {str(e)}")
                    continue
                    
            return stocks
        except Exception as e:
            self.logger.error(f"Error parsing with BeautifulSoup: {str(e)}")
            return []
            
    def get_top_stocks(self, url: str) -> List[Dict]:
        """
        Get top stocks using both BeautifulSoup and Scrapy with fallback.
        
        Args:
            url (str): URL to fetch stock information from
            
        Returns:
            List[Dict]: List of stock information
        """
        if not self.validate_url(url):
            return []
            
        # Try BeautifulSoup first
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        html = loop.run_until_complete(self.fetch_with_bs4(url))
        loop.close()
        
        if html:
            stocks = self.parse_with_bs4(html, self.get_bs4_selectors())
            if stocks:
                self.logger.info(f"Successfully extracted {len(stocks)} stocks using BeautifulSoup")
                return stocks
                
        # Fallback to Scrapy if BeautifulSoup fails
        self.logger.info("Falling back to Scrapy")
        return self.get_stocks_with_scrapy(url)
        
    def get_bs4_selectors(self) -> Dict[str, str]:
        """
        Get CSS selectors for BeautifulSoup parsing.
        Should be implemented by child classes.
        """
        raise NotImplementedError
        
    def get_stocks_with_scrapy(self, url: str) -> List[Dict]:
        """
        Get stocks using Scrapy.
        Should be implemented by child classes.
        """
        raise NotImplementedError 