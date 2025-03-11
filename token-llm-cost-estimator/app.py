import streamlit as st
import tiktoken
from docx import Document
from PyPDF2 import PdfReader
import io

def get_model_pricing():
    """Return pricing information for different AI models."""
    return {
        "OpenAI": {
            "GPT-4 Turbo": {"input": 0.01, "output": 0.03},
            "GPT-4": {"input": 0.03, "output": 0.06},
            "GPT-3.5 Turbo": {"input": 0.0005, "output": 0.0015}
        },
        "Anthropic": {
            "Claude 3 Opus": {"input": 0.015, "output": 0.075},
            "Claude 3.5 Sonnet": {"input": 0.003, "output": 0.015},
            "Claude 3 Haiku": {"input": 0.00025, "output": 0.00125}
        },
        "Google": {
            "Gemini 2.0 Flash": {"input": 0.0010, "output": 0.0040},
            "Gemini 1.5 Pro": {"input": 0.00125, "output": 0.005},
            "Gemini 1.5 Flash": {"input": 0.00075, "output": 0.003}
        }
    }

def count_tokens(text, model="gpt-3.5-turbo"):
    """Count the number of tokens in the text using the specified model's tokenizer."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def extract_text_from_pdf(pdf_file):
    """Extract text from a PDF file."""
    pdf_reader = PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

def extract_text_from_docx(docx_file):
    """Extract text from a DOCX file."""
    doc = Document(docx_file)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text

def calculate_costs(token_count, pricing_info):
    """Calculate costs for different providers and models."""
    costs = {}
    for provider, models in pricing_info.items():
        costs[provider] = {}
        for model, prices in models.items():
            input_cost = (token_count / 1000) * prices["input"]
            output_cost = (token_count / 1000) * prices["output"]
            costs[provider][model] = {
                "input": input_cost,
                "output": output_cost,
                "total": input_cost + output_cost
            }
    return costs

def main():
    st.set_page_config(
        page_title="AI Token to LLMCost Estimator",
        page_icon="🔢",
        layout="wide"
    )

    # Sidebar
    with st.sidebar:
        st.title("📤 Upload Document")
        st.write("""
        Upload your PDF or DOCX file here to estimate tokens and calculate potential costs across different AI providers.
        """)
        uploaded_file = st.file_uploader("Choose a file", type=['pdf', 'docx'])
        
        if uploaded_file:
            st.success(f"Successfully uploaded: {uploaded_file.name}")
            st.write("---")
            st.write("### File Information")
            st.write(f"**File name:** {uploaded_file.name}")
            st.write(f"**File type:** {uploaded_file.type}")
            st.write(f"**File size:** {uploaded_file.size/1024:.2f} KB")

    # Main content
    st.title("📄 Document Token - LLM Costing Estimator")
    st.write("""
    This tool uses OpenAI's tiktoken library to estimate tokens similar to how they're counted in various AI models.
    Upload your document using the sidebar to get started.
    """)

    if uploaded_file is not None:
        try:
            # Show a spinner while processing
            with st.spinner('Processing your document...'):
                # Extract text based on file type
                file_extension = uploaded_file.name.split('.')[-1].lower()
                
                if file_extension == 'pdf':
                    text = extract_text_from_pdf(uploaded_file)
                elif file_extension == 'docx':
                    text = extract_text_from_docx(uploaded_file)
                
                # Count tokens
                token_count = count_tokens(text)
                
                # Calculate costs for different providers
                pricing_info = get_model_pricing()
                costs = calculate_costs(token_count, pricing_info)
                
                # Display results
                st.success('✅ Document processed successfully!')
                
                col1, col2 = st.columns([1, 2])
                with col1:
                    st.write("### Token Count")
                    st.metric("Total Tokens", f"{token_count:,}")
                    
                    st.write("### Document Statistics")
                    st.metric("Characters", f"{len(text):,}")
                    st.metric("Words", f"{len(text.split()):,}")
                    st.metric("Avg Tokens/Word", f"{token_count/len(text.split()):.2f}")
                
                with col2:
                    st.write("### Cost Estimates by Provider")
                    # Create tabs for different providers
                    tabs = st.tabs(list(costs.keys()))
                    
                    for tab, (provider, models) in zip(tabs, costs.items()):
                        with tab:
                            st.write(f"#### {provider} Models")
                            for model, cost in models.items():
                                st.write(f"**{model}**")
                                cols = st.columns(3)
                                cols[0].metric("Input Cost", f"${cost['input']:.4f}")
                                cols[1].metric("Output Cost", f"${cost['output']:.4f}")
                                cols[2].metric("Total Cost", f"${cost['total']:.4f}")
                                st.write("---")

        except Exception as e:
            st.error(f"An error occurred while processing the file: {str(e)}")
            st.write("Please make sure you've uploaded a valid PDF or DOCX file.")
    else:
        # Show placeholder when no file is uploaded
        st.info("👈 Please upload a document using the sidebar to get started!")
        
        # Show example of what the tool does
        with st.expander("ℹ️ How it works"):
            st.write("""
            1. Upload your PDF or DOCX file using the sidebar
            2. The tool will process your document and count the tokens
            3. You'll get detailed cost estimates for various AI models
            4. Compare costs across different providers
            5. View document statistics and token metrics
            """)

if __name__ == "__main__":
    main() 