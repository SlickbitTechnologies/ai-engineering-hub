import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getDocumentById, getRedactedDocumentUrl } from '@/lib/firebase';

/**
 * GET handler for downloading redacted documents
 * @param {Request} request - The incoming request
 * @param {Object} params - Route parameters
 * @returns {Promise<NextResponse>} - Response with download URL or error
 */
export async function GET(request, { params }) {
  try {
    // Get authentication info
    const auth = getAuth();
    if (!auth?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documentId = params.id;
    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Verify document ownership
    const document = await getDocumentById(documentId);
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.userId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to document' },
        { status: 403 }
      );
    }

    // Check if document is redacted
    if (document.status !== 'redacted') {
      return NextResponse.json(
        { success: false, error: 'Document has not been redacted yet' },
        { status: 400 }
      );
    }

    // Get download URL
    const downloadUrl = await getRedactedDocumentUrl(documentId);
    
    return NextResponse.json({
      success: true,
      downloadUrl
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate download URL' 
      },
      { status: 500 }
    );
  }
} 