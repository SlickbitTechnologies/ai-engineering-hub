import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getDocumentById, updateDocument } from '@/lib/firebase';
import { processDocumentWithAI } from '@/lib/redactionService';

export async function POST(request) {
  try {
    const { auth } = getAuth(request);
    
    // Check authentication
    if (!auth?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { documentId, templateId } = body;
    
    // Validate required fields
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch document
    const document = await getDocumentById(documentId);
    
    // Check if document exists and belongs to user
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    if (document.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to redact this document' },
        { status: 403 }
      );
    }
    
    // Process document
    const result = await processDocumentWithAI(document, templateId);
    
    // Update document with redaction results
    await updateDocument(documentId, {
      status: 'redacted',
      redactedUrl: result.redactedUrl,
      redactedTimestamp: new Date().toISOString(),
      redactionResults: result.results,
      redactedCount: result.redactedCount,
      confidence: result.confidence
    });
    
    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        redactedUrl: result.redactedUrl,
        redactedCount: result.redactedCount,
        confidence: result.confidence,
        results: result.results
      }
    });
    
  } catch (error) {
    console.error('Error in redaction API:', error);
    
    return NextResponse.json(
      { error: 'Failed to process document', details: error.message },
      { status: 500 }
    );
  }
} 