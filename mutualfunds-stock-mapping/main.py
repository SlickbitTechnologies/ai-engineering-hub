import os
from typing import List, Dict
import google.generativeai as genai
from dotenv import load_dotenv
from utils.url_validator import validate_url
from crawlers.moneycontrol_crawler import MoneyControlCrawler
from crawlers.advisorkhoj_crawler import AdvisorkhojCrawler
import asyncio

load_dotenv()

class MutualFundAnalyzer:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Configure Gemini
        genai.configure(api_key=self.gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
        # Initialize crawlers
        self.moneycontrol_crawler = MoneyControlCrawler()
        self.advisorkhoj_crawler = AdvisorkhojCrawler()
    
    async def analyze_mutual_fund(self, url: str) -> Dict:
        """
        Analyze a mutual fund and return its top 10 stock holdings.
        
        Args:
            url (str): The mutual fund URL from either MoneyControl or Advisorkhoj
            
        Returns:
            Dict: Analysis results including top stocks and insights
        """
        # Validate URL
        is_valid, message = validate_url(url)
        if not is_valid:
            return {"error": message}
        
        # Get stocks based on the URL source
        if "moneycontrol.com" in url:
            stocks = await asyncio.to_thread(self.moneycontrol_crawler.get_top_stocks, url)
        else:
            stocks = await asyncio.to_thread(self.advisorkhoj_crawler.get_top_stocks, url)
        
        if not stocks:
            return {"error": "No stock data found"}
        
        # Use Gemini to analyze the holdings
        prompt = f"""
        Analyze the following mutual fund holdings and provide insights:
        {stocks}
        
        Please provide:
        1. A summary of the fund's investment strategy
        2. Key sectors the fund is exposed to
        3. Concentration risk analysis
        4. Notable holdings and their significance
        """
        
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            analysis = response.text
        except Exception as e:
            analysis = f"Error generating analysis: {str(e)}"
        
        return {
            "top_stocks": stocks,
            "analysis": analysis
        }

async def main():
    # Example usage
    analyzer = MutualFundAnalyzer()
    
    # Example URLs
    moneycontrol_url = "https://www.moneycontrol.com/mutual-funds/nav/quant-small-cap-fund-direct-plan-growth/MES056"
    advisorkhoj_url = "https://www.advisorkhoj.com/mutual-funds-research/Quant-Small-Cap-Fund-Growth-Regular-Plan"
    
    # Analyze MoneyControl fund
    print("Analyzing MoneyControl fund...")
    result = await analyzer.analyze_mutual_fund(moneycontrol_url)
    print(result)
    
    # Analyze Advisorkhoj fund
    print("\nAnalyzing Advisorkhoj fund...")
    result = await analyzer.analyze_mutual_fund(advisorkhoj_url)
    print(result)

if __name__ == "__main__":
    asyncio.run(main()) 