import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/firebase/auth';
import { DocumentRepository } from '@/db/documentRepository';

// Function to handle file retrieval and response - shared between GET and POST
async function handleDocumentRequest(request: NextRequest, params: { id: string }, userId: string, inline: boolean = false) {
    const documentId = params.id;
    console.log(`Processing document request: ID=${documentId}, userId=${userId}, inline=${inline}`);

    // Get the document
    let document;
    try {
        document = DocumentRepository.getDocumentById(documentId, userId);
        console.log(`Document retrieval result:`, document ? 'Found' : 'Not found');
    } catch (repoError: any) {
        console.error(`Error retrieving document from repository:`, repoError);
        return NextResponse.json({
            error: 'Failed to retrieve document from database',
            details: repoError.message
        }, { status: 500 });
    }

    if (!document) {
        console.error(`Document not found: ID=${documentId}, userId=${userId}`);
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if file exists
    if (!document.originalFilePath) {
        console.error(`API: Document has no originalFilePath set: ID=${documentId}`);
        return NextResponse.json(
            { error: 'Original file path not found in document record' },
            { status: 404 }
        );
    }

    console.log(`Original file path from document:`, document.originalFilePath);

    // Validate the file exists
    let finalFilePath = document.originalFilePath;
    if (!fs.existsSync(finalFilePath)) {
        console.error(`API: File not found at path: ${finalFilePath}`);

        // Try alternative paths if the file doesn't exist
        const fileName = path.basename(finalFilePath);
        console.log(`Trying to locate file by name: ${fileName}`);

        const possiblePaths = [
            // Check in user-specific uploads directory
            path.join(process.cwd(), 'uploads', userId, fileName),
            // Check in dev-user-123 directory (for development)
            path.join(process.cwd(), 'uploads', 'dev-user-123', fileName),
            // Check in the root uploads directory
            path.join(process.cwd(), 'uploads', fileName)
        ];

        console.log('API: Trying alternative paths for document:', possiblePaths);

        let fileFound = false;

        // Check each possible path
        for (const altPath of possiblePaths) {
            try {
                if (fs.existsSync(altPath)) {
                    console.log(`API: Found file at alternative path: ${altPath}`);
                    fileFound = true;
                    finalFilePath = altPath;
                    break;
                }
            } catch (fsError) {
                console.error(`Error checking path ${altPath}:`, fsError);
            }
        }

        if (!fileFound) {
            console.error(`API: All file path attempts failed for document: ${documentId}`);
            return NextResponse.json(
                { error: 'Original file not found on disk' },
                { status: 404 }
            );
        }
    } else {
        console.log(`API: File exists at original path: ${finalFilePath}`);
    }

    // Read the file with error handling
    let fileBuffer;
    try {
        console.log(`Reading file from path: ${finalFilePath}`);
        fileBuffer = fs.readFileSync(finalFilePath);
        console.log(`API: Successfully read file: size=${fileBuffer.length} bytes`);
    } catch (readError: any) {
        console.error('API: Error reading file:', readError);
        return NextResponse.json(
            {
                error: 'Failed to read file from disk',
                details: readError.message,
                path: finalFilePath
            },
            { status: 500 }
        );
    }

    // Prepare the response
    try {
        const response = new NextResponse(fileBuffer);

        // Set content type based on file extension
        const fileExtension = path.extname(finalFilePath).toLowerCase();
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

        // Set appropriate headers - inline for viewing, attachment for downloading
        console.log(`Setting response content type: ${contentType}, disposition: ${inline ? 'inline' : 'attachment'}`);
        response.headers.set('Content-Type', contentType);
        const disposition = inline ? 'inline' : 'attachment';
        response.headers.set('Content-Disposition', `${disposition}; filename="${document.fileName}"`);

        return response;
    } catch (responseError: any) {
        console.error('API: Error creating response:', responseError);
        return NextResponse.json(
            { error: 'Failed to create response', details: responseError.message },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log("POST request received for document viewing:", params.id);

        // Try to get token from request body
        const formData = await request.formData();
        const token = formData.get('token') as string;
        const userIdFromForm = formData.get('user_id') as string;

        if (!token) {
            console.error("No token provided in POST request");
            return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
        }

        console.log("Token received in POST request, length:", token.length);

        let userId;

        // Special handling for development mode
        if (process.env.NODE_ENV === 'development') {
            console.log("Development mode detected for auth");

            if (token === 'dev-auth-token') {
                // In development mode with dev token, use the provided user ID or default
                userId = userIdFromForm || 'dev-user-123';
                console.log("Using development fallback with user ID:", userId);
            } else {
                // Try Firebase auth, but fall back to development mode if it fails
                try {
                    const decodedToken = await auth.verifyIdToken(token);
                    if (decodedToken && decodedToken.uid) {
                        userId = decodedToken.uid;
                        console.log("Firebase auth successful in development mode, user ID:", userId);
                    } else {
                        // Fallback to form user ID if token verification fails
                        userId = userIdFromForm || 'dev-user-123';
                        console.log("Firebase auth failed in development mode, using fallback user ID:", userId);
                    }
                } catch (authError) {
                    console.log("Firebase auth error in development mode:", authError);
                    // Use the user ID from the form or a default
                    userId = userIdFromForm || 'dev-user-123';
                    console.log("Using development fallback after auth error, user ID:", userId);
                }
            }
        } else {
            // Production mode - verify Firebase token
            try {
                const decodedToken = await auth.verifyIdToken(token);
                if (!decodedToken || !decodedToken.uid) {
                    console.error("Invalid Firebase token, decoded token:", decodedToken);
                    return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
                }
                userId = decodedToken.uid;
                console.log("Firebase authentication successful, user ID:", userId);
            } catch (authError: any) {
                console.error("Firebase authentication error:", authError.message);
                return NextResponse.json({
                    error: 'Authentication failed',
                    details: authError.message
                }, { status: 401 });
            }
        }

        // Handle document viewing with inline=true
        try {
            console.log("Requesting document with params:", {
                documentId: params.id,
                userId,
                inline: true
            });
            return handleDocumentRequest(request, params, userId, true);
        } catch (docError: any) {
            console.error("Error in document request handler:", docError);
            return NextResponse.json({
                error: 'Document request failed',
                details: docError.message
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('Error viewing original document via POST:', error);
        // Return more detailed error information
        return NextResponse.json({
            error: 'Failed to view document',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication from header
        const authToken = request.headers.get('authorization')?.split('Bearer ')[1];
        if (!authToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify Firebase token and get user
        const decodedToken = await auth.verifyIdToken(authToken);
        if (!decodedToken.uid) {
            return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
        }

        const userId = decodedToken.uid;

        // Check if viewing is requested with inline parameter
        const url = new URL(request.url);
        const inline = url.searchParams.get('inline') === 'true';

        // Handle document request
        return handleDocumentRequest(request, params, userId, inline);
    } catch (error) {
        console.error('Error downloading original document:', error);
        return NextResponse.json(
            { error: 'Failed to download document' },
            { status: 500 }
        );
    }
} 