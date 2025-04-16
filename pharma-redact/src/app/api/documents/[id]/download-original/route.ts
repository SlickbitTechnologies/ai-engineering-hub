import { NextRequest, NextResponse } from 'next/server';
import { DocumentRepository } from '@/db/documentRepository';
import fs from 'fs';
import path from 'path';
import { auth } from '@/firebase/auth';

// For development mode, allow getting user ID from headers or form data
const handleDevAuth = async (req: NextRequest) => {
    if (process.env.NODE_ENV === 'development') {
        try {
            console.log('[DEV] Checking all available auth methods');

            // Check authorization header first
            const authHeader = req.headers.get('Authorization');
            if (authHeader) {
                console.log('[DEV] Found Authorization header:', authHeader.substring(0, 15) + '...');
            }

            // Check user ID headers
            const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
            if (userId) {
                console.log('[DEV] Using user ID from headers:', userId);
                return userId;
            }

            // If not in headers, try to get from form data
            try {
                const formData = await req.formData();
                console.log('[DEV] Form data keys:', [...formData.keys()]);

                // Check for user_id in form data
                const formUserId = formData.get('user_id');
                if (formUserId) {
                    console.log('[DEV] Using user ID from form data:', formUserId);
                    return formUserId.toString();
                }

                // Check for token in form data
                const formToken = formData.get('token');
                if (formToken) {
                    try {
                        console.log('[DEV] Found token in form data, attempting verification');
                        const decodedToken = await auth.verifyIdToken(formToken.toString());
                        if (decodedToken && decodedToken.uid) {
                            console.log('[DEV] Token verification successful:', decodedToken.uid);
                            return decodedToken.uid;
                        }
                    } catch (tokenError) {
                        console.error('[DEV] Token verification failed:', tokenError);
                    }
                }
            } catch (formError) {
                console.error('[DEV] Error parsing form data:', formError);
            }

            // If all else fails, try to parse the body as JSON
            try {
                const jsonBody = await req.json();
                console.log('[DEV] Parsed JSON body keys:', Object.keys(jsonBody));

                if (jsonBody.userId) {
                    console.log('[DEV] Using user ID from JSON body:', jsonBody.userId);
                    return jsonBody.userId;
                }

                if (jsonBody.user_id) {
                    console.log('[DEV] Using user_id from JSON body:', jsonBody.user_id);
                    return jsonBody.user_id;
                }
            } catch (jsonError) {
                // Ignore JSON parsing errors
            }

            // Last resort - use a fixed test user ID in development
            console.log('[DEV] Using fallback test user ID');
            return 'test-user-123';
        } catch (error) {
            console.error('[DEV] Error in development auth handling:', error);
            // Return test user as fallback
            return 'test-user-123';
        }
    }
    return null;
};

// Utility function to verify authentication
const verifyAuth = async (token: string) => {
    try {
        const decodedToken = await auth.verifyIdToken(token);
        if (decodedToken && decodedToken.uid) {
            return { userId: decodedToken.uid };
        }
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error);
    }
    return null;
};

