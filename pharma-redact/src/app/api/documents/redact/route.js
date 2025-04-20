/**
 * API Route for Document Redaction
 * 
 * Handles document upload and redaction processing
 */

import { NextResponse } from 'next/server';
import { parse } from 'next/dist/compiled/content-type';
import { v4 as uuidv4 } from 'uuid';
import redactionService from '../../../../lib/redactionService';
import { getAuth } from 'firebase-admin/auth';
import { saveRedactedDocument, createRedactionJob, updateRedactionJob } from '../../../../lib/firebase';

// 30MB max file size (adjust according to your requirements)
const MAX_FILE_SIZE = 30 * 1024 * 1024;

/**
 * Buffer parser for multipart form data
 * @param {Request} request - The incoming request
 * @returns {Promise<Object>} - Parsed form data
 */
async function parseFormData(request) {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw new Error('Content type must be multipart/form-data');
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const templateId = formData.get('templateId');
  const documentId = formData.get('documentId');

  if (!file) {
    throw new Error('No file provided');
  }

  if (!templateId) {
    throw new Error('No template ID provided');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  return { file, templateId, documentId };
}

/**
 * Validate authentication token
 * @param {Request} request - The incoming request
 * @returns {Promise<Object>} - User data
 */
async function validateAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authentication token');
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Authentication failed');
  }
}

/**
 * Process redaction for the uploaded document
 * @param {Object} params - Processing parameters
 * @returns {Promise<Object>} - Processing result
 */
async function processRedaction({ file, templateId, documentId, userId }) {
  try {
    // Create a unique job ID
    const jobId = uuidv4();
    
    // Create a job record in the database
    await createRedactionJob({
      id: jobId,
      userId,
      documentId,
      templateId,
      status: 'processing',
      createdAt: new Date(),
    });
    
    // Get the file buffer
    const fileBuffer = await file.arrayBuffer();
    const fileType = file.type;
    
    // Start redaction process
    const result = await redactionService.redactDocument(
      fileBuffer,
      fileType,
      templateId
    );
    
    // Save the redacted document to storage
    const redactedDocUrl = await saveRedactedDocument({
      buffer: result.redactedFile,
      fileType,
      originalFilename: file.name,
      documentId,
      userId,
    });
    
    // Update the job with success status
    await updateRedactionJob(jobId, {
      status: 'completed',
      completedAt: new Date(),
      result: {
        redactedFileUrl: redactedDocUrl,
        stats: result.stats,
      },
    });
    
    return {
      jobId,
      status: 'completed',
      redactedFileUrl: redactedDocUrl,
      stats: result.stats,
    };
  } catch (error) {
    console.error('Redaction processing error:', error);
    
    // Update job with error status if we have a jobId
    if (jobId) {
      await updateRedactionJob(jobId, {
        status: 'failed',
        completedAt: new Date(),
        error: error.message,
      });
    }
    
    throw error;
  }
}

/**
 * POST handler for document redaction
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} - API response
 */
export async function POST(request) {
  try {
    // Parse the form data from the request
    const { file, templateId, documentId } = await parseFormData(request);
    
    // Validate authentication
    const user = await validateAuth(request);
    
    // For large files, we process asynchronously
    if (file.size > 5 * 1024 * 1024) { // 5MB threshold
      // Create a job ID
      const jobId = uuidv4();
      
      // Create initial job record
      await createRedactionJob({
        id: jobId,
        userId: user.uid,
        documentId,
        templateId,
        status: 'queued',
        createdAt: new Date(),
      });
      
      // Start async processing
      processRedaction({
        file,
        templateId,
        documentId,
        userId: user.uid,
        jobId,
      }).catch(error => {
        console.error('Async redaction error:', error);
      });
      
      // Return the job ID immediately
      return NextResponse.json({ jobId, status: 'queued' }, { status: 202 });
    } else {
      // For smaller files, process synchronously
      const result = await processRedaction({
        file,
        templateId,
        documentId,
        userId: user.uid,
      });
      
      return NextResponse.json(result, { status: 200 });
    }
  } catch (error) {
    console.error('Redaction API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during redaction' },
      { status: error.status || 500 }
    );
  }
}

/**
 * GET handler for job status
 * @param {Request} request - The incoming request
 * @param {Object} params - URL parameters
 * @returns {Promise<Response>} - API response
 */
export async function GET(request, { params }) {
  try {
    const { jobId } = params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }
    
    // Validate authentication
    const user = await validateAuth(request);
    
    // Get job status from database
    const job = await getRedactionJob(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Check if job belongs to the user
    if (job.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized access to job' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      jobId,
      status: job.status,
      progress: job.progress || 0,
      result: job.result,
      error: job.error,
    });
  } catch (error) {
    console.error('Job status API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching job status' },
      { status: error.status || 500 }
    );
  }
} 