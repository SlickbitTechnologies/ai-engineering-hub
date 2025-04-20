import { NextResponse } from 'next/server';
import { createRedactionJob, getDocumentById } from '@/lib/firebase';
import { auth } from '@/lib/firebase-admin';
import { processDocumentRedaction } from '@/lib/redaction-service';

/**
 * API route to initiate document redaction
 */
export async function POST(request, { params }) {
  try {
    // Get the document ID from the route params
    const { id: documentId } = params;
    
    // Get authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    
    const userId = decodedToken.uid;
    
    // Get request body
    const body = await request.json();
    const { templateId } = body;
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Bad Request - Template ID is required' },
        { status: 400 }
      );
    }
    
    // Get the document to verify ownership and get file details
    const document = await getDocumentById(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Not Found - Document not found' },
        { status: 404 }
      );
    }
    
    // Verify document belongs to user
    if (document.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this document' },
        { status: 403 }
      );
    }
    
    // Check if document is already redacted
    if (document.status === 'redacted') {
      return NextResponse.json(
        { error: 'Bad Request - Document is already redacted' },
        { status: 400 }
      );
    }
    
    // Create a redaction job
    const jobData = {
      documentId,
      userId,
      templateId,
      status: 'queued',
      fileName: document.fileName,
      fileType: document.fileType
    };
    
    const jobId = await createRedactionJob(jobData);
    
    // Return the job ID and status
    return NextResponse.json({
      success: true,
      message: 'Redaction job created successfully',
      jobId,
      status: 'queued'
    });
  } catch (error) {
    console.error('Error creating redaction job:', error);
    return NextResponse.json(
      { error: 'Internal Server Error - ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * API route to get redaction status
 */
export async function GET(request, { params }) {
  try {
    // Get the document ID from the route params
    const { id: documentId } = params;
    
    // Get authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    
    const userId = decodedToken.uid;
    
    // Get the document to verify ownership
    const document = await getDocumentById(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Not Found - Document not found' },
        { status: 404 }
      );
    }
    
    // Verify document belongs to user
    if (document.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this document' },
        { status: 403 }
      );
    }
    
    // Return the document status
    return NextResponse.json({
      documentId,
      status: document.status,
      redactionStats: document.redactionStats || null,
      downloadURL: document.redactedUrl || null
    });
  } catch (error) {
    console.error('Error getting document status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error - ' + error.message },
      { status: 500 }
    );
  }
} 