import { NextRequest, NextResponse } from 'next/server';
import { summarizeContent } from '@/app/lib/gemini';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Setup the worker
const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.entry');
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Process a PDF file and extract its text content
 * This is a server-side implementation that handles PDF processing
 */
export async function POST(req: NextRequest) {
    console.log('PDF extraction API called');
    try {
        // Get the form data with the uploaded file
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const customPrompt = formData.get('customPrompt') as string | null;

        // Validate file
        if (!file) {
            console.error('No file provided');
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            console.error('File type is not PDF:', file.type);
            return NextResponse.json(
                { error: 'Only PDF files are accepted' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            console.error('File size too large:', file.size);
            return NextResponse.json(
                { error: 'File size exceeds 10MB limit' },
                { status: 400 }
            );
        }

        console.log('Extracting text from PDF:', file.name, 'size:', file.size);

        try {
            // Convert the file to array buffer
            const arrayBuffer = await file.arrayBuffer();
            console.log('File converted to array buffer');

            // Simple fallback if we can't extract text
            let fallbackText = '';

            try {
                // Extract text using PDF.js with simplified approach
                const extractedText = await extractTextFromPdfSimple(arrayBuffer);

                // Check if we got meaningful text
                if (extractedText && extractedText.trim().length > 100) {
                    console.log(`Extracted ${extractedText.length} characters from PDF`);

                    try {
                        console.log('Generating summary from extracted text');
                        const summary = await summarizeContent(extractedText, undefined, customPrompt || undefined);

                        if (!summary || summary.includes('API is currently unavailable')) {
                            console.error('Failed to generate summary with API');
                            return NextResponse.json(
                                { error: 'Failed to generate summary. API might be unavailable.' },
                                { status: 500 }
                            );
                        }

                        console.log('Summary generated successfully:', summary.substring(0, 100) + '...');
                        return NextResponse.json({
                            success: true,
                            text: extractedText.substring(0, 1000) + '...', // Send a preview of the text
                            summary: summary
                        });
                    } catch (summaryError) {
                        console.error('Error generating summary:', summaryError);
                        return NextResponse.json(
                            { error: 'Failed to generate summary from extracted text' },
                            { status: 500 }
                        );
                    }
                } else {
                    // If we couldn't extract enough text with the first method, try the fallback
                    if (fallbackText && fallbackText.trim().length > 100) {
                        console.log('Using fallback text extraction method');

                        try {
                            console.log('Generating summary from fallback text');
                            const summary = await summarizeContent(fallbackText, undefined, customPrompt || undefined);

                            if (!summary || summary.includes('API is currently unavailable')) {
                                console.error('Failed to generate summary with API');
                                return NextResponse.json(
                                    { error: 'Failed to generate summary. API might be unavailable.' },
                                    { status: 500 }
                                );
                            }

                            console.log('Summary generated successfully from fallback text:', summary.substring(0, 100) + '...');
                            return NextResponse.json({
                                success: true,
                                text: fallbackText.substring(0, 1000) + '...', // Send a preview of the text
                                summary: summary
                            });
                        } catch (summaryError) {
                            console.error('Error generating summary from fallback text:', summaryError);
                            return NextResponse.json(
                                { error: 'Failed to generate summary from extracted text' },
                                { status: 500 }
                            );
                        }
                    } else {
                        console.error('PDF text extraction failed: Not enough content extracted');
                        return NextResponse.json(
                            { error: 'Failed to extract meaningful text from PDF. The file might be scanned or contain primarily images.' },
                            { status: 400 }
                        );
                    }
                }
            } catch (extractionError) {
                console.error('Error extracting text from PDF:', extractionError);

                // Try fallback if available
                if (fallbackText && fallbackText.trim().length > 100) {
                    console.log('Using fallback text after extraction error');

                    try {
                        const summary = await summarizeContent(fallbackText, undefined, customPrompt || undefined);
                        return NextResponse.json({
                            success: true,
                            text: fallbackText.substring(0, 1000) + '...', // Send a preview
                            summary: summary
                        });
                    } catch (summaryError) {
                        console.error('Error generating summary from fallback:', summaryError);
                    }
                }

                return NextResponse.json(
                    { error: 'Failed to extract text from the PDF file' },
                    { status: 500 }
                );
            }
        } catch (error) {
            console.error('PDF processing error:', error);
            return NextResponse.json(
                { error: 'Error processing the PDF file' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('PDF extraction general error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process PDF' },
            { status: 500 }
        );
    }
}

/**
 * Extract text from a PDF file using pdf.js with simplified settings
 * This uses a more compatible approach for server-side extraction
 */
async function extractTextFromPdfSimple(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
        // Load PDF document with minimal settings
        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            disableFontFace: true,  // Disable font rendering
            disableRange: true,     // Disable range requests
            disableStream: true,    // Disable streaming
            isEvalSupported: false  // Disable eval
        });

        const pdf = await loadingTask.promise;
        console.log(`PDF loaded successfully with ${pdf.numPages} pages`);

        let extractedText = '';

        // Get total number of pages
        const numPages = pdf.numPages;

        // Extract text from each page
        for (let i = 1; i <= numPages; i++) {
            try {
                console.log(`Processing page ${i} of ${numPages}`);

                // Get page
                const page = await pdf.getPage(i);

                // Get text content with minimal settings
                const content = await page.getTextContent();

                // Join all the text items with proper spacing
                const items = content.items;
                let lastY = -1;
                let text = '';

                // Process text items
                for (const item of items) {
                    if ('str' in item && item.str) {
                        // Add a newline if Y position changes significantly
                        if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                            text += '\n';
                        } else if (text.length > 0 && !text.endsWith(' ') && !text.endsWith('\n')) {
                            // Add space between words on same line
                            text += ' ';
                        }

                        text += item.str.trim();
                        lastY = item.transform[5];
                    }
                }

                extractedText += text + '\n\n';
            } catch (pageError) {
                console.error(`Error processing page ${i}:`, pageError);
                // Continue with other pages even if one fails
            }
        }

        return extractedText;
    } catch (error) {
        console.error('Error in simple PDF text extraction:', error);
        throw error;
    }
} 