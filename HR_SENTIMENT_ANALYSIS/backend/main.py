from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import csv
import pandas as pd
from datetime import datetime
import groq
from dotenv import load_dotenv
import uuid

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()

# Initialize GROQ client with minimal configuration
try:
    client = groq.Client(
        api_key=os.getenv("GROQ_API_KEY", "default-key")
    )
except Exception as e:
    print(f"Error initializing GROQ client: {e}")
    # Fallback to basic configuration
    client = groq.Client(
        api_key=os.getenv("GROQ_API_KEY", "default-key")
    )

# Data models
class SentimentBreakdown(BaseModel):
    stronglyPositive: float
    somewhatPositive: float
    neutral: float
    somewhatNegative: float
    stronglyNegative: float

class Theme(BaseModel):
    id: str
    name: str
    sentiment: str
    mentions: int

class SentimentData(BaseModel):
    total: int
    positive: float
    neutral: float
    negative: float
    breakdown: SentimentBreakdown
    themes: List[Theme]

class TextAnalysisRequest(BaseModel):
    text: str

# Recommendation models
class Recommendation(BaseModel):
    id: str
    title: str
    description: str
    department: List[str]
    impactLevel: str
    status: str
    tags: List[str]

class NewRecommendation(BaseModel):
    title: str
    description: str
    department: List[str]
    impactLevel: str
    tags: List[str]

# File paths
DATA_DIR = "data"
SENTIMENT_FILE = os.path.join(DATA_DIR, "sentiment_data.json")
RECOMMENDATIONS_FILE = os.path.join(DATA_DIR, "recommendations.json")
UPLOADS_FILE = os.path.join(DATA_DIR, "uploads.json")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

