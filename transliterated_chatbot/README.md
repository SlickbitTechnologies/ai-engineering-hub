# Transliterated Chatbot

A modern web application that provides a transliterated chatbot interface for restaurants, allowing customers to interact with the restaurant's information in their preferred language.

## Features

- 🔐 User Authentication with Firebase
- 🌐 Multi-language Support
- 📱 Responsive Design
- 📄 File Management (Menu, Reviews, FAQs, History)
- 🤖 AI-Powered Chat Interface
- 📊 Analytics Dashboard
- ⚡ Real-time Updates

## Tech Stack

- **Frontend:**
  - React.js
  - Material-UI
  - React Query
  - React Router

- **Backend:**
  - Node.js
  - Express.js
  - Firebase (Authentication, Firestore, Storage)
  - Google Gemini AI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Google Cloud account (for Gemini AI)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/transliterated-chatbot.git
   cd transliterated-chatbot
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables:
   - Open `.env` file
   - Fill in your Firebase configuration
   - Add your Google API key for Gemini
   - Set other required variables

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Build for production:
   ```bash
   npm run build
   # or
   yarn build
   ```

3. Start production server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Project Structure

```
transliterated-chatbot/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API and external services
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── routes/       # API routes
│   │   └── services/     # Server-side services
│   └── utils/         # Utility functions
├── public/           # Static assets
└── tests/           # Test files
```

## API Endpoints

### Restaurant Settings
- `GET /api/restaurant/settings/:userId` - Get restaurant settings
- `POST /api/restaurant/settings` - Save restaurant settings with files
- `PUT /api/restaurant/settings/:userId` - Update restaurant settings

### Analytics
- `GET /api/analytics/sentiment` - Get sentiment analysis

## File Upload Guidelines

- Supported file types: PDF
- Maximum file size: 5MB
- Files are stored in Firebase Storage
- Organized structure: `restaurants/{userId}/{restaurant-name}/{file-type}.pdf`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or create an issue in the repository.

## Acknowledgments

- Firebase for authentication and storage
- Google Gemini AI for natural language processing
- Material-UI for the component library 