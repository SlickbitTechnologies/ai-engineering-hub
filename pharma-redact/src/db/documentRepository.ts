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
        try {
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
        } catch (error: any) {
            console.error('Error creating document in database:', error);
            throw new Error(`Database error creating document: ${error.message}`);
        }
    }

    // Get a document by ID (with user ID verification for security)
    static getDocumentById(documentId: string, userId: string): Document | null {
        try {
            console.log(`DB: Getting document with ID "${documentId}" for user "${userId}"`);
            console.log(`DB: Query:\n${GET_DOCUMENT_BY_ID}\n with parameters [${documentId}, ${userId}]`);

            const db = getDbConnection();
            const stmt = db.prepare(GET_DOCUMENT_BY_ID);
            const row = stmt.get(documentId, userId);

            if (!row) {
                console.log(`DB: No document found with ID "${documentId}" for user "${userId}"`);
                return null;
            }

            console.log(`DB: Document found with ID "${documentId}"`);
            console.log('DB: Raw document row data:', row);
            console.log('DB: Row properties:', Object.keys(row));

            // Check for naming mismatches
            const dbColumns = Object.keys(row);
            const camelCaseProps = ['userId', 'fileName', 'fileType', 'fileSize', 'originalFilePath', 'redactedFilePath', 'uploadedAt', 'updatedAt'];
            const snakeCaseProps = ['user_id', 'file_name', 'file_type', 'file_size', 'original_file_path', 'redacted_file_path', 'uploaded_at', 'updated_at'];

            const foundCamelCase = camelCaseProps.filter(prop => dbColumns.includes(prop));
            const foundSnakeCase = snakeCaseProps.filter(prop => dbColumns.includes(prop));

            console.log('DB: Found camelCase columns:', foundCamelCase);
            console.log('DB: Found snake_case columns:', foundSnakeCase);

            // Use the proper mapping function to create the Document object
            const doc = mapRowToDocument(row);
            console.log('DB: Mapped document:', doc);
            return doc;
        } catch (error) {
            console.error('Error getting document by ID:', error);
            throw error;
        }
    }

    // Get all documents for a user
    static getDocumentsByUser(userId: string): Document[] {
        try {
            const db = getDbConnection();

            const stmt = db.prepare(GET_DOCUMENTS_BY_USER);
            const rows = stmt.all(userId);

            return rows.map(mapRowToDocument);
        } catch (error: any) {
            console.error(`Error getting documents for user ${userId}:`, error);
            throw new Error(`Database error retrieving documents: ${error.message}`);
        }
    }

    // Update a document with redaction details
    static updateDocumentRedaction(
        id: string,
        userId: string,
        redactedFilePath: string,
        summary: string
    ): boolean {
        try {
            const db = getDbConnection();

            // Sanitize IDs by trimming whitespace
            const sanitizedId = String(id).trim();
            const sanitizedUserId = String(userId).trim();

            console.log(`DB: Updating document redaction for ID "${sanitizedId}" and user "${sanitizedUserId}"`);

            const stmt = db.prepare(UPDATE_DOCUMENT_REDACTION);
            const result = stmt.run(
                redactedFilePath,
                summary,
                Date.now(),
                sanitizedId,
                sanitizedUserId
            );

            return result.changes > 0;
        } catch (error: any) {
            console.error(`Error updating document ${id} in database:`, error);
            throw new Error(`Database error updating document: ${error.message}`);
        }
    }

    // Delete a document
    static deleteDocument(id: string, userId: string): boolean {
        try {
            const db = getDbConnection();

            // Sanitize IDs by trimming whitespace
            const sanitizedId = String(id).trim();
            const sanitizedUserId = String(userId).trim();

            console.log(`DB: Deleting document with ID "${sanitizedId}" for user "${sanitizedUserId}"`);

            const stmt = db.prepare(DELETE_DOCUMENT);
            const result = stmt.run(sanitizedId, sanitizedUserId);

            return result.changes > 0;
        } catch (error: any) {
            console.error(`Error deleting document ${id} from database:`, error);
            throw new Error(`Database error deleting document: ${error.message}`);
        }
    }
} 