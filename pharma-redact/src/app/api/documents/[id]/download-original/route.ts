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
        if (!document.originalFilePath) {
            console.error('API: Document has no originalFilePath set');
            return NextResponse.json(
                { error: 'Original file path not found in document record' },
                { status: 404 }
            );
        }

        // Validate the file exists
        if (!fs.existsSync(document.originalFilePath)) {
            console.error(`API: File not found at path: ${document.originalFilePath}`);

            // Try alternative paths if the file doesn't exist
            const fileName = path.basename(document.originalFilePath);
            const possiblePaths = [
                // Check in user-specific uploads directory
                path.join(process.cwd(), 'uploads', userId, fileName),
                // Check in dev-user-123 directory (for development)
                path.join(process.cwd(), 'uploads', 'dev-user-123', fileName),
                // Check in the root uploads directory
                path.join(process.cwd(), 'uploads', fileName)
            ];

            console.log('API: Trying alternative paths for download:', possiblePaths);

            let fileFound = false;
            let filePath = '';

            // Check each possible path
            for (const altPath of possiblePaths) {
                if (fs.existsSync(altPath)) {
                    console.log(`API: Found file at alternative path for download: ${altPath}`);
                    fileFound = true;
                    filePath = altPath;
                    break;
                }
            }

            if (!fileFound) {
                return NextResponse.json(
                    { error: 'Original file not found on disk' },
                    { status: 404 }
                );
            }

            // Continue with the found file
            document.originalFilePath = filePath;
        }

        // Read the file with error handling
        let fileBuffer;
        try {
            fileBuffer = fs.readFileSync(document.originalFilePath);
            console.log(`API: Successfully read file: ${document.originalFilePath}, size: ${fileBuffer.length} bytes`);
        } catch (readError) {
            console.error('API: Error reading file:', readError);
            return NextResponse.json(
                { error: 'Failed to read file from disk', details: (readError as Error).message },
                { status: 500 }
            );
        }

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