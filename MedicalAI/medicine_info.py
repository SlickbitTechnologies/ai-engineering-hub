from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MedicineRequest(BaseModel):
    medicine_name: str

llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro-latest", google_api_key=GEMINI_API_KEY)

prompt = PromptTemplate(
    input_variables=["medicine_name"],
    template="""
    Provide a **detailed** medical report for the medicine: {medicine_name}.
    The response should be structured as follows:

    1. **Medicine Name**: Include brand names and generic names.
    2. **Composition**: List the active ingredients and their strengths.
    3. **Uses**: Describe medical conditions it treats, including FDA-approved and off-label uses.
    4. **How it Works**: Explain the mechanism of action (MOA).
    5. **Dosage & Administration**:
       - Recommended dosages for different age groups.
       - Whether it should be taken with or without food.
       - Duration of the course.
    6. **Side Effects**:
       - Common side effects (e.g., nausea, headache).
       - Rare but serious side effects (e.g., allergic reactions, liver damage).
    7. **Contraindications**: When *not* to use this medicine (e.g., pregnancy, liver disease).
    8. **Drug Interactions**: Medications and substances that may interact negatively.
    9. **Precautions & Warnings**:
       - Special considerations for children, pregnant women, and the elderly.
       - Safety in kidney/liver impairment.
    10. **Storage Instructions**: How to store it properly (e.g., room temperature, refrigeration).
    11. **Overdose Management**: What to do in case of overdose symptoms.
    12. **Alternative Medicines**: Other drugs with similar effects.
    13. **Additional Information**: Any relevant details a patient should know.

    Ensure the response is **clear, concise, and medically accurate**.
    """
)


chain = LLMChain(llm=llm, prompt=prompt)

@app.post("/get_medicine_info/")
async def get_medicine_info(request: MedicineRequest):
    try:
        response = chain.invoke({"medicine_name": request.medicine_name})
        return {"medicine_info": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
