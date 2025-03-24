from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import os
from dotenv import load_dotenv
import pandas as pd
from PIL import Image
import io
import json
import easyocr
import cv2
import numpy as np
# from datetime import datetime

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'])

# Define shared storage path
SHARED_STORAGE_PATH = os.path.join(os.getcwd(), "shared_storage")
if not os.path.exists(SHARED_STORAGE_PATH):
    try:
        os.makedirs(SHARED_STORAGE_PATH, exist_ok=True)
        print(f"Created shared storage directory at: {SHARED_STORAGE_PATH}")
    except Exception as e:
        print(f"Error creating shared storage directory: {str(e)}")
        # Fallback to current directory if shared_storage creation fails
        SHARED_STORAGE_PATH = os.getcwd()
        print(f"Using current directory as storage: {SHARED_STORAGE_PATH}")

def load_existing_data():
    try:
        excel_path = os.path.join(SHARED_STORAGE_PATH, "business_cards_data.xlsx")
        if os.path.exists(excel_path):
            df = pd.read_excel(excel_path)
            return df.to_dict('records')
        return []
    except Exception as e:
        print(f"Error loading existing data: {str(e)}")
        return []

def save_to_shared_storage(data_list):
    try:
        excel_path = os.path.join(SHARED_STORAGE_PATH, "business_cards_data.xlsx")
        
        # Create DataFrame from data list
        df = pd.DataFrame(data_list)
        
        # Save to Excel with proper formatting
        with pd.ExcelWriter(excel_path, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Business Cards')
            
            # Auto-adjust columns' width
            worksheet = writer.sheets['Business Cards']
            for idx, col in enumerate(df.columns):
                series = df[col]
                max_len = max(
                    series.astype(str).map(len).max(),
                    len(str(series.name))
                ) + 1
                worksheet.set_column(idx, idx, max_len)
        
        print(f"Successfully saved {len(data_list)} entries to {excel_path}")
        return True
    except Exception as e:
        print(f"Error saving to shared storage: {str(e)}")
        # Try to save to current directory as fallback
        try:
            fallback_path = "business_cards_data.xlsx"
            df = pd.DataFrame(data_list)
            df.to_excel(fallback_path, index=False)
            print(f"Successfully saved to fallback location: {fallback_path}")
            return True
        except Exception as fallback_error:
            print(f"Error saving to fallback location: {str(fallback_error)}")
            return False

def preprocess_image(image):
    try:
        # Convert PIL Image to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Get original dimensions
        original_height, original_width = opencv_image.shape[:2]
        
        # Resize image if too large or too small
        target_width = 2000
        if original_width > target_width:
            scale = target_width / original_width
            new_width = int(original_width * scale)
            new_height = int(original_height * scale)
            opencv_image = cv2.resize(opencv_image, (new_width, new_height))
        
        # Convert to grayscale
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
        
        # Apply multiple preprocessing techniques
        preprocessed_images = []
        
        # 1. Basic grayscale
        preprocessed_images.append(gray)
        
        # 2. Adaptive thresholding
        adaptive_thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        preprocessed_images.append(adaptive_thresh)
        
        # 3. Otsu's thresholding
        _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        preprocessed_images.append(otsu)
        
        # 4. Contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        preprocessed_images.append(enhanced)
        
        # 5. Denoising
        denoised = cv2.fastNlMeansDenoising(gray)
        preprocessed_images.append(denoised)
        
        return preprocessed_images
    except Exception as e:
        print(f"Error in preprocess_image: {str(e)}")
        return None

def extract_text_from_image(image):
    try:
        # Get preprocessed versions of the image
        preprocessed_images = preprocess_image(image)
        if not preprocessed_images:
            return ""
        
        all_text_blocks = set()  # Use set to avoid duplicates
        
        # Try OCR on original image first
        original_results = reader.readtext(np.array(image))
        for result in original_results:
            if len(result) >= 2:
                text = result[1]
                confidence = result[2] if len(result) > 2 else 0
                if confidence > 0.5:  # Only include text with decent confidence
                    all_text_blocks.add(text.strip())
        
        # Try OCR on each preprocessed version
        for preprocessed_image in preprocessed_images:
            results = reader.readtext(preprocessed_image)
            for result in results:
                if len(result) >= 2:
                    text = result[1]
                    confidence = result[2] if len(result) > 2 else 0
                    if confidence > 0.5:  # Only include text with decent confidence
                        all_text_blocks.add(text.strip())
        
        # Convert set to sorted list and join with newlines
        text_blocks = sorted(list(all_text_blocks))
        extracted_text = '\n'.join(text_blocks)
        
        print(f"Extracted text:\n{extracted_text}")  # Debug print
        return extracted_text
    except Exception as e:
        print(f"Error in extract_text_from_image: {str(e)}")
        return ""

def extract_business_card_data(text):
    try:
        # Improved prompt for better extraction
        prompt = f"""Extract the following information from this business card text:
- First Name
- Last Name
- Company Name
- Designation/Job Title
- Mobile Number
- Email Address

Here's the text from the business card:
{text}

Please extract the information in this exact JSON format:
{{
    "First Name": "extracted first name or N/A if not found",
    "Last Name": "extracted last name or N/A if not found",
    "Company Name": "extracted company name or N/A if not found",
    "Designation/Job Title": "extracted job title or N/A if not found",
    "Mobile Number": "extracted mobile number or N/A if not found",
    "Email Address": "extracted email address or N/A if not found"
}}

Rules for extraction:
1. If a field is not found, use "N/A"
2. For names, properly separate first and last names
3. For phone numbers, include country code if present
4. For email addresses, extract the complete email address
5. Clean up any extra whitespace or special characters
6. Maintain proper capitalization
7. If multiple phone numbers exist, use the one labeled as mobile or cell
8. If no specific mobile number is identified, use the first phone number found
9. If multiple email addresses exist, use the primary or first one found

Return ONLY the JSON object, no other text."""

        # Call Groq API
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise business card information extractor. Extract only the requested fields and format them exactly as specified."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama3-8b-8192",
            temperature=0.1,  # Lower temperature for more consistent results
            max_tokens=500
        )
        
        # Get the response
        response_text = completion.choices[0].message.content
        print(f"Groq API response:\n{response_text}")  # Debug print
        
        # Parse the JSON response
        extracted_data = json.loads(response_text)
        return extracted_data
    except Exception as e:
        print(f"Error in extract_business_card_data: {str(e)}")
        return {
            "First Name": "N/A",
            "Last Name": "N/A",
            "Company Name": "N/A",
            "Designation/Job Title": "N/A",
            "Mobile Number": "N/A",
            "Email Address": "N/A"
        }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/get-all-data")
