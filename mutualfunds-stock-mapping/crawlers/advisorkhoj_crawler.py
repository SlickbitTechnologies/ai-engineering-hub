from typing import List, Dict
from scrapy import Spider, Request
from scrapy.crawler import CrawlerProcess
from .base_crawler import BaseCrawler
import json

class AdvisorkhojSpider(Spider):
    name = 'advisorkhoj'
    custom_settings = {
        'LOG_LEVEL': 'ERROR',
        'ROBOTSTXT_OBEY': True,
        'USER_AGENT': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'DOWNLOAD_HANDLERS': {
            "http": "scrapy.core.downloader.handlers.http.HTTP10DownloadHandler",
            "https": "scrapy.core.downloader.handlers.http.HTTP10DownloadHandler"
        }
    }
    
    def __init__(self, url=None, *args, **kwargs):
        super(AdvisorkhojSpider, self).__init__(*args, **kwargs)
        self.start_urls = [url] if url else []
        self.stocks = []
        
    def parse(self, response):
        # Find the portfolio holdings section
        holdings_section = response.css('.portfolio-holdings')
        if not holdings_section:
            return
            
        # Extract stock information
        for row in holdings_section.css('.stock-row')[:10]:  # Get top 10
            try:
                stock = {
                    'name': row.css('.stock-name::text').get().strip(),
                    'sector': row.css('.sector::text').get().strip(),
                    'percentage': row.css('.percentage::text').get().strip()
                }
                self.stocks.append(stock)
            except Exception:
                continue
                
        return self.stocks

class AdvisorkhojCrawler(BaseCrawler):
    def __init__(self):
        super().__init__('advisorkhoj_crawler')
        
    def get_bs4_selectors(self) -> Dict[str, str]:
        """Get CSS selectors for BeautifulSoup parsing."""
        return {
            'container': '.portfolio-holdings',
            'rows': '.stock-row',
            'name': '.stock-name',
            'sector': '.sector',
            'percentage': '.percentage'
        }
        
    def get_stocks_with_scrapy(self, url: str) -> List[Dict]:
        """Get stocks using Scrapy."""
        try:
            process = CrawlerProcess({
                'USER_AGENT': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'LOG_LEVEL': 'ERROR',
                'ROBOTSTXT_OBEY': True,
                'DOWNLOAD_HANDLERS': {
                    "http": "scrapy.core.downloader.handlers.http.HTTP10DownloadHandler",
                    "https": "scrapy.core.downloader.handlers.http.HTTP10DownloadHandler"
                }
            })
            
            # Create a new spider instance for each request
            spider = AdvisorkhojSpider(url=url)
            process.crawl(AdvisorkhojSpider, url=url)
            process.start()
            
            # Get the stocks from the spider instance
            stocks = spider.stocks
            if stocks:
                self.logger.info(f"Successfully extracted {len(stocks)} stocks using Scrapy")
                return stocks
            else:
                self.logger.warning("No stocks found using Scrapy")
                return []
                
        except Exception as e:
            self.logger.error(f"Error using Scrapy: {str(e)}")
            return [] 