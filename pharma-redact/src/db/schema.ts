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

// Templates table schema
export const CREATE_TEMPLATES_TABLE = `
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export const CREATE_TEMPLATES_USER_INDEX = `
CREATE INDEX IF NOT EXISTS idx_templates_userId ON templates(userId);
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

// SQL queries for template operations
export const INSERT_TEMPLATE = `
INSERT INTO templates (
  id, userId, name, description, categories, createdAt, updatedAt
) VALUES (?, ?, ?, ?, ?, ?, ?);
`;

export const GET_TEMPLATES_BY_USER = `
SELECT * FROM templates WHERE userId = ? ORDER BY updatedAt DESC;
`;

export const GET_TEMPLATE_BY_ID = `
SELECT * FROM templates WHERE id = ? AND userId = ?;
`;

export const UPDATE_TEMPLATE = `
UPDATE templates 
SET name = ?, description = ?, categories = ?, updatedAt = ? 
WHERE id = ? AND userId = ?;
`;

export const DELETE_TEMPLATE = `
DELETE FROM templates WHERE id = ? AND userId = ?;
`;
