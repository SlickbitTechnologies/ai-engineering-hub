# Document Token - LLM Costing Estimator

A Streamlit application that helps estimate token counts and associated costs for documents across different Large Language Model (LLM) providers. This tool is particularly useful for developers, researchers, and businesses looking to estimate API costs before processing documents through various LLM services.

## Features

- **Document Support**:
  - PDF files
  - DOCX (Microsoft Word) files

- **Token Estimation**:
  - Accurate token counting using OpenAI's tiktoken library
  - Document statistics (character count, word count, tokens per word)
  - Total token count visualization

- **Cost Estimation for Major LLM Providers**:
  - OpenAI
    - GPT-4 Turbo
    - GPT-4
    - GPT-3.5 Turbo
  - Anthropic
    - Claude 3 Opus
    - Claude 3.5 Sonnet
    - Claude 3 Haiku
  - Google
    - Gemini 2.0 Flash
    - Gemini 1.5 Pro
    - Gemini 1.5 Flash

- **Detailed Cost Breakdown**:
  - Input costs (per provider/model)
  - Output costs (per provider/model)
  - Total estimated costs
  - Cost comparison across providers

## Installation

1. Clone this repository
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Run the Streamlit application:
   ```bash
   streamlit run app.py
   ```

2. Open your web browser and navigate to the URL shown in the terminal (typically http://localhost:8501)

3. Upload a PDF or DOCX file using the file uploader

4. View the results:
   - Total token count
   - Cost estimates for each provider and model
   - Document statistics

## Important Assumptions

1. **Token Counting**:
   - Uses OpenAI's tiktoken library for token counting
   - The same token count is used across all providers (actual token counts may vary slightly between providers)
   - Token counting is based on GPT-3.5-Turbo's tokenizer

2. **Cost Calculation**:
   - Assumes the same input text will be used for both input and output tokens
   - Prices are based on per 1,000 tokens (as of March 2024)
   - Does not account for potential bulk discounts or custom pricing
   - Assumes standard API pricing (not including any special enterprise rates)

3. **Document Processing**:
   - Text is extracted from PDFs and DOCXs as plain text
   - Formatting, images, and special characters may affect token count accuracy
   - Complex document layouts might not be perfectly captured

## Pricing Information (as of March 2024)

### OpenAI
- GPT-4 Turbo: $0.01/1K input, $0.03/1K output
- GPT-4: $0.03/1K input, $0.06/1K output
- GPT-3.5 Turbo: $0.0005/1K input, $0.0015/1K output

### Anthropic
- Claude 3 Opus: $0.015/1K input, $0.075/1K output
- Claude 3.5 Sonnet: $0.003/1K input, $0.015/1K output
- Claude 3 Haiku: $0.00025/1K input, $0.00125/1K output

### Google
- Gemini 2.0 Flash: $0.001/1K input, $0.004/1K output
- Gemini 1.5 Pro: $0.00125/1K input, $0.005/1K output
- Gemini 1.5 Flash: $0.00075/1K input, $0.003/1K output

## Limitations

1. Token counting may not be exactly the same as what different providers use
2. PDF extraction might not capture all formatting perfectly
3. Special characters and non-standard text might affect token count accuracy
4. Pricing is subject to change and should be verified with providers
5. Does not account for provider-specific features or limitations

## Requirements

- Python 3.7+
- Streamlit
- python-docx
- PyPDF2
- tiktoken

## Note

This tool is for estimation purposes only. Actual costs may vary based on:
- Provider-specific tokenization methods
- Special pricing arrangements
- Changes in provider pricing
- Document complexity and formatting
- API-specific features or limitations 