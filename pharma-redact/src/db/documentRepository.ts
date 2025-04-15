import { v4 as uuidv4 } from 'uuid';
import { Document, mapRowToDocument } from '@/types/document';
import { getDbConnection } from './connection';
import {
    INSERT_DOCUMENT,
    GET_DOCUMENTS_BY_USER,
    GET_DOCUMENT_BY_ID,
    UPDATE_DOCUMENT_REDACTION,
    DELETE_DOCUMENT
} from './schema';

export class DocumentRepository {
    // Create a new document record
    static createDocument(
        userId: string,
        originalFilePath: string,
        fileName: string,
        fileType: string,
        fileSize: number,
    ): Document {
        const db = getDbConnection();

        const now = Date.now();
        const id = uuidv4();
        const status = 'pending';

        const stmt = db.prepare(INSERT_DOCUMENT);
        stmt.run(
            id,
            userId,
            originalFilePath,
            fileName,
            fileType,
            fileSize,
            status,
            now,
            now
        );

        return {
            id,
            userId,
            originalFilePath,
            status: 'pending',
            fileName,
            fileType,
            fileSize,
            uploadedAt: now,
            updatedAt: now
        };
    }

    // Get a document by ID (with user ID verification for security)
    static getDocumentById(id: string, userId: string): Document | null {
        const db = getDbConnection();

        const stmt = db.prepare(GET_DOCUMENT_BY_ID);
        const row = stmt.get(id, userId);

        if (!row) return null;

        return mapRowToDocument(row);
    }

    // Get all documents for a user
    static getDocumentsByUser(userId: string): Document[] {
        const db = getDbConnection();

        const stmt = db.prepare(GET_DOCUMENTS_BY_USER);
        const rows = stmt.all(userId);

        return rows.map(mapRowToDocument);
    }

    // Update a document with redaction details
    static updateDocumentRedaction(
        id: string,
        userId: string,
        redactedFilePath: string,
        summary: string
    ): boolean {
        const db = getDbConnection();
        const now = Date.now();

        const stmt = db.prepare(UPDATE_DOCUMENT_REDACTION);
        const result = stmt.run(redactedFilePath, summary, now, id, userId);

        return result.changes > 0;
    }

    // Delete a document
    static deleteDocument(id: string, userId: string): boolean {
        const db = getDbConnection();

        const stmt = db.prepare(DELETE_DOCUMENT);
        const result = stmt.run(id, userId);

        return result.changes > 0;
    }
} 