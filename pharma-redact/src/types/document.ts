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
}

// Database row to Document object mapper
export const mapRowToDocument = (row: any): Document => {
    return {
        id: row.id,
        userId: row.user_id,
        originalFilePath: row.original_file_path,
        redactedFilePath: row.redacted_file_path,
        summary: row.summary,
        status: row.status as 'pending' | 'redacted',
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        uploadedAt: row.uploaded_at,
        updatedAt: row.updated_at
    };
};

// Document object to database row mapper
export const mapDocumentToRow = (document: Document): any => {
    return {
        id: document.id,
        user_id: document.userId,
        original_file_path: document.originalFilePath,
        redacted_file_path: document.redactedFilePath,
        summary: document.summary,
        status: document.status,
        file_name: document.fileName,
        file_type: document.fileType,
        file_size: document.fileSize,
        uploaded_at: document.uploadedAt,
        updated_at: document.updatedAt
    };
}; 