// Handler for both GET and POST requests
export async function handleRequest(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<Response> {
    // Log incoming request details
    console.log('=== DOWNLOAD-ORIGINAL REQUEST ===');
    console.log(`Document ID: ${params.id}`);
    console.log(`Method: ${request.method}`);
    console.log(`Content-Type: ${request.headers.get('content-type')}`);
    console.log(`Accept: ${request.headers.get('accept')}`);

    // Debug headers
    console.log('Auth Header:', request.headers.get('authorization'));
    console.log('x-user-id Header:', request.headers.get('x-user-id'));
    console.log('user-id Header:', request.headers.get('user-id'));

    try {
        // First try validating Bearer token
        let userId = null;
        let usedAuthMethod = '';

        // 1. Try to get token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            console.log('Found Bearer token, attempting to verify...');
            try {
                const authResult = await verifyAuth(token);
                if (authResult) {
                    userId = authResult.userId;
                    usedAuthMethod = 'bearer-token';
                    console.log(`Successfully authenticated with bearer token. User ID: ${userId}`);
                }
            } catch (tokenError) {
                console.error('Token verification error:', tokenError);
            }
        } else {
            console.log('No Bearer token found in Authorization header');
        }

        // 2. Try to get user ID from headers (for dev mode)
        if (!userId) {
            const userIdHeader = request.headers.get('x-user-id') || request.headers.get('user-id');
            if (userIdHeader && process.env.NODE_ENV === 'development') {
                userId = userIdHeader;
                usedAuthMethod = 'dev-header';
                console.log(`Using user ID from header for dev mode: ${userId}`);
            }
        }

        // 3. For POST requests, try to extract auth from form data or JSON body
        if (!userId && request.method === 'POST') {
            const contentType = request.headers.get('content-type') || '';

            // Handle form data
            if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
                console.log('Attempting to extract user ID from form data...');
                try {
                    const formData = await request.formData();
                    const formUserId = formData.get('user_id');
                    const formToken = formData.get('token');

                    if (formToken) {
                        console.log('Found token in form data, verifying...');
                        try {
                            const authResult = await verifyAuth(formToken.toString());
                            if (authResult) {
                                userId = authResult.userId;
                                usedAuthMethod = 'form-token';
                                console.log(`Successfully authenticated with form token. User ID: ${userId}`);
                            }
                        } catch (formTokenError) {
                            console.error('Form token verification error:', formTokenError);
                        }
                    }

                    // Fall back to user_id in dev mode
                    if (!userId && formUserId && process.env.NODE_ENV === 'development') {
                        userId = formUserId.toString();
                        usedAuthMethod = 'form-user-id-dev';
                        console.log(`Using user ID from form data for dev mode: ${userId}`);
                    }
                } catch (formError) {
                    console.error('Error parsing form data:', formError);
                }
            }

            // Handle JSON data
            if (!userId && contentType.includes('application/json')) {
                console.log('Attempting to extract user ID from JSON body...');
                try {
                    const json = await request.json();
                    const jsonToken = json.token;
                    const jsonUserId = json.user_id;

                    if (jsonToken) {
                        console.log('Found token in JSON body, verifying...');
                        try {
                            const authResult = await verifyAuth(jsonToken);
                            if (authResult) {
                                userId = authResult.userId;
                                usedAuthMethod = 'json-token';
                                console.log(`Successfully authenticated with JSON token. User ID: ${userId}`);
                            }
                        } catch (jsonTokenError) {
                            console.error('JSON token verification error:', jsonTokenError);
                        }
                    }

                    // Fall back to user_id in dev mode
                    if (!userId && jsonUserId && process.env.NODE_ENV === 'development') {
                        userId = jsonUserId;
                        usedAuthMethod = 'json-user-id-dev';
                        console.log(`Using user ID from JSON body for dev mode: ${userId}`);
                    }
                } catch (jsonError) {
                    console.error('Error parsing JSON body:', jsonError);
                }
            }
        }

        // 4. Last resort for development: use test user ID
        if (!userId && process.env.NODE_ENV === 'development') {
            userId = 'test-user-123';
            usedAuthMethod = 'test-user-fallback';
            console.log('Using test user ID as fallback for development');
        }

        // Check if we have a user ID
        if (!userId) {
            console.error('Authentication failed: Unable to determine user ID');
            return new Response(
                JSON.stringify({
                    error: 'Authentication failed',
                    details: 'Unable to determine user ID',
                    authMethodsTried: ['bearer-token', 'dev-header', 'form-data', 'json-body']
                }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Proceed with document retrieval
        console.log(`Authenticated as ${userId} via ${usedAuthMethod}. Retrieving document ${params.id}...`);
        const document = await DocumentRepository.getDocumentById(params.id, userId);

        if (!document) {
            console.error(`Document with ID ${params.id} not found for user ${userId}`);
            return new Response(
                JSON.stringify({
                    error: 'Document not found',
                    details: `Document with ID ${params.id} not found for user ${userId}`
                }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check if the original file exists
        let filePath;

        // Check if originalFilePath is already an absolute path
        if (path.isAbsolute(document.originalFilePath)) {
            filePath = document.originalFilePath;
            console.log(`Using absolute path: ${filePath}`);
        } else {
            // If it's a relative path, join with workspace path
            filePath = path.join(process.cwd(), 'uploads', document.originalFilePath);
            console.log(`Using joined path: ${filePath}`);
        }

        // Also try an alternative path, just in case
        const altFilePath = path.join(process.cwd(), document.originalFilePath);

        if (!fs.existsSync(filePath) && !fs.existsSync(altFilePath)) {
            console.error(`Original file not found at primary path: ${filePath}`);
            console.error(`Also checked alternative path: ${altFilePath}`);
            return new Response(
                JSON.stringify({
                    error: 'File not found',
                    details: 'The original document file could not be found on the server'
                }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Use the path that exists
        if (!fs.existsSync(filePath) && fs.existsSync(altFilePath)) {
            filePath = altFilePath;
            console.log(`Using alternative file path: ${filePath}`);
        }

        // Read the file and serve it
        try {
            const fileContent = await fs.promises.readFile(filePath);
            const filename = document.originalFilePath.split('/').pop() || 'document.pdf';

            console.log(`Successfully serving original file: ${filename}`);

            return new Response(fileContent, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Length': fileContent.length.toString()
                }
            });
        } catch (fileError) {
            console.error('Error reading file:', fileError);
            return new Response(
                JSON.stringify({
                    error: 'File read error',
                    details: 'Failed to read the original document file'
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    } catch (error) {
        console.error('Error handling request:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                details: 'An unexpected error occurred while processing the request'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// GET handler to serve the document
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<Response> {
    return handleRequest(request, { params });
}

// POST handler to serve the document (for cases where GET is not feasible)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<Response> {
    return handleRequest(request, { params });
}