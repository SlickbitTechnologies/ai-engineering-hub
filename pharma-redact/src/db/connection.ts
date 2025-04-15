import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_DOCUMENTS_TABLE, CREATE_USER_INDEX } from './schema';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database file path
const DB_PATH = path.join(DATA_DIR, 'pharma-redact.db');

let dbInstance: ReturnType<typeof Database> | null = null;

export function getDbConnection(): ReturnType<typeof Database> {
    if (!dbInstance) {
        dbInstance = new Database(DB_PATH, { verbose: console.log });

        // Initialize database schema
        dbInstance.exec(CREATE_DOCUMENTS_TABLE);
        dbInstance.exec(CREATE_USER_INDEX);
    }

    return dbInstance;
}

export function closeDbConnection() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}

// To be used in development for resetting the database
export function resetDatabase() {
    if (process.env.NODE_ENV === 'development') {
        closeDbConnection();

        if (fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
        }

        // Re-initialize
        getDbConnection();
    }
} 