def get_all_data():
    try:
        data = load_existing_data()
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract")
async def extract_data(file: UploadFile = File(...)):
    try:
        # Read and process the image
        image_data = await file.read()
        if not image_data:
            raise HTTPException(status_code=400, detail="No image data received")
            
        try:
            image = Image.open(io.BytesIO(image_data))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to open image: {str(e)}")
        
        # Extract text from image
        extracted_text = extract_text_from_image(image)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the image")
        
        # Extract structured data
        extracted_data = extract_business_card_data(extracted_text)
        if not extracted_data:
            raise HTTPException(status_code=400, detail="Failed to extract structured data from text")
            
        print(f"New extracted data: {extracted_data}")  # Debug print
        
        # Load existing data
        existing_data = load_existing_data()
        print(f"Number of existing entries: {len(existing_data)}")  # Debug print
        
        # Check if entry with same mobile number exists
        mobile_number = extracted_data.get('Mobile Number', '')
        entry_exists = False
        
        for entry in existing_data:
            if entry.get('Mobile Number') == mobile_number:
                # Update existing entry
                entry.update(extracted_data)
                entry_exists = True
                print(f"Updated existing entry for mobile: {mobile_number}")
                break
        
        if not entry_exists:
            # Add new entry
            existing_data.append(extracted_data)
            print(f"Added new entry for mobile: {mobile_number}")
        
        print(f"Total entries after update: {len(existing_data)}")  # Debug print
        
        # Save updated data
        if save_to_shared_storage(existing_data):
            print("Data successfully saved to Excel sheet")  # Debug print
            return {"data": extracted_data, "message": "Data saved successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save data to storage")
        
    except HTTPException as he:
        print(f"HTTP Exception in extract_data: {str(he)}")  # Debug print
        raise he
    except Exception as e:
        print(f"Error in extract_data: {str(e)}")  # Debug print
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/delete-entry/{index}")
async def delete_entry(index: int):
    try:
        # Load existing data
        existing_data = load_existing_data()
        
        # Check if index is valid
        if 0 <= index < len(existing_data):
            # Remove the entry at the specified index
            deleted_entry = existing_data.pop(index)
            
            # Save updated data
            if save_to_shared_storage(existing_data):
                return {"message": "Entry deleted successfully", "deleted_entry": deleted_entry}
            else:
                raise HTTPException(status_code=500, detail="Failed to save updated data")
        else:
            raise HTTPException(status_code=400, detail="Invalid index")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clear-all-data")
