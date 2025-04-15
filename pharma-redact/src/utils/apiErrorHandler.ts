/**
 * Utility for handling API errors with user-friendly messages
 */

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
    isTimeout?: boolean;
    isAborted?: boolean;
}

/**
 * Wraps an async function and returns [result, error] tuple
 * Similar to Go's error handling pattern
 */
export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<[T | null, ApiError | null]> {
    try {
        const result = await fn();
        return [result, null];
    } catch (error: any) {
        console.error('API Error:', error);

        if (error.name === 'AbortError' || error.name === 'DOMException' && error.message === 'PDF processing aborted') {
            return [null, {
                message: 'Operation was cancelled',
                isAborted: true
            }];
        }

        if (error.name === 'TimeoutError') {
            return [null, {
                message: 'Operation timed out. Try again or use Large Document mode for larger files.',
                isTimeout: true
            }];
        }

        return [null, {
            message: error.message || 'An unexpected error occurred',
            code: error.code,
            status: error.status
        }];
    }
}

/**
 * Creates an AbortController with a timeout
 * @param timeoutMs Timeout in milliseconds
 * @returns [AbortController, clearTimeout function]
 */
export function createTimeoutController(timeoutMs: number = 60000): [AbortController, () => void] {
    const controller = new AbortController();

    // Create timeout that will abort the controller
    const timeoutId = setTimeout(() => {
        const timeoutError = new Error('Operation timed out');
        timeoutError.name = 'TimeoutError';
        controller.abort(timeoutError);
    }, timeoutMs);

    // Return controller and cleanup function
    return [
        controller,
        () => clearTimeout(timeoutId)
    ];
}

/**
 * Formats file size in a human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Determines if a document is considered large based on file size
 */
export function isLargeDocument(fileSize: number): boolean {
    const LARGE_THRESHOLD = 5 * 1024 * 1024; // 5MB
    return fileSize > LARGE_THRESHOLD;
} 