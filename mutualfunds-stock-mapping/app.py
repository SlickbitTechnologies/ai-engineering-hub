import streamlit as st
import asyncio
import nest_asyncio
from crawlers.moneycontrol_crawler import MoneyControlCrawler
from crawlers.advisorkhoj_crawler import AdvisorkhojCrawler
import google.generativeai as genai
from dotenv import load_dotenv
import os
import warnings
import multiprocessing
from functools import partial

# Suppress the coroutine warning
warnings.filterwarnings("ignore", message="coroutine 'expire_cache' was never awaited")

# Apply nest_asyncio to allow nested event loops
nest_asyncio.apply()

# Load environment variables
load_dotenv()

# Configure Google AI
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

def run_crawler(url: str, source: str) -> dict:
    """
    Run crawler in a separate process to avoid signal handling issues.
    """
    try:
        # Initialize crawler based on source
        if source.lower() == 'moneycontrol':
            crawler = MoneyControlCrawler()
        else:
            crawler = AdvisorkhojCrawler()
            
        # Get top stocks
        stocks = crawler.get_top_stocks(url)
        
        if not stocks:
            return {
                'error': 'No stock data found',
                'stocks': [],
                'analysis': ''
            }
            
        return {
            'stocks': stocks,
            'analysis': ''
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'stocks': [],
            'analysis': ''
        }

def analyze_mutual_fund(url: str, source: str) -> dict:
    """
    Analyze mutual fund holdings and provide insights.
    """
    try:
        # Run crawler in a separate process
        with multiprocessing.Pool(1) as pool:
            result = pool.apply(run_crawler, (url, source))
        
        if 'error' in result:
            return result
            
        # Prepare prompt for analysis
        prompt = f"""
        Analyze the following mutual fund holdings and provide insights:
        
        Top Holdings:
        {result['stocks']}
        
        Please provide:
        1. Sector concentration analysis
        2. Risk assessment
        3. Investment strategy insights
        4. Potential concerns or opportunities
        """
        
        # Generate analysis using Google AI
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        result['analysis'] = response.text
        return result
        
    except Exception as e:
        return {
            'error': str(e),
            'stocks': [],
            'analysis': ''
        }

def main():
    # Initialize session state
    if 'url' not in st.session_state:
        st.session_state.url = ""
    if 'source' not in st.session_state:
        st.session_state.source = "MoneyControl"
    if 'analysis_result' not in st.session_state:
        st.session_state.analysis_result = None

    st.title("Mutual Fund Analysis Tool")
    st.write("Analyze mutual fund holdings and get AI-powered insights")
    
    # Input fields with session state
    url = st.text_input("Enter Mutual Fund URL", key="url", value=st.session_state.url)
    source = st.selectbox("Select Data Source", ["MoneyControl", "Advisorkhoj"], key="source", index=0 if st.session_state.source == "MoneyControl" else 1)
    
    if st.button("Analyze"):
        if not url:
            st.error("Please enter a URL")
            return
            
        with st.spinner("Analyzing mutual fund holdings..."):
            try:
                # Run analysis
                result = analyze_mutual_fund(url, source)
                
                if 'error' in result:
                    st.error(f"Error: {result['error']}")
                    return
                    
                # Store result in session state
                st.session_state.analysis_result = result
                
                # Display results
                st.subheader("Top Holdings")
                for stock in result['stocks']:
                    st.write(f"- {stock['name']} ({stock['sector']}): {stock['percentage']}")
                    
                st.subheader("AI Analysis")
                st.write(result['analysis'])
                
            except Exception as e:
                st.error(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main() 