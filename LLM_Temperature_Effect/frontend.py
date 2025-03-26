import streamlit as st
import requests

# FastAPI backend URLs
GENERATE_API_URL = "http://127.0.0.1:8000/generate-story/"
TRANSLATE_API_URL = "http://127.0.0.1:8000/translate-story/"

# Set page layout to wide
st.set_page_config(layout="wide")

st.title("📖 AI Story Generator")

# Explanation of temperature
st.markdown("""
### 🔥 Understanding Temperature in Story Generation
- **Low Temperature (0.2):** More predictable, structured, and logical storytelling.  
- **Medium Temperature (0.7):** A mix of creativity and coherence.  
- **High Temperature (1.2):** Unexpected twists, surprises, and more randomness.  

📌 **Compare different temperatures to see how creativity changes!**
""")

# User input for story prompt
prompt = st.text_area("Enter a story prompt:", "Once upon a time...")

# Temperature selection
selected_temperature = st.slider("Choose Creativity Level (Temperature)", 0.1, 1.5, 0.7)

if st.button("Generate Story"):
    if prompt:
        with st.spinner("Generating stories..."):
            stories = {}

            # Predefined temperature levels
            temp_levels = {
                "Low (0.2)": 0.2,
                "Medium (0.7)": 0.7,
                "High (1.2)": 1.2,
                f"Selected ({selected_temperature})": selected_temperature
            }

            # Generate stories for each temperature level
            for label, temp in temp_levels.items():
                response = requests.post(GENERATE_API_URL, json={"prompt": prompt, "temperature": temp})
                result = response.json()
                stories[label] = result.get("story", "Error generating story.")

            st.session_state["stories"] = stories

        # Display stories in full screen layout
        st.subheader("📖 Story Comparison Across Different Temperatures")
        st.write(f"Generated Stories about:{prompt}") 

        # Create four columns with equal width for better spacing
        col1, col2, col3, col4 = st.columns(4)

        # Assign each story to a column
        columns = [col1, col2, col3, col4]

        for col, (label, story) in zip(columns, stories.items()):
            with col:
                st.subheader(label)
                st.write(story)

    else:
        st.warning("Please enter a story prompt.")
