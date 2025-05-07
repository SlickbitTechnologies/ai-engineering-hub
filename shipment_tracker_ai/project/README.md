# Cold Chain Monitor

A comprehensive application for tracking temperature-sensitive shipments in real-time, ensuring product integrity throughout the supply chain.

## Features

- Real-time temperature monitoring with configurable alert thresholds
- Shipment tracking with detailed journey visualization
- Automatic alerts for critical temperature deviations
- Comprehensive dashboard with shipment details and temperature history
- User authentication and role-based access control
- Shipment log upload and processing functionality
- Notification preferences and delivery settings
- Mobile-responsive design for on-the-go monitoring

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Recharts for visualizations
- **Backend**: Python Flask RESTful API
- **Authentication**: Firebase Authentication
- **Storage**: Firebase Storage for file uploads
- **State Management**: React Context API
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8 or higher
- Firebase account (for auth and storage)

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Set up Python backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Running the App

1. Start the backend server:
   ```bash
   npm run backend
   ```
2. In a separate terminal, start the frontend development server:
   ```bash
   npm run dev
   ```

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password) and Storage
3. Add your Firebase configuration to `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.