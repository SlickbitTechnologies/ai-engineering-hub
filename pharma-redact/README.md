# PharmaRedact - Document Redaction Solution

PharmaRedact is a modern web application for automatically retrieving, processing, and redacting sensitive information from documents, particularly Clinical Study Reports for pharmaceutical regulatory submissions.

## Features

- **Automated Document Retrieval**: Connect to shared drives, Document Management Systems (DMS), or SharePoint to retrieve documents.
- **Intelligent Redaction**: Utilize AI and NLP techniques to identify and redact sensitive information.
- **Custom Redaction Rules**: Define and manage your own rules for identifying sensitive content.
- **Document Preview**: Review documents before and after redaction to ensure accuracy.
- **Approval Workflow**: Route redacted documents through a secure review and approval process.
- **Sample Document Generation**: Generate sample Clinical Study Reports for testing when needed.

## Technology Stack

- **Next.js**: React framework for server-side rendering and modern web development
- **Redux Toolkit**: State management solution
- **TailwindCSS v4**: Utility-first CSS framework
- **ShadCN**: Styled components for a consistent UI
- **TypeScript**: Type-safe JavaScript
- **Firebase**: Authentication, storage, and database
- **OpenAI & Gemini AI**: AI models for document analysis and redaction

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Firebase account
- OpenAI API key
- Gemini API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/pharma-redact.git
   cd pharma-redact
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your API keys and Firebase configuration
   ```bash
   cp .env.example .env
   ```

4. Environment Variables:
   - `OPENAI_API_KEY`: Your OpenAI API key for document analysis
   - `GEMINI_API_KEY`: Your Gemini API key
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Same Gemini API key exposed to client
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID
   - `FIREBASE_PROJECT_ID`: Same as above for server-side
   - `FIREBASE_CLIENT_EMAIL`: Firebase service account email
   - `FIREBASE_PRIVATE_KEY`: Firebase service account private key

5. Run the development server:
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
pharma-redact/
├── public/              # Static assets
├── src/
│   ├── app/             # App router pages
│   ├── components/      # Reusable UI components
│   │   ├── layout/      # Layout components (header, footer, etc.)
│   │   └── ui/          # UI components (cards, buttons, etc.)
│   ├── utils/           # Utility functions and APIs
│   ├── firebase/        # Firebase configuration and utilities
│   └── store/           # Redux store setup
│       └── slices/      # Redux slices
├── tailwind.config.js   # Tailwind CSS configuration
├── .env.example         # Example environment variables
└── next.config.js       # Next.js configuration
```

## Key Workflows

### Document Redaction Process

1. **Upload/Retrieve Document**: Upload a document or connect to a DMS to retrieve one
2. **Apply Redaction Rules**: Apply predefined or custom rules to identify sensitive information
3. **Review Redactions**: Preview and review the identified content to be redacted
4. **Approve/Reject**: Approve or reject each redaction instance
5. **Export**: Export the final redacted document

### Rule Management

1. **Create Rules**: Define regex patterns to match sensitive information
2. **Test Rules**: Test rules against sample documents
3. **Activate/Deactivate**: Control which rules are active for redaction

## Database Implementation

The application uses SQLite as a persistent storage solution for document management. This provides a lightweight, serverless database that doesn't require additional infrastructure.

### Document Storage

Documents are stored with the following metadata:

- **id**: A unique identifier for each document
- **user_id**: The ID of the user who uploaded the document
- **original_file_path**: Path to the original file on the server
- **redacted_file_path**: Path to the redacted version (if available)
- **summary**: Text summary of what was redacted
- **status**: Document status ('pending' or 'redacted')
- **file_name**: Original file name
- **file_type**: File MIME type
- **file_size**: File size in bytes
- **uploaded_at**: Timestamp when document was uploaded
- **updated_at**: Timestamp when document was last updated

### Database Structure

The database is initialized with a `documents` table and appropriate indexes for efficient queries. All queries are scoped by user ID to ensure users can only access their own documents.

### Document Lifecycle

1. **Upload**: Document is uploaded and saved to the server's filesystem. A record is created in the database with status "pending".
2. **Redaction**: User processes the document for redaction.
3. **Completion**: When redaction is complete, the redacted file path and summary are stored, and status is updated to "redacted".

### Navigation Control

The application controls navigation based on document status:

- If status is "pending", navigation to `/documents/{id}` allows the user to start or continue redaction.
- If status is "redacted", navigation to `/documents/{id}/report` displays the redaction report and summary.

### File Storage

Files are stored in a structured directory hierarchy:
- `uploads/[user_id]/` for original files
- `uploads/[user_id]/redacted/` for redacted files

This ensures proper organization and security separation between different users' documents.

## License

[MIT License](LICENSE)

## Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com).
