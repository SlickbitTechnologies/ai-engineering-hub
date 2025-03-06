# Mutual Fund Stock Analyzer

This application analyzes mutual funds from MoneyControl and Advisorkhoj to show you the top 10 stocks they invest in, along with detailed insights about the fund's strategy and holdings.

## Features

- Extract top 10 stock holdings from mutual funds
- Support for both MoneyControl and Advisorkhoj URLs
- AI-powered analysis using Google's Gemini
- Beautiful web interface using Streamlit
- Download holdings data as CSV
- URL validation and error handling

## Prerequisites

- Python 3.8 or higher
- API keys for:
  - Google Gemini
  - Firecrawl

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mutualfunds-stock-mapping
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

5. Add your API keys to the `.env` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

## Running the Application

1. Start the Streamlit app:
```bash
streamlit run app.py
```

2. Open your web browser and navigate to the URL shown in the terminal (typically http://localhost:8501)

3. Enter a mutual fund URL from either MoneyControl or Advisorkhoj and click "Analyze Fund"

## Example URLs

- MoneyControl: https://www.moneycontrol.com/mutual-funds/nav/quant-small-cap-fund-direct-plan-growth/MES056
- Advisorkhoj: https://www.advisorkhoj.com/mutual-funds-research/Quant-Small-Cap-Fund-Growth-Regular-Plan

## Project Structure

```
mutualfunds-stock-mapping/
├── app.py                 # Streamlit web interface
├── main.py               # Main application logic
├── requirements.txt      # Python dependencies
├── .env.example         # Example environment variables
├── crawlers/            # Web crawler modules
│   ├── moneycontrol_crawler.py
│   └── advisorkhoj_crawler.py
└── utils/              # Utility modules
    └── url_validator.py
```

## Contributing

Feel free to submit issues and enhancement requests! 