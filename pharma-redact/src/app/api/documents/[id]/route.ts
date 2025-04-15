import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/firebase/admin';
import { DocumentRepository } from '@/db/documentRepository';

// Mock document for development fallback
const mockDocument = {
    id: 'mock-id',
    userId: 'mock-user-id',
    fileName: 'mock-document.pdf',
    fileType: 'application/pdf',
    fileSize: 1024 * 1024,
    originalFilePath: '/mock/path/to/file.pdf',
    status: 'pending',
    uploadedAt: Date.now(),
    updatedAt: Date.now()
};

// GET a specific document
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // Await params properly before accessing its properties
    const { id } = await params;
    const documentId = String(id).trim();
    console.log(`API: Document GET request for ID: ${documentId} (length: ${documentId.length})`);

    try {
        // Debug log all headers (excluding auth token details)
        const headers = Object.fromEntries(request.headers.entries());
        if (headers.authorization) {
            headers.authorization = headers.authorization.substring(0, 15) + '...';
        }
        console.log('API: Request headers:', headers);

        // Development mode fallback for easier testing
        if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_API === 'true') {
            console.log('API: Using development mock data');
            // Return a mock document with the requested ID for development
            const devMockDocument = { ...mockDocument, id: documentId };
            return NextResponse.json(devMockDocument);
        }

        // Verify authentication
        const authToken = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!authToken) {
            console.log('API: No authorization token provided');
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }

        console.log('API: Auth token found, length:', authToken?.length);

        // Debug token format
        const tokenParts = authToken.split('.');
        if (tokenParts.length !== 3) {
            console.error('API: Invalid token format - should have 3 parts separated by dots');
            return NextResponse.json({ error: 'Unauthorized - Invalid token format' }, { status: 401 });
        }

        console.log('API: Token format valid (3 parts)');
        try {
            // Try to decode payload (middle part) to debug
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log('API: Token payload:', {
                uid: payload.user_id || payload.sub || payload.uid,
                email: payload.email,
                exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown',
                iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'unknown'
            });

            // Check if token is expired
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                console.error('API: Token is expired');
                return NextResponse.json({ error: 'Unauthorized - Token expired' }, { status: 401 });
            }
        } catch (e) {
            console.error('API: Error decoding token payload:', e);
        }

        try {
            // Verify Firebase token and get user
            console.log('API: Before Firebase verification');

            // Pass the request headers to verifyIdToken
            const decodedToken = await auth.verifyIdToken(authToken, {
                headers: Object.fromEntries(request.headers.entries())
            });

            console.log('API: Firebase token verified successfully, uid:', decodedToken.uid);

            if (!decodedToken.uid) {
                console.log('API: No UID in decoded token');
                return NextResponse.json({ error: 'Unauthorized - No UID in token' }, { status: 401 });
            }

            const userId = decodedToken.uid;
            console.log(`API: User authenticated: ${userId}`);

            try {
                // Get the document
                console.log(`API: Fetching document ${documentId} for user ${userId}`);
                console.log(`API: Database diagnostics - connection status check`);

                try {
                    const fs = require('fs');
                    const path = require('path');

                    // Check for database existence
                    const dbPath = path.join(process.cwd(), 'data', 'pharma-redact.db');
                    const dbExists = fs.existsSync(dbPath);
                    console.log(`API: Database file check - path: ${dbPath}, exists: ${dbExists}`);

                    // Check data directory
                    const dataDir = path.join(process.cwd(), 'data');
                    const dataDirExists = fs.existsSync(dataDir);
                    const dataDirStats = dataDirExists ? fs.statSync(dataDir) : null;
                    console.log(`API: Data directory check - path: ${dataDir}, exists: ${dataDirExists}, isDirectory: ${dataDirStats?.isDirectory()}`);

                    // Check uploads directory
                    const uploadsDir = path.join(process.cwd(), 'uploads');
                    const uploadsDirExists = fs.existsSync(uploadsDir);
                    console.log(`API: Uploads directory check - path: ${uploadsDir}, exists: ${uploadsDirExists}`);

                    // Check user directory
                    if (uploadsDirExists) {
                        const userDir = path.join(uploadsDir, userId);
                        const userDirExists = fs.existsSync(userDir);
                        console.log(`API: User directory check - path: ${userDir}, exists: ${userDirExists}`);
                    }
                } catch (fsError) {
                    console.error('API: Error checking filesystem:', fsError);
                }

                // Now fetch the document
                console.log(`API: Now attempting to fetch document from DB`);
                const document = await DocumentRepository.getDocumentById(documentId, userId);

                if (!document) {
                    console.log(`API: Document not found - ID: "${documentId}", User ID: "${userId}"`);
                    return NextResponse.json({ error: 'Document not found', details: { checkedId: documentId } }, { status: 404 });
                }

                // Add path verification and correction
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const originalDocument = { ...document }; // Save original for logging

                    // Check if the original file path exists
                    if (document.originalFilePath) {
                        let fileExists = fs.existsSync(document.originalFilePath);
                        console.log(`API: Original file path check - path: ${document.originalFilePath}, exists: ${fileExists}`);

                        // Try to fix the path if the file doesn't exist
                        if (!fileExists) {
                            console.warn(`API: File exists in DB but not on disk: ${document.originalFilePath}`);

                            // Try alternative paths
                            const fileName = path.basename(document.originalFilePath);
                            const possiblePaths = [
                                // Check in user-specific uploads directory
                                path.join(process.cwd(), 'uploads', userId, fileName),
                                // Check in dev-user-123 directory (for development)
                                path.join(process.cwd(), 'uploads', 'dev-user-123', fileName),
                                // Check in the root uploads directory
                                path.join(process.cwd(), 'uploads', fileName)
                            ];

                            console.log('API: Trying alternative paths:', possiblePaths);

                            // Check each possible path
                            for (const altPath of possiblePaths) {
                                if (fs.existsSync(altPath)) {
                                    console.log(`API: Found file at alternative path: ${altPath}`);
                                    document.originalFilePath = altPath;
                                    fileExists = true;
                                    break;
                                }
                            }

                            // If still not found, create a dummy file for testing (development only)
                            if (!fileExists && process.env.NODE_ENV === 'development') {
                                console.warn('API: File not found in any location, creating dummy file for development');
                                const tempDir = path.join(process.cwd(), 'uploads', userId);

                                // Ensure user directory exists
                                if (!fs.existsSync(tempDir)) {
                                    fs.mkdirSync(tempDir, { recursive: true });
                                }

                                // Create a dummy PDF file
                                const dummyFilePath = path.join(tempDir, `dummy-${documentId.substring(0, 8)}.pdf`);

                                try {
                                    // Create a minimal valid PDF file
                                    const minimalPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF';
                                    fs.writeFileSync(dummyFilePath, minimalPdf);

                                    document.originalFilePath = dummyFilePath;
                                    document.fileName = `dummy-document-${documentId.substring(0, 8)}.pdf`;
                                    document.fileType = 'application/pdf';
                                    document.fileSize = fs.statSync(dummyFilePath).size;

                                    console.log(`API: Created dummy file at ${dummyFilePath}`);
                                    fileExists = true;
                                } catch (dummyError) {
                                    console.error('API: Error creating dummy file:', dummyError);
                                }
                            }
                        }

                        // If file still doesn't exist, set a flag
                        if (!fileExists) {
                            console.error(`API: Could not locate file, returning document with missing file warning`);
                            document.fileStatus = 'missing';
                        } else {
                            document.fileStatus = 'available';

                            // Update file size and type based on actual file
                            try {
                                const stats = fs.statSync(document.originalFilePath);
                                document.fileSize = stats.size;

                                if (!document.fileType || document.fileType === 'Unknown type') {
                                    // Try to guess file type from extension
                                    const ext = path.extname(document.originalFilePath).toLowerCase();
                                    const mimeTypes: Record<string, string> = {
                                        '.pdf': 'application/pdf',
                                        '.doc': 'application/msword',
                                        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                        '.txt': 'text/plain'
                                    };
                                    document.fileType = mimeTypes[ext] || 'application/octet-stream';
                                }
                            } catch (statsError) {
                                console.error('API: Error getting file stats:', statsError);
                            }
                        }
                    } else {
                        console.error(`API: Document has no originalFilePath set`);
                        document.fileStatus = 'missing';
                    }

                    // Log changes made to document
                    if (JSON.stringify(originalDocument) !== JSON.stringify(document)) {
                        console.log('API: Document was modified to fix paths/metadata:', {
                            before: originalDocument,
                            after: document
                        });
                    }
                } catch (pathError) {
                    console.error('API: Error checking file path:', pathError);
                    document.fileStatus = 'error';
                }

                console.log('API: Document found, returning response');
                return NextResponse.json(document);
            } catch (dbError: any) {
                console.error('API: Database error:', dbError);
                return NextResponse.json(
                    { error: 'Database error', details: dbError.message },
                    { status: 500 }
                );
            }
        } catch (authError: any) {
            console.error('API: Authentication error:', authError);
            return NextResponse.json(
                { error: 'Authentication failed', details: authError.message },
                { status: 401 }
            );
        }
    } catch (error: any) {
        console.error('API: Error fetching document:', error);
        return NextResponse.json(
            { error: 'Failed to fetch document', details: error.message },
            { status: 500 }
        );
    }
}

