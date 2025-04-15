import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/firebase/auth';
import { DocumentRepository } from '@/db/documentRepository';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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
        const documentId = params.id;

        // Get the original document
        const document = DocumentRepository.getDocumentById(documentId, userId);

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Handle form data with redacted file
        const formData = await request.formData();
        const redactedFile = formData.get('redactedFile') as File;
        const summary = formData.get('summary') as string;

        if (!redactedFile) {
            return NextResponse.json(
                { error: 'No redacted file provided' },
                { status: 400 }
            );
        }

        if (!summary) {
            return NextResponse.json(
                { error: 'No redaction summary provided' },
                { status: 400 }
            );
        }

        // Create user's redacted file directory
        const userRedactedDir = path.join(process.cwd(), 'uploads', userId, 'redacted');
        if (!fs.existsSync(userRedactedDir)) {
            fs.mkdirSync(userRedactedDir, { recursive: true });
        }

        // Generate filename for redacted file
        const fileExtension = path.extname(redactedFile.name);
        const uniqueFilename = `${uuidv4()}_redacted${fileExtension}`;
        const redactedFilePath = path.join(userRedactedDir, uniqueFilename);

        // Save the redacted file
        const buffer = Buffer.from(await redactedFile.arrayBuffer());
        fs.writeFileSync(redactedFilePath, buffer);

        // Update document record with redacted file path and summary
        const updated = DocumentRepository.updateDocumentRedaction(
            documentId,
            userId,
            redactedFilePath,
            summary
        );

        if (!updated) {
            // Clean up if update fails
            if (fs.existsSync(redactedFilePath)) {
                fs.unlinkSync(redactedFilePath);
            }

            return NextResponse.json(
                { error: 'Failed to update document with redaction information' },
                { status: 500 }
            );
        }

        // Get the updated document
        const updatedDocument = DocumentRepository.getDocumentById(documentId, userId);

        return NextResponse.json(updatedDocument);
    } catch (error) {
        console.error('Error saving redacted document:', error);
        return NextResponse.json(
            { error: 'Failed to save redacted document' },
            { status: 500 }
        );
    }
} 