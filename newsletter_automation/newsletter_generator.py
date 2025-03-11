import google.generativeai as genai
import logging
import requests
from bs4 import BeautifulSoup
from typing import Optional, Dict, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NewsletterGenerator:
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        # List available models
        for m in genai.list_models():
            logger.info(f"Available model: {m.name}")
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        logger.info("NewsletterGenerator initialized with Gemini API")

    def search_news(self, topic: str) -> List[Dict[str, str]]:
        """Search for news articles related to the topic."""
        try:
            # Using DuckDuckGo for news search (no API key required)
            search_url = f"https://duckduckgo.com/html/?q={topic}+news"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(search_url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            results = []
            for result in soup.find_all('div', {'class': 'result'})[:5]:  # Get top 5 results
                title = result.find('h2').get_text() if result.find('h2') else ""
                snippet = result.find('a', {'class': 'result__snippet'}).get_text() if result.find('a', {'class': 'result__snippet'}) else ""
                if title and snippet:
                    results.append({
                        'title': title,
                        'snippet': snippet
                    })
            
            logger.info(f"Found {len(results)} news articles for topic: {topic}")
            return results
        except Exception as e:
            logger.error(f"Error searching news: {str(e)}")
            return []

    def generate_newsletter(self, topic: str, description: str = "") -> Optional[str]:
        """Generate a newsletter using Gemini."""
        try:
            # Search for relevant news
            news_articles = self.search_news(topic)
            
            # Prepare context for Gemini
            context = f"""
Topic: {topic}
Additional Description: {description}

Recent News Articles:
{chr(10).join([f"- {article['title']}: {article['snippet']}" for article in news_articles])}

Instructions:
1. Create an engaging newsletter about the given topic
2. Include a catchy headline
3. Organize content into clear sections
4. Include key insights and trends
5. Add a compelling call to action
6. Keep the tone professional yet engaging
7. Format the content with proper markdown
"""

            # Generate newsletter using Gemini
            response = self.model.generate_content(context)
            
            if response.text:
                logger.info("Successfully generated newsletter")
                return response.text
            else:
                logger.error("Empty response from Gemini")
                return None

        except Exception as e:
            logger.error(f"Error generating newsletter: {str(e)}")
            return None 