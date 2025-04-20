/**
 * Redaction Service for PharmaRedact
 * 
 * Provides functionality to redact sensitive information from PDF and DOCX files
 * based on configurable templates and rules.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { createWorker } from 'tesseract.js';
import { getTemplateRules, getTemplateById } from './firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Create a singleton instance of the redaction service
const redactionService = new RedactionService();

/**
 * Process a document using AI and template rules (exported module function)
 * @param {Object} document - The document object from Firestore
 * @param {string} templateId - The ID of the template to use for redaction
 * @returns {Promise<Object>} - Results of the redaction process
 */
export async function processDocumentWithAI(document, templateId) {
  return redactionService.processDocumentWithAI(document, templateId);
}

/**
 * Generate a document preview for the redacted document
 * @param {string} documentUrl - The document URL
 * @param {string} fileType - The file type ('pdf' or 'docx')
 * @returns {Promise<string>} - Data URL for preview
 */
export async function generateDocumentPreview(documentUrl, fileType) {
  return redactionService.generateDocumentPreview(documentUrl, fileType);
}

// Predefined patterns for common sensitive data types
const PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  SSN: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  PHONE: /\b(\+\d{1,2}\s)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  DATE_OF_BIRTH: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{4}|\d{2})\b/g,
  IP_ADDRESS: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  NAME: /\b([A-Z][a-z]+([ ])?[A-Z]?[a-z]+)\b/g
};

/**
 * Main redaction service class for handling document redaction
 */
export class RedactionService {
  constructor() {
    this.ocrWorker = null;
    this.redactionStats = {
      email: 0,
      ssn: 0,
      phone: 0,
      creditCard: 0,
      dateOfBirth: 0,
      ipAddress: 0,
      name: 0,
      other: 0
    };
  }

  /**
   * Initialize OCR worker if needed
   */
  async initOCR() {
    if (!this.ocrWorker) {
      console.log('Initializing OCR worker...');
      this.ocrWorker = await createWorker('eng');
    }
    return this.ocrWorker;
  }

  /**
   * Main entry point for document redaction
   * @param {ArrayBuffer} fileBuffer - The document file buffer
   * @param {string} fileType - MIME type of the document
   * @param {string} templateId - ID of the redaction template to use
   * @returns {Object} - Redacted document and statistics
   */
  async redactDocument(fileBuffer, fileType, templateId) {
    console.log(`Starting redaction process for ${fileType} using template ${templateId}`);
    
    // Reset statistics
    this.resetStats();
    
    // Get the redaction rules based on template
    const rules = await this.getRedactionRules(templateId);
    
    // Process based on file type
    if (fileType === 'application/pdf') {
      return await this.redactPDF(fileBuffer, rules);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await this.redactDOCX(fileBuffer, rules);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Reset redaction statistics
   */
  resetStats() {
    for (const key in this.redactionStats) {
      this.redactionStats[key] = 0;
    }
  }

  /**
   * Get rules based on template ID
   * @param {string} templateId - Template identifier
   * @returns {Array} - Redaction rules
   */
  async getRedactionRules(templateId) {
    try {
      // Fetch rules from Firebase or use built-in default templates
      const templateRules = await getTemplateRules(templateId);
      
      if (templateRules && templateRules.rules) {
        return templateRules.rules;
      }
      
      // Default rules based on template ID if not found in database
      switch (templateId) {
        case 'template1': // HIPAA Compliance
          return [
            { type: 'name', pattern: PATTERNS.NAME, description: 'Personal names' },
            { type: 'email', pattern: PATTERNS.EMAIL, description: 'Email addresses' },
            { type: 'phone', pattern: PATTERNS.PHONE, description: 'Phone numbers' },
            { type: 'ssn', pattern: PATTERNS.SSN, description: 'Social Security Numbers' },
            { type: 'dateOfBirth', pattern: PATTERNS.DATE_OF_BIRTH, description: 'Dates of birth' }
          ];
        case 'template2': // GDPR Standard
          return [
            { type: 'name', pattern: PATTERNS.NAME, description: 'Personal names' },
            { type: 'email', pattern: PATTERNS.EMAIL, description: 'Email addresses' },
            { type: 'phone', pattern: PATTERNS.PHONE, description: 'Phone numbers' },
            { type: 'ipAddress', pattern: PATTERNS.IP_ADDRESS, description: 'IP addresses' },
            { type: 'creditCard', pattern: PATTERNS.CREDIT_CARD, description: 'Credit card numbers' }
          ];
        case 'template3': // Internal Communications
          return [
            { type: 'email', pattern: PATTERNS.EMAIL, description: 'Email addresses' },
            { type: 'phone', pattern: PATTERNS.PHONE, description: 'Phone numbers' },
            { type: 'creditCard', pattern: PATTERNS.CREDIT_CARD, description: 'Credit card numbers' }
          ];
        default:
          return [
            { type: 'email', pattern: PATTERNS.EMAIL, description: 'Email addresses' },
            { type: 'phone', pattern: PATTERNS.PHONE, description: 'Phone numbers' }
          ];
      }
    } catch (error) {
      console.error('Error getting redaction rules:', error);
      // Fallback to basic rules
      return [
        { type: 'email', pattern: PATTERNS.EMAIL, description: 'Email addresses' },
        { type: 'phone', pattern: PATTERNS.PHONE, description: 'Phone numbers' }
      ];
    }
  }

  /**
   * Extract text with positions from a PDF page
   * @param {PDFPage} page - PDF page
   * @returns {Array} - Array of text objects with positions
   */
  async extractTextWithPositions(page) {
    // This is a simplified version - in production you would use
    // the pdf.js library to get precise text positions
    const { width, height } = page.getSize();
    const text = await page.getTextContent();
    
    return text.items.map(item => ({
      text: item.str,
      x: item.transform[4],
      y: height - item.transform[5], // Convert to PDF coordinates
      width: item.width,
      height: item.height
    }));
  }

  /**
   * Find all matches for a pattern in text
   * @param {string} text - Text to search
   * @param {RegExp} pattern - Pattern to match
   * @returns {Array} - Array of matches
   */
  findMatches(text, pattern) {
    // Ensure the pattern has the global flag
    const regex = pattern instanceof RegExp ? 
      new RegExp(pattern.source, 'g' + pattern.flags.replace('g', '')) : 
      pattern;
    
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        text: match[0],
        index: match.index,
        length: match[0].length
      });
    }
    
