from typing import List, Dict
from scrapy import Spider, Request
from scrapy.crawler import CrawlerProcess
from .base_crawler import BaseCrawler
import json

class MoneyControlSpider(Spider):
    name = 'moneycontrol'
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
        super(MoneyControlSpider, self).__init__(*args, **kwargs)
        self.start_urls = [url] if url else []
        self.stocks = []
        
    def parse(self, response):
        # Find the holdings table
        holdings_table = response.css('.holdings-table')
        if not holdings_table:
            return
            
        # Extract stock information
        for row in holdings_table.css('tr')[1:11]:  # Skip header, get top 10
            try:
                stock = {
                    'name': row.css('td:nth-child(1)::text').get().strip(),
                    'sector': row.css('td:nth-child(2)::text').get().strip(),
                    'percentage': row.css('td:nth-child(3)::text').get().strip()
                }
                self.stocks.append(stock)
            except Exception:
                continue
                
        return self.stocks

class MoneyControlCrawler(BaseCrawler):
    def __init__(self):
        super().__init__('moneycontrol_crawler')
        
    def get_bs4_selectors(self) -> Dict[str, str]:
        """Get CSS selectors for BeautifulSoup parsing."""
        return {
            'container': '.holdings-table',
            'rows': 'tr',
            'name': 'td:nth-child(1)',
            'sector': 'td:nth-child(2)',
            'percentage': 'td:nth-child(3)'
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
            spider = MoneyControlSpider(url=url)
            process.crawl(MoneyControlSpider, url=url)
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