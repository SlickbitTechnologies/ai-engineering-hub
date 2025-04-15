import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { CREATE_DOCUMENTS_TABLE, CREATE_USER_INDEX } from './schema';

let db: ReturnType<typeof Database> | null = null;
let dbPath: string; // Declare dbPath at module level

/**
 * Get the database connection
 * @returns SQLite database connection
 */
export function getDbConnection(): ReturnType<typeof Database> {
    if (db) return db;

    const dataDir = path.join(process.cwd(), 'data');

    // Ensure data directory exists
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('Created data directory:', dataDir);
        }
    } catch (err: any) {
        console.error('Error creating data directory:', err);
        throw new Error(`Failed to create data directory: ${err.message}`);
    }

    dbPath = path.join(dataDir, 'pharma-redact.db');
    console.log('Database path:', dbPath);

    // Try to connect to the database with retry logic
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            attempts++;
            console.log(`Attempt ${attempts} to connect to database`);

            // Open database connection
            db = new Database(dbPath, { verbose: console.log });

            // Initialize schema if needed
            db.exec(CREATE_DOCUMENTS_TABLE);
            db.exec(CREATE_USER_INDEX);

            console.log('Database connection established and schema initialized');
            return db;
        } catch (err: any) {
            console.error(`Database connection attempt ${attempts} failed:`, err);

            if (attempts >= maxAttempts) {
                console.error('Maximum connection attempts reached');

                // In development, create an in-memory database as fallback
                if (process.env.NODE_ENV === 'development') {
                    console.warn('DEVELOPMENT MODE: Creating in-memory database as fallback');
                    try {
                        db = new Database(':memory:', { verbose: console.log });
                        db.exec(CREATE_DOCUMENTS_TABLE);
                        db.exec(CREATE_USER_INDEX);
                        console.log('In-memory database initialized');
                        return db;
                    } catch (memErr: any) {
                        console.error('Failed to create in-memory database:', memErr);
                        throw new Error(`Failed to create in-memory database: ${memErr.message}`);
                    }
                }

                throw new Error(`Failed to connect to database after ${maxAttempts} attempts: ${err.message}`);
            }

            // Wait before retry
            console.log(`Waiting before retry ${attempts + 1}...`);
        }
    }

    // This should never be reached due to the throw in the loop above
    throw new Error('Failed to establish database connection');
}

export function closeDbConnection() {
    if (db) {
        try {
            db.close();
            console.log('Database connection closed');
        } catch (error) {
            console.error('Error closing database connection:', error);
        }
        db = null;
    }
}

// Function to reset the database (for testing purposes only)
export function resetDatabase() {
    try {
        closeDbConnection();

        if (dbPath && fs.existsSync(dbPath)) {
            try {
                fs.unlinkSync(dbPath);
                console.log('Database file deleted');
            } catch (error) {
                console.error('Error deleting database file:', error);
            }
        }
    } catch (error) {
        console.error('Error resetting database:', error);
    }
} 