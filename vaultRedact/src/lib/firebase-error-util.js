/**
 * Utility functions for handling Firebase errors
 */

/**
 * Handles Firestore operation errors and returns user-friendly error messages
 * @param {Error} error - The error object from Firestore
 * @param {string} operation - The operation being performed (create, read, update, delete)
 * @param {string} resource - The resource being operated on (document, template, etc.)
 * @returns {string} A user-friendly error message
 */
export const handleFirestoreError = (error, operation = 'operation', resource = 'resource') => {
  console.error(`Firestore ${operation} error:`, error);
  
  // Common Firestore error codes
  switch (error.code) {
    case 'permission-denied':
      return `You don't have permission to ${operation} this ${resource}.`;
    case 'not-found':
      return `The ${resource} could not be found.`;
    case 'already-exists':
      return `This ${resource} already exists.`;
    case 'resource-exhausted':
      return 'Service temporarily unavailable. Please try again later.';
    case 'failed-precondition':
      return 'Operation failed. The system may be in an invalid state.';
    case 'aborted':
      return 'The operation was aborted. Please try again.';
    case 'out-of-range':
      return 'Operation specified an invalid range.';
    case 'unimplemented':
      return 'This operation is not supported.';
    case 'internal':
      return 'An internal error occurred. Please try again later.';
    case 'unavailable':
      return 'The service is currently unavailable. Please check your connection and try again.';
    case 'data-loss':
      return 'Unrecoverable data loss or corruption.';
    case 'unauthenticated':
      return 'Authentication required. Please sign in and try again.';
    default:
      return `Failed to ${operation} ${resource}. Please try again.`;
  }
};

/**
 * Handles Firebase Storage errors
 * @param {Error} error - The error object from Firebase Storage
 * @param {string} operation - The operation being performed (upload, download, delete)
 * @returns {string} A user-friendly error message
 */
export const handleStorageError = (error, operation = 'upload') => {
  console.error(`Storage ${operation} error:`, error);
  
  switch (error.code) {
    case 'storage/unknown':
      return 'An unknown error occurred.';
    case 'storage/object-not-found':
      return 'The file does not exist.';
    case 'storage/bucket-not-found':
      return 'Storage bucket not configured correctly.';
    case 'storage/project-not-found':
      return 'Firebase project not found.';
    case 'storage/quota-exceeded':
      return 'Storage quota exceeded. Please contact support.';
    case 'storage/unauthenticated':
      return 'Authentication required. Please sign in and try again.';
    case 'storage/unauthorized':
      return 'You do not have permission to access this file.';
    case 'storage/retry-limit-exceeded':
      return 'Network error. Maximum retry attempts exceeded.';
    case 'storage/invalid-checksum':
      return 'File upload failed. Please try again.';
    case 'storage/canceled':
      return 'Operation canceled.';
    case 'storage/invalid-event-name':
    case 'storage/invalid-url':
    case 'storage/invalid-argument':
      return 'Invalid request. Please try again.';
    case 'storage/no-default-bucket':
      return 'Storage not properly configured.';
    case 'storage/cannot-slice-blob':
      return 'File upload failed. Please try again with a different file.';
    case 'storage/server-file-wrong-size':
      return 'File verification failed. Please try again.';
    default:
      return `Failed to ${operation} file. Please try again.`;
  }
};

/**
 * Format and log errors consistently
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 */
export const logError = (error, context = 'App') => {
  console.error(`[${context}] Error:`, error);
  
  // Here you could implement additional error logging
  // like sending to a monitoring service
};

/**
 * Creates a standardized error response object
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - A message describing the result
 * @param {any} data - Optional data to include in the response
 * @returns {Object} A standardized response object
 */
export const createResponse = (success, message, data = null) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}; 