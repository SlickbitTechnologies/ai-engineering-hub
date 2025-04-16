import { v4 as uuidv4 } from 'uuid';
import { RedactionTemplate } from '@/types/redaction';
import { getDbConnection } from './connection';
import {
    CREATE_TEMPLATES_TABLE,
    INSERT_TEMPLATE,
    GET_TEMPLATES_BY_USER,
    GET_TEMPLATE_BY_ID,
    UPDATE_TEMPLATE,
    DELETE_TEMPLATE
} from './schema';

export class TemplateRepository {
    // Ensure templates table exists
    static initializeTable() {
        try {
            const db = getDbConnection();
            db.exec(CREATE_TEMPLATES_TABLE);
            console.log('DB: Templates table initialized');
        } catch (error) {
            console.error('Error initializing templates table:', error);
            throw error;
        }
    }

    // Create a new template record
    static createTemplate(
        userId: string,
        name: string,
        description: string,
        categories: any[]
    ): RedactionTemplate {
        try {
            const db = getDbConnection();
            const now = Date.now();
            const id = uuidv4();

            // Serialize the categories array to JSON for storage
            const categoriesJson = JSON.stringify(categories);

            const stmt = db.prepare(INSERT_TEMPLATE);
            stmt.run(
                id,
                userId,
                name,
                description,
                categoriesJson,
                now,
                now
            );

            return {
                id,
                name,
                description,
                categories,
                userId
            };
        } catch (error: any) {
            console.error('Error creating template in database:', error);
            throw new Error(`Database error creating template: ${error.message}`);
        }
    }

    // Get a template by ID (with user ID verification for security)
    static getTemplateById(templateId: string, userId: string): RedactionTemplate | null {
        try {
            console.log(`DB: Getting template with ID "${templateId}" for user "${userId}"`);

            const db = getDbConnection();
            const stmt = db.prepare(GET_TEMPLATE_BY_ID);
            const row = stmt.get(templateId, userId);

            if (!row) {
                console.log(`DB: No template found with ID "${templateId}" for user "${userId}"`);
                return null;
            }

            // Parse the categories JSON string back to an array
            const categories = JSON.parse(row.categories || '[]');

            return {
                id: row.id,
                name: row.name,
                description: row.description,
                categories,
                userId: row.userId
            };
        } catch (error) {
            console.error('Error getting template by ID:', error);
            throw error;
        }
    }

    // Get all templates for a user
    static getTemplatesByUser(userId: string): RedactionTemplate[] {
        try {
            console.log(`DB: Getting templates for user "${userId}"`);

            const db = getDbConnection();
            const stmt = db.prepare(GET_TEMPLATES_BY_USER);
            const rows = stmt.all(userId);

            return rows.map(row => ({
                id: row.id,
                name: row.name,
                description: row.description,
                categories: JSON.parse(row.categories || '[]'),
                userId: row.userId
            }));
        } catch (error: any) {
            console.error(`Error getting templates for user ${userId}:`, error);
            throw new Error(`Database error retrieving templates: ${error.message}`);
        }
    }

    // Update a template
    static updateTemplate(
        id: string,
        userId: string,
        name: string,
        description: string,
        categories: any[]
    ): boolean {
        try {
            const db = getDbConnection();

            // Sanitize inputs
            const sanitizedId = String(id).trim();
            const sanitizedUserId = String(userId).trim();

            // Serialize the categories array to JSON for storage
            const categoriesJson = JSON.stringify(categories);

            console.log(`DB: Updating template with ID "${sanitizedId}" for user "${sanitizedUserId}"`);

            const stmt = db.prepare(UPDATE_TEMPLATE);
            const result = stmt.run(
                name,
                description,
                categoriesJson,
                Date.now(),
                sanitizedId,
                sanitizedUserId
            );

            return result.changes > 0;
        } catch (error: any) {
            console.error(`Error updating template ${id} in database:`, error);
            throw new Error(`Database error updating template: ${error.message}`);
        }
    }

    // Delete a template
    static deleteTemplate(id: string, userId: string): boolean {
        try {
            const db = getDbConnection();

            // Sanitize inputs
            const sanitizedId = String(id).trim();
            const sanitizedUserId = String(userId).trim();

            console.log(`DB: Deleting template with ID "${sanitizedId}" for user "${sanitizedUserId}"`);

            const stmt = db.prepare(DELETE_TEMPLATE);
            const result = stmt.run(sanitizedId, sanitizedUserId);

            return result.changes > 0;
        } catch (error: any) {
            console.error(`Error deleting template ${id} from database:`, error);
            throw new Error(`Database error deleting template: ${error.message}`);
        }
    }
} 