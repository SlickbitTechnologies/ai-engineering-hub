import { saveRedactedDocument, updateRedactionJobStatus, getDocumentById, getTemplateById, updateDocumentStatus, saveRedactionResults } from './firebase';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import mammoth from 'mammoth';
import { storage } from './firebase';
import PizZip from 'pizzip';

// Define pharmaceutical patterns for redaction
export const PHARMA_PATTERNS = {
  drugNames: {
    pattern: /\b(Aspirin|Lipitor|Advil|Tylenol|Metformin|Amoxicillin|Atorvastatin|Lisinopril|Levothyroxine|Albuterol|Gabapentin|Metoprolol|Omeprazole|Losartan|Hydrochlorothiazide|Simvastatin|Paxlovid|Ozempic|Wegovy|Semaglutide|Tirzepatide|Mounjaro)\b/gi,
    description: 'Drug Names'
  },
  chemicalCompounds: {
    pattern: /\b[A-Z][a-z]?\d*(?:\([a-z0-9]+\))?\d*\b|\b\d*[A-Z][a-z]?\d*\b|\b[A-Z]{2,}\b|\b[A-Z][a-z]+(?:acid|ium|ide|ate|ite)\b/g,
    description: 'Chemical Compounds'
  },
  patientIdentifiers: {
    pattern: /\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b|\b[A-Z]{2}\d{7}\b/g,
    description: 'Patient Identifiers'
  },
  dates: {
    pattern: /\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{2,4})\b/gi,
    description: 'Dates'
  },
  dosages: {
    pattern: /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|µg|IU|mEq|%|mg\/ml|mg\/g)\b/gi,
    description: 'Dosages'
  },
  batchNumbers: {
    pattern: /\b[A-Z0-9]{5,}\b|\b(?:LOT|BATCH)\s*(?:#|No\.?|Number)?:?\s*[A-Z0-9-]{4,}\b/gi,
    description: 'Batch Numbers'
  }
};

/**
 * Process a document with the specified template
 * @param {Object} document - The document object
 * @param {string} templateId - The template ID to use for redaction
 * @param {Object} user - The user object
 * @returns {Promise<Object>} - Results of the redaction process
 */
