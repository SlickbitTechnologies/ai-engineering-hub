import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/firebase/auth';
import { DocumentRepository } from '@/db/documentRepository';

// Development mode handler for authorization
async function handleDevAuth(request: NextRequest) {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
        console.log('[DEV MODE] Using development auth fallback');

        // Try to get user ID from the dev-auth-token header
        const userId = request.headers.get('x-user-id');
        if (userId) {
            console.log(`[DEV MODE] Using provided user ID: ${userId}`);
            return { uid: userId };
        }

        // If no user ID in header, try to get it from the form data (POST requests)
        if (request.method === 'POST') {
            try {
                const formData = await request.formData();
                const formUserId = formData.get('user_id');
                if (formUserId) {
                    console.log(`[DEV MODE] Using user ID from form data: ${formUserId}`);
                    return { uid: formUserId.toString() };
                }
            } catch (err) {
                console.log('[DEV MODE] No form data available');
            }
        }

        // Last resort - use a hardcoded dev user ID
        console.log('[DEV MODE] Using default development user ID');
        return { uid: 'dev-user-123' };
    }

    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(`Download request for document: ${params.id}`);
    try {
        // Verify authentication
        const authToken = request.headers.get('authorization')?.split('Bearer ')[1];
        console.log(`Auth token present: ${!!authToken}`);

        let userId;

        if (!authToken) {
            if (process.env.NODE_ENV === 'development') {
                // Use development fallback
                const devUser = await handleDevAuth(request);
                if (devUser) {
                    userId = devUser.uid;
                } else {
                    return NextResponse.json({ error: 'Unauthorized - no auth token' }, { status: 401 });
                }
            } else {
                return NextResponse.json({ error: 'Unauthorized - no auth token' }, { status: 401 });
            }
        } else {
            try {
                // Verify Firebase token and get user
                const decodedToken = await auth.verifyIdToken(authToken);
                if (!decodedToken.uid) {
                    return NextResponse.json({ error: 'Invalid authentication - no uid in token' }, { status: 401 });
                }
                userId = decodedToken.uid;
            } catch (authError) {
                console.error('Auth token verification error:', authError);

                if (process.env.NODE_ENV === 'development') {
                    // Special handling for development mode
                    const devUser = await handleDevAuth(request);
                    if (devUser) {
                        userId = devUser.uid;
                        console.log(`[DEV MODE] Using fallback user ID: ${userId}`);
                    } else {
                        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
                    }
                } else {
                    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
                }
            }
        }

        const documentId = params.id;
        console.log(`Fetching document ${documentId} for user ${userId}`);

        // Get the document
        let document;
        try {
            document = DocumentRepository.getDocumentById(documentId, userId);
        } catch (dbError) {
            console.error('Database error fetching document:', dbError);
            return NextResponse.json({
                error: 'Failed to fetch document from database',
                details: dbError instanceof Error ? dbError.message : 'Unknown database error'
            }, { status: 500 });
        }

        if (!document) {
            console.log(`Document not found: ${documentId} for user ${userId}`);
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        console.log(`Document found: ${document.fileName}, Status: ${document.status}, Has redacted file: ${!!document.redactedFilePath}`);

        // Check if document has been redacted
        if (document.status !== 'redacted' || !document.redactedFilePath) {
            return NextResponse.json(
                { error: 'Redacted version not available', documentStatus: document.status },
                { status: 400 }
            );
        }

        console.log(`Redacted file path: ${document.redactedFilePath}`);

        // Check if file exists
        if (!fs.existsSync(document.redactedFilePath)) {
            console.error(`File not found on disk: ${document.redactedFilePath}`);

            // In development mode, provide more details for debugging
            if (process.env.NODE_ENV === 'development') {
                try {
                    const dir = path.dirname(document.redactedFilePath);
                    const filesInDir = fs.existsSync(dir) ? fs.readdirSync(dir) : [];

                    return NextResponse.json({
                        error: 'Redacted file not found on disk',
                        details: {
                            path: document.redactedFilePath,
                            directoryExists: fs.existsSync(dir),
                            filesInDirectory: filesInDir
                        }
                    }, { status: 404 });
                } catch (fsError) {
                    return NextResponse.json({
                        error: 'Redacted file not found on disk',
                        details: fsError instanceof Error ? fsError.message : 'Unknown filesystem error'
                    }, { status: 404 });
                }
            }

            return NextResponse.json(
                { error: 'Redacted file not found on disk' },
                { status: 404 }
            );
        }

        // Read the file
        let fileBuffer;
        try {
            fileBuffer = fs.readFileSync(document.redactedFilePath);
            console.log(`File read successfully: ${fileBuffer.length} bytes`);
        } catch (fsError) {
            console.error(`Error reading file: ${document.redactedFilePath}`, fsError);
            return NextResponse.json({
                error: 'Failed to read file from disk',
                details: fsError instanceof Error ? fsError.message : 'Unknown file read error'
            }, { status: 500 });
        }

        // Prepare the response
        const response = new NextResponse(fileBuffer);

        // Set content type based on file extension
        const fileExtension = path.extname(document.redactedFilePath).toLowerCase();
        let contentType = 'application/octet-stream';

        if (fileExtension === '.pdf') {
            contentType = 'application/pdf';
        } else if (['.doc', '.docx'].includes(fileExtension)) {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (['.xls', '.xlsx'].includes(fileExtension)) {
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (fileExtension === '.txt') {
            contentType = 'text/plain';
        }

        console.log(`Using content type: ${contentType} for extension: ${fileExtension}`);

        // Set appropriate headers
        response.headers.set('Content-Type', contentType);
        response.headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`);
        response.headers.set('Cache-Control', 'no-cache');

        return response;
    } catch (error) {
        console.error('Error in download route:', error);

        // Detailed error response in development mode
        if (process.env.NODE_ENV === 'development') {
            return NextResponse.json({
                error: 'Failed to download document',
                details: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : 'Unknown error'
            }, { status: 500 });
        }

        return NextResponse.json(
            { error: 'Failed to download document' },
            { status: 500 }
        );
    }
}

// Add POST method to handle form-based authentication for downloads
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return GET(request, { params });
} 