async def clear_all_data():
    try:
        excel_path = os.path.join(SHARED_STORAGE_PATH, "business_cards_data.xlsx")
        if os.path.exists(excel_path):
            os.remove(excel_path)
        return {"message": "All data cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/delete-by-mobile/{mobile_number}")
async def delete_by_mobile(mobile_number: str):
    try:
        # Load existing data
        existing_data = load_existing_data()
        
        # Find and remove entries with matching mobile number
        deleted_entries = []
        updated_data = []
        
        for entry in existing_data:
            if entry.get("Mobile Number") == mobile_number:
                deleted_entries.append(entry)
            else:
                updated_data.append(entry)
        
        if deleted_entries:
            # Save updated data
            if save_to_shared_storage(updated_data):
                return {
                    "message": f"Successfully deleted {len(deleted_entries)} entry(ies)",
                    "deleted_entries": deleted_entries
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to save updated data")
        else:
            raise HTTPException(status_code=404, detail="No entries found with this mobile number")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save-data")
async def save_data(file: UploadFile = File(...)):
    try:
        # Read the Excel file content
        content = await file.read()
        
        # Save the file to shared storage
        excel_path = os.path.join(SHARED_STORAGE_PATH, "business_cards_data.xlsx")
        
        # If file exists, read existing data
        existing_data = []
        if os.path.exists(excel_path):
            try:
                existing_df = pd.read_excel(excel_path)
                existing_data = existing_df.to_dict('records')
                print(f"Loaded {len(existing_data)} existing entries")
            except Exception as e:
                print(f"Error reading existing Excel file: {str(e)}")
        
        # Read new data from uploaded file
        new_df = pd.read_excel(io.BytesIO(content))
        new_data = new_df.to_dict('records')
        print(f"Received {len(new_data)} new entries")
        
        # Create a dictionary of existing entries using mobile number as key
        existing_dict = {entry.get('Mobile Number', ''): entry for entry in existing_data}
        
        # Process new data and update existing entries
        for new_entry in new_data:
            mobile = new_entry.get('Mobile Number', '')
            if mobile in existing_dict:
                # Update existing entry with new data
                existing_dict[mobile].update(new_entry)
                print(f"Updated existing entry for mobile: {mobile}")
            else:
                # Add new entry
                existing_dict[mobile] = new_entry
                print(f"Added new entry for mobile: {mobile}")
        
        # Convert dictionary back to list
        updated_data = list(existing_dict.values())
        print(f"Total entries after update: {len(updated_data)}")
        
        # Save updated data back to Excel
        df_updated = pd.DataFrame(updated_data)
        df_updated.to_excel(excel_path, index=False)
        print(f"Saved data to {excel_path}")
        
        return {
            "message": "Data saved successfully",
            "total_entries": len(updated_data),
            "updated_entries": len(new_data)
        }
    except Exception as e:
        print(f"Error in save_data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
