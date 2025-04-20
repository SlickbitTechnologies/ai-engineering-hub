import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { getRedactionJobById } from '@/lib/firebase';

/**
 * API route to get redaction job status
 */
export async function GET(request, { params }) {
  try {
    // Get the job ID from the route params
    const { id: jobId } = params;
    
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
    
    // Get the job to verify ownership
    const job = await getRedactionJobById(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Not Found - Job not found' },
        { status: 404 }
      );
    }
    
    // Verify job belongs to user
    if (job.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this job' },
        { status: 403 }
      );
    }
    
    // Return the job details
    return NextResponse.json({
      jobId,
      status: job.status,
      documentId: job.documentId,
      progress: job.progress || 0,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt || job.createdAt,
      error: job.error || null
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error - ' + error.message },
      { status: 500 }
    );
  }
} 