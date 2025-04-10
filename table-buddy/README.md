# Table Buddy - Restaurant Reservation Management System

Table Buddy is a modern restaurant reservation management system built with Next.js, featuring real-time table management, reservation tracking, and AI-powered voice assistant integration.

## Features

- 📅 Real-time reservation calendar
- 📊 Dashboard with today's statistics
- 🎯 Table management with capacity and section tracking
- 🤖 AI voice assistant for handling reservations
- 📱 Responsive design for all devices
- 🔄 Real-time updates and notifications

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite
- **AI Integration**: Vapi.ai
- **State Management**: Redux Toolkit
- **API**: Next.js API Routes

## Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite3

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/SlickbitTechnologies/ai-engineering-hub.git
   cd ai-engineering-hub/table-buddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=file:./restaurants.db
   VAPI_API_KEY=your_vapi_api_key
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   # or
   yarn db:init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The system uses the following tables:
- `restaurant_settings`: Restaurant information
- `operating_hours`: Business hours
- `table_settings`: Table configuration
- `tables`: Table information
- `reservations`: Reservation records



## AI Voice Assistant Integration

The system integrates with Vapi.ai for handling phone reservations:
1. Configure your Vapi.ai assistant
2. Set up the API key in environment variables
3. Use the call simulator to test the integration



## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@tablebuddy.com or open an issue in the repository.
