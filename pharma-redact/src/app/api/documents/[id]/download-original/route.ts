import { NextRequest, NextResponse } from 'next/server';
import { DocumentRepository } from '@/db/documentRepository';
import fs from 'fs';
import path from 'path';
import { auth } from '@/firebase/auth';

// For development mode, allow getting user ID from headers or form data
const handleDevAuth = async (req: NextRequest) => {
    if (process.env.NODE_ENV === 'development') {
        try {
            // First try to get from headers
            const userId = req.headers.get('x-user-id') || req.headers.get('user-id');
            if (userId) {
                console.log('[DEV] Using user ID from headers:', userId);
                return userId;
            }

            // If not in headers, try to get from form data
            const formData = await req.formData().catch(() => null);
            if (formData) {
                const formUserId = formData.get('user_id');
                if (formUserId) {
                    console.log('[DEV] Using user ID from form data:', formUserId);
                    return formUserId.toString();
                }
            }
        } catch (error) {
            console.error('[DEV] Error parsing auth info:', error);
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
async function handleRequest(req: NextRequest, params: { id: string }) {
    console.log(`[download-original] Request for document ID: ${params.id}`);

    try {
        // Authentication
        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        let userId;

        // First try to verify with token
        if (token) {
            const authResult = await verifyAuth(token);
            userId = authResult?.userId;
            console.log(`[download-original] Auth result from token: ${userId ? 'successful' : 'failed'}`);
        }

        // If token auth failed and it's development, try alternate methods
        if (!userId) {
            userId = await handleDevAuth(req);
            if (userId) {
                console.log(`[download-original] Using development auth with user ID: ${userId}`);
            } else {
                console.log('[download-original] No authentication provided');
                return new NextResponse('Unauthorized', { status: 401 });
            }
        }

        // Get document
        console.log(`[download-original] Retrieving document ${params.id} for user ${userId}`);
        const document = DocumentRepository.getDocumentById(params.id, userId);

        if (!document) {
            console.log(`[download-original] Document not found: ${params.id}`);
            return new NextResponse('Document not found', { status: 404 });
        }

        console.log(`[download-original] Found document: ${document.fileName}`);

        // Check if original file path is available
        if (!document.originalFilePath) {
            console.log(`[download-original] No original file path for document: ${params.id}`);
            return new NextResponse('Original file path not available', { status: 404 });
        }

        const filePath = document.originalFilePath;
        console.log(`[download-original] File path: ${filePath}`);

        let fileBuffer: Buffer;
        let stats: fs.Stats;

        // Check if file exists
        try {
            if (!fs.existsSync(filePath)) {
                console.log(`[download-original] File does not exist at path: ${filePath}`);
                return new NextResponse('File not found on server', { status: 404 });
            }

            // Get file stats for size
            stats = fs.statSync(filePath);
            console.log(`[download-original] File size: ${stats.size} bytes`);

            // Validate file size
            if (stats.size === 0) {
                console.log(`[download-original] File exists but has zero size: ${filePath}`);
                return new NextResponse('File exists but is empty', { status: 404 });
            }

            // Read file and return as response
            fileBuffer = fs.readFileSync(filePath);
            console.log(`[download-original] Successfully read file`);
        } catch (error) {
            console.error(`[download-original] Error accessing file: ${error}`);
            return new NextResponse('Error accessing file', { status: 500 });
        }

        // Determine if this is a direct download request or an inline view request
        const isDownload = req.headers.get('x-download') === 'true' ||
            req.nextUrl.searchParams.get('download') === 'true';

        // Set the content type, ensuring PDF files are properly identified
        const contentType = document.fileType ||
            (document.fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

        // Set content disposition based on whether this is a download or inline view
        const contentDisposition = isDownload
            ? `attachment; filename="${document.fileName}"`
            : `inline; filename="${document.fileName}"`;

        console.log(`[download-original] Serving file with disposition: ${contentDisposition}`);

        // Prepare response with proper headers
        const response = new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': contentDisposition,
                'Content-Length': String(stats.size),
                'Cache-Control': 'private, max-age=300'
            }
        });

        console.log(`[download-original] Sending response with Content-Type: ${contentType}`);
        return response;
    } catch (error) {
        console.error('[download-original] Error:', error);

        // Detailed error for development
        if (process.env.NODE_ENV === 'development') {
            return new NextResponse(
                JSON.stringify({
                    error: 'Failed to download original document',
                    details: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new NextResponse('Failed to download original document', { status: 500 });
    }
}

// Handle GET request
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    return handleRequest(req, params);
}

// Handle POST request for form-based downloads
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    return handleRequest(req, params);
} 