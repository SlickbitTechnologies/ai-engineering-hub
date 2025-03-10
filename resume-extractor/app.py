import streamlit as st
import google.generativeai as genai
import PyPDF2
from docx import Document
import pandas as pd
import os
from io import BytesIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    st.error("Please set your GOOGLE_API_KEY in the .env file")
    st.stop()

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def extract_text_from_pdf(pdf_file):
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

def extract_text_from_docx(docx_file):
    doc = Document(docx_file)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text

def process_resume(text):
    # Education information extraction
    education_prompt = f"""
    Extract education information from the following resume text and format it as a table.
    For each education entry, identify:
    1. Institution name (school/college)
    2. Year of study
    3. Degree/Course
    4. Marks/Grade (if available)
    
    If any information is missing, leave it blank.
    Format the output as a markdown table with headers: Institution, Year, Degree, Marks
    
    Resume text:
    {text}
    """
    
    education_response = model.generate_content(education_prompt)
    education_table = education_response.text

    # Skills analysis for Python/AI development
    skills_prompt = f"""
    Analyze the resume text and provide a comprehensive summary of the candidate's skills relevant to Python development and AI/ML roles. Focus on:
    1. Programming languages (especially Python) and proficiency level
    2. AI/ML frameworks and libraries
    3. Software development tools and practices
    4. Cloud platforms and deployment experience
    5. Relevant projects or experience
    
    Format the response as a clear, bulleted list grouped by categories. Only include skills that are explicitly mentioned or can be directly inferred from the resume.
    
    Resume text:
    {text}
    """
    
    skills_response = model.generate_content(skills_prompt)
    skills_summary = skills_response.text
    
    return education_table, skills_summary

def main():
    st.title("Resume Education Information Extractor")
    st.write("Upload a resume (PDF or DOCX) to extract education information")
    
    uploaded_file = st.file_uploader("Choose a file", type=['pdf', 'docx'])
    
    if uploaded_file is not None:
        try:
            # Extract text based on file type
            if uploaded_file.type == "application/pdf":
                text = extract_text_from_pdf(uploaded_file)
            else:
                text = extract_text_from_docx(uploaded_file)
            
            # Process the resume
            with st.spinner("Processing resume..."):
                education_table, skills_summary = process_resume(text)
                
                # Display the education table
                st.markdown("### Education Information")
                st.markdown(education_table)
                
                # Display the skills summary
                st.markdown("### Skills Summary for Python/AI Development")
                st.markdown(skills_summary)
                
                # Convert markdown table to pandas DataFrame for download
                try:
                    # Split the markdown table into rows
                    rows = education_table.strip().split('\n')
                    # Remove the separator line
                    rows = [row for row in rows if not all(c == '-' for c in row)]
                    # Process headers and data
                    headers = [cell.strip() for cell in rows[0].strip('|').split('|')]
                    data = []
                    for row in rows[1:]:
                        data.append([cell.strip() for cell in row.strip('|').split('|')])
                    
                    df = pd.DataFrame(data, columns=headers)
                    
                    # Add download button
                    csv = df.to_csv(index=False)
                    st.download_button(
                        label="Download CSV",
                        data=csv,
                        file_name="education_info.csv",
                        mime="text/csv"
                    )
                except Exception as e:
                    st.error(f"Error creating CSV: {str(e)}")
                    
        except Exception as e:
            st.error(f"Error processing file: {str(e)}")

if __name__ == "__main__":
    main() 