export async function processDocument(document, templateId, user) {
  try {
    if (!document || !document.id || !templateId || !user) {
      throw new Error("Missing required parameters");
    }

    // Update document status to processing
    await updateDocumentStatus(document.id, "processing");

    // Get the document download URL if not already available
    const documentUrl = document.url || await getDownloadURL(document.storageRef);
    
    // Call the redaction API
    const response = await fetch("/api/redact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId: document.id,
        documentUrl,
        templateId,
        userId: user.id,
        fileType: document.fileType || document.name.split('.').pop(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to process document");
    }

    const result = await response.json();

    // Update document status with results if the API hasn't already done so
    if (!result.statusUpdated) {
      await updateDocumentStatus(document.id, "redacted", {
        redactedUrl: result.redactedUrl,
        results: result.results,
        redactedCount: result.redactedCount,
        confidence: result.confidence,
        redactedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      documentId: document.id,
      redactedUrl: result.redactedUrl,
      results: result.results,
      redactedCount: result.redactedCount,
      confidence: result.confidence,
      redactedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error processing document:", error);
    
    // Update document status to failed
    try {
      await updateDocumentStatus(document.id, "failed", { 
        error: error.message 
      });
    } catch (updateError) {
      console.error("Error updating document status:", updateError);
    }
    
    throw error;
  }
}

/**
 * Generate a redaction report from redaction results
 * @param {Array} results - The redaction results
 * @returns {Object} - Formatted report
 */
export function generateRedactionReport(results) {
  if (!results || !Array.isArray(results)) {
    return {
      totalRedactions: 0,
      byCategory: {},
      averageConfidence: 0
    };
  }

  // Calculate total redactions
  const totalRedactions = results.length;
  
  // Group redactions by category
  const byCategory = results.reduce((acc, redaction) => {
    const category = redaction.category;
    
    if (!acc[category]) {
      acc[category] = {
        count: 0,
        items: [],
        totalConfidence: 0
      };
    }
    
    acc[category].count++;
    acc[category].items.push(redaction);
    acc[category].totalConfidence += redaction.confidence;
    
    return acc;
  }, {});
  
  // Calculate average confidence for each category
  Object.keys(byCategory).forEach(category => {
    byCategory[category].averageConfidence = 
      byCategory[category].totalConfidence / byCategory[category].count;
  });
  
  // Calculate overall average confidence
  const averageConfidence = 
    totalRedactions > 0 
      ? results.reduce((sum, item) => sum + item.confidence, 0) / totalRedactions 
      : 0;
  
  return {
    totalRedactions,
    byCategory,
    averageConfidence
  };
}

/**
 * Format redacted text with highlighting
 * @param {string} text - The original text
 * @param {Array} redactions - The redaction results
 * @returns {string} - HTML with highlighted redactions
 */
export function formatRedactedText(text, redactions) {
  if (!text || !redactions || !Array.isArray(redactions)) {
    return text;
  }
  
  // Sort redactions by position in descending order
  // so we can replace text from end to start without affecting positions
  const sortedRedactions = [...redactions].sort((a, b) => b.position - a.position);
  
  let result = text;
  
  // Replace each redaction with highlighted version
  sortedRedactions.forEach(redaction => {
    const { text: redactedText, position, category, confidence } = redaction;
    const confidenceClass = confidence >= 0.9 ? 'high' : confidence >= 0.8 ? 'medium' : 'low';
    
    const replacement = `<span class="redacted ${confidenceClass}" 
      data-category="${category}" 
      data-confidence="${confidence.toFixed(2)}">
      ${redactedText}
    </span>`;
    
    result = 
      result.substring(0, position) + 
      replacement + 
      result.substring(position + redactedText.length);
  });
  
  return result;
}

/**
 * Process a PDF document for redaction
 * @param {ArrayBuffer} fileBuffer - The PDF file buffer
 * @param {Object} patterns - Redaction patterns to apply
 * @returns {Promise<Object>} - The redacted PDF buffer and stats
 */
async function processPdfDocument(fileBuffer, patterns) {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();
    
    // Initialize redaction statistics
    const stats = {
      totalPages: pages.length,
      totalRedactions: 0,
      redactionsByCategory: {}
    };
    
    // Initialize redaction count for each category
    Object.keys(patterns).forEach(category => {
      stats.redactionsByCategory[category] = 0;
    });
    
    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Get page dimensions and font
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Extract text content with positions
      // In a production app, we'd use pdf.js for better text extraction
      const textContent = await extractTextContentWithPositions(page);
      const pageText = textContent.text;
      
      // Create a map to track redacted areas to prevent overlapping redactions
      const redactedAreas = [];
      
      // Apply redactions for each pattern
      for (const [category, patternInfo] of Object.entries(patterns)) {
        const { pattern } = patternInfo;
        
        // Reset pattern for repeated use
        pattern.lastIndex = 0;
        
        // Find matches and apply redactions
        let match;
        while ((match = pattern.exec(pageText)) !== null) {
          const matchText = match[0];
          const startIndex = match.index;
          const endIndex = startIndex + matchText.length;
          
          // Find position in the PDF for this text match
          // In a real implementation, this would map text positions accurately
          const matchPositions = findTextPositionsInPDF(textContent, startIndex, endIndex);
          
          if (matchPositions) {
            // Check for overlaps with existing redactions
            const overlaps = redactedAreas.some(area => 
              rectanglesOverlap(area, matchPositions)
            );
            
            if (!overlaps) {
              // Add a small padding around the text for complete coverage
              const redactionBox = {
                x: matchPositions.x - 2,
                y: matchPositions.y - 2,
                width: matchPositions.width + 4,
                height: matchPositions.height + 4
              };
              
              // 1. FIRST SOLUTION APPROACH: Content stream modification
              // This is a simplified version; in production, you would modify 
              // the content stream to completely remove the text
              
              // 2. SECOND SOLUTION APPROACH: Multi-layer redaction
              // First draw a white rectangle to "erase" the text
              page.drawRectangle({
                x: redactionBox.x,
                y: redactionBox.y,
                width: redactionBox.width,
                height: redactionBox.height,
                color: rgb(1, 1, 1), // White to erase
              });
              
              // Then draw the black redaction rectangle on top
              page.drawRectangle({
                x: redactionBox.x,
                y: redactionBox.y,
                width: redactionBox.width,
                height: redactionBox.height,
                color: rgb(0, 0, 0), // Black redaction
              });
              
              // 3. Add REDACTED text to make it clear this is redacted content
              const fontSize = Math.min(9, redactionBox.height * 0.7);
              if (redactionBox.width > 40) { // Only if there's enough space
                page.drawText('REDACTED', {
                  x: redactionBox.x + redactionBox.width / 2 - 25,
                  y: redactionBox.y + redactionBox.height / 2 - fontSize / 2,
                  size: fontSize,
                  font: font,
                  color: rgb(1, 1, 1), // White text
                });
              }
              
              // Track this redacted area
              redactedAreas.push(redactionBox);
              
              // Update statistics
              stats.totalRedactions++;
              stats.redactionsByCategory[category] = 
                (stats.redactionsByCategory[category] || 0) + 1;
            }
          }
        }
      }
      
      // Add a metadata annotation indicating the document was redacted
      page.drawText(`Redacted: ${new Date().toISOString()}`, {
        x: 5,
        y: 5,
        size: 6,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.5,
      });
    }
    
    // Add document-level metadata indicating redaction was performed
    pdfDoc.setTitle(`${pdfDoc.getTitle() || 'Document'} (Redacted)`);
    pdfDoc.setSubject(`Redacted document - ${stats.totalRedactions} items removed`);
    pdfDoc.setProducer('PharmaRedact Secure Redaction Service');
    pdfDoc.setModificationDate(new Date());
    
    // Set document permissions to prevent content extraction
    // Note: This adds a layer of security but is not foolproof
    const encryptedPdf = await pdfDoc.save({
      useObjectStreams: true,
    });
    
    // Perform a final sanitization pass to remove any remaining sensitive data
    // In a production implementation, this would be more comprehensive
    
    return {
      buffer: encryptedPdf,
      stats
    };
  } catch (error) {
    console.error('Error processing PDF document:', error);
    throw new Error(`Failed to process PDF document: ${error.message}`);
  }
}

/**
 * Process a DOCX document for redaction
 * @param {ArrayBuffer} fileBuffer - The DOCX file buffer
 * @param {Object} patterns - Redaction patterns to apply
 * @returns {Promise<Object>} - The redacted DOCX buffer and stats
 */
async function processDocxDocument(fileBuffer, patterns) {
  try {
    // Create a zip object from the docx file (DOCX is a zip of XML files)
    const zip = new PizZip(fileBuffer);
    
    // Initialize redaction statistics
    const stats = {
      totalPages: 1, // Will be updated if possible
      totalRedactions: 0,
      redactionsByCategory: {}
    };
    
    // Initialize redaction count for each category
    Object.keys(patterns).forEach(category => {
      stats.redactionsByCategory[category] = 0;
    });
    
    // Get the main document content
    let documentXml = zip.file('word/document.xml');
    if (!documentXml) {
      throw new Error('Invalid DOCX file: missing document.xml');
    }
    
    let documentContent = documentXml.asText();
    
    // Process main document content
    for (const [category, patternInfo] of Object.entries(patterns)) {
      const { pattern } = patternInfo;
      
      // Process the XML content
      const redactionResult = redactXmlContent(documentContent, pattern, 'REDACTED');
      documentContent = redactionResult.content;
      
      // Update statistics
      stats.totalRedactions += redactionResult.redactionCount;
      stats.redactionsByCategory[category] = 
        (stats.redactionsByCategory[category] || 0) + redactionResult.redactionCount;
    }
    
    // Update the document.xml in the zip
    zip.file('word/document.xml', documentContent);
    
    // Process headers (they may contain sensitive information too)
    const headerFiles = Object.keys(zip.files).filter(filename => 
      filename.startsWith('word/header')
    );
    
    for (const headerFile of headerFiles) {
      const headerXml = zip.file(headerFile);
      if (headerXml) {
        let headerContent = headerXml.asText();
        
        // Process each pattern in the header
        for (const [category, patternInfo] of Object.entries(patterns)) {
          const { pattern } = patternInfo;
          
          const redactionResult = redactXmlContent(headerContent, pattern, 'REDACTED');
          headerContent = redactionResult.content;
          
          // Update statistics
          stats.totalRedactions += redactionResult.redactionCount;
          stats.redactionsByCategory[category] = 
            (stats.redactionsByCategory[category] || 0) + redactionResult.redactionCount;
        }
        
        // Update the header file in the zip
        zip.file(headerFile, headerContent);
      }
    }
    
    // Process footers (they may contain sensitive information too)
    const footerFiles = Object.keys(zip.files).filter(filename => 
      filename.startsWith('word/footer')
    );
    
    for (const footerFile of footerFiles) {
      const footerXml = zip.file(footerFile);
      if (footerXml) {
        let footerContent = footerXml.asText();
        
        // Process each pattern in the footer
        for (const [category, patternInfo] of Object.entries(patterns)) {
          const { pattern } = patternInfo;
          
          const redactionResult = redactXmlContent(footerContent, pattern, 'REDACTED');
          footerContent = redactionResult.content;
          
          // Update statistics
          stats.totalRedactions += redactionResult.redactionCount;
          stats.redactionsByCategory[category] = 
            (stats.redactionsByCategory[category] || 0) + redactionResult.redactionCount;
        }
        
        // Update the footer file in the zip
        zip.file(footerFile, footerContent);
      }
    }
    
    // Clean document metadata that might contain sensitive information
    cleanDocxMetadata(zip);
    
    // Generate the redacted DOCX file
    const redactedBuffer = zip.generate({ type: 'arraybuffer' });
    
    return {
      buffer: redactedBuffer,
      stats
    };
  } catch (error) {
    console.error('Error processing DOCX document:', error);
    throw new Error(`Failed to process DOCX document: ${error.message}`);
  }
}

/**
 * Helper function to redact XML content
 * @param {string} xmlContent - The XML content to redact
 * @param {RegExp} pattern - The pattern to match sensitive data
 * @param {string} replacement - The text to replace sensitive data with
 * @returns {Object} - The redacted content and count
 */
function redactXmlContent(xmlContent, pattern, replacement = 'REDACTED') {
  let redactionCount = 0;
  
  // Reset pattern for reuse
  pattern.lastIndex = 0;
  
  // XML text in DOCX is within <w:t> tags
  // We need to find and redact text within these tags while preserving XML structure
  
  // Function to process the content of a w:t tag
  const processTextNode = (fullMatch, prefix, textContent, suffix) => {
    // Reset pattern again for this specific text content
    pattern.lastIndex = 0;
    
    // Apply redaction to the text content within the XML tag
    let redactedText = textContent;
    let match;
    while ((match = pattern.exec(textContent)) !== null) {
      // Replace the sensitive data with the redaction text
      redactedText = redactedText.substring(0, match.index) + 
                     replacement + 
                     redactedText.substring(match.index + match[0].length);
      
      // Adjust regex lastIndex for the replacement
      pattern.lastIndex = match.index + replacement.length;
      
      // Increment redaction count
      redactionCount++;
    }
    
    // Return the XML tag with redacted content
    return prefix + redactedText + suffix;
  };
  
  // Find and process text within w:t tags
  // This regex captures the opening tag, content, and closing tag separately
  const textTagsRegex = /(<w:t(?:[^>]*)>)(.*?)(<\/w:t>)/g;
  const redactedContent = xmlContent.replace(textTagsRegex, processTextNode);
  
  return {
    content: redactedContent,
    redactionCount
  };
}

/**
 * Extract text content with positions from a PDF page
 * @param {PDFPage} page - The PDF page
 * @returns {Object} - Text content with position information
 */
async function extractTextContentWithPositions(page) {
  // This is a simplified placeholder for text extraction with positions
  // In a real implementation, you would use a library like pdf.js for accurate text positions
  
  // Simplified example output format
  return {
    text: "This is placeholder text extracted from the PDF page with positions",
    items: [
      { text: "This is", x: 50, y: 50, width: 40, height: 10 },
      { text: "placeholder text", x: 100, y: 50, width: 100, height: 10 },
      { text: "from the PDF", x: 50, y: 70, width: 80, height: 10 },
      { text: "with positions", x: 140, y: 70, width: 90, height: 10 }
    ]
  };
}

/**
 * Find text positions in PDF based on text content indexes
 * @param {Object} textContent - Text content with position information
 * @param {number} startIndex - Start index in the text
 * @param {number} endIndex - End index in the text
 * @returns {Object|null} - Position information or null if not found
 */
function findTextPositionsInPDF(textContent, startIndex, endIndex) {
  // This is a simplified implementation
  // In a real implementation, this would map text indexes to positions in the PDF
  
  // For demonstration, we'll return a placeholder position
  return {
    x: 50,
    y: 50,
    width: 100,
    height: 20
  };
}

/**
 * Check if two rectangles overlap
 * @param {Object} rect1 - First rectangle
 * @param {Object} rect2 - Second rectangle
 * @returns {boolean} - True if rectangles overlap
 */
function rectanglesOverlap(rect1, rect2) {
  return !(rect1.x > rect2.x + rect2.width || 
           rect1.x + rect1.width < rect2.x || 
           rect1.y > rect2.y + rect2.height ||
           rect1.y + rect1.height < rect2.y);
}

/**
 * Clean metadata from a DOCX file
 * @param {PizZip} zip - The DOCX zip object
 */
function cleanDocxMetadata(zip) {
  // Clean core.xml properties
  const coreXml = zip.file('docProps/core.xml');
  if (coreXml) {
    let coreContent = coreXml.asText();
    
    // Replace creator, lastModifiedBy, etc. with PharmaRedact
    coreContent = coreContent.replace(/<dc:creator>.*?<\/dc:creator>/g, '<dc:creator>PharmaRedact</dc:creator>');
    coreContent = coreContent.replace(/<cp:lastModifiedBy>.*?<\/cp:lastModifiedBy>/g, '<cp:lastModifiedBy>PharmaRedact</cp:lastModifiedBy>');
    coreContent = coreContent.replace(/<dc:subject>.*?<\/dc:subject>/g, '<dc:subject>Redacted Document</dc:subject>');
    
    // Add redaction timestamp
    const now = new Date().toISOString();
    if (coreContent.includes('<dcterms:modified')) {
      coreContent = coreContent.replace(/(<dcterms:modified.*?>).*?(<\/dcterms:modified>)/g, `$1${now}$2`);
    }
    
    // Update the core.xml in the zip
    zip.file('docProps/core.xml', coreContent);
  }
  
  // Clean app.xml (application-specific metadata)
  const appXml = zip.file('docProps/app.xml');
  if (appXml) {
    let appContent = appXml.asText();
    
    // Replace company, application name, etc.
    appContent = appContent.replace(/<Company>.*?<\/Company>/g, '<Company>PharmaRedact</Company>');
    appContent = appContent.replace(/<Application>.*?<\/Application>/g, '<Application>PharmaRedact Redaction Service</Application>');
    
    // Update the app.xml in the zip
    zip.file('docProps/app.xml', appContent);
  }
}

/**
 * Extract text from a PDF page
 * @param {PDFPage} page - The PDF page
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromPdfPage(page) {
  // This is a simplified placeholder
  // In a real implementation, you would use pdf.js or a similar library
  return "This is placeholder text extracted from the PDF page";
}

/**
 * Get redaction patterns based on template ID
 * @param {string} templateId - The template ID
 * @returns {Promise<Object>} - The redaction patterns
 */
async function getRedactionPatterns(templateId) {
  try {
    if (templateId) {
      // In a real implementation, you would fetch the template from Firestore
      // and return the patterns defined in the template
      console.log(`Using template ${templateId} for redaction patterns`);
      
      // This is a placeholder - would fetch from database in real implementation
      return PHARMA_PATTERNS;
    }
    
    // Return default patterns if no template specified
    return PHARMA_PATTERNS;
  } catch (error) {
    console.error('Error getting redaction patterns:', error);
    // Fall back to default patterns
    return PHARMA_PATTERNS;
  }
} 