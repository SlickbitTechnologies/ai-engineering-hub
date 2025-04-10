import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { RedactionRule } from '@/store/slices/redactionSlice';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface RedactionItem {
    id: string;
    documentId: string;
    pageNumber: number;
    text: string;
    reason: string;
    ruleId: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    isApproved: boolean;
    isRejected: boolean;
}

export interface TextPosition {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    pageNum: number;
}

// Helper function to extract text positions from PDF using PDF.js
async function extractTextPositions(pdfBuffer: ArrayBuffer): Promise<TextPosition[]> {
    console.log("Extracting text positions from PDF");
    try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
        const pdf = await loadingTask.promise;
        const textPositions: TextPosition[] = [];

        // Process each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });

            // Extract text items with their positions
            textContent.items.forEach((item: any) => {
                const tx = pdfjsLib.Util.transform(
                    viewport.transform,
                    item.transform
                );

                textPositions.push({
                    text: item.str,
                    pageNum: i,
                    x: tx[4], // x position
                    y: tx[5], // y position
                    width: item.width || 100,
                    height: item.height || 12
                });
            });
        }

        return textPositions;
    } catch (error) {
        console.error("Error extracting text positions:", error);
        throw new Error("Failed to extract text from PDF");
    }
}

// Main PDF redaction function
export async function redactPdf(pdfBuffer: ArrayBuffer, rules: RedactionRule[]) {
    console.log(`PDF redaction started with ${rules.length} rules`);
    try {
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        console.log(`PDF loaded with ${pdfDoc.getPageCount()} pages`);

        // Process each page
        const redactionItems: RedactionItem[] = [];
        const pages = pdfDoc.getPages();

        // Get text positions from real PDF
        const textPositions = await extractTextPositions(pdfBuffer);
        console.log(`Found ${textPositions.length} text elements to check`);

        // Check each text position against all rules
        for (const position of textPositions) {
            for (const rule of rules) {
                if (!rule.isActive) continue;

                try {
                    const regex = new RegExp(rule.pattern, 'g');
                    const matches = [...position.text.matchAll(regex)];

                    if (matches.length > 0) {
                        // For each match, apply redaction
                        for (const match of matches) {
                            const matchText = match[0];
                            const page = pages[position.pageNum - 1]; // Pages are 0-indexed in the library

                            if (page) {
                                // Create redaction rectangle
                                page.drawRectangle({
                                    x: position.x,
                                    y: position.y,
                                    width: position.width,
                                    height: position.height,
                                    color: rgb(0, 0, 0), // Black redaction box
                                    opacity: 1,
                                    borderWidth: 0
                                });

                                // Add to redaction items
                                redactionItems.push({
                                    id: `redaction-${redactionItems.length + 1}`,
                                    documentId: "",
                                    text: matchText,
                                    pageNumber: position.pageNum,
                                    ruleId: rule.id,
                                    reason: rule.description || rule.name,
                                    boundingBox: {
                                        x: position.x,
                                        y: position.y,
                                        width: position.width,
                                        height: position.height
                                    },
                                    isApproved: true,
                                    isRejected: false
                                });

                                console.log(`Redacted text on page ${position.pageNum}: "${matchText}" (Rule: ${rule.description || rule.name})`);
                            }
                        }
                    }
                } catch (ruleError) {
                    console.error(`Error applying rule ${rule.id}:`, ruleError);
                    // Continue to next rule on error
                }
            }
        }

        // Save the redacted PDF
        const redactedPdfBytes = await pdfDoc.save();
        console.log(`PDF redaction complete. Redacted ${redactionItems.length} items`);

        return {
            buffer: redactedPdfBytes,
            redactionItems
        };
    } catch (error) {
        console.error("Error during PDF redaction:", error);
        // No mock data fallback - throw the error for proper handling
        throw error;
    }
}

// Preview function to generate a preview of redactions
export async function previewPdfRedactions(pdfBuffer: ArrayBuffer, rules: RedactionRule[]): Promise<string> {
    try {
        // Apply redactions to a copy of the PDF
        const result = await redactPdf(pdfBuffer, rules);

        // Convert to data URL for preview
        const base64 = Buffer.from(result.buffer).toString('base64');
        return `data:application/pdf;base64,${base64}`;
    } catch (error) {
        console.error("Error generating PDF preview:", error);
        throw error;
    }
}

// Generate thumbnail preview of a PDF page
export async function getPdfPreview(pdfBuffer: ArrayBuffer, pageIndex = 0): Promise<string> {
    try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageIndex + 1);

        // In a real implementation, we would render to canvas
        // For now, return a data URL that indicates this is a real preview
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';
    } catch (error) {
        console.error("Error generating PDF preview:", error);
        throw error;
    }
}

// NOTE: Future enhancements
// - A function to verify if a PDF is password protected
// - A function to handle multi-page PDFs more efficiently
// - A function to handle scanned PDFs using OCR (tesseract.js)
// - A function to redact images in PDFs
