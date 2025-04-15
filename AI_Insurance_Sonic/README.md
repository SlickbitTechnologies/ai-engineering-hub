# AI Insurance Sonic

A full-stack insurance application with Node.js backend and React frontend for analyzing and managing customer call recordings.

## Features

- 🎯 Call Analysis Dashboard
- 📊 Real-time KPI Monitoring
- 🔍 Sentiment Analysis
- 📝 Transcription Service
- 📈 Performance Metrics
- 🔒 User Management

## Project Structure

```
.
├── backend_node/        # Node.js backend
│   ├── src/            # Source code
│   │   ├── config/     # Configuration files
│   │   ├── db/        # Database models and migrations
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   └── utils/     # Utility functions
│   └── package.json
└── frontend/          # React frontend
    ├── src/          # Source code
    │   ├── components/ # Reusable components
    │   ├── pages/     # Page components
    │   ├── redux/     # State management
    │   └── utils/     # Utility functions
    ├── public/       # Static files
    └── package.json
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend_node
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
DB_PATH=./database.sqlite
OPENAI_API_KEY=your_openai_api_key
FIREBASE_STORAGE_BUCKET=your_firebase_bucket
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```


## Technologies Used

### Backend
- Node.js
- Express
- SQLite
- Sequelize ORM
- OpenAI API
- Firebase Storage

### Frontend
- React
- Redux Toolkit
- Tailwind CSS
- Chart.js
- TypeScript

## Features in Detail

### Call Analysis
- Real-time transcription using OpenAI Whisper
- Sentiment analysis of customer interactions
- KPI tracking and compliance monitoring
- Performance metrics and trends

### Dashboard
- Call volume trends
- KPI performance metrics
- Sentiment analysis visualization
- Recent calls overview

### User Management
- Role-based access control
- User activity monitoring
- Performance tracking 