// PATCH to update document (e.g., add redacted file and summary)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Await params properly before accessing its properties
        const { id } = await params;
        const documentId = String(id).trim();
        console.log(`API: Document PATCH request for ID: ${documentId} (length: ${documentId.length})`);

        // Verify authentication
        const authToken = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!authToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify Firebase token and get user
        const decodedToken = await auth.verifyIdToken(authToken, {
            headers: Object.fromEntries(request.headers.entries())
        });

        if (!decodedToken.uid) {
            return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
        }

        const userId = decodedToken.uid;

        // Get existing document
        const existingDocument = await DocumentRepository.getDocumentById(documentId, userId);
        if (!existingDocument) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Parse request body
        const { redactedFilePath, summary } = await request.json();

        if (!redactedFilePath || !summary) {
            return NextResponse.json(
                { error: 'Redacted file path and summary are required' },
                { status: 400 }
            );
        }

        // Update the document
        const updated = await DocumentRepository.updateDocumentRedaction(
            documentId,
            userId,
            redactedFilePath,
            summary
        );

        if (!updated) {
            return NextResponse.json(
                { error: 'Failed to update document' },
                { status: 500 }
            );
        }

        // Get the updated document
        const updatedDocument = await DocumentRepository.getDocumentById(documentId, userId);

        return NextResponse.json(updatedDocument);
    } catch (error) {
        console.error('Error updating document:', error);
        return NextResponse.json(
            { error: 'Failed to update document' },
            { status: 500 }
        );
    }
}

// DELETE a document
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Await params properly before accessing its properties
        const { id } = await params;
        const documentId = String(id).trim();
        console.log(`API: Document DELETE request for ID: ${documentId} (length: ${documentId.length})`);

        // Verify authentication
        const authToken = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!authToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify Firebase token and get user
        const decodedToken = await auth.verifyIdToken(authToken, {
            headers: Object.fromEntries(request.headers.entries())
        });

        if (!decodedToken.uid) {
            return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
        }

        const userId = decodedToken.uid;

        // Get the document first to get file paths
        const document = await DocumentRepository.getDocumentById(documentId, userId);

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Delete file from filesystem
        if (fs.existsSync(document.originalFilePath)) {
            fs.unlinkSync(document.originalFilePath);
        }

        // Delete redacted file if it exists
        if (document.redactedFilePath && fs.existsSync(document.redactedFilePath)) {
            fs.unlinkSync(document.redactedFilePath);
        }

        // Delete from database
        const deleted = await DocumentRepository.deleteDocument(documentId, userId);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Failed to delete document' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { error: 'Failed to delete document' },
            { status: 500 }
        );
    }
} 