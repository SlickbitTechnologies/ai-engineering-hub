# english_tutor

English tutor, dynamically generating fill-in-the-blank questions on grammar topics using Google Generative AI. It tracks the user's progress, checks answers for correctness, and rotates through topics after a minimum number of questions per topic. The app ensures unique questions, provides instant feedback, and encourages learning through interactive practice.

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
```
