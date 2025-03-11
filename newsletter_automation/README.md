# AI Newsletter Generator

A Streamlit-based application that generates and sends newsletters using AI technology powered by Google's Gemini model.

## Features

- 📝 AI-powered newsletter content generation
- 📧 Email functionality with HTML formatting
- 🎨 Professional email template with logo
- ✅ Email validation
- 🔒 Secure SMTP integration
- 🎯 Topic-focused content generation
- 💅 Modern and responsive email design

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Newsletter_automation
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following content:
```
GEMINI_API_KEY=your_gemini_api_key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your_email@gmail.com
SENDER_PASSWORD=your_app_password
```

Note: For Gmail users, you need to use an App Password:
1. Go to Google Account → Security → 2-Step Verification → App passwords
2. Select "Mail" and "Other"
3. Generate and copy the 16-character password
4. Use this password in your `.env` file

4. Add your logo:
- Place your logo file named `slickbit_technologies_logo.jpeg` in the root directory

## Usage

1. Run the application:
```bash
streamlit run app.py
```

2. Access the application in your browser at `http://localhost:8501`

3. Generate Newsletter:
   - Enter your desired topic
   - Add any additional details or focus areas
   - Click "Generate Newsletter"

4. Send Newsletter:
   - Switch to the "Email Configuration" tab
   - Enter recipient email addresses (one per line)
   - Customize the email subject
   - Click "Send Newsletter"

## Email Template

The newsletter is sent with a professional HTML template that includes:
- Company logo in the header
- Clean, modern design
- Responsive layout
- Professional formatting
- Footer with contact information

## Dependencies

- streamlit
- python-dotenv
- google-generativeai
- beautifulsoup4
- requests
- secure-smtplib

## Security

- Environment variables for sensitive information
- Email validation
- Secure SMTP with TLS
- App Password support for Gmail

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.