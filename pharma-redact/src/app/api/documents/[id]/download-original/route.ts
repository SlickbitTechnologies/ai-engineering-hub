import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '@/firebase/auth';
import { DocumentRepository } from '@/db/documentRepository';

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

        // Check if file exists
        if (!fs.existsSync(document.originalFilePath)) {
            return NextResponse.json(
                { error: 'Original file not found' },
                { status: 404 }
            );
        }

        // Read the file
        const fileBuffer = fs.readFileSync(document.originalFilePath);

        // Prepare the response
        const response = new NextResponse(fileBuffer);

        // Set content type based on file extension
        const fileExtension = path.extname(document.originalFilePath).toLowerCase();
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

        // Set appropriate headers
        response.headers.set('Content-Type', contentType);
        response.headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`);

        return response;
    } catch (error) {
        console.error('Error downloading original document:', error);
        return NextResponse.json(
            { error: 'Failed to download document' },
            { status: 500 }
        );
    }
} 