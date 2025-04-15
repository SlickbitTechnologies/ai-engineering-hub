import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseRunResult {
  changes: number;
  lastID?: number;
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database | null = null;
  private dbPath: string;

  private constructor() {
    this.dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private async initializeDatabase(): Promise<void> {
    if (!this.db) {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      console.log('Database initialized at:', this.dbPath);
    }
  }

  public getDb(): Database | null {
    return this.db;
  }

  public async run(sql: string, params: any[] = []): Promise<DatabaseRunResult> {
    await this.initializeDatabase();
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const result = await this.db.run(sql, params);
    return {
      changes: result.changes || 0,
      lastID: result.lastID
    };
  }

  public async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    await this.initializeDatabase();
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return await this.db.get(sql, params);
  }

  public async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    await this.initializeDatabase();
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return await this.db.all(sql, params);
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
} 