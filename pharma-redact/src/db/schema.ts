// SQL statements for database schema

export const CREATE_DOCUMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileType TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  originalFilePath TEXT NOT NULL,
  redactedFilePath TEXT,
  status TEXT DEFAULT 'pending',
  summary TEXT,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export const CREATE_USER_INDEX = `
CREATE INDEX IF NOT EXISTS idx_documents_userId ON documents(userId);
`;

// SQL queries for document operations
export const INSERT_DOCUMENT = `
INSERT INTO documents (
  id, userId, originalFilePath, fileName, fileType, fileSize, status, uploadedAt, updatedAt
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

export const GET_DOCUMENTS_BY_USER = `
SELECT * FROM documents WHERE userId = ? ORDER BY uploadedAt DESC;
`;

export const GET_DOCUMENT_BY_ID = `
SELECT * FROM documents WHERE id = ? AND userId = ?;
`;

export const UPDATE_DOCUMENT_REDACTION = `
UPDATE documents 
SET redactedFilePath = ?, summary = ?, status = 'redacted', updatedAt = ? 
WHERE id = ? AND userId = ?;
`;

export const DELETE_DOCUMENT = `
DELETE FROM documents WHERE id = ? AND userId = ?;
`;
