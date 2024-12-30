# PDF QA Using AI

This application that allows users to upload a PDF file and engage in a chatbot-like interaction with the content of the PDF using OpenAI's GPT model. The app extracts text from the uploaded PDF and utilizes the OpenAI API to generate contextual responses based on the user’s queries.
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