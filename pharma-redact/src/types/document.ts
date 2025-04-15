export interface Document {
    id: string;
    userId: string;
    originalFilePath: string;
    redactedFilePath?: string | null;
    summary?: string | null;
    status: 'pending' | 'redacted';
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: number;
    updatedAt: number;
    fileStatus?: 'available' | 'missing' | 'error'; // Status of the file availability
}

// Database row to Document object mapper
export const mapRowToDocument = (row: any): Document => {
    console.log('DB: Row data from database:', row);
    return {
        id: row.id,
        userId: row.userId,
        originalFilePath: row.originalFilePath,
        redactedFilePath: row.redactedFilePath,
        summary: row.summary,
        status: row.status as 'pending' | 'redacted',
        fileName: row.fileName,
        fileType: row.fileType,
        fileSize: row.fileSize,
        uploadedAt: row.uploadedAt,
        updatedAt: row.updatedAt
    };
};

// Document object to database row mapper
export const mapDocumentToRow = (document: Document): any => {
    return {
        id: document.id,
        userId: document.userId,
        originalFilePath: document.originalFilePath,
        redactedFilePath: document.redactedFilePath,
        summary: document.summary,
        status: document.status,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
        updatedAt: document.updatedAt
    };
}; 