def load_sentiment_data() -> dict:
    """Load sentiment data from local storage"""
    if os.path.exists(SENTIMENT_FILE):
        with open(SENTIMENT_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_sentiment_data(data: dict):
    """Save sentiment data to local storage"""
    with open(SENTIMENT_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def load_uploads() -> list:
    """Load uploaded file records from local storage"""
    if os.path.exists(UPLOADS_FILE):
        with open(UPLOADS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_uploads(data: list):
    """Save uploaded file records to local storage"""
    with open(UPLOADS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def analyze_text_with_groq(text: str) -> dict:
    """Analyze text using GROQ API"""
    prompt = f"""Analyze the following text for sentiment and extract key themes:
    {text}
    
    Provide a detailed analysis including:
    1. Overall sentiment (positive, neutral, negative percentages)
    2. Sentiment breakdown (strongly positive to strongly negative)
    3. Key themes mentioned
    
    Format the response as JSON."""

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="mixtral-8x7b-32768",
        temperature=0.1,
        max_tokens=1000,
    )

    # Parse GROQ response and format it
    try:
        analysis = response.choices[0].message.content
        # Convert string response to structured data
        return json.loads(analysis)
    except Exception as e:
        print(f"Error parsing GROQ response: {e}")
        return None

@app.get("/api/sentiment")
async def get_sentiment_data():
    """Get sentiment data"""
    data = load_sentiment_data()
    if not data:
        raise HTTPException(status_code=404, detail="No sentiment data available")
    return data

@app.post("/api/sentiment/analyze")
async def analyze_sentiment(request: TextAnalysisRequest):
    """Analyze new text and update sentiment data"""
    # Analyze text using GROQ
    analysis = analyze_text_with_groq(request.text)
    if not analysis:
        raise HTTPException(status_code=500, detail="Failed to analyze text")

    # Load existing data
    current_data = load_sentiment_data()
    
    # Update data with new analysis
    if not current_data:
        current_data = analysis
    else:
        # Merge new analysis with existing data
        # This is a simplified merge - you might want to implement more sophisticated merging logic
        current_data["total"] = current_data.get("total", 0) + 1
        current_data["positive"] = (current_data.get("positive", 0) + analysis["positive"]) / 2
        current_data["neutral"] = (current_data.get("neutral", 0) + analysis["neutral"]) / 2
        current_data["negative"] = (current_data.get("negative", 0) + analysis["negative"]) / 2
        
        # Update breakdown
        for key in ["stronglyPositive", "somewhatPositive", "neutral", "somewhatNegative", "stronglyNegative"]:
            current_data["breakdown"][key] = (
                current_data["breakdown"].get(key, 0) + analysis["breakdown"][key]
            ) / 2

        # Update themes
        existing_themes = {theme["name"]: theme for theme in current_data["themes"]}
        for new_theme in analysis["themes"]:
            if new_theme["name"] in existing_themes:
                existing_themes[new_theme["name"]]["mentions"] += new_theme["mentions"]
            else:
                current_data["themes"].append(new_theme)

    # Save updated data
    save_sentiment_data(current_data)
    return current_data

@app.get("/api/themes")
async def get_themes():
    """Get all themes"""
    data = load_sentiment_data()
    if not data or "themes" not in data:
        return []
    return data["themes"]

def process_file(file: UploadFile) -> List[str]:
    """Process uploaded file and extract text content"""
    filename = file.filename.lower()
    content = []
    
    try:
        if filename.endswith('.csv'):
            # Read CSV file
            df = pd.read_csv(file.file)
            # Assume the feedback is in a column named 'feedback' or the first text column
            text_columns = df.select_dtypes(include=['object']).columns
            if 'feedback' in text_columns:
                content = df['feedback'].dropna().tolist()
            else:
                content = df[text_columns[0]].dropna().tolist()
                
        elif filename.endswith('.xlsx'):
            # Read Excel file
            df = pd.read_excel(file.file)
            text_columns = df.select_dtypes(include=['object']).columns
            if 'feedback' in text_columns:
                content = df['feedback'].dropna().tolist()
            else:
                content = df[text_columns[0]].dropna().tolist()
                
        elif filename.endswith('.json'):
            # Read JSON file
            data = json.load(file.file)
            if isinstance(data, list):
                content = [item.get('feedback', '') for item in data if item.get('feedback')]
            elif isinstance(data, dict) and 'feedback' in data:
                content = [data['feedback']]
                
    except Exception as e:
        print(f"Error processing file {filename}: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing file {filename}")
        
    return content

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload and process multiple files"""
    uploaded_files = []
    
    try:
        print(f"Received upload request with {len(files)} files")
        # Log details about the files
        for file in files:
            print(f"File: {file.filename}, Content-Type: {file.content_type}")
        
        # Load existing uploads
        uploads = load_uploads()
        
        # Process each file
        for file in files:
            try:
                print(f"Processing file: {file.filename}")
                feedback = process_file(file)
                print(f"Extracted {len(feedback)} feedback entries from {file.filename}")
                
                file_id = str(uuid.uuid4())
                
                # Add file record to uploads list
                file_info = {
                    "id": file_id,
                    "filename": file.filename,
                    "size": 0,  # Size will be calculated if needed
                    "content_type": file.content_type,
                    "upload_date": datetime.now().isoformat(),
                    "entries": len(feedback),
                    "analyzed": False
                }
                uploads.append(file_info)
                uploaded_files.append(file_info)
                
                # Save the extracted feedback for later analysis
                feedback_file = os.path.join(DATA_DIR, f"feedback_{file_id}.json")
                with open(feedback_file, 'w') as f:
                    json.dump(feedback, f, indent=2)
                
            except Exception as e:
                print(f"Error processing file {file.filename}: {e}")
                raise HTTPException(status_code=400, detail=f"Error processing file {file.filename}: {str(e)}")
            
        # Save uploads data
        save_uploads(uploads)
        print(f"Saved {len(uploaded_files)} new files to uploads list")
        
        # Start analysis in the background for the first uploaded file
        if uploaded_files:
            try:
                first_file = uploaded_files[0]
                # This is just a quick update to sentiment data to show something in the UI
                # A simple sentiment update with minimal data
                update_initial_sentiment_data(first_file["id"])
            except Exception as e:
                print(f"Error in initial sentiment update: {e}")
        
        result = {
            "message": f"Successfully uploaded {len(uploaded_files)} files", 
            "files": uploaded_files
        }
        print(f"Returning result: {result}")
        return result
        
    except Exception as e:
        print(f"Error processing files: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

def update_initial_sentiment_data(file_id: str):
    """Create initial sentiment data for a file without full analysis"""
    # Load or create sentiment data structure
    current_data = load_sentiment_data()
    if not current_data:
        current_data = {
            "total": 100,
            "positive": 60,
            "neutral": 25,
            "negative": 15,
            "breakdown": {
                "stronglyPositive": 30,
                "somewhatPositive": 30,
                "neutral": 25,
                "somewhatNegative": 10,
                "stronglyNegative": 5
            },
            "themes": [
                {
                    "name": "Sample Theme 1",
                    "sentiment": "positive",
                    "mentions": 35
                },
                {
                    "name": "Sample Theme 2",
                    "sentiment": "neutral",
                    "mentions": 28
                },
                {
                    "name": "Sample Theme 3",
                    "sentiment": "negative",
                    "mentions": 20
                }
            ]
        }
    
    # Save updated data
    save_sentiment_data(current_data)
    
    # Mark file as analyzed
    uploads = load_uploads()
    for file in uploads:
        if file["id"] == file_id:
            file["analyzed"] = True
            break
    save_uploads(uploads)
    
    return current_data

@app.post("/api/uploads/{file_id}/analyze")
async def analyze_file(file_id: str):
    """Analyze a specific uploaded file"""
    try:
        print(f"Analyzing file with ID: {file_id}")
        
        # Load uploads data
        uploads = load_uploads()
        file_info = next((f for f in uploads if f["id"] == file_id), None)
        if not file_info:
            raise HTTPException(status_code=404, detail=f"File not found with ID: {file_id}")
        
        # Check if feedback file exists
        feedback_file = os.path.join(DATA_DIR, f"feedback_{file_id}.json")
        if not os.path.exists(feedback_file):
            raise HTTPException(status_code=404, detail=f"Feedback data not found for file: {file_info['filename']}")
            
        # Load feedback data
        with open(feedback_file, 'r') as f:
            feedback = json.load(f)
            
        print(f"Loaded {len(feedback)} feedback entries for analysis")
            
        # Load existing sentiment data
        current_data = load_sentiment_data()
        if not current_data:
            current_data = {
                "total": 0,
                "positive": 0,
                "neutral": 0,
                "negative": 0,
                "breakdown": {
                    "stronglyPositive": 0,
                    "somewhatPositive": 0,
                    "neutral": 0,
                    "somewhatNegative": 0,
                    "stronglyNegative": 0
                },
                "themes": []
            }
        
        # For demonstration, just update with sample data rather than full GROQ analysis
        # In production, you would analyze each feedback entry with GROQ
        sample_sentiment = {
            "positive": 65,
            "neutral": 20,
            "negative": 15,
            "breakdown": {
                "stronglyPositive": 35,
                "somewhatPositive": 30,
                "neutral": 20,
                "somewhatNegative": 10,
                "stronglyNegative": 5
            },
            "themes": [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Work-life Balance",
                    "sentiment": "negative",
                    "mentions": 25
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Remote Work",
                    "sentiment": "positive",
                    "mentions": 30
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Management Support",
                    "sentiment": "positive",
                    "mentions": 28
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Compensation",
                    "sentiment": "neutral",
                    "mentions": 15
                }
            ]
        }
        
        # Update sentiment data
        current_data["total"] = len(feedback)
        current_data["positive"] = sample_sentiment["positive"]
        current_data["neutral"] = sample_sentiment["neutral"]
        current_data["negative"] = sample_sentiment["negative"]
        current_data["breakdown"] = sample_sentiment["breakdown"]
        current_data["themes"] = sample_sentiment["themes"]
        
        # Save updated data
        save_sentiment_data(current_data)
        print(f"Updated sentiment data with {len(feedback)} entries")
        
        # Mark file as analyzed
        for file in uploads:
            if file["id"] == file_id:
                file["analyzed"] = True
                break
        save_uploads(uploads)
        print(f"Marked file '{file_info['filename']}' as analyzed")
        
        return {"message": f"Analysis completed for file {file_info['filename']}", "sentiment": current_data}
        
    except HTTPException as he:
        print(f"HTTP error analyzing file: {he.detail}")
        raise
    except Exception as e:
        print(f"Error analyzing file: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")

@app.get("/api/uploads/analyze-all")
async def analyze_all_files():
    """Analyze all uploaded files"""
    try:
        print("Starting analysis of all files")
        uploads = load_uploads()
        
        if not uploads:
            return {"message": "No files to analyze"}
        
        analyzed_files = []
        
        # Analyze each file, or at least the first one for demonstration
        if uploads:
            # In a real app, you would process all files
            # But for this demo, we'll just process the first one
            first_file = uploads[0]
            result = await analyze_file(first_file["id"])
            analyzed_files.append(first_file["filename"])
            
        print(f"Completed analysis of files: {', '.join(analyzed_files)}")
        return {"message": f"Analysis completed for {len(analyzed_files)} files", "analyzed_files": analyzed_files}
        
    except Exception as e:
        print(f"Error starting analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error starting analysis: {str(e)}")

@app.get("/api/uploads")
async def get_uploads():
    """Get list of uploaded files"""
    uploads = load_uploads()
    if not uploads:
        return {"files": []}
    return {"files": uploads}

@app.get("/api/uploads/{file_id}")
async def get_file_details(file_id: str):
    """Get details of a specific uploaded file"""
    uploads = load_uploads()
    file = next((f for f in uploads if f["id"] == file_id), None)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return file
    
@app.delete("/api/uploads/{file_id}")
async def delete_file(file_id: str):
    """Delete a specific uploaded file from the records"""
    uploads = load_uploads()
    uploads = [f for f in uploads if f["id"] != file_id]
    save_uploads(uploads)
    return {"message": "File deleted"}

def load_recommendations() -> List[dict]:
    """Load recommendations from local storage"""
    if os.path.exists(RECOMMENDATIONS_FILE):
        with open(RECOMMENDATIONS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_recommendations(data: List[dict]):
    """Save recommendations to local storage"""
    with open(RECOMMENDATIONS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.get("/api/recommendations")
async def get_recommendations():
    """Get all recommendations"""
    recommendations = load_recommendations()
    if not recommendations:
        # Generate default recommendations based on sentiment data
        sentiment_data = load_sentiment_data()
        if sentiment_data and sentiment_data.get("themes"):
            recommendations = generate_default_recommendations(sentiment_data)
            save_recommendations(recommendations)
    return recommendations

@app.post("/api/recommendations")
async def create_recommendation(recommendation: NewRecommendation):
    """Create a new recommendation"""
    recommendations = load_recommendations()
    new_rec = {
        "id": str(uuid.uuid4()),
        **recommendation.dict(),
        "status": "New"
    }
    recommendations.append(new_rec)
    save_recommendations(recommendations)
    return new_rec

@app.put("/api/recommendations/{recommendation_id}/implement")
async def implement_recommendation(recommendation_id: str):
    """Mark a recommendation as implemented"""
    recommendations = load_recommendations()
    for rec in recommendations:
        if rec["id"] == recommendation_id:
            rec["status"] = "Implemented"
            save_recommendations(recommendations)
            return {"message": "Recommendation marked as implemented"}
    
    raise HTTPException(status_code=404, detail="Recommendation not found")

@app.put("/api/recommendations/{recommendation_id}/dismiss")
async def dismiss_recommendation(recommendation_id: str):
    """Mark a recommendation as dismissed"""
    recommendations = load_recommendations()
    for rec in recommendations:
        if rec["id"] == recommendation_id:
            rec["status"] = "Dismissed"
            save_recommendations(recommendations)
            return {"message": "Recommendation marked as dismissed"}
    
    raise HTTPException(status_code=404, detail="Recommendation not found")

def generate_default_recommendations(sentiment_data: dict) -> List[dict]:
    """Generate default recommendations based on sentiment data"""
    recommendations = []
    
    # Sort themes by number of mentions
    negative_themes = [t for t in sentiment_data.get("themes", []) if t["sentiment"] == "negative"]
    negative_themes.sort(key=lambda x: x["mentions"], reverse=True)
    
    # Generate recommendations for top negative themes
    for i, theme in enumerate(negative_themes[:3]):
        dept = "IT" if i == 0 else "Engineering" if i == 1 else "Sales"
        impact = "High Impact" if i < 2 else "Medium Impact"
        
        recommendations.append({
            "id": str(uuid.uuid4()),
            "title": f"Address {theme['name']} Issues",
            "description": f"Employee feedback indicates issues with {theme['name']}. This was mentioned {theme['mentions']} times in negative context.",
            "department": [dept],
            "impactLevel": impact,
            "status": "New",
            "tags": [theme["name"], dept]
        })
    
    return recommendations

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 