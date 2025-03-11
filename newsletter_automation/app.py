import os
from newsletter_generator import NewsletterGenerator
from email_sender import EmailSender
import streamlit as st
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

# Check for API key
if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("#"):
    st.error("Please set your Gemini API key in the .env file")
    st.stop()

# Check email configuration
if not all([SMTP_SERVER, SMTP_PORT, SENDER_EMAIL, SENDER_PASSWORD]):
    st.error("Please configure email settings in the .env file")
    st.stop()

# Initialize EmailSender
email_sender = EmailSender(
    smtp_server=SMTP_SERVER,
    smtp_port=SMTP_PORT,
    sender_email=SENDER_EMAIL,
    sender_password=SENDER_PASSWORD
)

# Streamlit page configuration
st.set_page_config(
    page_title="Newsletter Generator",
    layout="centered",
    initial_sidebar_state="auto",
    page_icon="📰"  # Using newspaper emoji as icon
)

st.title("📰 AI Newsletter Generator")
st.markdown("### Welcome to the Newsletter Generator!")

# Initialize the NewsletterGenerator
@st.cache_resource(show_spinner=True)
def get_generator():
    return NewsletterGenerator(api_key=GEMINI_API_KEY)

generator = get_generator()

# Create tabs for different sections
tab1, tab2 = st.tabs(["Generate Newsletter", "Email Configuration"])

with tab1:
    # Input area for the topic and description
    topic = st.text_input("Enter Topic", help="Enter the main topic for your newsletter")
    description = st.text_area("Additional Details (optional)", height=100, help="Add any specific details or focus areas you want to include")

    if "newsletter_content" not in st.session_state:
        st.session_state.newsletter_content = None

    if st.button("Generate Newsletter"):
        if topic.strip():
            with st.spinner("Generating Newsletter..."):
                newsletter_content = generator.generate_newsletter(topic, description)
                if newsletter_content:
                    st.session_state.newsletter_content = newsletter_content
                    st.markdown("## Generated Newsletter")
                    st.markdown(newsletter_content)
                else:
                    st.error("Failed to generate newsletter. Please try again.")
        else:
            st.warning("Please provide a topic")

with tab2:
    st.markdown("### Email Configuration")
    
    # Email list input
    emails_input = st.text_area(
        "Recipient Emails",
        help="Enter email addresses, one per line",
        height=100,
        key="emails"
    )
    
    # Email subject
    email_subject = st.text_input(
        "Email Subject",
        help="Enter the subject line for the email",
        value="Your AI-Generated Newsletter"
    )

    # Send button
    if st.button("Send Newsletter"):
        if not st.session_state.newsletter_content:
            st.error("Please generate a newsletter first!")
        elif not emails_input.strip():
            st.error("Please enter at least one recipient email address!")
        else:
            # Process email addresses
            recipient_emails = [email.strip() for email in emails_input.split('\n') if email.strip()]
            
            # Validate emails
            invalid_emails = EmailSender.validate_emails(recipient_emails)
            if invalid_emails:
                st.error(f"Invalid email addresses found: {', '.join(invalid_emails)}")
            else:
                with st.spinner("Sending newsletter..."):
                    success, message = email_sender.send_newsletter(
                        recipient_emails=recipient_emails,
                        subject=email_subject,
                        content=st.session_state.newsletter_content
                    )
                    if success:
                        st.success(message)
                    else:
                        st.error(message)

# Optional footer or credits
st.markdown("---")
st.markdown("Powered by Google Gemini")
