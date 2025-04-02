import { getStorage } from 'firebase-admin/storage';

export async function getStorageFileContent(fileUrl) {
  try {
    const storage = getStorage();
    const bucket = storage.bucket();
    
    // Extract file path from URL
    const filePath = fileUrl.split('/o/')[1].split('?')[0];
    console.log('Fetching file from path:', filePath);
    
    // Get file reference
    const file = bucket.file(decodeURIComponent(filePath));
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('File not found in storage');
    }
    
    // Download file content
    const [content] = await file.download();
    return content.toString('utf-8');
  } catch (error) {
    console.error('Error fetching file from storage:', error);
    throw error;
  }
} 