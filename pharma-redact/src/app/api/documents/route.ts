import { NextRequest, NextResponse } from 'next/server';
import { firebaseAdmin, auth } from '@/firebase/admin';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentRepository } from '@/db/documentRepository';

// Define upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created uploads directory at ${UPLOAD_DIR}`);
}

/**
 * Handler for POST /api/documents
 * Uploads a new document
 */
export async function POST(request: NextRequest) {
    try {
        console.log('POST /api/documents - Starting document upload');

        // Get authorization header
        const authHeader = request.headers.get('Authorization');
        console.log('Auth header present:', !!authHeader);

        // Check if auth header is present and in correct format
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Development fallback for testing
            if (process.env.NODE_ENV === 'development') {
                console.warn('Using development mode without authentication');
                // Use the current authenticated user ID from localStorage if available
                // or the Firebase UID if provided in request cookies or headers
                const userCookie = request.cookies.get('firebase-user-id');
                const userHeader = request.headers.get('x-user-id');
                const devUserId = userCookie?.value ||
                    userHeader ||
                    'dev-user-123'; // Fallback to dev-user-123 only if no other ID is available

                console.log(`Development mode using user ID: ${devUserId}`);
                return await handleUpload(request, devUserId);
            }

            return NextResponse.json({ error: 'Unauthorized - Invalid auth header' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify auth token 
        try {
            // Using our new auth helper
            const decodedToken = await auth.verifyIdToken(token, {
                headers: Object.fromEntries(request.headers.entries())
            });
            const userId = decodedToken.uid;
            console.log('User authenticated:', userId);
            return await handleUpload(request, userId);
        } catch (error: any) {
            console.error('Token verification failed:', error);

            // Development fallback for testing
            if (process.env.NODE_ENV === 'development' && token === 'dev-auth-token') {
                console.warn('Using development mode authentication fallback');
                // Use the current authenticated user ID from localStorage if available
                // or the Firebase UID if provided in request cookies or headers
                const userCookie = request.cookies.get('firebase-user-id');
                const userHeader = request.headers.get('x-user-id');
                const devUserId = userCookie?.value ||
                    userHeader ||
                    'dev-user-123'; // Fallback to dev-user-123 only if no other ID is available

                console.log(`Development mode using user ID: ${devUserId}`);
                return await handleUpload(request, devUserId);
            }

            return NextResponse.json({
                error: `Unauthorized - Token verification failed: ${error.message}`
            }, { status: 401 });
        }

    } catch (error: any) {
        console.error('Unhandled error in document upload:', error);
        return NextResponse.json({
            error: `Server error: ${error.message || 'Unknown error'}`
        }, { status: 500 });
    }
}

/**
 * Handle the actual file upload after authentication
 */
async function handleUpload(request: NextRequest, userId: string) {
    try {
        console.log('Handling file upload for user:', userId);

        // Handle form data with file
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log('File received:', file.name, file.size, 'bytes');

        // Create user-specific upload directory
        const userUploadDir = path.join(UPLOAD_DIR, userId);
        if (!fs.existsSync(userUploadDir)) {
            fs.mkdirSync(userUploadDir, { recursive: true });
            console.log(`Created user upload directory at ${userUploadDir}`);
        }

        // Generate a unique filename
        const fileExtension = path.extname(file.name);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(userUploadDir, uniqueFilename);

        // Save the file
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        console.log(`File saved to ${filePath}`);

        // Create document record in database
        const document = DocumentRepository.createDocument(
            userId,
            filePath,
            file.name,
            file.type,
            file.size
        );

        console.log('Document created in database:', document.id);

        return NextResponse.json(document, { status: 201 });
    } catch (error: any) {
        console.error('Error in handleUpload:', error);

        // Check for specific error types
        if (error.message && error.message.includes('disk')) {
            return NextResponse.json({
                error: `Disk error: ${error.message}`
            }, { status: 507 });
        }

        if (error.code === 'SQLITE_ERROR') {
            return NextResponse.json({
                error: `Database error: ${error.message}`
            }, { status: 500 });
        }

        return NextResponse.json({
            error: `Upload processing error: ${error.message}`
        }, { status: 500 });
    }
}

/**
 * Handler for GET /api/documents
 * Gets all documents for current user
 */
export async function GET(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Development fallback for testing
            if (process.env.NODE_ENV === 'development') {
                console.warn('Using development mode without authentication');
                // Use the current authenticated user ID from localStorage if available
                // or the Firebase UID if provided in request cookies or headers
                const userCookie = request.cookies.get('firebase-user-id');
                const userHeader = request.headers.get('x-user-id');
                const devUserId = userCookie?.value ||
                    userHeader ||
                    'dev-user-123'; // Fallback to dev-user-123 only if no other ID is available

                console.log(`Development mode using user ID: ${devUserId}`);
                const documents = DocumentRepository.getDocumentsByUser(devUserId);
                return NextResponse.json(documents);
            }

            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify auth token
        try {
            // Using our new auth helper
            const decodedToken = await auth.verifyIdToken(token, {
                headers: Object.fromEntries(request.headers.entries())
            });
            const userId = decodedToken.uid;

            // Get all documents for this user
            const documents = DocumentRepository.getDocumentsByUser(userId);

            return NextResponse.json(documents);
        } catch (error: any) {
            // Development fallback for testing
            if (process.env.NODE_ENV === 'development' && token === 'dev-auth-token') {
                console.warn('Using development mode authentication fallback');
                // Use the current authenticated user ID from localStorage if available
                // or the Firebase UID if provided in request cookies or headers
                const userCookie = request.cookies.get('firebase-user-id');
                const userHeader = request.headers.get('x-user-id');
                const devUserId = userCookie?.value ||
                    userHeader ||
                    'dev-user-123'; // Fallback to dev-user-123 only if no other ID is available

                console.log(`Development mode using user ID: ${devUserId}`);
                const documents = DocumentRepository.getDocumentsByUser(devUserId);
                return NextResponse.json(documents);
            }

            return NextResponse.json({
                error: `Unauthorized: ${error.message}`
            }, { status: 401 });
        }
    } catch (error: any) {
        console.error('Error getting documents:', error);
        return NextResponse.json({
            error: `Failed to get documents: ${error.message}`
        }, { status: 500 });
    }
} 