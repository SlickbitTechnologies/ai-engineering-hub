import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/firebase/auth';
import { DocumentRepository } from '@/db/documentRepository';

// GET a specific document
export async function GET(
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

        // Get the document
        const document = DocumentRepository.getDocumentById(documentId, userId);

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        return NextResponse.json(
            { error: 'Failed to fetch document' },
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

        // Get existing document
        const existingDocument = DocumentRepository.getDocumentById(documentId, userId);
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
        const updated = DocumentRepository.updateDocumentRedaction(
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
        const updatedDocument = DocumentRepository.getDocumentById(documentId, userId);

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

        // Get the document first to get file paths
        const document = DocumentRepository.getDocumentById(documentId, userId);

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
        const deleted = DocumentRepository.deleteDocument(documentId, userId);

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