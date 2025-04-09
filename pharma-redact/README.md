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

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

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

3. Run the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
pharma-redact/
├── public/              # Static assets
├── src/
│   ├── app/             # App router pages
│   ├── components/      # Reusable UI components
│   │   ├── layout/      # Layout components (header, footer, etc.)
│   │   └── ui/          # UI components (cards, buttons, etc.)
│   ├── lib/             # Utility functions and helpers
│   └── store/           # Redux store setup
│       └── slices/      # Redux slices
├── tailwind.config.js   # Tailwind CSS configuration
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

## License

[MIT License](LICENSE)

## Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com).
