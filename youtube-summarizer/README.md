# YouTube Video Summarizer

A web application that allows users to search for YouTube videos, filter them by duration, and generate AI-powered summaries of their content.

## Features

- **Video Search**: Search for YouTube videos on any topic
- **Duration Filtering**: Filter videos by duration (short, medium, long)
- **AI Summaries**: Generate comprehensive summaries of video content
- **Key Points**: Extract the most important points from videos
- **Action Items**: Get actionable takeaways from video content
- **Word Count Control**: Customize the length of generated summaries

## Tech Stack

### Frontend
- React with TypeScript
- CSS for styling
- Axios for API requests

### Backend
- FastAPI (Python)
- YouTube Data API for video search and metadata
- YouTube Transcript API for video captions
- Groq API for AI-powered summarization

## Setup and Installation

### Prerequisites
- Node.js and npm
- Python 3.8+
- YouTube API key
- Groq API key

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file with your API keys:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key
   GROQ_API_KEY=your_groq_api_key
   ```

6. Start the backend server:
   ```
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter a search query in the search bar
3. Use the duration filter to narrow down results
4. Click on a video to view its details
5. Click "Generate Summary" to create an AI summary of the video
6. Customize the word count range if needed
7. View the generated summary, key points, and action items

## API Endpoints

### Search Videos
- `GET /search-videos?query={query}&max_results={count}&duration={filter}&min_subscribers={count}`
- Returns a list of YouTube videos matching the search criteria

### Generate Summaries
- `POST /summarize-videos`
- Request body: `{ "video_ids": ["video_id"], "min_words": 500, "max_words": 600 }`
- Returns AI-generated summaries for the specified videos

## License

MIT 