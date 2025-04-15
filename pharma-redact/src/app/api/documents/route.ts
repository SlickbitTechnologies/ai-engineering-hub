import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { auth } from '@/firebase/auth';
import { DocumentRepository } from '@/db/documentRepository';

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
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

        // Handle form data with file
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Create user-specific upload directory
        const userUploadDir = path.join(UPLOAD_DIR, userId);
        if (!fs.existsSync(userUploadDir)) {
            fs.mkdirSync(userUploadDir, { recursive: true });
        }

        // Generate a unique filename
        const fileExtension = path.extname(file.name);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(userUploadDir, uniqueFilename);

        // Save the file
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        // Create document record in database
        const document = DocumentRepository.createDocument(
            userId,
            filePath,
            file.name,
            file.type,
            file.size
        );

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error('Error uploading document:', error);
        return NextResponse.json(
            { error: 'Failed to upload document' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
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

        // Get all documents for the user
        const documents = DocumentRepository.getDocumentsByUser(userId);

        return NextResponse.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
} 