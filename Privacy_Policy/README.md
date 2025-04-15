# Privacy Policy Compliance Checker

A web application that helps organizations analyze and ensure compliance of their privacy policies with various data protection regulations like GDPR, CCPA, and DPDPA.

## Features

- **Document Analysis**: Upload and analyze privacy policy documents
- **Compliance Scoring**: Get detailed compliance scores for different regulations
- **Gap Analysis**: Identify areas of non-compliance and get actionable insights
- **Export Reports**: Generate comprehensive compliance reports in Excel format
- **Document History**: Track and manage previously analyzed documents
- **Real-time Analysis**: Get instant feedback on policy compliance

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS
- **Charts**: Chart.js, Nivo
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **AI Analysis**: Google Gemini AI

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd privacy-policy-checker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts for state management
├── firebase/       # Firebase configuration and utilities
├── pages/          # Page components
├── services/       # API and service functions
├── styles/         # Global styles and theme
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Google Gemini AI](https://ai.google.dev/)
- [Chart.js](https://www.chartjs.org/)
- [Nivo](https://nivo.rocks/) 