# Plant Disease Diagnosis Using AI

This project leverages AI-powered models and a user-friendly web interface to diagnose diseases in plants based on uploaded images. The application provides detailed analysis and suggestions for treatment, ensuring healthier plants and effective care.

## Steps to Run the Project

Follow these steps to set up and run the project successfully:


### 1. Set Up the Virtual Environment

1. Create a virtual environment using the following command:
   ```bash
   python -m venv .venv
   ```

2. Activate the virtual environment:

    ### For windows 

    ```bash
    .venv\Scripts\activate
   ```

    ### macOS/Linux:

    ```bash
    source .venv/bin/activate
   ```
   

### 2. Set Up the Environment Variables 
1. Create a `.env` file in the project directory.
2. Add your `GEMINI_API_KEY` to the `.env` file:

### 3. Install Dependencies
- Use the following command to install the required dependencies:
```bash
pip install -r requirements.txt
```

### 4. Run the project
- Use the following command to run the project:
```bash
streamlit run main.py