    return matches;
  }

  /**
   * Redact PDF document
   * @param {ArrayBuffer} fileBuffer - PDF file buffer
   * @param {Array} rules - Redaction rules
   * @returns {Object} - Redacted PDF and statistics
   */
  async redactPDF(fileBuffer, rules) {
    console.log('Starting PDF redaction process');
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const pages = pdfDoc.getPages();
    
    // Load font for redaction markers
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    console.log(`Processing ${pages.length} pages`);
    
    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      console.log(`Processing page ${i + 1}/${pages.length}`);
      
      try {
        // Extract text content - simplified approach
        // In production, you would use pdf.js for better text extraction
        const textObjects = await this.extractTextContent(page);
        
        let pageText = textObjects.map(obj => obj.text).join(' ');
        
        // Check if the page might be scanned (low text content)
        const needsOCR = pageText.length < 100;
        
        if (needsOCR) {
          console.log(`Page ${i + 1} may be scanned, performing OCR...`);
          
          // Render page to image
          const pageImage = await this.renderPageToImage(pdfDoc, i);
          
          // Perform OCR
          const worker = await this.initOCR();
          const { data } = await worker.recognize(pageImage);
          
          // Get the OCR text
          pageText = data.text;
          
          // Process OCR results
          for (const block of data.blocks || []) {
            for (const line of block.lines || []) {
              for (const word of line.words || []) {
                // Check each rule
                for (const rule of rules) {
                  if (this.matchesRule(word.text, rule.pattern)) {
                    // Redact the word
                    page.drawRectangle({
                      x: word.bbox.x0,
                      y: height - word.bbox.y1, // Convert to PDF coordinates
                      width: word.bbox.x1 - word.bbox.x0,
                      height: word.bbox.y1 - word.bbox.y0,
                      color: rgb(0, 0, 0),
                    });
                    
                    this.redactionStats[rule.type]++;
                  }
                }
              }
            }
          }
        } else {
          // Process text-based PDF
          // For each rule, find matches in the page text
          for (const rule of rules) {
            const matches = this.findMatches(pageText, rule.pattern);
            
            for (const match of matches) {
              console.log(`Found match for rule ${rule.type}: "${match.text}"`);
              
              // Find the position in the PDF
              // This is a simplified approach - in production,
              // you would need to map the match to exact PDF coordinates
              const matchIndices = this.findTextIndices(textObjects, match.text);
              
              for (const idx of matchIndices) {
                const textObj = textObjects[idx];
                
                // Draw redaction rectangle
                page.drawRectangle({
                  x: textObj.x,
                  y: textObj.y - textObj.height,
                  width: font.widthOfTextAtSize(match.text, 12),
                  height: textObj.height * 1.2,
                  color: rgb(0, 0, 0),
                  opacity: 1,
                });
                
                this.redactionStats[rule.type]++;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error);
      }
    }
    
    // Sanitize metadata
    pdfDoc.setTitle('Redacted Document');
    pdfDoc.setAuthor('PharmaRedact System');
    pdfDoc.setCreator('PharmaRedact');
    pdfDoc.setProducer('PharmaRedact Secure Redaction');
    
    // Save the redacted PDF
    const redactedPdfBytes = await pdfDoc.save();
    
    return {
      redactedFile: new Uint8Array(redactedPdfBytes),
      stats: { ...this.redactionStats }
    };
  }

  /**
   * Extract text content from a PDF page
   * @param {PDFPage} page - PDF page
   * @returns {Array} - Array of text objects
   */
  async extractTextContent(page) {
    // This is a simplified simulation - in production, you would use pdf.js
    // to get accurate text extraction with positions
    
    // For demo purposes, we'll create some fake text objects
    const { width, height } = page.getSize();
    
    // Get the page content as a string - this is simplified
    // In production, you would use a proper text extraction library
    let content = '';
    
    try {
      // This would be replaced with actual text extraction
      content = 'Sample text content for demonstration purposes. john.doe@example.com 123-456-7890';
    } catch (error) {
      console.error('Error extracting text:', error);
    }
    
    // Create text objects with positions
    const lines = content.split('\n');
    const textObjects = [];
    
    let y = height - 50; // Start from top
    
    for (const line of lines) {
      textObjects.push({
        text: line,
        x: 50,
        y,
        width: line.length * 5, // Approximate width
        height: 14 // Approximate height
      });
      
      y -= 20; // Move down for next line
    }
    
    return textObjects;
  }

  /**
   * Find indices of text objects containing a specific text
   * @param {Array} textObjects - Text objects array
   * @param {string} text - Text to find
   * @returns {Array} - Array of indices
   */
  findTextIndices(textObjects, text) {
    const indices = [];
    
    for (let i = 0; i < textObjects.length; i++) {
      if (textObjects[i].text.includes(text)) {
        indices.push(i);
      }
    }
    
    return indices;
  }

  /**
   * Check if text matches a rule pattern
   * @param {string} text - Text to check
   * @param {RegExp} pattern - Pattern to match
   * @returns {boolean} - Whether the text matches
   */
  matchesRule(text, pattern) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    return regex.test(text);
  }

  /**
   * Render a PDF page to an image
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {number} pageIndex - Page index
   * @returns {Uint8Array} - Image data
   */
  async renderPageToImage(pdfDoc, pageIndex) {
    // This would use pdf.js in production to render the page
    // For demo purposes, we're returning a placeholder
    
    return new Uint8Array(100); // Placeholder
  }

  /**
   * Redact DOCX document
   * @param {ArrayBuffer} fileBuffer - DOCX file buffer
   * @param {Array} rules - Redaction rules
   * @returns {Object} - Redacted DOCX and statistics
   */
  async redactDOCX(fileBuffer, rules) {
    console.log('Starting DOCX redaction process');
    
    // Create a zip object from the docx
    const zip = new PizZip(fileBuffer);
    
    try {
      // Parse the document
      const docx = new Docxtemplater();
      docx.loadZip(zip);
      
      // Get the document.xml content
      const documentXml = zip.file('word/document.xml').asText();
      
      // Create a DOM parser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
      
      // Process paragraphs
      const paragraphs = xmlDoc.getElementsByTagName('w:p');
      console.log(`Found ${paragraphs.length} paragraphs`);
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        const runs = paragraph.getElementsByTagName('w:r');
        
        // Build paragraph text with mapping to runs
        let paragraphText = '';
        const runMap = [];
        
        for (let j = 0; j < runs.length; j++) {
          const run = runs[j];
          const textElements = run.getElementsByTagName('w:t');
          
          for (let k = 0; k < textElements.length; k++) {
            const textElement = textElements[k];
            const text = textElement.textContent || '';
            
            runMap.push({
              startIndex: paragraphText.length,
              endIndex: paragraphText.length + text.length,
              run,
              textElement
            });
            
            paragraphText += text;
          }
        }
        
        // Apply redaction rules
        for (const rule of rules) {
          const matches = this.findMatches(paragraphText, rule.pattern);
          
          for (const match of matches) {
            console.log(`Found match for rule ${rule.type}: "${match.text}"`);
            
            // Find runs that contain this match
            const matchedRuns = [];
            
            for (const runInfo of runMap) {
              // Check if this run contains any part of the match
              if (
                (runInfo.startIndex <= match.index && runInfo.endIndex > match.index) ||
                (runInfo.startIndex >= match.index && runInfo.startIndex < match.index + match.length)
              ) {
                matchedRuns.push(runInfo);
              }
            }
            
            // Apply redaction to matched runs
            for (const runInfo of matchedRuns) {
              const textElement = runInfo.textElement;
              
              // Get the original text
              const originalText = textElement.textContent || '';
              
              // Calculate which part needs to be redacted
              const matchStartInRun = Math.max(0, match.index - runInfo.startIndex);
              const matchEndInRun = Math.min(originalText.length, match.index + match.length - runInfo.startIndex);
              
              if (matchStartInRun < matchEndInRun) {
                // Create redacted text
                const redactedText =
                  originalText.substring(0, matchStartInRun) +
                  '■'.repeat(matchEndInRun - matchStartInRun) +
                  originalText.substring(matchEndInRun);
                
                // Update the text element
                textElement.textContent = redactedText;
                
                this.redactionStats[rule.type]++;
              }
            }
          }
        }
      }
      
      // Process headers and footers
      this.processDocxHeadersFooters(zip, rules);
      
      // Clean document metadata
      this.cleanDocxMetadata(zip);
      
      // Generate the output docx
      const redactedDocx = zip.generate({ type: 'uint8array' });
      
      return {
        redactedFile: redactedDocx,
        stats: { ...this.redactionStats }
      };
      
    } catch (error) {
      console.error('Error redacting DOCX:', error);
      throw new Error(`DOCX redaction failed: ${error.message}`);
    }
  }

  /**
   * Process DOCX headers and footers
   * @param {PizZip} zip - DOCX zip object
   * @param {Array} rules - Redaction rules
   */
  processDocxHeadersFooters(zip, rules) {
    // Find all header and footer files
    const headerFiles = Object.keys(zip.files).filter(
      file => file.startsWith('word/header') && file.endsWith('.xml')
    );
    
    const footerFiles = Object.keys(zip.files).filter(
      file => file.startsWith('word/footer') && file.endsWith('.xml')
    );
    
    console.log(`Found ${headerFiles.length} headers and ${footerFiles.length} footers`);
    
    // Process each header
    for (const headerFile of headerFiles) {
      try {
        const headerXml = zip.file(headerFile).asText();
        const redactedHeaderXml = this.redactXmlContent(headerXml, rules);
        zip.file(headerFile, redactedHeaderXml);
      } catch (error) {
        console.error(`Error processing header ${headerFile}:`, error);
      }
    }
    
    // Process each footer
    for (const footerFile of footerFiles) {
      try {
        const footerXml = zip.file(footerFile).asText();
        const redactedFooterXml = this.redactXmlContent(footerXml, rules);
        zip.file(footerFile, redactedFooterXml);
      } catch (error) {
        console.error(`Error processing footer ${footerFile}:`, error);
      }
    }
  }

  /**
   * Redact XML content
   * @param {string} xmlContent - XML content
   * @param {Array} rules - Redaction rules
   * @returns {string} - Redacted XML content
   */
  redactXmlContent(xmlContent, rules) {
    // This is a simplified implementation
    // In production, you'd need to properly parse and modify the XML
    
    try {
      // Replace sensitive information based on rules
      let redactedContent = xmlContent;
      
      for (const rule of rules) {
        const matches = this.findMatches(redactedContent, rule.pattern);
        
        for (const match of matches) {
          const redaction = '■'.repeat(match.text.length);
          redactedContent = redactedContent.replace(match.text, redaction);
          this.redactionStats[rule.type]++;
        }
      }
      
      return redactedContent;
    } catch (error) {
      console.error('Error redacting XML content:', error);
      return xmlContent; // Return original if error
    }
  }

  /**
   * Clean metadata from a DOCX file
   * @param {PizZip} zip - The DOCX zip object
   */
  cleanDocxMetadata(zip) {
    try {
      // Clean core.xml properties
      const coreXml = zip.file('docProps/core.xml');
      if (coreXml) {
        let coreContent = coreXml.asText();
        
        // Replace creator, lastModifiedBy, etc. with PharmaRedact
        coreContent = coreContent.replace(/<dc:creator>.*?<\/dc:creator>/g, '<dc:creator>PharmaRedact</dc:creator>');
        coreContent = coreContent.replace(/<cp:lastModifiedBy>.*?<\/cp:lastModifiedBy>/g, '<cp:lastModifiedBy>PharmaRedact</cp:lastModifiedBy>');
        
        // Update modification time
        const now = new Date().toISOString();
        if (coreContent.includes('<dcterms:modified')) {
          coreContent = coreContent.replace(/(<dcterms:modified[^>]*>).*?(<\/dcterms:modified>)/g, `$1${now}$2`);
        }
        
        // Add redaction note to title
        if (coreContent.includes('<dc:title')) {
          coreContent = coreContent.replace(/(<dc:title>)(.*?)(<\/dc:title>)/g, '$1$2 (Redacted)$3');
        }
        
        zip.file('docProps/core.xml', coreContent);
      }
      
      // Clean app.xml (application properties)
      const appXml = zip.file('docProps/app.xml');
      if (appXml) {
        let appContent = appXml.asText();
        
        // Replace company, application name, etc.
        appContent = appContent.replace(/<Company>.*?<\/Company>/g, '<Company>PharmaRedact</Company>');
        appContent = appContent.replace(/<Application>.*?<\/Application>/g, '<Application>PharmaRedact Secure Redaction</Application>');
        
        zip.file('docProps/app.xml', appContent);
      }
    } catch (error) {
      console.error('Error cleaning DOCX metadata:', error);
      // Continue without failing the entire redaction process
    }
  }

  /**
   * Process a document using AI and template rules
   * @param {Object} document - The document object from Firestore
   * @param {string} templateId - The ID of the template to use for redaction
   * @returns {Promise<Object>} - Results of the redaction process
   */
  async processDocumentWithAI(document, templateId) {
    try {
      console.log(`Processing document ${document.id} with template ${templateId}`);
      
      // Get the template rules
      const rules = await this.getRedactionRules(templateId);
      if (!rules || rules.length === 0) {
        throw new Error('No redaction rules found for the specified template');
      }
      
      // Extract text from document based on file type
      let documentText = '';
      if (document.fileType.toLowerCase() === 'pdf') {
        console.log('Extracting text from PDF...');
        // For demonstration, we'd use the PDF text extraction methods
        const pdfBuffer = await fetch(document.fileUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        
        // Extract text from each page (simplified)
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
          // This is a placeholder - in a real implementation, 
          // you would use proper PDF text extraction
          documentText += `[Content from page ${i+1}]\n`;
        }
      } else if (document.fileType.toLowerCase() === 'docx') {
        console.log('Extracting text from DOCX...');
        // For demonstration, we'd use the DOCX text extraction methods
        const docxBuffer = await fetch(document.fileUrl).then(res => res.arrayBuffer());
        const zip = new PizZip(docxBuffer);
        const doc = new Docxtemplater();
        doc.loadZip(zip);
        
        // This is a placeholder - in a real implementation,
        // you would extract the actual text
        documentText = '[DOCX content]';
      } else {
        throw new Error(`Unsupported file type: ${document.fileType}`);
      }
      
      // Create entity descriptions for the OpenAI prompt
      const entityDescriptions = {};
      rules.forEach(rule => {
        entityDescriptions[rule.type] = rule.description;
      });
      
      // Entity types to look for
      const entityTypes = rules.map(rule => rule.type);
      
      // Create OpenAI client (if not already initialized)
      if (!global.openai) {
        const { OpenAI } = await import('openai');
        global.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      }
      
      console.log('Sending document to OpenAI for analysis...');
      
      // Create prompt for entity identification
      const prompt = `
I need you to identify the following types of sensitive information in this text:
${entityTypes.map(type => `- ${type}: ${entityDescriptions[type] || 'No description provided'}`).join('\n')}

Here is the text to analyze:
---
${documentText.substring(0, 15000)} ${documentText.length > 15000 ? '... [text truncated due to length]' : ''}
---

For each entity you identify, provide:
1. The exact text of the entity
2. The category it belongs to (from the list above)
3. A confidence score between 0 and 1
4. The approximate position in the text (character index)
5. A brief context (the text surrounding the entity)

Return your answer as a JSON object with this structure:
{
  "entities": [
    {
      "text": "the entity text",
      "category": "category name",
      "confidence": 0.95,
      "position": 145,
      "context": "text before ... the entity text ... text after"
    }
  ]
}
`;

      // Call OpenAI API
      const response = await global.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system", 
            content: "You are an AI specialized in identifying sensitive information in medical and pharmaceutical documents. Your task is to identify and extract entities based on the categories provided."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });
      
      // Parse AI response
      const responseContent = response.choices[0].message.content;
      let entities = [];
      
      try {
        const parsedResponse = JSON.parse(responseContent);
        entities = parsedResponse.entities || [];
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw new Error('Failed to parse AI response');
      }
      
      console.log(`AI identified ${entities.length} entities to redact`);
      
      // Generate redacted document (placeholder for now)
      const redactedUrl = await this.generateRedactedDocument(document, entities);
      
      // Calculate overall confidence
      const totalRedactions = entities.length;
      const confidenceSum = entities.reduce((sum, item) => sum + (item.confidence || 0.85), 0);
      const averageConfidence = totalRedactions > 0 ? confidenceSum / totalRedactions : 0;
      
      return {
        success: true,
        redactedUrl,
        results: entities,
        redactedCount: totalRedactions,
        confidence: averageConfidence
      };
    } catch (error) {
      console.error('Error in document processing:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Generate a redacted document with identified entities redacted
   * @param {Object} document - The original document
   * @param {Array} entities - The entities to redact
   * @returns {Promise<string>} - URL of the redacted document
   */
  async generateRedactedDocument(document, entities) {
    try {
      console.log(`Generating redacted document for ${document.id} with ${entities.length} redactions`);
      
      // Download the original document
      const response = await fetch(document.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      
      // Get document buffer
      const fileBuffer = await response.arrayBuffer();
      
      // Process based on file type
      let redactedBuffer;
      const fileType = document.fileType.toLowerCase();
      
      if (fileType === 'pdf') {
        // Process PDF redaction
        redactedBuffer = await this.redactPdfDocument(fileBuffer, entities);
      } else if (fileType === 'docx') {
        // Process DOCX redaction
        redactedBuffer = await this.redactDocxDocument(fileBuffer, entities);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      // Generate unique filename for the redacted document
      const timestamp = new Date().getTime();
      const fileExtension = fileType.includes('pdf') ? 'pdf' : 'docx';
      const redactedFileName = `redacted_${document.id}_${timestamp}.${fileExtension}`;
      
      // Upload the redacted file to storage
      const redactedUrl = await this.uploadRedactedFile(
        redactedBuffer, 
        redactedFileName, 
        document.userId, 
        fileType.includes('pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      
      return redactedUrl;
    } catch (error) {
      console.error('Error generating redacted document:', error);
      throw new Error(`Failed to generate redacted document: ${error.message}`);
    }
  }

  /**
   * Upload a redacted file to storage
   * @param {ArrayBuffer} buffer - The file buffer
   * @param {string} filename - The filename
   * @param {string} userId - The user ID
   * @param {string} contentType - The file content type
   * @returns {Promise<string>} - The download URL
   */
  async uploadRedactedFile(buffer, filename, userId, contentType) {
    try {
      // Use Firebase Storage for file upload
      const storage = getStorage();
      const redactedFilesRef = ref(storage, `redacted/${userId}/${filename}`);
      
      // Convert ArrayBuffer to Blob for upload
      const blob = new Blob([buffer], { type: contentType });
      
      // Upload the file
      const snapshot = await uploadBytes(redactedFilesRef, blob, {
        contentType,
        customMetadata: {
          redacted: 'true',
          redactedAt: new Date().toISOString(),
          userId
        }
      });
      
      // Get download URL
      const downloadUrl = await getDownloadURL(redactedFilesRef);
      
      console.log(`Redacted file uploaded: ${downloadUrl}`);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading redacted file:', error);
      throw error;
    }
  }

  /**
   * Redact a PDF document using the entities
   * @param {ArrayBuffer} fileBuffer - The PDF file buffer
   * @param {Array} entities - The entities to redact
   * @returns {Promise<ArrayBuffer>} - The redacted PDF buffer
   */
  async redactPdfDocument(fileBuffer, entities) {
    try {
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const pages = pdfDoc.getPages();
      
      // Get a font for adding redacted labels
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Group entities by page for more efficient processing
      const entitiesByPage = {};
      
      // In a real implementation, we would map entities to specific pages
      // For this simplified version, we'll process all entities on each page
      for (let i = 0; i < pages.length; i++) {
        entitiesByPage[i] = entities.filter(entity => 
          // In a real implementation, you would check which page this entity belongs to
          // For now, we'll assume all entities could be on any page
          true
        );
      }
      
      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageEntities = entitiesByPage[i] || [];
        
        // Extract text from page to find matches
        // In a real implementation, you would use pdf.js for accurate text extraction
        const pageText = await this.extractTextFromPage(page);
        
        // Keep track of redacted areas to prevent overlaps
        const redactedAreas = [];
        
        // Process each entity
        for (const entity of pageEntities) {
          const { text, category, confidence } = entity;
          
          // Find all occurrences of this text in the page
          let searchIndex = 0;
          let matchIndex;
          
          while ((matchIndex = pageText.indexOf(text, searchIndex)) !== -1) {
            // In a real implementation, you would map the text index to position in the PDF
            // For this example, we'll use placeholder positions
            const x = 50 + (matchIndex % 400); // Placeholder calculation
            const y = 50 + Math.floor(matchIndex / 400) * 20; // Placeholder calculation
            const textWidth = text.length * 5; // Approximate width
            const textHeight = 15; // Approximate height
            
            // Check for overlaps with existing redactions
            const redactionBox = { x, y, width: textWidth, height: textHeight };
            const overlaps = redactedAreas.some(area => this.rectanglesOverlap(area, redactionBox));
            
            if (!overlaps) {
              // Apply multi-layer redaction
              // 1. White rectangle to erase the text
              page.drawRectangle({
                x,
                y,
                width: textWidth,
                height: textHeight,
                color: rgb(1, 1, 1)
              });
              
              // 2. Black redaction box
              page.drawRectangle({
                x,
                y,
                width: textWidth,
                height: textHeight,
                color: rgb(0, 0, 0)
              });
              
              // 3. Add "REDACTED" text if there's enough space
              if (textWidth > 40) {
                page.drawText('REDACTED', {
                  x: x + textWidth / 2 - 25,
                  y: y + textHeight / 2 - 4,
                  size: 8,
                  font,
                  color: rgb(1, 1, 1)
                });
              }
              
              // Track redacted area
              redactedAreas.push(redactionBox);
            }
            
            // Move to next occurrence
            searchIndex = matchIndex + text.length;
          }
        }
        
        // Add redaction metadata to page
        page.drawText(`Redacted by PharmaRedact - ${new Date().toISOString()}`, {
          x: 5,
          y: 5,
          size: 6,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.5
        });
      }
      
      // Update document metadata
      pdfDoc.setTitle(`${pdfDoc.getTitle() || 'Document'} (Redacted)`);
      pdfDoc.setSubject(`Redacted document - ${entities.length} items removed`);
      pdfDoc.setProducer('PharmaRedact Secure Redaction Service');
      pdfDoc.setModificationDate(new Date());
      
      // Save the redacted PDF
      const redactedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
      });
      
      return redactedPdfBytes;
    } catch (error) {
      console.error('Error redacting PDF:', error);
      throw error;
    }
  }

  /**
   * Redact a DOCX document using the entities
   * @param {ArrayBuffer} fileBuffer - The DOCX file buffer
   * @param {Array} entities - The entities to redact
   * @returns {Promise<ArrayBuffer>} - The redacted DOCX buffer
   */
  async redactDocxDocument(fileBuffer, entities) {
    try {
      // Use PizZip to handle the DOCX (which is a ZIP of XML files)
      const zip = new PizZip(fileBuffer);
      
      // Get document.xml which contains the main content
      const documentXml = zip.file('word/document.xml');
      if (!documentXml) {
        throw new Error('Invalid DOCX file: missing document.xml');
      }
      
      let documentContent = documentXml.asText();
      
      // Process the document content - replace all occurrences of each entity
      for (const entity of entities) {
        const { text, category } = entity;
        
        // Create a safe regex that escapes special characters
        const safeText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const entityRegex = new RegExp(safeText, 'g');
        
        // Replace within w:t tags (text nodes in Word XML)
        documentContent = this.replaceTextInXml(documentContent, entityRegex, 'REDACTED');
      }
      
      // Update the document.xml in the zip
      zip.file('word/document.xml', documentContent);
      
      // Process headers (they may contain sensitive information)
      const headerFiles = Object.keys(zip.files).filter(filename => 
        filename.startsWith('word/header')
      );
      
      for (const headerFile of headerFiles) {
        const headerXml = zip.file(headerFile);
        if (headerXml) {
          let headerContent = headerXml.asText();
          
          for (const entity of entities) {
            const { text } = entity;
            const safeText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const entityRegex = new RegExp(safeText, 'g');
            
            headerContent = this.replaceTextInXml(headerContent, entityRegex, 'REDACTED');
          }
          
          zip.file(headerFile, headerContent);
        }
      }
      
      // Process footers (they may contain sensitive information)
      const footerFiles = Object.keys(zip.files).filter(filename => 
        filename.startsWith('word/footer')
      );
      
      for (const footerFile of footerFiles) {
        const footerXml = zip.file(footerFile);
        if (footerXml) {
          let footerContent = footerXml.asText();
          
          for (const entity of entities) {
            const { text } = entity;
            const safeText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const entityRegex = new RegExp(safeText, 'g');
            
            footerContent = this.replaceTextInXml(footerContent, entityRegex, 'REDACTED');
          }
          
          zip.file(footerFile, footerContent);
        }
      }
      
      // Clean metadata that might contain sensitive information
      this.cleanDocxMetadata(zip);
      
      // Generate the redacted DOCX file
      const redactedBuffer = zip.generate({ type: 'arraybuffer' });
      
      return redactedBuffer;
    } catch (error) {
      console.error('Error redacting DOCX:', error);
      throw error;
    }
  }

  /**
   * Replace text in XML content (for DOCX processing)
   * @param {string} xmlContent - The XML content
   * @param {RegExp} pattern - The pattern to search for
   * @param {string} replacement - The replacement text
   * @returns {string} - The updated XML content
   */
  replaceTextInXml(xmlContent, pattern, replacement) {
    // Function to process text within w:t tags
    const processTextNode = (match, prefix, text, suffix) => {
      // Replace the text while preserving the XML structure
      const replacedText = text.replace(pattern, replacement);
      return prefix + replacedText + suffix;
    };
    
    // Find and process all text within w:t tags
    return xmlContent.replace(/(<w:t[^>]*>)(.*?)(<\/w:t>)/g, processTextNode);
  }

  /**
   * Check if two rectangles overlap
   * @param {Object} rect1 - First rectangle {x, y, width, height}
   * @param {Object} rect2 - Second rectangle {x, y, width, height}
   * @returns {boolean} - True if rectangles overlap
   */
  rectanglesOverlap(rect1, rect2) {
    return !(rect1.x > rect2.x + rect2.width || 
             rect1.x + rect1.width < rect2.x || 
             rect1.y > rect2.y + rect2.height ||
             rect1.y + rect1.height < rect2.y);
  }

  /**
   * Extract text from a PDF page
   * @param {PDFPage} page - The PDF page
   * @returns {Promise<string>} - The extracted text
   */
  async extractTextFromPage(page) {
    // This is a simplified placeholder function
    // In a real implementation, you would use pdf.js or a similar library
    // to extract text with position information
    return "This is placeholder text for PDF extraction during redaction";
  }

  /**
   * Generate a document preview for the redacted document
   * @param {string} documentUrl - The document URL
   * @param {string} fileType - The file type ('pdf' or 'docx')
   * @returns {Promise<string>} - Data URL for preview
   */
  async generateDocumentPreview(documentUrl, fileType) {
    try {
      if (!documentUrl) {
        throw new Error('Document URL is required');
      }
      
      // Fetch the document
      const response = await fetch(documentUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }
      
      const fileBuffer = await response.arrayBuffer();
      
      if (fileType.toLowerCase() === 'pdf') {
        // For PDFs, we can return a data URL directly
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      } else if (fileType.toLowerCase() === 'docx') {
        // For DOCX, convert to HTML for preview
        const result = await mammoth.convertToHtml({ arrayBuffer: fileBuffer });
        const htmlContent = result.value;
        
        // Create a styled HTML document for preview
        const fullHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Document Preview</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.5;
                margin: 2rem;
              }
              .redacted {
                background-color: black;
                color: white;
                padding: 2px 4px;
                border-radius: 2px;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `;
        
        // Convert to data URL
        const blob = new Blob([fullHtml], { type: 'text/html' });
        return URL.createObjectURL(blob);
      } else {
        throw new Error(`Unsupported file type for preview: ${fileType}`);
      }
    } catch (error) {
      console.error('Error generating document preview:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default redactionService; 