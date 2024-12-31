# Invoice OCR  Using AI

Invoice OCR app enables users to upload image files to determine if they are invoices and extract relevant data. It uses OpenAI's API for processing and displays results in a structured format, or notifies users if the file isn’t an invoice.
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
2. Add your `OPENAI_API_KEY` to the `.env` file:

### 3. Install Dependencies
- Use the following command to install the required dependencies:
```bash
pip install -r requirements.txt
```

### 4. Run the project
- Use the following command to run the project:
```bash
streamlit run main.py