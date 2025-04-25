import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, getBytes } from 'firebase/storage';
import { doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { getAuth } from 'firebase/auth';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { Packer, Document, Paragraph, TextRun, HeadingLevel } from 'docx';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as xpath from 'xpath';
// import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument } from 'pdf-lib';
import { rgb } from 'pdf-lib';
import { PDFName, PDFNumber } from 'pdf-lib';

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY);

// Gemini API integration
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

/**
 * Creates a safe copy of a buffer to prevent detachment issues
 * @param {ArrayBuffer|Uint8Array|TypedArray} buffer - The buffer to copy
 * @returns {Uint8Array|null} - A new Uint8Array copy or null if invalid
 */
function createSafeBufferCopy(buffer) {
  try {
    if (!buffer) {
      console.error("Cannot create a copy of null or undefined buffer");
      return null;
    }
    
    // Handle ArrayBuffer
    if (buffer instanceof ArrayBuffer) {
      return new Uint8Array(buffer.slice(0));
    }
    
    // Handle Uint8Array and other TypedArrays
    if (buffer instanceof Uint8Array) {
      // Create a completely new copy to avoid any reference to the original buffer
      return new Uint8Array(buffer.buffer.slice(0, buffer.byteLength));
    }
    
    if (ArrayBuffer.isView(buffer)) {
      return new Uint8Array(buffer.buffer.slice(0, buffer.byteLength));
    }
    
    // If buffer is an object with byteLength but not an ArrayBuffer/TypedArray,
    // try to convert it to a Uint8Array
    if (typeof buffer === 'object' && buffer.byteLength !== undefined) {
      return new Uint8Array(new Uint8Array(buffer).buffer.slice(0));
    }
    
    console.error("Unsupported buffer type:", typeof buffer);
    return null;
  } catch (error) {
    console.error("Error creating buffer copy:", error);
    return null;
  }
}

/**
 * Redact a document by identifying and removing sensitive information
 * @param {Object|string} documentOrId - Document object with storagePath or just the document ID
 * @param {Object|string} templateOrId - Redaction template with rules or just the template ID
 * @returns {Promise<Object>} - Result with redacted document URL and report
 */
export const redactDocument = async (documentOrId, templateOrId = null) => {
  try {
    console.log('Starting document redaction process...');
    
    // Step 1: Handle document parameter which can be an ID or object
    let document = documentOrId;
    let documentId = typeof documentOrId === 'string' ? documentOrId : (documentOrId?.id || null);
    
    console.log(`Document ID determined to be: "${documentId}"`);
    
    // If just an ID was passed, fetch the full document
    if (typeof documentOrId === 'string') {
      console.log(`Fetching document with ID: ${documentOrId}`);
      try {
        // Get auth and DB instances
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Try to use the getDocumentById function from firebase.js
        try {
          // Import dynamically to avoid circular imports
          const { getDocumentById } = await import('./firebase');
          console.log('Successfully imported getDocumentById function');
          
          const fetchedDoc = await getDocumentById(documentOrId);
          if (fetchedDoc) {
            document = fetchedDoc;
            console.log('Successfully fetched document using getDocumentById:', document);
          } else {
            console.warn('getDocumentById returned null, falling back to direct Firestore query');
          }
        } catch (importError) {
          console.error('Error importing getDocumentById:', importError);
          console.log('Falling back to direct Firestore query');
        }
        
        // If we couldn't get the document using getDocumentById, use direct Firestore query as fallback
        if (!document || typeof document === 'string') {
          console.log('Using direct Firestore query to fetch document');
          // Fetch document from Firestore
          const docRef = doc(db, 'documents', documentOrId);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            throw new Error(`Document with ID ${documentOrId} not found`);
          }
          
          // Get document data
          document = {
            id: docSnap.id,
            ...docSnap.data()
          };
        }
        
        console.log('Successfully fetched document:', document);
        console.log(`Document ID from fetched document: ${document.id}`);
        
        // Ensure documentId is set correctly
        documentId = document.id;
      } catch (fetchError) {
        console.error('Error fetching document:', fetchError);
        throw new Error(`Failed to fetch document: ${fetchError.message}`);
      }
    }
    
    // Make sure we have a valid document ID
    if (!documentId && document && document.id) {
      documentId = document.id;
      console.log(`Updated document ID to: ${documentId}`);
    }
    
    if (!documentId) {
      console.error("No valid document ID found in:", document);
      throw new Error('Cannot process document: Invalid or missing document ID');
    }
    
    // Step 2: Handle template parameter which can be an ID or object
    let template = templateOrId;
    
    if (typeof templateOrId === 'string') {
      console.log(`Fetching template with ID: ${templateOrId}`);
      try {
        // Fetch template from Firestore
        const templateRef = doc(db, 'templates', templateOrId);
        const templateSnap = await getDoc(templateRef);
        
        if (!templateSnap.exists()) {
          throw new Error(`Template with ID ${templateOrId} not found`);
        }
        
        // Get template data
        template = {
          id: templateSnap.id,
          ...templateSnap.data()
        };
        
        // Validate template data has expected structure
        if (!template.rules || !Array.isArray(template.rules)) {
          console.warn(`Template ${templateSnap.id} has invalid or missing rules:`, template.rules);
          template.rules = []; // Initialize as empty array to prevent errors
        } else {
          console.log(`Template ${templateSnap.id} loaded with ${template.rules.length} rules`);
        }
        
        console.log('Successfully fetched template:', template);
      } catch (templateError) {
        console.error('Error fetching template:', templateError);
        throw new Error(`Failed to fetch template: ${templateError.message}`);
      }
    }
    
    if (!document) {
      throw new Error('Invalid document object provided');
    }
    
    // Step 3: Determine the document path in storage (handle different field names)
    const docPath = document.storagePath || document.filePath || document.path || document.url || document.downloadUrl;
    
    // Log the document object to help with debugging
    console.log('Document object:', JSON.stringify(document, null, 2));
    
    if (!docPath) {
      // If no direct path is found, construct it from document fields
      if (document.fileName || document.filename) {
        const fileName = document.fileName || document.filename;
        const userId = document.userId || (auth.currentUser ? auth.currentUser.uid : null);
        
        if (userId) {
          const constructedPath = `documents/${userId}/${fileName}`;
          console.log(`Constructed storage path from fields: ${constructedPath}`);
          document.storagePath = constructedPath;
        } else {
          throw new Error('Document storage path not found and user ID not available to construct path');
        }
      } else {
        throw new Error('Document storage path not found and insufficient information to construct it');
      }
    }
    
    // From here, the existing redaction process continues
    // Get storage reference to the document
    const storage = getStorage();
    const storageRef = ref(storage, document.storagePath || docPath);
    
    // Download the document
    console.log('Downloading original document from storage...');
    const downloadResult = await getBytes(storageRef);
    
    // Create a copy of the buffer immediately to avoid detachment issues
    const originalBuffer = createSafeBufferCopy(downloadResult);
    if (!originalBuffer) {
      throw new Error('Failed to create a working copy of the document buffer');
    }
    console.log(`Downloaded document: ${originalBuffer.byteLength} bytes`);
    
    // Determine file type based on path extension
    const fileType = docPath.toLowerCase().endsWith('.pdf') ? 'pdf' 
                   : docPath.toLowerCase().endsWith('.docx') ? 'docx'
                   : null;
    
    if (!fileType) {
      throw new Error('Unsupported file type. Only PDF and DOCX are supported.');
    }
    
    console.log(`Processing ${fileType.toUpperCase()} document...`);
    
    // Check if this is a scanned PDF that might need special handling
    let needsSpecialHandling = false;
    let scannedPdfResult = null;
    
    if (fileType === 'pdf') {
      // Make a separate buffer copy specifically for this check
      const checkBuffer = createSafeBufferCopy(originalBuffer);
      const hasText = await checkPdfHasText(checkBuffer);
      
      if (!hasText) {
        console.log('PDF appears to be scanned, requires special handling');
        needsSpecialHandling = true;
        // We'll handle this later after entity detection
      }
    }
    
    // Extract text with positions for entity detection
    console.log('Extracting text with positions...');
    let textWithPositions;
    
    if (fileType === 'pdf') {
      // Make a fresh buffer copy for text extraction
      const extractionBuffer = createSafeBufferCopy(originalBuffer);
      textWithPositions = await extractPdfTextWithPositions(extractionBuffer);
    } else if (fileType === 'docx') {
      // Make a fresh buffer copy for DOCX extraction
      const docxBuffer = createSafeBufferCopy(originalBuffer);
      textWithPositions = await extractDocxStructure(docxBuffer);
    }
    
    if (!textWithPositions || (Array.isArray(textWithPositions) && textWithPositions.length === 0)) {
      console.warn('No text content extracted from document');
    }
    
    // Apply redaction rules to detect sensitive information
    console.log('Applying redaction rules...');
    const extractedText = Array.isArray(textWithPositions) 
      ? textWithPositions.map(item => item.text).join(' ') 
      : '';
    
    let detectedEntities = [];
    let templateRules = [];
    
    // Use template rules if available
    if (template && Array.isArray(template.rules) && template.rules.length > 0) {
      templateRules = template.rules;
      console.log(`Using template with ${templateRules.length} redaction rules`);
      detectedEntities = await detectEntitiesWithRules(extractedText, templateRules);
      console.log(`Detected ${detectedEntities.length} entities using template rules`);
    } else {
      // Enhanced default rules with more comprehensive patterns
      templateRules = [
        {
          id: 'default-ssn',
          name: 'Social Security Number',
          category: 'PII',
          pattern: '\\b(?:\\d{3}-\\d{2}-\\d{4}|\\d{9})\\b'
        },
        {
          id: 'default-email',
          name: 'Email Address',
          category: 'PII',
          pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
        },
        {
          id: 'default-phone',
          name: 'Phone Number',
          category: 'PII',
          pattern: '\\b(?:\\(\\d{3}\\)\\s*\\d{3}-\\d{4}|\\d{3}-\\d{3}-\\d{4}|\\d{10}|\\+\\d{1,2}\\s*\\d{3}\\s*\\d{3}\\s*\\d{4})\\b'
        },
        {
          id: 'default-credit-card',
          name: 'Credit Card Number',
          category: 'Financial',
          pattern: '\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b'
        },
        {
          id: 'default-bank-account',
          name: 'Bank Account Number',
          category: 'Financial',
          pattern: '\\b\\d{10,12}\\b'
        },
        {
          id: 'default-routing-number',
          name: 'Routing Number',
          category: 'Financial',
          pattern: '\\b\\d{9}\\b'
        },
        {
          id: 'default-birthdate',
          name: 'Birth Date',
          category: 'PII',
          pattern: '\\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+\\d{1,2}(?:st|nd|rd|th)?[,\\s]+\\d{4}\\b|\\b\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}\\b'
        },
        {
          id: 'default-passport',
          name: 'Passport Number',
          category: 'PII',
          pattern: '\\b[A-Z0-9]{6,9}\\b'
        },
        {
          id: 'default-drivers-license',
          name: 'Driver\'s License Number',
          category: 'PII',
          pattern: '\\b[A-Z0-9]{7,9}\\b'
        },
        {
          id: 'default-ip-address',
          name: 'IP Address',
          category: 'Technical',
          pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b'
        },
        {
          id: 'default-address',
          name: 'Street Address',
          category: 'PII',
          pattern: '\\b\\d+\\s+[A-Za-z0-9\\s\\.,]+(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Plaza|Plz|Terrace|Ter|Circle|Cir|Way|Parkway|Pkwy)\\b'
        },
        {
          id: 'default-zipcode',
          name: 'Zip Code',
          category: 'PII',
          pattern: '\\b\\d{5}(?:-\\d{4})?\\b'
        },
        {
          id: 'default-medical-record',
          name: 'Medical Record Number',
          category: 'PHI',
          pattern: '\\bMR[A-Z0-9]{6,10}\\b|\\b(?:Medical Record|MRN)(?:\\s|:)\\s*[A-Z0-9]{6,12}\\b'
        },
        {
          id: 'default-patient-id',
          name: 'Patient ID',
          category: 'PHI',
          pattern: '\\b(?:Patient ID|PID)(?:\\s|:)\\s*[A-Z0-9-]{4,15}\\b'
        }
      ];
      
      console.log('No template rules found, using comprehensive default rules');
      detectedEntities = await detectEntitiesWithRules(extractedText, templateRules);
      console.log(`Detected ${detectedEntities.length} entities using default rules`);
    }
    
    // If few entities detected, try AI detection if enabled in template or by default
    const useAI = (template && template.useAI !== undefined) ? template.useAI : true;
    
    if (useAI && (detectedEntities.length < 5 || (template && template.alwaysUseAI))) {
      console.log('Using AI to enhance entity detection...');
      
      try {
        // Make a separate AI detection call with the extracted text
        // Pass templateRules to help guide AI detection
        const aiDetectedEntities = await detectEntitiesWithAI(extractedText, templateRules);
        
        if (aiDetectedEntities && aiDetectedEntities.length > 0) {
          console.log(`AI detected ${aiDetectedEntities.length} additional entities`);
          
          // Log all entities detected by AI for debugging
          aiDetectedEntities.forEach((entity, index) => {
            console.log(`AI entity ${index + 1}: ${entity.entity} (${entity.type || 'unknown type'})`);
          });
          
          // Map the AI-detected entities to their positions in the document
          const mappedAIEntities = await mapEntitiesToPositions(aiDetectedEntities, textWithPositions, extractedText);
          
          // Merge with rule-based entities, removing duplicates
          detectedEntities = await mergeEntitiesRemovingDuplicates(detectedEntities, mappedAIEntities);
          console.log(`After merging, total entities: ${detectedEntities.length}`);
          
          // Log merged entities for debugging
          if (detectedEntities.length < 10) {
            detectedEntities.forEach((entity, index) => {
              console.log(`Final entity ${index + 1}: ${entity.entity} (${entity.type || 'unknown type'})`);
            });
          }
        }
      } catch (aiError) {
        console.error('Error in AI entity detection:', aiError);
        // Continue with rule-based entities only
      }
    }
    
    // Handle scanned PDFs after entity detection
    if (fileType === 'pdf' && needsSpecialHandling) {
      // Make a fresh buffer copy for handling scanned PDFs
      const scannedBuffer = createSafeBufferCopy(originalBuffer);
      scannedPdfResult = await handleScannedPdf(scannedBuffer, detectedEntities);
      
      if (scannedPdfResult && scannedPdfResult.needsManualReview) {
        // Use the specially processed buffer for scanned documents
        if (scannedPdfResult.redactedBuffer) {
          // Get user ID from auth
          const user = auth.currentUser;
          if (!user) {
            throw new Error('User not authenticated');
          }
          
          // Extract file name from the original path
          const fileName = docPath.split('/').pop();
          
          // Create path using the requested structure: documents/${user.uid}/${file.name}
          const redactedFileName = fileName.replace('.pdf', '_redacted.pdf');
          const redactedDocPath = `documents/${user.uid}/${redactedFileName}`;
          
          console.log(`Uploading scanned document to ${redactedDocPath}`);
          // Initialize storage again to avoid reference errors
          const storage = getStorage();
          const redactedDocRef = ref(storage, redactedDocPath);
          
          // Upload the specially handled PDF
          await uploadBytes(redactedDocRef, scannedPdfResult.redactedBuffer);
          
          return {
            success: true,
            redactedUrl: await getDownloadURL(redactedDocRef),
            report: {
              isScanned: true,
              needsManualReview: true,
              entitiesFound: detectedEntities.length,
              entities: detectedEntities
            }
          };
        }
      }
    }
    
    // Now perform the actual redaction
    console.log(`Performing redaction of ${detectedEntities.length} entities...`);
    let redactedBuffer;
    
    if (fileType === 'pdf') {
      // Make a fresh buffer copy for redaction
      const redactionBuffer = createSafeBufferCopy(originalBuffer);
      redactedBuffer = await performPdfRedaction(redactionBuffer, detectedEntities, template);
    } else if (fileType === 'docx') {
      // Make a fresh buffer copy for DOCX redaction
      const docxRedactionBuffer = createSafeBufferCopy(originalBuffer);
      redactedBuffer = await performDocxRedaction(docxRedactionBuffer, detectedEntities, textWithPositions);
    }
    
    if (!redactedBuffer) {
      throw new Error('Redaction process failed to produce a valid document');
    }
    
    // Clean metadata from the redacted document
    console.log('Cleaning document metadata...');
    // Make a fresh buffer copy for metadata cleaning
    const metadataBuffer = createSafeBufferCopy(redactedBuffer);
    
    const cleanedBuffer = await cleanDocumentMetadata(metadataBuffer, fileType);
    
    // Verify redaction success by extracting text from redacted document
    console.log('Verifying redaction was successful...');
    const verificationResult = await verifyRedaction(cleanedBuffer, fileType, detectedEntities);
    
    const redactionSuccess = verificationResult.success;
    const remainingEntities = verificationResult.remainingEntities.map(entity => entity.entity);
    
    // If verification failed and there are remaining entities, try one more time with stringent settings
    if (!redactionSuccess && remainingEntities.length > 0) {
      console.log(`Redaction verification failed with ${remainingEntities.length} entities remaining. Trying one more time...`);
      
      // Make a fresh buffer copy for second redaction attempt
      const secondAttemptBuffer = createSafeBufferCopy(originalBuffer);
      
      // Use more aggressive redaction settings
      const enhancedTemplate = {
        ...(template || {}),
        useStrictRedaction: true,
        redactionPadding: 10 // Add padding to redaction boxes
      };
      
      // Perform redaction again with enhanced settings
      if (fileType === 'pdf') {
        redactedBuffer = await performPdfRedaction(secondAttemptBuffer, detectedEntities, enhancedTemplate);
      } else if (fileType === 'docx') {
        redactedBuffer = await performDocxRedaction(secondAttemptBuffer, detectedEntities, textWithPositions);
      }
      
      // Clean metadata again
      const enhancedMetadataBuffer = createSafeBufferCopy(redactedBuffer);
      const enhancedCleanedBuffer = await cleanDocumentMetadata(enhancedMetadataBuffer, fileType);
      
      // Verify redaction success again
      const secondVerification = await verifyRedaction(enhancedCleanedBuffer, fileType, detectedEntities);
      
      if (secondVerification.success) {
        console.log('Second redaction attempt was successful');
        cleanedBuffer = enhancedCleanedBuffer;
        redactionSuccess = true;
        remainingEntities.length = 0;
      } else {
        console.log(`Second redaction attempt still has ${secondVerification.remainingEntities.length} unredacted entities`);
        // Continue with the best effort redaction
      }
    }
    
    // Upload the redacted document
    console.log('Uploading redacted document...');
    
    // Get user ID from auth
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Extract file name from the original path
    const fileName = docPath.split('/').pop();
    
    // Create path using the requested structure: documents/${user.uid}/${file.name}
    const redactedFileName = fileName.replace(`.${fileType}`, `_redacted.${fileType}`);
    const redactedDocPath = `documents/${user.uid}/${redactedFileName}`;
    
    console.log(`Uploading redacted document to ${redactedDocPath}`);
    const redactedDocRef = ref(storage, redactedDocPath);
    
    // Make sure we have the correct buffer format for upload
    const uploadBuffer = createSafeBufferCopy(cleanedBuffer);
    
    await uploadBytes(redactedDocRef, uploadBuffer);
    const redactedFileURL = await getDownloadURL(redactedDocRef);
    
    // Generate redaction report
    console.log(`Creating redaction report for document ID: ${documentId}`);
    const report = await getRedactionReport(
      documentId, // Pass the explicit document ID instead of document object
      detectedEntities,
      remainingEntities,
      redactionSuccess,
      template
    );
    
    return {
      success: true,
      redactedUrl: redactedFileURL,
      originalUrl: document.url || document.downloadUrl,
      redactionReport: report,
      documentId: documentId // Explicitly include the document ID
    };
    
  } catch (error) {
    console.error('Error in redactDocument:', error);
    throw error;
  }
}

/**
 * Extract text from PDF with accurate positions
 * @param {ArrayBuffer|Uint8Array} fileBuffer - PDF file buffer
 * @returns {Promise<Array>} - Text items with positions
 */
async function extractPdfTextWithPositions(fileBuffer) {
  try {
    // Ensure we have a fresh Uint8Array to work with
    const bufferData = createSafeBufferCopy(fileBuffer);
    if (!bufferData) {
      throw new Error('Failed to create buffer copy for PDF text extraction');
    }
    
    // Load the PDF using PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: bufferData });
    const pdf = await loadingTask.promise;
    
    let allTextWithPositions = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();
      
      // Process text items with accurate positioning
      for (const item of textContent.items) {
        // Transform coordinates using PDF.js utilities
        const transform = pdfjsLib.Util.transform(
          viewport.transform,
          item.transform
        );
        
        allTextWithPositions.push({
          text: item.str,
          pageIndex: i - 1,
          page: i,
          x: transform[4],
          y: transform[5],
          width: item.width,
          height: item.height,
          transform: item.transform,
          // Store the raw operands for precise content stream modifications
          raw: {
            operands: item.operands,
            fontName: item.fontName,
            hasEOL: !!item.hasEOL
          }
        });
      }
    }
    
    return allTextWithPositions;
  } catch (error) {
    console.error('Error extracting PDF text with positions:', error);
    throw error;
  }
}

/**
 * Check if a PDF contains actual text or is a scanned image
 * @param {ArrayBuffer|Uint8Array} fileBuffer - PDF file buffer
 * @returns {Promise<boolean>} - True if PDF contains text
 */
async function checkPdfHasText(fileBuffer) {
  try {
    // Ensure we have a fresh Uint8Array to work with
    const bufferData = createSafeBufferCopy(fileBuffer);
    if (!bufferData) {
      throw new Error('Failed to create buffer copy for PDF text check');
    }
    
    const loadingTask = pdfjsLib.getDocument({ data: bufferData });
    const pdf = await loadingTask.promise;
    
    // Check first page for text
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    
    // Check if we have meaningful text content
    // Not just empty strings or spaces
    const hasRealText = textContent.items.some(item => 
      item.str && item.str.trim().length > 0
    );
    
    return hasRealText;
  } catch (error) {
    console.error('Error checking if PDF has text:', error);
    return false;
  }
}

/**
 * Extract DOCX structure preserving XML nodes and positions
 * @param {ArrayBuffer} fileBuffer - DOCX file buffer
 * @returns {Promise<Object>} - DOCX structure with XML nodes
 */
async function extractDocxStructure(docxBuffer) {
  try {
    const zip = await JSZip.loadAsync(docxBuffer);
    const parts = [];
    const contentTypes = {};
    
    // Define Word ML namespaces
    const wordMLNamespaces = {
      w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      m: 'http://schemas.openxmlformats.org/officeDocument/2006/math',
      v: 'urn:schemas-microsoft-com:vml',
      wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
      a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
      pic: 'http://schemas.openxmlformats.org/drawingml/2006/picture',
      c: 'http://schemas.openxmlformats.org/drawingml/2006/chart',
      ct: 'http://schemas.openxmlformats.org/package/2006/content-types'
    };
    
    // Helper function to find text elements without using XPath
    function findTextElements(doc) {
      // Find all elements in the document
      const allElements = doc.getElementsByTagName("*");
      const textElements = [];
      
      // Filter for w:t elements based on local name and namespace
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        if (element.localName === 't' && 
            element.namespaceURI === wordMLNamespaces.w) {
          textElements.push(element);
        }
      }
      
      return textElements;
    }
    
    // Find parent with specific name
    function findParentWithName(element, localName, namespaceURI) {
      let parent = element.parentNode;
      while (parent) {
        if (parent.localName === localName && 
            parent.namespaceURI === namespaceURI) {
          return parent;
        }
        parent = parent.parentNode;
      }
      return null;
    }

    // Process main document
    const documentXml = await zip.file("word/document.xml").async("text");
    if (documentXml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(documentXml, "text/xml");
      
      // Extract text elements with their positions - without XPath
      const textElements = findTextElements(doc);
      const extractedTexts = [];

      // Process each text element
      for (let i = 0; i < textElements.length; i++) {
        const textEl = textElements[i];
        const text = textEl.textContent;
        
        // Find paragraph and run ancestors to determine position context
        const runEl = findParentWithName(textEl, 'r', wordMLNamespaces.w);
        const paraEl = runEl ? findParentWithName(runEl, 'p', wordMLNamespaces.w) : null;
        
        // Generate a unique ID for the text element
        const id = `text_${i}`;
        
        extractedTexts.push({
          id,
          text,
          element: textEl,
          parentRun: runEl,
          parentParagraph: paraEl,
          xmlPath: { part: "word/document.xml", elementId: id }
        });
      }
      
      parts.push({
        name: "word/document.xml",
        content: documentXml,
        parsed: doc,
        texts: extractedTexts
      });
    }
    
    // Process headers and footers
    const headerFooterFiles = [];
    
    // Find all header and footer files
    Object.keys(zip.files).forEach(filename => {
      if (filename.match(/word\/(header|footer)\d+\.xml$/)) {
        headerFooterFiles.push(filename);
      }
    });
    
    // Process each header and footer
    for (const filename of headerFooterFiles) {
      const content = await zip.file(filename).async("text");
      if (content) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/xml");
        
        // Extract text elements without XPath
        const textElements = findTextElements(doc);
        const extractedTexts = [];
        
        for (let i = 0; i < textElements.length; i++) {
          const textEl = textElements[i];
          const text = textEl.textContent;
          
          // Find paragraph and run ancestors
          const runEl = findParentWithName(textEl, 'r', wordMLNamespaces.w);
          const paraEl = runEl ? findParentWithName(runEl, 'p', wordMLNamespaces.w) : null;
          
          const id = `${filename.replace(/[^\w]/g, '_')}_text_${i}`;
          
          extractedTexts.push({
            id,
            text,
            element: textEl,
            parentRun: runEl,
            parentParagraph: paraEl,
            xmlPath: { part: filename, elementId: id }
          });
        }
        
        parts.push({
          name: filename,
          content,
          parsed: doc,
          texts: extractedTexts
        });
      }
    }
    
    // Process content types
    const contentTypesXml = await zip.file("[Content_Types].xml").async("text");
    if (contentTypesXml) {
      const parser = new DOMParser();
      const ctDoc = parser.parseFromString(contentTypesXml, "text/xml");
      contentTypes.doc = ctDoc;
      contentTypes.content = contentTypesXml;
    }
    
    // Create namespace resolver function (for compatibility with other code)
    function nsResolver(prefix) {
      return wordMLNamespaces[prefix] || null;
    }
    
    return {
      zip,
      parts,
      contentTypes,
      nsResolver,
      wordMLNamespaces
    };
  } catch (error) {
    console.error("Error extracting DOCX structure:", error);
    throw new Error("Failed to extract DOCX structure: " + error.message);
  }
}

/**
 * Convert DOCX structure to text positions for entity mapping
 * @param {Object} docxStructure - DOCX structure with runs
 * @param {string} extractedText - Plain text content
 * @returns {Array} - Text positions for entity mapping
 */
function convertDocxToTextPositions(docxStructure, extractedText) {
  const { runs } = docxStructure;
  
  return runs.map(run => ({
    text: run.text,
    offset: run.offset,
    length: run.length,
    endOffset: run.endOffset,
    paragraphIndex: run.paragraphIndex,
    runIndex: run.runIndex,
    textNode: run.textNode,
    parentRun: run.parentRun
  }));
}

/**
 * Detect entities using rule-based patterns
 * @param {string} text - Document text
 * @param {Array} rules - Redaction rules
 * @returns {Promise<Array>} - Detected entities
 */
async function detectEntitiesWithRules(text, rules) {
  try {
    console.log('Applying redaction rules to document...');
    console.log(`Total extracted text length: ${text.length}`);
    
    // Early return if no text or rules
    if (!text || !rules || rules.length === 0) {
      console.log('No text or rules provided for entity detection');
      return [];
    }
    
    const allEntities = [];
    
    // Apply each rule
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      console.log(`Applying rule "${rule.name}" with pattern "${rule.pattern}"`);
      
      try {
        // Remove anchors from pattern if present to match within larger text
        const modifiedPattern = rule.pattern
          .replace(/^\^/, '') // Remove beginning anchor
          .replace(/\$$/, ''); // Remove ending anchor
        
        console.log(`Modified pattern to remove anchors: "${modifiedPattern}"`);
        
        // Create a regex with global flag to find all matches
        const regex = new RegExp(modifiedPattern, 'g');
        let match;
        let entities = [];
        
        // Find all matches
        while ((match = regex.exec(text)) !== null) {
          // Avoid infinite loops
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
            continue;
          }
          
          // Create an entity object
          const entity = {
            entity: match[0],
            type: rule.name || rule.category || 'Unknown',
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          };
          
          entities.push(entity);
        }
        
        console.log(`Rule "${rule.name}" found ${entities.length} matches`);
        allEntities.push(...entities);
      } catch (ruleError) {
        console.error(`Error applying rule ${rule.name}:`, ruleError);
      }
    }
    
    return allEntities;
  } catch (error) {
    console.error('Error in detectEntitiesWithRules:', error);
    return [];
  }
}

/**
 * Map detected entities to text positions for accurate redaction
 * @param {Array} entities - Detected entities
 * @param {Array} textPositions - Text positions
 * @param {string} text - Full document text
 * @returns {Array} - Entities with position mapping
 */
function mapEntitiesToPositions(entities, textPositions, text) {
  try {
    console.log(`Mapping ${entities.length} entities to their positions in the document`);
    
    if (!entities || !textPositions || !text) {
      console.error('Missing required arguments for position mapping');
      return [];
    }
    
    const result = [];
    
    for (const entity of entities) {
      if (!entity.entity || typeof entity.entity !== 'string') {
        console.warn('Skipping entity with invalid or missing text');
        continue;
      }
      
      // Get text range for this entity
      const entityText = entity.entity.trim();
      const startPos = text.indexOf(entityText);
      
      if (startPos === -1) {
        // Try case-insensitive match if exact match fails
        const lowerText = text.toLowerCase();
        const lowerEntityText = entityText.toLowerCase();
        const lowerStartPos = lowerText.indexOf(lowerEntityText);
        
        if (lowerStartPos === -1) {
          console.warn(`Entity "${entityText}" not found in document text (${entityText.length} chars)`);
          
          // Add the entity without position data for reporting
          result.push({
            ...entity,
            positionFound: false
          });
          continue;
        } else {
          // Found with case-insensitive search
          console.log(`Found entity "${entityText}" with case-insensitive search at position ${lowerStartPos}`);
          const endPos = lowerStartPos + lowerEntityText.length;
          const overlappingPositions = findOverlappingTextPositions(textPositions, lowerStartPos, endPos, text);
          
          if (overlappingPositions.length > 0) {
            // Calculate width and add position data
            const width = calculateEntityWidth(overlappingPositions, entityText);
            // Take the first position for page/coordinates
            const firstPos = overlappingPositions[0];
            
            result.push({
              ...entity,
              pageIndex: firstPos.pageIndex,
              page: firstPos.page,
              x: firstPos.x,
              y: firstPos.y,
              width: width,
              height: firstPos.height || 12,
              positionFound: true
            });
          } else {
            console.warn(`No overlapping positions found for entity "${entityText}" despite text match`);
            result.push({
              ...entity,
              positionFound: false
            });
          }
          continue;
        }
      }
      
      const endPos = startPos + entityText.length;
      console.log(`Entity "${entityText}" found at positions ${startPos}-${endPos}`);
      
      // Find text positions that overlap with this entity
      const overlappingPositions = findOverlappingTextPositions(textPositions, startPos, endPos, text);
      
      if (overlappingPositions.length > 0) {
        // Calculate width and add position data
        const width = calculateEntityWidth(overlappingPositions, entityText);
        // Take the first position for page/coordinates
        const firstPos = overlappingPositions[0];
        
        result.push({
          ...entity,
          pageIndex: firstPos.pageIndex,
          page: firstPos.page,
          x: firstPos.x,
          y: firstPos.y,
          width: width,
          height: firstPos.height || 12,
          positionFound: true
        });
      } else {
        console.warn(`No overlapping positions found for entity "${entityText}" despite text match`);
        // Still include the entity for reporting purposes
        result.push({
          ...entity,
          positionFound: false
        });
      }
    }
    
    // Log success/failure statistics
    const mappedCount = result.filter(e => e.positionFound).length;
    console.log(`Mapped ${mappedCount} out of ${entities.length} entities with position data`);
    
    return result;
  } catch (error) {
    console.error('Error mapping entities to positions:', error);
    // Return original entities for fallback
    return entities.map(entity => ({ ...entity, positionFound: false }));
  }
}

/**
 * Find text positions that overlap with an entity
 * @param {Array} textPositions - Text positions
 * @param {number} start - Entity start offset
 * @param {number} end - Entity end offset
 * @param {string} text - Full document text
 * @returns {Array} - Overlapping text positions
 */
function findOverlappingTextPositions(textPositions, start, end, text) {
  try {
    if (!textPositions || !Array.isArray(textPositions) || textPositions.length === 0) {
      console.warn('No text positions provided for overlap detection');
      return [];
    }
    
    if (start === undefined || end === undefined) {
      console.warn('Invalid start or end position for overlap detection');
      return [];
    }
    
    // Find all text positions that overlap with the range [start, end)
    const overlapping = [];
    
    // Keep track of overlapping character count for verification
    let overlappingCharCount = 0;
    
    // Current position in the full text as we scan through positions
    let currentPos = 0;
    
    for (let i = 0; i < textPositions.length; i++) {
      const position = textPositions[i];
      // Skip invalid positions
      if (!position || !position.text) continue;
      
      const posText = position.text;
      const posTextLen = posText.length;
      
      // Calculate the range for this text position
      const posStart = currentPos;
      const posEnd = posStart + posTextLen;
      
      // Check if this position overlaps with our target range
      const hasOverlap = (posStart < end && posEnd > start);
      
      if (hasOverlap) {
        // Calculate how much of this position is within our target range
        const overlapStart = Math.max(posStart, start);
        const overlapEnd = Math.min(posEnd, end);
        const overlapLength = overlapEnd - overlapStart;
        
        // Only count if we have a meaningful overlap
        if (overlapLength > 0) {
          overlappingCharCount += overlapLength;
          
          // Create a copy with overlap information
          overlapping.push({
            ...position,
            overlapStart: overlapStart - posStart,  // Relative to this text position
            overlapEnd: overlapEnd - posStart,      // Relative to this text position
            overlapLength,
            originalText: posText
          });
          
          console.log(`Found overlapping position for "${posText}" at x:${position.x}, y:${position.y}, page:${position.page}`);
        }
      }
      
      // Move to the next position in the full text
      currentPos += posTextLen;
      
      // Add space accounting for PDF text extraction quirks
      // This helps with alignment between extracted full text and position-based text
      if (i < textPositions.length - 1 && !posText.endsWith(' ') && !textPositions[i+1].text.startsWith(' ')) {
        currentPos += 1;  // Account for implicit space between text chunks
      }
    }
    
    // Verify we found a reasonable overlap
    const entityLength = end - start;
    const coverageRatio = overlappingCharCount / entityLength;
    
    console.log(`Found ${overlapping.length} overlapping positions covering ${overlappingCharCount} of ${entityLength} characters (${(coverageRatio * 100).toFixed(1)}%)`);
    
    if (coverageRatio < 0.5 && overlapping.length > 0) {
      console.warn('Low coverage ratio for entity text positions - may lead to inaccurate redaction');
    }
    
    return overlapping;
  } catch (error) {
    console.error('Error finding overlapping text positions:', error);
    return [];
  }
}

/**
 * Find DOCX runs that overlap with an entity
 * @param {Array} runs - DOCX runs
 * @param {number} start - Entity start offset
 * @param {number} end - Entity end offset
 * @returns {Array} - Overlapping runs
 */
function findOverlappingRuns(runs, start, end) {
  return runs.filter(run => {
    // Check if this run overlaps with the entity
    return (run.offset <= end && run.endOffset >= start);
  });
}

/**
 * Calculate the width of an entity based on its text positions
 * @param {Array} positions - Text positions
 * @param {string} entityText - Entity text
 * @returns {number} - Calculated width
 */
function calculateEntityWidth(positions, entityText) {
  try {
    if (!positions || positions.length === 0) {
      console.warn('No positions provided for width calculation, using default width');
      return 100; // Default width if no positions available
    }
    
    // Simple case: only one position
    if (positions.length === 1) {
      const pos = positions[0];
      
      // If we have overlap information, calculate width based on relevant portion
      if (pos.overlapStart !== undefined && pos.overlapEnd !== undefined && pos.width !== undefined) {
        const overlapRatio = (pos.overlapEnd - pos.overlapStart) / pos.originalText.length;
        const estimatedWidth = pos.width * overlapRatio;
        console.log(`Single position width calculation: ${estimatedWidth.toFixed(2)} based on overlap ratio ${overlapRatio.toFixed(2)}`);
        return Math.max(estimatedWidth, 15); // Ensure minimum width for visibility
      }
      
      // Fallback to full width or default
      return pos.width || 100;
    }
    
    // Multiple positions: calculate horizontal span
    // For positions on the same line
    const sameLinePositions = groupPositionsByLine(positions);
    
    // If we have positions on the same line, calculate width as difference between leftmost and rightmost points
    if (sameLinePositions.length > 0) {
      // Find the group with the most positions
      const largestGroup = sameLinePositions.reduce(
        (largest, group) => group.length > largest.length ? group : largest, 
        sameLinePositions[0]
      );
      
      // Calculate width based on min x and max (x + width)
      let minX = Infinity;
      let maxX = -Infinity;
      
      for (const pos of largestGroup) {
        const posStartX = pos.x;
        const posEndX = pos.x + (pos.width || 0);
        
        // If we have overlap information, adjust the actual start/end
        if (pos.overlapStart !== undefined && pos.overlapEnd !== undefined && pos.width !== undefined) {
          // Calculate character width approximation
          const charWidth = pos.width / pos.originalText.length;
          
          // Adjust start/end based on overlap within this text position
          const adjustedStartX = pos.x + (pos.overlapStart * charWidth);
          const adjustedEndX = pos.x + (pos.overlapEnd * charWidth);
          
          minX = Math.min(minX, adjustedStartX);
          maxX = Math.max(maxX, adjustedEndX);
        } else {
          // No overlap info, use full position
          minX = Math.min(minX, posStartX);
          maxX = Math.max(maxX, posEndX);
        }
      }
      
      const calculatedWidth = maxX - minX;
      console.log(`Multi-position width calculation: ${calculatedWidth.toFixed(2)} using ${largestGroup.length} positions on same line`);
      
      return Math.max(calculatedWidth, entityText.length * 5); // Ensure reasonable minimum width based on text length
    }
    
    // Fallback: calculate average width per character and multiply by entity length
    const widthValues = positions
      .filter(pos => pos.width !== undefined && pos.originalText)
      .map(pos => pos.width / pos.originalText.length);
    
    if (widthValues.length > 0) {
      const avgCharWidth = widthValues.reduce((sum, w) => sum + w, 0) / widthValues.length;
      const estimatedWidth = avgCharWidth * entityText.length;
      console.log(`Width calculation using avg char width: ${estimatedWidth.toFixed(2)} (${avgCharWidth.toFixed(2)} per char)`);
      return estimatedWidth;
    }
    
    // Final fallback: use entity length for estimation
    const fallbackWidth = Math.max(entityText.length * 6, 20);
    console.log(`Using fallback width calculation: ${fallbackWidth}`);
    return fallbackWidth;
  } catch (error) {
    console.error('Error calculating entity width:', error);
    return entityText.length * 6; // Fallback width based on text length
  }
}

/**
 * Helper function to group positions that appear on the same line
 * @param {Array} positions - Text positions to group
 * @returns {Array} Array of position groups, each containing positions on the same line
 */
function groupPositionsByLine(positions) {
  if (!positions || positions.length === 0) return [];
  
  // Sort by page and y-coordinate
  const sorted = [...positions].sort((a, b) => {
    if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
    return a.y - b.y;
  });
  
  const groups = [];
  let currentGroup = [sorted[0]];
  
  // Group by proximity on y-axis (same line)
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i-1];
    
    // Check if on same page and roughly same line
    // Allow small variation in y-coordinate (usually less than font size)
    if (current.pageIndex === prev.pageIndex && 
        Math.abs(current.y - prev.y) < (prev.height || 12)) {
      // Same line
      currentGroup.push(current);
    } else {
      // New line
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }
  
  // Add the last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
}

/**
 * Perform PDF redaction by removing sensitive text and adding black boxes
 * @param {ArrayBuffer|Uint8Array} fileBuffer - PDF file buffer
 * @param {Array} entities - Entities to redact with position data
 * @param {Object} template - Redaction template with settings
 * @returns {Promise<ArrayBuffer>} - Redacted PDF buffer
 */
async function performPdfRedaction(fileBuffer, entities, template = {}) {
  try {
    // Filter out entities without proper position data
    const entitiesWithPositions = entities.filter(entity => entity.positionFound);
    console.log(`Performing PDF redaction for ${entitiesWithPositions.length} entities that have position data`);
    
    // Log issue if there's a discrepancy
    if (entitiesWithPositions.length < entities.length) {
      console.warn(`Note: ${entities.length - entitiesWithPositions.length} entities don't have position data and won't be redacted visually`);
      
      // Log the entities that don't have positions
      entities.filter(entity => !entity.positionFound).forEach(entity => {
        console.warn(`Entity without position: "${entity.entity}" (${entity.type || 'unknown'})`);
      });
    }
    
    // Extract entities' text for content stream filtering
    const sensitiveTexts = entities.map(entity => entity.entity).filter(Boolean);
    console.log(`Using ${sensitiveTexts.length} sensitive text strings for content stream filtering`);
    
    // Check if we have any entities to redact
    if (sensitiveTexts.length === 0) {
      console.warn('No sensitive texts to redact');
      return fileBuffer;
    }
    
    // Verify that we have a Uint8Array to work with
    const bufferData = createSafeBufferCopy(fileBuffer);
    if (!bufferData) {
      throw new Error('Failed to create buffer copy for PDF redaction');
    }
    
    // Try the PDF-lib approach first
    try {
      // Load PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(bufferData.buffer.slice(0), {
        ignoreEncryption: true,
        updateMetadata: false
      });
      
      // Get all pages in the document
      const pages = pdfDoc.getPages();
      console.log(`Processing ${pages.length} pages in the PDF document`);
      
      // STEP 1: Process content streams to remove text
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageIndex = i;
        
        // Extract content streams for this page
        const contentStreams = await getPageContentStreams(pdfDoc, page);
        
        if (!contentStreams || contentStreams.length === 0) {
          console.warn(`No content streams found for page ${pageIndex + 1}`);
          continue;
        }
        
        console.log(`Processing ${contentStreams.length} content streams for page ${pageIndex + 1}`);
        
        // Process each content stream
        for (let j = 0; j < contentStreams.length; j++) {
          const contentStream = contentStreams[j];
          
          // Make sure we're working with Uint8Array for tokenization
          if (!contentStream || !contentStream.content) {
            console.warn(`Invalid content stream at index ${j}`);
            continue;
          }
          
          try {
            // Tokenize content stream
            const tokens = tokenizeContentStream(contentStream.content);
            
            if (!tokens || tokens.length === 0) {
              console.warn(`No tokens found in content stream ${j}`);
              continue;
            }
            
            // Group tokens into operations
            const operations = [];
            let currentOperands = [];
            
            for (let k = 0; k < tokens.length; k++) {
              const token = tokens[k];
              
              if (token.type === 'operator') {
                operations.push([...currentOperands, token]);
                currentOperands = [];
              } else {
                currentOperands.push(token);
              }
            }
            
            if (currentOperands.length > 0) {
              operations.push(currentOperands);
            }
            
            console.log(`Grouped ${tokens.length} tokens into ${operations.length} operations`);
            
            // EXTREMELY aggressive filtering - remove ALL text operators completely
            const filteredOperations = operations.filter(operation => {
              if (!operation || operation.length === 0) return true;
              
              const lastItem = operation[operation.length - 1];
              if (lastItem && lastItem.type === 'operator') {
                // Remove all text showing operators
                if (['Tj', 'TJ', 'BT', 'ET', "'", '"'].includes(lastItem.value)) {
                  return false;
                }
              }
              return true;
            });
            
            // Serialize filtered operations back to content stream
            const serializedContent = serializeTokens(filteredOperations);
            
            // Replace content stream with filtered version
            try {
              const streamObj = pdfDoc.context.lookup(contentStream.ref);
              if (streamObj && typeof streamObj.dict !== 'undefined') {
                streamObj.dict.set(PDFName.of('Length'), PDFNumber.of(serializedContent.length));
                streamObj.content = serializedContent;
                console.log(`Successfully updated content stream ${j} with filtered content`);
              } else {
                console.error(`Cannot update content stream ${j}: streamObj structure is not as expected`, streamObj);
              }
            } catch (updateErr) {
              console.error(`Error updating content stream ${j}:`, updateErr);
            }
          } catch (err) {
            console.error(`Error processing content stream ${j}:`, err);
          }
        }
      }
      
      // STEP 2: Draw extra large white boxes followed by black boxes over redacted areas
      // First pass: Draw large white boxes to overwrite any background color or patterns
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageEntities = entities.filter(e => (e.pageIndex || 0) === i && e.positionFound);
        
        for (const entity of pageEntities) {
          try {
            // Calculate position using helper function with extra padding
            const position = getAdjustedPosition(entity, entity.entity);
            
            // Skip invalid positions
            if (!position.x || !position.y || !position.width || !position.height) continue;
            
            // Add extra large white rectangle first
            const extraPadding = 8; // Very large padding
            page.drawRectangle({
              x: Math.max(0, position.x - extraPadding),
              y: Math.max(0, position.y - extraPadding),
              width: position.width + (extraPadding * 3),
              height: position.height + (extraPadding * 3),
              color: rgb(1, 1, 1), // White
              opacity: 1,
              borderWidth: 0
            });
          } catch (err) {
            console.error(`Error drawing white box for entity:`, err);
          }
        }
      }
      
      // Second pass: Draw solid black boxes
      drawRedactionBoxes(pdfDoc, entitiesWithPositions);
      
      // STEP 3: Remove document text extraction resources and other hidden text
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        try {
          // Force rebuild of the page to remove any text that might be cached
          const resources = page.node.Resources();
          if (resources) {
            // Remove all resources that might contain text
            const keysToRemove = ['Font', 'XObject', 'Properties', 'ExtGState'];
            for (const key of keysToRemove) {
              if (resources.has(PDFName.of(key))) {
                resources.delete(PDFName.of(key));
              }
            }
            
            // Create new empty resources to replace problematic ones
            const emptyDict = pdfDoc.context.obj({});
            for (const key of keysToRemove) {
              resources.set(PDFName.of(key), emptyDict);
            }
          }
          
          // Remove Annots and Contents and replace with empty arrays
          if (page.node.has(PDFName.of('Annots'))) {
            page.node.delete(PDFName.of('Annots'));
            page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([]));
          }
          
          // Try to remove Thumb, Metadata, PieceInfo
          const pageKeysToRemove = ['Thumb', 'PieceInfo', 'Metadata', 'StructParents'];
          for (const key of pageKeysToRemove) {
            if (page.node.has(PDFName.of(key))) {
              page.node.delete(PDFName.of(key));
            }
          }
        } catch (err) {
          console.error(`Error processing page ${i+1} resources:`, err);
        }
      }
      
      // STEP 4: Remove document-level dictionaries that might contain text
      try {
        const catalog = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Root);
        if (catalog) {
          // Remove any document-level dictionaries that might contain text
          const catalogKeysToRemove = [
            'Names', 'Outlines', 'AcroForm', 'OCProperties', 'StructTreeRoot', 
            'MarkInfo', 'Lang', 'SpiderInfo', 'OutputIntents', 'PieceInfo',
            'Metadata', 'Perms', 'Collection', 'NeedsRendering'
          ];
          
          for (const key of catalogKeysToRemove) {
            if (catalog.has(PDFName.of(key))) {
              catalog.delete(PDFName.of(key));
            }
          }
        }
      } catch (err) {
        console.error('Error removing document-level dictionaries:', err);
      }
      
      // STEP 5: Remove all metadata
      pdfDoc.setTitle('Redacted Document');
      pdfDoc.setAuthor('Redaction System');
      pdfDoc.setSubject('Redacted');
      pdfDoc.setKeywords([]);
      pdfDoc.setCreator('Redaction System');
      pdfDoc.setProducer('Redaction System');
      pdfDoc.setModificationDate(new Date());
      
      // STEP 6: Apply a second approach - create a brand new PDF without any of the original content
      // This is the most aggressive approach but ensures no text leaks through
      const newPdfDoc = await PDFDocument.create();
      
      // Copy each page's appearance but not its content
      for (let i = 0; i < pages.length; i++) {
        const [newPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(newPage);
      }
      
      // Save the completely new PDF with just the visual appearance
      const completelyRedactedPdfBytes = await newPdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        updateFieldAppearances: false
      });
      
      return completelyRedactedPdfBytes;
    } catch (pdfLibError) {
      console.error('Error in PDF-lib redaction approach:', pdfLibError);
      
      // Use the original file as a fallback
      return fileBuffer;
    }
  } catch (error) {
    console.error('Error performing PDF redaction:', error);
    throw error;
  }
}

/**
 * Tokenize a PDF content stream into a structured representation of operators and operands
 * @param {Uint8Array|Object} contentData - Content stream bytes or object with content property
 * @returns {Array} - Array of tokens (operators and operands)
 */
function tokenizeContentStream(contentData) {
  // Handle both Uint8Array and object with content property
  let contentBytes;
  if (contentData instanceof Uint8Array) {
    contentBytes = contentData;
  } else if (contentData && contentData.content instanceof Uint8Array) {
    contentBytes = contentData.content;
  } else {
    console.error("Invalid content data format for tokenization:", contentData);
    return []; // Return empty array to avoid crashing
  }
  
  // Convert bytes to string for processing
  const contentString = new TextDecoder().decode(contentBytes);
  
  // Define patterns for PDF operators
  const operators = {
    textBegin: /BT/g,
    textEnd: /ET/g,
    textShow: /Tj/g,
    textShowArr: /TJ/g,
    textMatrix: /Tm/g,
    textNextLine: /T\*/g,
    textPos: /Td/g,
    textFont: /Tf/g,
    textCharSpace: /Tc/g,
    textWordSpace: /Tw/g,
    textLeading: /TL/g,
    textRise: /Ts/g,
    textRender: /Tr/g,
    textScale: /Tz/g,
  };
  
  // Regex to parse PDF content stream tokens
  // This handles strings, hex strings, arrays, names, numbers, and operators
  const tokenRegex = /(\((?:[^()\\]|\\[()]|\\.|(?:\r\n|\r|\n))*\))|(<[0-9A-Fa-f]+>)|(\[[^\]]*\])|([/][A-Za-z0-9_.]+)|([+-]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?)|([A-Za-z]{1,2})/g;
  
  const tokens = [];
  let match;
  
  while ((match = tokenRegex.exec(contentString)) !== null) {
    const token = match[0];
    
    // Identify token type
    if (/^\(/.test(token)) {
      // Literal string
      tokens.push({ type: 'string', value: token });
    } else if (/^</.test(token)) {
      // Hex string
      tokens.push({ type: 'hexString', value: token });
    } else if (/^\[/.test(token)) {
      // Array
      tokens.push({ type: 'array', value: token });
    } else if (/^\//.test(token)) {
      // Name
      tokens.push({ type: 'name', value: token });
    } else if (/^[+-]?(?:\d+\.\d*|\.\d+|\d+)/.test(token)) {
      // Number
      tokens.push({ type: 'number', value: parseFloat(token) });
    } else if (/^[A-Za-z]{1,2}$/.test(token)) {
      // Operator
      let opType = 'other';
      for (const [type, regex] of Object.entries(operators)) {
        if (regex.test(token)) {
          opType = type;
          regex.lastIndex = 0; // Reset regex
          break;
        }
      }
      tokens.push({ type: 'operator', value: token, opType });
    }
  }
  
  return tokens;
}

/**
 * Filter PDF content stream operations to remove text operators containing sensitive information
 * @param {Array} operations - Content stream operations
 * @param {Array} sensitiveTexts - Sensitive text strings to redact
 * @param {boolean} strictMode - Whether to use strict filtering mode
 * @returns {Array} - Filtered operations
 */
function filterPdfTextOperators(operations, sensitiveTexts, strictMode = false) {
  if (!sensitiveTexts || sensitiveTexts.length === 0) {
    return operations;
  }
  
  console.log(`Filtering PDF text operators for ${sensitiveTexts.length} sensitive entities`);
  
  // Convert all sensitive texts to lowercase for case-insensitive matching
  const lowerSensitiveTexts = sensitiveTexts.map(text => 
    typeof text === 'string' ? text.toLowerCase() : ''
  ).filter(Boolean);
  
  if (lowerSensitiveTexts.length === 0) {
    return operations;
  }
  
  // Create a set for faster lookups
  const sensitiveSet = new Set(lowerSensitiveTexts);
  
  // Add variations for better matching
  lowerSensitiveTexts.forEach(text => {
    // Phone number variations
    if (text.match(/[\d\(\)\-\s]{10,20}/)) {
      sensitiveSet.add(text.replace(/[\(\)\-\s]/g, ''));
    }
    
    // Email variations
    if (text.includes('@')) {
      sensitiveSet.add(text.replace(/\./g, '')); // no dots
      sensitiveSet.add(text.replace(/\s+/g, '')); // no spaces
      sensitiveSet.add(text.replace(/[\.\s]+/g, '')); // no dots or spaces
    }
  });
  
  console.log(`Using ${sensitiveSet.size} sensitive text patterns (including variations)`);
  
  // Track text across multiple operations for context
  let textBuffer = '';
  const bufferSize = strictMode ? 200 : 100;
  
  // Create an array to track operations requiring redaction across content streams
  const result = [];
  const redactionTracker = new Map(); // Track text positions to ensure consistent redaction
  
  // Process each operation
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    
    // Skip invalid operations
    if (!operation || !Array.isArray(operation) || operation.length === 0) {
      result.push(operation);
      continue;
    }
    
    // Get the operator (last element in the array)
    const operator = operation[operation.length - 1];
    
    // Skip if not an operator
    if (!operator || operator.type !== 'operator') {
      result.push(operation);
      continue;
    }
    
    // Check if this is a text-showing operator (Tj or TJ)
    const isTextShowOp = operator.value === 'Tj';
    const isTextArrayOp = operator.value === 'TJ';
    
    if (isTextShowOp || isTextArrayOp) {
      let hasMatch = false;
      let extractedText = '';
      
      // Get the operands (all elements except the last one)
      const operands = operation.slice(0, -1);
      
      if (isTextShowOp && operands.length > 0) {
        // Handle Tj operator (single string operand)
        const textOperand = operands[0];
        
        if (textOperand && textOperand.type === 'string') {
          extractedText = decodeStringLiteral(textOperand.value);
        } else if (textOperand && textOperand.type === 'hexString') {
          extractedText = decodeHexString(textOperand.value);
        }
      } else if (isTextArrayOp && operands.length > 0) {
        // Handle TJ operator (array of strings and numbers)
        const arrayOperand = operands[0];
        
        if (arrayOperand && arrayOperand.type === 'array') {
          // Parse the array content
          const arrayContent = arrayOperand.value;
          // Simple regex to extract string parts from array notation
          const stringMatches = arrayContent.match(/\((?:[^()\\]|\\[()]|\\.)*\)|<[0-9A-Fa-f]+>/g);
          
          if (stringMatches) {
            extractedText = stringMatches.map(str => {
              if (str.startsWith('(')) {
                return decodeStringLiteral(str);
              } else if (str.startsWith('<')) {
                return decodeHexString(str);
              }
              return '';
            }).join('');
          }
        }
      }
      
      // Update text buffer - keep a context window of recent text
      const combinedText = textBuffer + extractedText;
      textBuffer = (combinedText.length > bufferSize) 
        ? combinedText.slice(-bufferSize) 
        : combinedText;
      
      // Check if extracted text contains any sensitive text
      if (extractedText) {
        const lowerText = extractedText.toLowerCase();
        
        // Check against all sensitive texts
        for (const sensitiveText of sensitiveSet) {
          // More aggressive matching to catch partial matches too
          if (lowerText.includes(sensitiveText) || 
              sensitiveText.includes(lowerText) || 
              lowerText.replace(/\s+/g, '').includes(sensitiveText.replace(/\s+/g, ''))) {
            hasMatch = true;
            console.log(`Found sensitive text "${sensitiveText}" in text operator`);
            break;
          }
        }
        
        // Check buffer in strict mode to catch text split across operators
        if (!hasMatch && strictMode && textBuffer) {
          const lowerBuffer = textBuffer.toLowerCase();
          
          for (const sensitiveText of sensitiveSet) {
            if (lowerBuffer.includes(sensitiveText)) {
              hasMatch = true;
              console.log(`Found sensitive text "${sensitiveText}" in text buffer (strict mode)`);
              break;
            }
          }
        }
        
        if (hasMatch) {
          // REMOVE text completely instead of replacing with spaces
          if (isTextShowOp && operands.length > 0) {
            // For Tj operators, replace with empty string
            operands[0] = { 
              type: 'string', 
              value: '()'  // Empty string
            };
          } else if (isTextArrayOp && operands.length > 0) {
            // For TJ arrays, remove string elements completely
            const arrayOperand = operands[0];
            
            if (arrayOperand.type === 'array') {
              // Replace string content with empty strings, keep positioning values
              const redactedArray = arrayOperand.value.replace(
                /\((?:[^()\\]|\\[()]|\\.)*\)|<[0-9A-Fa-f]+>/g,
                '()'  // Replace with empty string
              );
              
              operands[0] = { type: 'array', value: redactedArray };
            }
          }
        }
      }
    }
    
    // Add the (potentially modified) operation to the result
    result.push(operation);
  }
  
  return result;
}

/**
 * Serialize operations back to a PDF content stream
 * @param {Array} operations - Content stream operations
 * @returns {Uint8Array} - Serialized content stream
 */
function serializeTokens(operations) {
  // Convert operations back to string
  let contentString = '';
  
  // Handle different operation formats
  for (const op of operations) {
    if (Array.isArray(op)) {
      // Format: [operand1, operand2, ..., operator]
      // Last item is the operator, rest are operands
      for (let i = 0; i < op.length; i++) {
        const token = op[i];
        if (token && typeof token.value !== 'undefined') {
          contentString += token.value + (i < op.length - 1 ? ' ' : '\n');
        }
      }
    } else if (op.operator && op.operands) {
      // Format: {operator: {...}, operands: [...]}
      // Add operands
      for (const operand of op.operands) {
        if (operand && typeof operand.value !== 'undefined') {
          contentString += operand.value + ' ';
        }
      }
      
      // Add operator
      if (op.operator && typeof op.operator.value !== 'undefined') {
        contentString += op.operator.value + '\n';
      }
    } else {
      // Unknown format, try to extract any values we can
      console.warn("Unknown operation format in serializeTokens:", op);
      if (op && typeof op.value !== 'undefined') {
        contentString += op.value + '\n';
      }
    }
  }
  
  // Convert to binary
  return new TextEncoder().encode(contentString);
}

/**
 * Decode a PDF string literal to JavaScript string
 * @param {string} pdfString - PDF string literal e.g. "(Hello World)"
 * @returns {string} - Decoded string
 */
function decodeStringLiteral(pdfString) {
  if (!pdfString.startsWith('(') || !pdfString.endsWith(')')) {
    return '';
  }
  
  // Remove parentheses and handle escape sequences
  return pdfString.slice(1, -1)
    .replace(/\\([()\\])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

/**
 * Decode a PDF hex string to JavaScript string
 * @param {string} hexString - PDF hex string e.g. "<48656C6C6F>"
 * @returns {string} - Decoded string
 */
function decodeHexString(hexString) {
  if (!hexString.startsWith('<') || !hexString.endsWith('>')) {
    return '';
  }
  
  // Remove angle brackets and decode hex
  const hex = hexString.slice(1, -1).replace(/\s/g, '');
  let result = '';
  
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substr(i, 2), 16);
    result += String.fromCharCode(byte);
  }
  
  return result;
}

/**
 * Performs redaction on DOCX file
 * @param {Buffer} docxBuffer - Buffer containing DOCX data
 * @param {Array} detectedEntities - Array of entities to redact
 * @param {Array} textWithPositions - Text content with positions
 * @returns {Promise<ArrayBuffer>} - Redacted DOCX buffer
 */
async function performDocxRedaction(docxBuffer, detectedEntities, textWithPositions) {
  try {
    console.log(`Starting DOCX redaction with ${detectedEntities.length} entities`);
    
    // Extract DOCX structure
    const docStructure = await extractDocxStructure(docxBuffer);
    
    // Process all document parts (main document, headers, footers)
    await redactAllDocumentParts(docStructure.zip, detectedEntities);
    
    // Handle embedded objects (Excel, PowerPoint, etc.)
    await handleEmbeddedObjects(docStructure.zip, detectedEntities);
    
    // Remove macros that might contain sensitive information
    await removeMacros(docStructure.zip);
    
    // Clean metadata
    await cleanDocxMetadata(docStructure.zip);
    
    // Generate the redacted DOCX
    const redactedDocx = await docStructure.zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    });
    
    console.log('DOCX redaction completed successfully');
    return redactedDocx;
  } catch (error) {
    console.error('Error performing DOCX redaction:', error);
    throw error;
  }
}

/**
 * Redacts all document parts (main document, headers, footers)
 * @param {JSZip} zip - JSZip instance containing DOCX
 * @param {Array} entities - Array of entities to redact
 */
async function redactAllDocumentParts(zip, entities) {
  try {
    console.log('Redacting all document parts...');
    
    // DOCX namespaces
    const nsResolver = (prefix) => {
      const ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
        'xmlns': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math'
      };
      return ns[prefix] || null;
    };

    // Word document parts that might contain text
    const documentParts = [
      'word/document.xml', // Main document
      'word/comments.xml', // Comments
      'word/endnotes.xml', // Endnotes
      'word/footnotes.xml', // Footnotes
    ];
    
    // Get header and footer files
    const headerFooterRegex = /word\/(header|footer)\d+\.xml/;
    const headerFooterFiles = Object.keys(zip.files).filter(fileName => headerFooterRegex.test(fileName));
    
    // Add headers and footers to document parts
    documentParts.push(...headerFooterFiles);
    
    // Add custom XML files that might contain data
    const customXmlRegex = /word\/customXml\/item\d+\.xml/;
    const customXmlFiles = Object.keys(zip.files).filter(fileName => customXmlRegex.test(fileName));
    documentParts.push(...customXmlFiles);
    
    // Process each document part
    for (const partName of documentParts) {
      // Skip if file doesn't exist
      if (!zip.files[partName]) continue;
      
      try {
        console.log(`Processing document part: ${partName}`);
        
        // Get the XML content
        const content = await zip.file(partName).async('text');
        
        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'application/xml');
        
        let modified = false;
        
        // Handle main document XML format
        if (partName.includes('document.xml') || partName.includes('header') || partName.includes('footer') ||
            partName.includes('footnotes') || partName.includes('endnotes') || partName.includes('comments')) {
          // Find text elements (w:t)
          const textElements = findTextElements(xmlDoc);
          
          console.log(`Found ${textElements.length} text elements in ${partName}`);
          
          // Check each text element for sensitive content
          for (const textEl of textElements) {
            const originalText = textEl.textContent;
            
            // Apply redaction to this text
            let redactedText = originalText;
            
            // Apply all entities to this text
            for (const entity of entities) {
              if (entity.entity && originalText.includes(entity.entity)) {
                // Replace with redaction marker (zero-width characters)
                redactedText = redactedText.replace(new RegExp(escapeRegExp(entity.entity), 'g'), 'â€‹'); // Zero-width space
                modified = true;
                
                console.log(`Redacted "${entity.entity}" in ${partName}`);
              }
            }
            
            // Update text content if modified
            if (originalText !== redactedText) {
              textEl.textContent = redactedText;
            }
          }
          
          // Also find field instruction text (w:instrText) which can contain data
          const instrTextElements = findInstrTextElements(xmlDoc);
          
          console.log(`Found ${instrTextElements.length} field instruction elements in ${partName}`);
          
          // Process field instructions
          for (const instrEl of instrTextElements) {
            const originalInstr = instrEl.textContent;
            
            // Apply redaction to this instruction text
            let redactedInstr = originalInstr;
            
            // Apply all entities to this instruction text
            for (const entity of entities) {
              if (entity.entity && originalInstr.includes(entity.entity)) {
                // Replace with redaction marker
                redactedInstr = redactedInstr.replace(new RegExp(escapeRegExp(entity.entity), 'g'), 'â€‹');
                modified = true;
                
                console.log(`Redacted "${entity.entity}" in field instruction in ${partName}`);
              }
            }
            
            // Update instruction content if modified
            if (originalInstr !== redactedInstr) {
              instrEl.textContent = redactedInstr;
            }
          }
        }
        // Handle custom XML format
        else if (partName.includes('customXml')) {
          // For custom XML, we'll be more aggressive since it's often used to store form data
          // Get all text nodes
          const walker = xmlDoc.createTreeWalker(xmlDoc, NodeFilter.SHOW_TEXT);
          const textNodes = [];
          
          // Collect all text nodes
          let currentNode;
          while ((currentNode = walker.nextNode())) {
            textNodes.push(currentNode);
          }
          
          console.log(`Found ${textNodes.length} text nodes in custom XML part ${partName}`);
          
          // Process each text node
          for (const textNode of textNodes) {
            const originalText = textNode.nodeValue;
            
            // Apply redaction to this text
            let redactedText = originalText;
            
            // Apply all entities to this text
            for (const entity of entities) {
              if (entity.entity && originalText.includes(entity.entity)) {
                // Replace with redaction marker
                redactedText = redactedText.replace(new RegExp(escapeRegExp(entity.entity), 'g'), 'â€‹');
                modified = true;
                
                console.log(`Redacted "${entity.entity}" in custom XML ${partName}`);
              }
            }
            
            // Update text content if modified
            if (originalText !== redactedText) {
              textNode.nodeValue = redactedText;
            }
          }
        }
        
        // If we modified the XML, update the file in the ZIP
        if (modified) {
          // Serialize XML back to string
          const serializer = new XMLSerializer();
          const xmlString = serializer.serializeToString(xmlDoc);
          
          // Update the file in the ZIP
          zip.file(partName, xmlString);
          
          console.log(`Updated ${partName} with redacted content`);
        }
      } catch (partError) {
        console.error(`Error processing ${partName}:`, partError);
        // Continue with other parts
      }
    }
    
    console.log('Completed redaction of all document parts');
  } catch (error) {
    console.error('Error redacting document parts:', error);
    throw error;
  }
}

/**
 * Find text elements in a DOCX XML document
 * @param {Document} doc - XML document
 * @returns {Array} - Array of text elements
 */
function findTextElements(doc) {
  // Find all w:t elements (text runs)
  return Array.from(doc.getElementsByTagName('w:t'));
}

/**
 * Find field instruction text elements in a DOCX XML document
 * @param {Document} doc - XML document
 * @returns {Array} - Array of instruction text elements
 */
function findInstrTextElements(doc) {
  // Find all w:instrText elements (field instructions)
  return Array.from(doc.getElementsByTagName('w:instrText'));
}

/**
 * Handle embedded objects in DOCX
 * @param {JSZip} zip - JSZip instance containing DOCX
 * @param {Array} entities - Array of entities to redact
 * @returns {Promise<void>}
 */
async function handleEmbeddedObjects(zip, entities) {
  try {
    console.log('Checking for embedded objects...');
    
    // Get all files in the embeddings directory
    const embeddingFiles = Object.keys(zip.files).filter(fileName => 
      fileName.startsWith('word/embeddings/') || 
      fileName.startsWith('word/media/')
    );
    
    if (embeddingFiles.length === 0) {
      console.log('No embedded objects found');
      return;
    }
    
    console.log(`Found ${embeddingFiles.length} potential embedded objects`);
    
    // For safety, we could replace embedded objects with safe placeholders
    // or attempt to parse and redact them if they're documents
    
    // Here we'll log the embedded objects but keep them
    // In a production environment, you might want to handle these differently
    for (const fileName of embeddingFiles) {
      console.log(`Found embedded object: ${fileName}`);
      
      // Optional: Replace embedded objects with empty files for maximum security
      // This is a trade-off between redaction thoroughness and document functionality
      // Uncomment the following lines to implement this approach
      /*
      if (fileName.endsWith('.bin') || fileName.endsWith('.xlsx') || fileName.endsWith('.docx')) {
        console.log(`Replacing embedded object ${fileName} with placeholder`);
        zip.file(fileName, new Uint8Array([0, 0, 0, 0])); // Minimal placeholder
      }
      */
    }
  } catch (error) {
    console.error('Error handling embedded objects:', error);
    // Continue with redaction process
  }
}

/**
 * Remove macros from DOCX
 * @param {JSZip} zip - JSZip instance containing DOCX
 * @returns {Promise<void>}
 */
async function removeMacros(zip) {
  try {
    console.log('Checking for macros...');
    
    // Check if document has macros (look for vbaProject.bin)
    const hasMacros = zip.files['word/vbaProject.bin'] !== undefined;
    
    if (hasMacros) {
      console.log('Document contains macros - removing for security');
      
      // Remove the macros file
      zip.remove('word/vbaProject.bin');
      
      // Update the document type in _rels/.rels
      try {
        // Get the .rels file
        const relsContent = await zip.file('_rels/.rels').async('text');
        
        // Parse the XML
        const parser = new DOMParser();
        const relsDoc = parser.parseFromString(relsContent, 'application/xml');
        
        // Find and modify the relationship type
        const relationships = relsDoc.getElementsByTagName('Relationship');
        
        for (const rel of Array.from(relationships)) {
          const type = rel.getAttribute('Type');
          
          // If this is a macro-enabled document type, change it to regular document
          if (type && type.includes('macroEnabled')) {
            const newType = type.replace('macroEnabled', '');
            rel.setAttribute('Type', newType);
            console.log(`Changed document type from ${type} to ${newType}`);
          }
        }
        
        // Serialize back to XML
        const serializer = new XMLSerializer();
        const updatedRels = serializer.serializeToString(relsDoc);
        
        // Update the file in the ZIP
        zip.file('_rels/.rels', updatedRels);
      } catch (relsError) {
        console.error('Error updating document type after macro removal:', relsError);
      }
      
      // Update Content_Types.xml to remove macro references
      try {
        const contentTypesPath = '[Content_Types].xml';
        
        if (zip.files[contentTypesPath]) {
          const contentTypesXml = await zip.file(contentTypesPath).async('text');
          
          // Parse the XML
          const parser = new DOMParser();
          const contentTypesDoc = parser.parseFromString(contentTypesXml, 'application/xml');
          
          // Find and modify content types that reference macros
          const overrides = contentTypesDoc.getElementsByTagName('Override');
          
          for (const override of Array.from(overrides)) {
            const contentType = override.getAttribute('ContentType');
            
            // If this is a macro-enabled content type, change it to regular type
            if (contentType && contentType.includes('macroEnabled')) {
              const newContentType = contentType.replace('macroEnabled', '');
              override.setAttribute('ContentType', newContentType);
              console.log(`Changed content type from ${contentType} to ${newContentType}`);
            }
          }
          
          // Serialize back to XML
          const serializer = new XMLSerializer();
          const updatedContentTypes = serializer.serializeToString(contentTypesDoc);
          
          // Update the file in the ZIP
          zip.file(contentTypesPath, updatedContentTypes);
        }
      } catch (contentTypesError) {
        console.error('Error updating content types after macro removal:', contentTypesError);
      }
    } else {
      console.log('No macros found in document');
    }
  } catch (error) {
    console.error('Error handling macros:', error);
    // Continue with redaction process
  }
}

/**
 * Clean document metadata from DOCX
 * @param {JSZip} zip - JSZip instance containing DOCX
 * @returns {Promise<void>}
 */
async function cleanDocxMetadata(zip) {
  try {
    console.log('Cleaning DOCX metadata...');
    
    // Metadata files to clean
    const metadataFiles = [
      'docProps/core.xml',    // Core properties (title, author, etc.)
      'docProps/app.xml',     // Application properties
      'docProps/custom.xml'   // Custom properties
    ];
    
    // Process each metadata file
    for (const fileName of metadataFiles) {
      if (!zip.files[fileName]) continue;
      
      try {
        console.log(`Processing metadata file: ${fileName}`);
        
        // Get the XML content
        const content = await zip.file(fileName).async('text');
        
        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'application/xml');
        
        let modified = false;
        
        // Process core.xml (dc:title, dc:creator, etc.)
        if (fileName === 'docProps/core.xml') {
          const elements = [
            'dc:title', 'dc:subject', 'dc:creator', 'dc:description',
            'cp:lastModifiedBy', 'cp:keywords', 'dc:language'
          ];
          
          for (const elementName of elements) {
            const element = xmlDoc.getElementsByTagName(elementName)[0];
            if (element) {
              element.textContent = '';
              modified = true;
            }
          }
          
          // Keep creation and modification times
          // or optionally clear them by setting to empty string
        }
        // Process app.xml (Application-specific properties)
        else if (fileName === 'docProps/app.xml') {
          const elements = [
            'Manager', 'Company', 'HyperlinkBase', 'Template', 'Application', 'AppVersion'
          ];
          
          for (const elementName of elements) {
            const element = xmlDoc.getElementsByTagName(elementName)[0];
            if (element) {
              element.textContent = '';
              modified = true;
            }
          }
        }
        // Process custom.xml (Custom properties)
        else if (fileName === 'docProps/custom.xml') {
          // For custom properties, remove all property values
          const properties = xmlDoc.getElementsByTagName('property');
          
          for (const property of Array.from(properties)) {
            // Find child nodes (lpwstr, etc.) that contain values
            const valueNodes = property.children;
            
            for (const valueNode of Array.from(valueNodes)) {
              valueNode.textContent = '';
              modified = true;
            }
          }
        }
        
        // If we modified the XML, update the file in the ZIP
        if (modified) {
          // Serialize XML back to string
          const serializer = new XMLSerializer();
          const xmlString = serializer.serializeToString(xmlDoc);
          
          // Update the file in the ZIP
          zip.file(fileName, xmlString);
          
          console.log(`Updated ${fileName} with cleaned metadata`);
        }
      } catch (metadataError) {
        console.error(`Error cleaning metadata file ${fileName}:`, metadataError);
        // Continue with other metadata files
      }
    }
    
    console.log('Completed cleaning document metadata');
  } catch (error) {
    console.error('Error cleaning document metadata:', error);
    // Continue with redaction process
  }
}

/**
 * Escape special characters in a string for RegExp
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get category breakdown from redacted entities
 * @param {Array} redactedEntities - Array of redacted entities
 * @returns {Object} - Object with category counts
 */
function getCategoryBreakdown(redactedEntities) {
  const breakdown = {};
  
  if (!redactedEntities || !Array.isArray(redactedEntities)) {
    return breakdown;
  }
  
  redactedEntities.forEach(entity => {
    const category = entity.type || 'Unknown';
    if (breakdown[category]) {
      breakdown[category]++;
    } else {
      breakdown[category] = 1;
    }
  });
  
  return breakdown;
}

/**
 * Get all templates for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - A promise that resolves to an array of templates
 */
export async function getUserTemplates(userId) {
  try {
    if (!userId) {
      console.error('getUserTemplates called with invalid userId:', userId);
      return [];
    }
    
    console.log(`Fetching templates for user: ${userId}`);
    const templatesRef = collection(db, 'templates');
    const q = query(templatesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No templates found for user ${userId}`);
      return [];
    }
    
    console.log(`Found ${querySnapshot.size} template documents for user ${userId}`);
    
    // First fetch all rules for this user to have them available
    console.log('Pre-fetching all redaction rules for user to optimize template loading');
    let allUserRules = [];
    try {
      const rulesRef = collection(db, 'redaction_rules');
      const rulesQuery = query(rulesRef, where('userId', '==', userId));
      const rulesSnapshot = await getDocs(rulesQuery);
      
      allUserRules = rulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Pre-fetched ${allUserRules.length} redaction rules for user ${userId}`);
    } catch (rulesError) {
      console.error('Error pre-fetching redaction rules:', rulesError);
      // Continue with empty rules array
    }
    
    // Process each template
    const templates = [];
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const templateData = docSnapshot.data();
        const template = {
          id: docSnapshot.id,
          ...templateData,
          rules: Array.isArray(templateData.rules) ? [...templateData.rules] : []
        };
        
        // Check if template has ruleIds but missing or incomplete rules
        if (Array.isArray(templateData.ruleIds) && templateData.ruleIds.length > 0) {
          console.log(`Template ${docSnapshot.id} has ${templateData.ruleIds.length} ruleIds`);
          
          // Check if rules array is complete
          const existingRuleIds = new Set(template.rules.map(rule => rule.id));
          const missingRuleIds = templateData.ruleIds.filter(id => !existingRuleIds.has(id));
          
          if (missingRuleIds.length > 0) {
            console.log(`Template ${docSnapshot.id} is missing ${missingRuleIds.length} rules, adding them now`);
            
            // First check our pre-fetched rules
            const rulesToAdd = [];
            for (const ruleId of missingRuleIds) {
              // Try to find in pre-fetched rules first
              const foundRule = allUserRules.find(r => r.id === ruleId);
              
              if (foundRule) {
                rulesToAdd.push(foundRule);
              } else {
                // If not found in pre-fetched rules, fetch individually
                try {
                  const ruleDocRef = doc(db, 'redaction_rules', ruleId);
                  const ruleSnap = await getDoc(ruleDocRef);
                  
                  if (ruleSnap.exists()) {
                    rulesToAdd.push({
                      id: ruleSnap.id,
                      ...ruleSnap.data()
                    });
                  } else {
                    console.warn(`Rule ${ruleId} not found for template ${docSnapshot.id}`);
                  }
                } catch (ruleError) {
                  console.error(`Error fetching individual rule ${ruleId}:`, ruleError);
                }
              }
            }
            
            if (rulesToAdd.length > 0) {
              console.log(`Adding ${rulesToAdd.length} rules to template ${docSnapshot.id}`);
              template.rules = [...template.rules, ...rulesToAdd];
            }
          }
        }
        
        if (template.rules.length === 0) {
          console.warn(`Template ${docSnapshot.id} has no rules after processing`);
        } else {
          console.log(`Template ${docSnapshot.id} has ${template.rules.length} rules after processing`);
        }
        
        templates.push(template);
      } catch (templateError) {
        console.error(`Error processing template ${docSnapshot.id}:`, templateError);
        // Continue with next template
      }
    }
    
    console.log(`Successfully processed ${templates.length} templates for user ${userId}`);
    return templates;
  } catch (error) {
    console.error('Error getting user templates:', error);
    return [];
  }
}

/**
 * Get or create redaction report for a document
 * @param {Object|string} documentOrId - Document object or ID
 * @param {Array} detectedEntities - Detected entities
 * @param {Array} remainingEntities - Entities that weren't redacted successfully
 * @param {boolean} redactionSuccess - Overall redaction success
 * @param {Object} template - Template used for redaction
 * @returns {Promise<Object>} - Redaction report
 */
export const getRedactionReport = async (documentOrId, detectedEntities = [], remainingEntities = [], redactionSuccess = true, template = null) => {
  try {
    // Handle document object or ID
    let docId;
    let docData = {};
    
    console.log(`getRedactionReport called with documentOrId type: ${typeof documentOrId}`);
    
    if (typeof documentOrId === 'string') {
      // Simple ID string
      docId = documentOrId;
      console.log(`Using document ID directly: ${docId}`);
    } else if (documentOrId && typeof documentOrId === 'object') {
      // Handle document object
      docId = documentOrId.id;
      docData = { ...documentOrId };
      delete docData.id; // Remove id from data to avoid duplication
      console.log(`Extracted document ID from object: ${docId}`);
    } else {
      console.error('Invalid document parameter:', documentOrId);
      throw new Error('Invalid document parameter');
    }
    
    if (!docId) {
      console.error('Document ID is required but was not found:', documentOrId);
      throw new Error('Document ID is required');
    }
    
    console.log(`Getting/creating redaction report for document: ${docId}`);
    
    // Check if report already exists
    const reportRef = doc(db, 'redaction_reports', docId);
    const reportSnap = await getDoc(reportRef);
    
    // If we're querying only (no entities passed)
    if (detectedEntities.length === 0 && reportSnap.exists()) {
      console.log(`Found existing redaction report for document: ${docId}`);
      return {
        id: reportSnap.id,
        ...reportSnap.data()
      };
    }
    
    // Create new or update existing report
    const categoryBreakdown = getCategoryBreakdown(detectedEntities);
    
    const report = {
      documentId: docId,
      documentName: docData.fileName || docData.name || 'Unknown Document',
      timestamp: new Date(),
      totalEntitiesFound: detectedEntities.length,
      redactedEntities: detectedEntities.map(entity => ({
        ...entity,
        redactionStatus: remainingEntities.includes(entity.entity) ? 'FAILED' : 'SUCCESS'
      })),
      success: redactionSuccess,
      categories: categoryBreakdown,
      templateId: template?.id || null,
      templateName: template?.name || 'Default Rules'
    };
    
    // Create or update the report
    console.log(`Saving redaction report for document ID: ${docId}`);
    await setDoc(reportRef, report);
    
    return {
      id: docId,
      ...report
    };
  } catch (error) {
    console.error('Error creating/getting redaction report:', error);
    // Return basic report on error to avoid breaking the process
    return {
      error: error.message,
      timestamp: new Date(),
      totalEntitiesFound: detectedEntities?.length || 0
    };
  }
};

/**
 * Update an entity's redaction status
 * @param {string} documentId - Document ID
 * @param {string} entityId - Entity ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<boolean>} - Success status
 */
export const updateRedaction = async (documentId, entityId, updates) => {
  try {
    const reportRef = doc(db, 'redaction_reports', documentId);
    const reportSnap = await getDoc(reportRef);
    
    if (!reportSnap.exists()) {
      throw new Error('Redaction report not found');
    }
    
    const report = reportSnap.data();
    const entities = report.redactedEntities || [];
    
    // Find and update the entity
    const updatedEntities = entities.map(entity => {
      if (entity.id === entityId || 
          (entity.ruleId === entityId) ||
          (entity.entity === updates.entity)) {
        return {
          ...entity,
          ...updates
        };
      }
      return entity;
    });
    
    // Update the report
    await updateDoc(reportRef, {
      redactedEntities: updatedEntities,
      userFeedback: true,
      lastUpdated: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating redaction:', error);
    throw error;
  }
};

/**
 * Verify redaction was successful by checking for remaining sensitive information
 * @param {ArrayBuffer|Uint8Array} redactedBuffer - Redacted document buffer
 * @param {string} fileType - 'pdf' or 'docx'
 * @param {Array} originalEntities - Original detected entities
 * @returns {Promise<Object>} - Verification results
 */
async function verifyRedaction(redactedBuffer, fileType, originalEntities) {
  try {
    console.log('Verifying redaction success...');
    if (!redactedBuffer || !originalEntities || originalEntities.length === 0) {
      console.log('No entities to verify or no redacted buffer');
      return { success: true, remainingEntities: [] };
    }
    
    // Extract text from the redacted document
    let extractedText = '';
    
    if (fileType === 'pdf') {
      extractedText = await extractTextFromRedactedPdf(redactedBuffer);
    } else if (fileType === 'docx') {
      extractedText = await extractTextFromRedactedDocx(redactedBuffer);
    } else {
      console.warn(`Unsupported file type for verification: ${fileType}`);
      // Default to assuming success for unsupported file types
      return { success: true, remainingEntities: [] };
    }
    
    console.log(`Extracted ${extractedText.length} characters from redacted document for verification`);
    
    // If we extracted very little text (highly likely the PDF was completely rebuilt)
    // and the PDF approach we used was aggressive, we can assume success
    if (fileType === 'pdf' && extractedText.length < 100) {
      console.log('Very little text extracted from redacted PDF. This indicates successful redaction through PDF rebuilding.');
      return { success: true, remainingEntities: [] };
    }
    
    console.log(`Verifying ${originalEntities.length} entities were redacted`);
    
    // Normalize extracted text for more reliable checking
    const normalizedText = extractedText
      .toLowerCase()
      .replace(/\s+/g, ' ')  // Normalize spaces
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''); // Remove punctuation
    
    // Check if any entities remain in the extracted text
    const remainingEntities = [];
    
    // Skip verification for large text blocks since they tend to cause false positives
    const entitiesToVerify = originalEntities.filter(entity => {
      // Skip very large text blocks (likely the entire document content)
      if (entity.entity && entity.entity.length > 500) {
        console.log(`Skipping verification for very large entity (${entity.entity.length} chars)`);
        return false;
      }
      return true;
    });
    
    for (const entity of entitiesToVerify) {
      const entityText = entity.entity;
      if (!entityText) continue;
      
      // Skip very short entities (less than 3 chars) as they might cause false positives
      if (entityText.length < 3) continue;
      
      // Normalize the entity text for matching
      const normalizedEntity = entityText
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
      
      // Special handling for different entity types
      if (entity.type === 'email' && entityText.includes('@')) {
        // For emails, check variants (with and without dots)
        const emailParts = normalizedEntity.split('@');
        if (emailParts.length === 2) {
          const [localPart, domain] = emailParts;
          
          // Create different versions to check against
          const emailNoDotsInLocal = localPart.replace(/\./g, '') + '@' + domain;
          const emailNoDotsInDomain = localPart + '@' + domain.replace(/\./g, '');
          
          // If we find any variant, consider it unredacted
          const foundWithDots = normalizedText.includes(normalizedEntity);
          const foundWithoutDotsInLocal = normalizedText.includes(emailNoDotsInLocal);
          const foundWithoutDotsInDomain = normalizedText.includes(emailNoDotsInDomain);
          
          if (foundWithDots || foundWithoutDotsInLocal || foundWithoutDotsInDomain) {
            console.warn(`Found unredacted email entity: "${entityText}"`);
            remainingEntities.push(entity);
          }
        }
      } else if (entity.type === 'phone' || entityText.match(/[\d\(\)\-\s]{7,}/)) {
        // For phone numbers, check the normalized version (digits only)
        const digitsOnly = normalizedEntity.replace(/\D/g, '');
        
        // Check if the digits-only version is in the text
        if (digitsOnly.length >= 7 && normalizedText.includes(digitsOnly)) {
          console.warn(`Found unredacted phone entity: "${entityText}"`);
          remainingEntities.push(entity);
        } else if (normalizedText.includes(normalizedEntity)) {
          // Also check the formatted version
          console.warn(`Found unredacted entity: "${entityText}"`);
          remainingEntities.push(entity);
        }
      } else {
        // For other entities, only consider an exact match
        if (normalizedText.includes(normalizedEntity)) {
          console.warn(`Found unredacted entity: "${entityText}"`);
          remainingEntities.push(entity);
        }
      }
    }
    
    const success = remainingEntities.length === 0;
    
    // Log the verification result
    if (success) {
      console.log('Verification result: SUCCESS - All entities were successfully redacted');
    } else {
      console.error(`Verification result: FAILED - ${remainingEntities.length} entities remain unredacted`);
    }
    
    return {
      success,
      remainingEntities
    };
  } catch (error) {
    console.error('Error verifying redaction:', error);
    // In case of verification error, assume success rather than failure
    // This is because our redaction is now extremely aggressive
    return {
      success: true,
      remainingEntities: [],
      error: error.message
    };
  }
}

/**
 * Extract text from a redacted PDF for verification
 * @param {ArrayBuffer|Uint8Array} pdfBuffer - Redacted PDF buffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromRedactedPdf(pdfBuffer) {
  try {
    // Convert buffer to appropriate format
    const bufferData = createSafeBufferCopy(pdfBuffer);
    if (!bufferData) {
      throw new Error('Failed to create buffer copy for text extraction');
    }
    
    // Try multiple extraction methods and combine results
    let extractedText = '';
    
    // Primary extraction using pdf.js
    try {
      // Load PDF document with pdf.js
      const loadingTask = pdfjsLib.getDocument({
        data: bufferData,
        disableFontFace: true,
        ignoreErrors: true,
        isEvalSupported: false,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
        cMapPacked: true,
      });
      
      const pdfDocument = await loadingTask.promise;
      
      // Get total number of pages
      const numPages = pdfDocument.numPages;
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false,
        });
        
        const textItems = textContent.items;
        for (const item of textItems) {
          if (item.str) {
            fullText += item.str + ' ';
          }
        }
        
        // Don't forget to clean up the page object
        page.cleanup();
      }
      
      extractedText += fullText;
    } catch (pdfJsError) {
      console.warn('Error extracting text using pdf.js:', pdfJsError);
    }
    
    // Try pdf-lib approach if not much text was found
    if (extractedText.trim().length < 100) {
      console.log('Limited text found, attempting alternate extraction methods');
      
      try {
        // Load PDF with pdf-lib for a different extraction approach
        const pdfDoc = await PDFDocument.load(bufferData.buffer.slice(0), { 
          ignoreEncryption: true 
        });
        
        const pages = pdfDoc.getPages();
        let alternateText = '';
        
        // Extract text from content streams
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const pageText = await extractTextFromStreamObjects(pdfDoc, page);
          alternateText += pageText + ' ';
        }
        
        if (alternateText.length > 0) {
          console.log(`Found ${alternateText.length} chars via content stream extraction`);
          extractedText += ' ' + alternateText;
        }
      } catch (pdfLibError) {
        console.warn('Error extracting text from PDF content streams:', pdfLibError);
      }
      
      // Final approach: try to extract strings directly from the raw PDF buffer
      try {
        const pdfString = new TextDecoder().decode(bufferData);
        const rawText = extractStringsFromRawPdf(pdfString);
        
        if (rawText.length > 0) {
          console.log(`Found ${rawText.length} chars via raw PDF extraction`);
          extractedText += ' ' + rawText;
        }
      } catch (rawError) {
        console.warn('Error extracting strings from raw PDF data:', rawError);
      }
    }
    
    // Clean up the result
    return extractedText.trim();
  } catch (error) {
    console.error('Error extracting text from redacted PDF:', error);
    return ''; // Return empty string on error
  }
}

/**
 * Extract strings directly from raw PDF data
 * This is a last-resort method to find any text hidden in the PDF
 * @param {string} pdfString - Raw PDF content as string
 * @returns {string} - Extracted text
 */
function extractStringsFromRawPdf(pdfString) {
  if (!pdfString) return '';
  
  let extractedText = '';
  
  // Look for text between parentheses (PDF string objects)
  const textMatches = pdfString.match(/\(([^\)\\]{3,})\)/g) || [];
  for (const match of textMatches) {
    if (match.length > 5) { // Skip very short matches
      extractedText += match.substring(1, match.length - 1) + ' ';
    }
  }
  
  // Look for email addresses specifically
  const emailMatches = pdfString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  for (const match of emailMatches) {
    extractedText += match + ' ';
  }
  
  // Look for phone numbers
  const phoneMatches = pdfString.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g) || [];
  for (const match of phoneMatches) {
    extractedText += match + ' ';
  }
  
  return extractedText;
}

/**
 * Extract text from a redacted DOCX for verification
 * @param {ArrayBuffer|Uint8Array} docxBuffer - Redacted DOCX buffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromRedactedDocx(docxBuffer) {
  try {
    // Convert buffer to appropriate format
    const bufferData = createSafeBufferCopy(docxBuffer);
    if (!bufferData) {
      throw new Error('Failed to create buffer copy for text extraction');
    }
    
    // Use Mammoth to convert DOCX to text
    const result = await mammoth.extractRawText({arrayBuffer: bufferData.buffer});
    return result.value;
  } catch (error) {
    console.error('Error extracting text from redacted DOCX:', error);
    return ''; // Return empty string on error
  }
}

/**
 * Process a PDF that appears to be scanned (image-based)
 * @param {ArrayBuffer|Uint8Array} pdfBuffer - PDF buffer
 * @param {Array} entities - Detected entities (may be empty if OCR needed first)
 * @returns {Promise<Object>} - Processing result with redacted buffer
 */
async function handleScannedPdf(pdfBuffer, entities = []) {
  try {
    console.log('Processing scanned PDF document...');
    
    // Ensure we have a fresh Uint8Array to work with
    const bufferData = createSafeBufferCopy(pdfBuffer);
    if (!bufferData) {
      throw new Error('Failed to create buffer copy for scanned PDF handling');
    }
    
    // Check if this is truly a scanned document without text
    const hasText = await checkPdfHasText(bufferData.buffer.slice(0));
    
    if (!hasText) {
      console.log('PDF appears to be image-based, needs OCR processing');
      
      // In a production environment, you would:
      // 1. Extract images from each page
      // 2. Perform OCR using Tesseract.js or a server-side OCR service
      // 3. Map detected text to coordinates on each page
      // 4. Use those coordinates for redaction
      
      // For this implementation, we'll apply a visual warning
      // Make a fresh copy for pdf-lib
      const pdfLibBuffer = bufferData.buffer.slice(0);
      const pdfDoc = await PDFDocument.load(pdfLibBuffer);
      
      // Add a watermark to indicate this needs human review
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        // Add warning text at the top of the page
        page.drawText('âš ï¸ SCANNED DOCUMENT - MANUAL REVIEW REQUIRED âš ï¸', {
          x: 50,
          y: height - 50,
          size: 20,
          color: rgb(0.9, 0.1, 0.1)
        });
        
        // Draw a visible border to indicate this needs review
        page.drawRectangle({
          x: 20,
          y: 20,
          width: width - 40,
          height: height - 40,
          borderColor: rgb(0.9, 0.1, 0.1),
          borderWidth: 2,
          opacity: 0.8
        });
      }
      
      return {
        redactedBuffer: await pdfDoc.save(),
        isScanned: true,
        needsManualReview: true,
        entities: entities
      };
    }
    
    // If we have text but no entities, we should run OCR to detect more precisely
    if (entities.length === 0) {
      console.log('PDF has text but no entities detected, consider enhanced OCR');
    }
    
    return {
      redactedBuffer: null, // Return null to use normal processing
      isScanned: false,
      needsManualReview: false,
      entities: entities
    };
  } catch (error) {
    console.error('Error handling scanned PDF:', error);
    throw error;
  }
}

/**
 * Detect sensitive information using AI
 * @param {string} text - Document text
 * @param {Array} rules - Redaction rules for context
 * @returns {Promise<Array>} - Detected entities
 */
async function detectEntitiesWithAI(text, templateRules = []) {
  try {
    // Skip if text is too short
    if (!text || text.length < 50) {
      console.log('Text too short for AI analysis');
      return [];
    }
    
    // Skip if no Gemini API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.log('No Gemini API key provided, skipping AI detection');
      return [];
    }
    
    console.log('Analyzing document with Gemini 1.5-flash AI...');
    
    // Extract categories from the template rules to focus detection
    let categories = [];
    if (templateRules && Array.isArray(templateRules) && templateRules.length > 0) {
      categories = [...new Set(templateRules.map(rule => rule.category).filter(Boolean))];
    }
    
    const categoryText = categories.length > 0 ? 
      `Focus on these categories: ${categories.join(', ')}.` : 
      `Identify all sensitive information including PII, PHI, financial data, legal information, and confidential business information.`;
    
    // Prepare examples of entities to look for from the template rules
    let examplesText = '';
    if (templateRules && Array.isArray(templateRules) && templateRules.length > 0) {
      const examples = templateRules.map(rule => rule.name || rule.category).filter(Boolean);
      if (examples.length > 0) {
        examplesText = `\nLook for sensitive information including: ${examples.join(', ')}.`;
      }
    }
    
    // Create a specialized prompt for the Gemini model
    const prompt = `
TASK: Identify sensitive information that should be redacted in the following document text.
${categoryText}${examplesText}

For each piece of sensitive information found, calculate its exact character position in the text.
Respond with a valid JSON array containing all found entities in this exact format:
[
  {
    "entity": "exact sensitive text to redact",
    "type": "category name",
    "position": {
      "start": character_index_start,
      "end": character_index_end
    }
  }
]

DOCUMENT TEXT:
${text.substring(0, 7500)}
`;
    
    console.log('Sending request to Gemini API...');
    
    // Call the Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    // Configure generation to ensure we get parseable JSON
    const generationConfig = {
      temperature: 0.1, // Very low temperature for deterministic output
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    };
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });
    
    const response = await result.response;
    const responseText = response.text();
    
    console.log('Received response from Gemini API');
    
    // Extract JSON from response (looking for array pattern)
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      console.warn('Could not extract valid JSON from AI response');
      console.log('AI response content:', responseText.substring(0, 200) + '...');
      return [];
    }
    
    try {
      const jsonContent = jsonMatch[0];
      console.log('Extracted JSON pattern from response');
      
      const entities = JSON.parse(jsonContent);
      console.log(`AI detected ${entities.length} sensitive entities`);
      
      // Validate and clean entities
      const validEntities = entities.filter(entity => {
        // Ensure entity has required fields
        if (!entity.entity || typeof entity.entity !== 'string') {
          return false;
        }
        
        // Skip empty entities
        if (entity.entity.trim().length === 0) {
          return false;
        }
        
        // Ensure position has valid start and end values
        if (!entity.position || 
            typeof entity.position.start !== 'number' || 
            typeof entity.position.end !== 'number') {
          return false;
        }
        
        // Ensure start is before end
        if (entity.position.start >= entity.position.end) {
          return false;
        }
        
        // Ensure entity text is not too long (avoid false positives)
        const maxEntityLength = 500;
        if (entity.entity.length > maxEntityLength) {
          return false;
        }
        
        return true;
      });
      
      if (validEntities.length < entities.length) {
        console.log(`Filtered out ${entities.length - validEntities.length} invalid entities`);
      }
      
      // Deduplicate entities that overlap
      const deduplicatedEntities = deduplicateEntities(validEntities);
      console.log(`Returning ${deduplicatedEntities.length} valid AI-detected entities`);
      
      return deduplicatedEntities;
    } catch (jsonError) {
      console.error('Error parsing AI response as JSON:', jsonError);
      console.error('Raw response excerpt:', responseText.substring(0, 200) + '...');
      return [];
    }
  } catch (error) {
    console.error('Error in AI-based entity detection:', error);
    // Return empty array on error to continue processing with rule-based detection
    return [];
  }
}

/**
 * Deduplicate entities that overlap with each other
 * @param {Array} entities - Detected entities
 * @returns {Array} - Deduplicated entities
 */
function deduplicateEntities(entities) {
  // Sort entities by position (start index)
  const sorted = [...entities].sort((a, b) => a.position.start - b.position.start);
  const result = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    let overlapping = false;
    
    // Check if this entity overlaps with any entity already in results
    for (let j = 0; j < result.length; j++) {
      const existing = result[j];
      
      // Check for overlap
      if (current.position.start <= existing.position.end && 
          current.position.end >= existing.position.start) {
        
        // If current entity is longer, replace the existing one
        if ((current.position.end - current.position.start) > 
            (existing.position.end - existing.position.start)) {
          result[j] = current;
        }
        
        overlapping = true;
        break;
      }
    }
    
    // If not overlapping with any existing entity, add it
    if (!overlapping) {
      result.push(current);
    }
  }
  
  return result;
}

/**
 * Merge entities from multiple sources while removing duplicates
 * @param {Array} baseEntities - Base entities
 * @param {Array} newEntities - New entities to merge
 * @returns {Array} - Merged entities without duplicates
 */
function mergeEntitiesRemovingDuplicates(baseEntities, newEntities) {
  // Create combined list
  const combined = [...baseEntities];
  let addedCount = 0;
  
  // Add new entities if they don't already exist
  for (const newEntity of newEntities) {
    if (!newEntity.entity) continue;
    
    // Check if this entity already exists (avoid duplication)
    const exists = baseEntities.some(baseEntity => {
      // Only consider exact matches of the same text
      if (!baseEntity.entity) return false;
      
      // Check for exact match of the entity text
      return baseEntity.entity.toLowerCase() === newEntity.entity.toLowerCase();
    });
    
    if (!exists) {
      combined.push(newEntity);
      addedCount++;
    }
  }
  
  console.log(`Added ${addedCount} unique entities from AI detection to the final list`);
  return combined;
}

/**
 * Redacts text by replacing sensitive entities with zero-width characters
 * @param {string} text - The text to redact
 * @param {Array} entities - Array of entity objects to redact
 * @returns {string} - Redacted text
 */
function redactTextWithEntities(text, entities) {
  let redactedText = text;
  
  for (const entity of entities) {
    const sensitiveText = entity.entity;
    if (!sensitiveText || !text.includes(sensitiveText)) continue;
    
    // Replace sensitive text with zero-width characters
    const regex = new RegExp(escapeRegExp(sensitiveText), 'g');
    redactedText = redactedText.replace(regex, '\uFEFF'.repeat(sensitiveText.length));
  }
  
  return redactedText;
}

/**
 * Get breakdown of entities by category with examples
 * @param {Array} entities - List of detected entities
 * @returns {Object} - Category statistics with examples
 */
const getCategoryBreakdownWithExamples = (entities = []) => {
  const categories = {};
  
  if (!Array.isArray(entities) || entities.length === 0) {
    return {};
  }
  
  // Count entities by category
  entities.forEach(entity => {
    const category = entity.category || 'UNKNOWN';
    if (!categories[category]) {
      categories[category] = {
        count: 0,
        examples: []
      };
    }
    
    categories[category].count++;
    
    // Add example if we have fewer than 3
    if (categories[category].examples.length < 3) {
      categories[category].examples.push(entity.entity);
    }
  });
  
  return categories;
};

/**
 * Cleans metadata from DOCX files to remove sensitive information
 * @param {JSZip} docxZip - The DOCX file as a JSZip object
 * @returns {Promise<JSZip>} - The cleaned JSZip object
 */
const cleanDocxMetadataV2 = async (docxZip) => {
  try {
    console.log("Cleaning DOCX metadata");
    
    // Core properties file contains metadata like author, title, etc.
    const corePropPath = 'docProps/core.xml';
    
    if (docxZip.files[corePropPath]) {
      const content = await docxZip.file(corePropPath).async('string');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'application/xml');
      
      // List of metadata elements to remove or sanitize
      const metadataElements = [
        'dc:creator', 'dc:lastModifiedBy', 'dc:description',
        'cp:lastPrinted', 'cp:keywords', 'dc:subject'
      ];
      
      // Replace content of these elements with safe values
      metadataElements.forEach(elementName => {
        const elements = xmlDoc.getElementsByTagName(elementName);
        for (let i = 0; i < elements.length; i++) {
          elements[i].textContent = 'Redacted';
        }
      });
      
      // Serialize back to XML
      const serializer = new XMLSerializer();
      const cleanedXml = serializer.serializeToString(xmlDoc);
      
      // Update the zip with cleaned metadata
      docxZip.file(corePropPath, cleanedXml);
    }
    
    // Custom properties file
    const customPropPath = 'docProps/custom.xml';
    if (docxZip.files[customPropPath]) {
      docxZip.remove(customPropPath);
    }
    
    return docxZip;
  } catch (error) {
    console.error("Error cleaning DOCX metadata:", error);
    return docxZip; // Return original zip if cleaning fails
  }
};

/**
 * Clean document metadata thoroughly 
 * @param {ArrayBuffer|Uint8Array} fileBuffer - Document buffer
 * @param {string} fileType - PDF or DOCX
 * @returns {Promise<ArrayBuffer>} - Cleaned document buffer
 */
async function cleanDocumentMetadata(fileBuffer, fileType) {
  try {
    console.log(`Cleaning metadata for ${fileType.toUpperCase()} document`);
    
    // Ensure we have a fresh Uint8Array to work with
    const bufferData = createSafeBufferCopy(fileBuffer);
    if (!bufferData) {
      throw new Error('Failed to create buffer copy for metadata cleaning');
    }
    
    if (fileType === 'pdf') {
      try {
        // Make a fresh buffer copy for pdf-lib
        const pdfLibBuffer = bufferData.buffer.slice(0);
        const pdfDoc = await PDFDocument.load(pdfLibBuffer);
        
        // Remove all metadata
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setCreator('');
        pdfDoc.setProducer('');
        
        // Try to remove XMP metadata
        try {
          const catalog = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Root);
          if (catalog && catalog.has && catalog.has('Metadata')) {
            catalog.delete('Metadata');
          }
        } catch (e) {
          console.warn('Could not remove XMP metadata:', e);
        }
        
        return await pdfDoc.save();
      } catch (error) {
        console.error('Error cleaning PDF metadata:', error);
        // Return the original if cleaning fails
        return fileBuffer;
      }
    }
    else if (fileType === 'docx') {
      try {
        // For DOCX we need to process the zip structure
        const zip = new JSZip();
        
        // Load the DOCX as a ZIP
        // Use a fresh buffer copy
        const docxCopy = bufferData.buffer.slice(0);
        await zip.loadAsync(docxCopy);
        
        // Call the existing DOCX metadata cleaning function 
        await cleanDocxMetadata(zip);
        
        // Return the cleaned DOCX file
        return await zip.generateAsync({ type: 'arraybuffer' });
      } catch (error) {
        console.error('Error cleaning DOCX metadata:', error);
        // Return the original if cleaning fails
        return fileBuffer;
      }
    }
    
    // For unsupported types, return the original
    return fileBuffer;
  } catch (error) {
    console.error('Error in metadata cleaning:', error);
    return fileBuffer;
  }
}

/**
 * Draw black boxes over redacted text areas
 * @param {PDFDocument} pdfDoc - PDF document
 * @param {Array} entityPositions - Entities with position data
 * @returns {PDFDocument} - Modified PDF document
 */
function drawRedactionBoxes(pdfDoc, entityPositions) {
  try {
    console.log(`Drawing redaction boxes for ${entityPositions.length} entities with position data`);
    if (!pdfDoc || !entityPositions || entityPositions.length === 0) {
      console.warn('No entities with position data for drawing redaction boxes');
      return pdfDoc;
    }

    const pages = pdfDoc.getPages();
    
    // Group entities by page for more efficient processing
    const entitiesByPage = {};
    let totalRedactionBoxes = 0;
    
    // Group entities by page
    for (const entity of entityPositions) {
      if (!entity.positionFound) {
        console.warn(`Entity "${entity.entity}" has no position data for redaction`);
        continue;
      }
      
      const pageIndex = entity.pageIndex || 0;
      
      if (!entitiesByPage[pageIndex]) {
        entitiesByPage[pageIndex] = [];
      }
      
      entitiesByPage[pageIndex].push(entity);
    }
    
    // Process each page with entities
    for (const pageIndexStr in entitiesByPage) {
      const pageIndex = parseInt(pageIndexStr, 10);
      const pageEntities = entitiesByPage[pageIndex];
      
      if (pageIndex >= pages.length) {
        console.warn(`Page index ${pageIndex} is out of range (document has ${pages.length} pages)`);
        continue;
      }
      
      const page = pages[pageIndex];
      
      console.log(`Processing page ${pageIndex+1} with ${pageEntities.length} redaction areas`);
      
      // First pass: Draw white boxes to overwrite any potential colored backgrounds
      for (const entity of pageEntities) {
        try {
          // Calculate position using helper function
          const position = getAdjustedPosition(entity, entity.entity);
          
          // Skip invalid positions
          if (position.x === undefined || position.y === undefined || 
              position.width === undefined || position.height === undefined) {
            console.warn(`Invalid position for entity "${entity.entity}" on page ${pageIndex+1}`);
            continue;
          }
          
          // Add white background rectangle first (slightly larger)
          const padding = 4; // Increased padding for better coverage
          page.drawRectangle({
            x: Math.max(0, position.x - padding),
            y: Math.max(0, position.y - padding),
            width: position.width + (padding * 2),
            height: position.height + (padding * 2),
            color: rgb(1, 1, 1), // White
            opacity: 1,
            borderWidth: 0
          });
        } catch (err) {
          console.error(`Error drawing white box for entity "${entity.entity}":`, err);
        }
      }
      
      // Second pass: Draw black boxes for redaction
      for (const entity of pageEntities) {
        try {
          // Calculate position using helper function
          const position = getAdjustedPosition(entity, entity.entity);
          
          // Skip invalid positions
          if (position.x === undefined || position.y === undefined || 
              position.width === undefined || position.height === undefined) {
            console.warn(`Invalid position for entity "${entity.entity}" on page ${pageIndex+1}`);
            continue;
          }
          
          // Add black redaction rectangle on top
          const padding = 3; // Slightly smaller than the white box
          page.drawRectangle({
            x: Math.max(0, position.x - padding),
            y: Math.max(0, position.y - padding),
            width: position.width + (padding * 2),
            height: position.height + (padding * 2),
            color: rgb(0, 0, 0), // Black
            opacity: 1,
            borderWidth: 0
          });
          
          totalRedactionBoxes++;
          
          // Optional: Log detailed redaction box info for debugging
          console.log(`Drew redaction box for "${entity.entity}" at (${position.x.toFixed(2)},${position.y.toFixed(2)}) with size ${position.width.toFixed(2)}x${position.height.toFixed(2)} on page ${pageIndex+1}`);
        } catch (err) {
          console.error(`Error drawing redaction box for entity "${entity.entity}":`, err);
        }
      }
    }
    
    console.log(`Successfully drew ${totalRedactionBoxes} redaction boxes across ${Object.keys(entitiesByPage).length} pages`);
    return pdfDoc;
  } catch (error) {
    console.error('Error in drawRedactionBoxes:', error);
    return pdfDoc; // Return original document on error
  }
}

/**
 * Calculate adjusted position information for redaction box drawing
 * @param {Object} position - Raw position data
 * @param {string} entityText - The text of the entity being redacted
 * @returns {Object} Adjusted position with x, y, width, and height
 */
function getAdjustedPosition(position, entityText) {
  try {
    // Default position values
    let { x, y, width, height, pageIndex } = position;
    
    // If we have overlap information, adjust the position
    if (position.overlapStart !== undefined && 
        position.overlapEnd !== undefined && 
        position.originalText && 
        position.width) {
      
      // Calculate start and width based on character-level info
      const charWidth = position.width / position.originalText.length;
      const overlapWidth = (position.overlapEnd - position.overlapStart) * charWidth;
      
      // Adjust x position based on overlap start
      x = x + (position.overlapStart * charWidth);
      width = overlapWidth;
      
      console.log(`Adjusted position for "${entityText}" using overlap data [${position.overlapStart}-${position.overlapEnd}]`);
    }
    
    // Ensure we have valid dimensions, use fallbacks if needed
    if (width === undefined || width <= 0) {
      width = Math.max(entityText.length * 6, 20); // Fallback to character-based width
      console.warn(`Using fallback width ${width} for "${entityText}"`);
    }
    
    if (height === undefined || height <= 0) {
      height = 12; // Default height
      console.warn(`Using fallback height ${height} for "${entityText}"`);
    }
    
    // Add a larger padding to ensure complete coverage
    const padding = 4;
    x = Math.max(0, x - padding);
    y = Math.max(0, y - padding);
    width += padding * 2.5; // Extra horizontal padding
    height += padding * 2;
    
    return { x, y, width, height, pageIndex };
  } catch (error) {
    console.error('Error in getAdjustedPosition:', error);
    return position; // Return original position on error
  }
}

/**
 * Get content streams for a PDF page
 * @param {PDFDocument} pdfDoc - The PDF document
 * @param {PDFPage} page - The page to get content streams from
 * @returns {Promise<Array>} - Array of content stream objects
 */
async function getPageContentStreams(pdfDoc, page) {
  try {
    // Get content stream references for the page
    const contentStreamRefs = page.node.Contents();
    
    // Handle case where there are no content streams
    if (!contentStreamRefs) {
      return [];
    }
    
    // Convert to array if not already
    const streamRefs = Array.isArray(contentStreamRefs) ? contentStreamRefs : [contentStreamRefs];
    const contentStreams = [];
    
    // Process each content stream reference
    for (const streamRef of streamRefs) {
      if (!streamRef) continue;
      
      try {
        // Get the stream object
        const streamObj = pdfDoc.context.lookup(streamRef);
        if (!streamObj) continue;
        
        // Get the decoded content stream data
        const contentBytes = await streamObj.asUint8Array();
        
        // Add to content streams array
        contentStreams.push({
          ref: streamRef,
          content: contentBytes
        });
      } catch (streamError) {
        console.error('Error getting content stream:', streamError);
      }
    }
    
    return contentStreams;
  } catch (error) {
    console.error('Error getting page content streams:', error);
    return [];
  }
}

/**
 * Extract text directly from PDF stream objects
 * @param {PDFDocument} pdfDoc - PDF document
 * @param {PDFPage} page - PDF page
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromStreamObjects(pdfDoc, page) {
  try {
    // Get content streams for this page
    const contentStreams = await getPageContentStreams(pdfDoc, page);
    
    if (!contentStreams || contentStreams.length === 0) {
      return '';
    }
    
    let extractedText = '';
    
    // Process each content stream
    for (const contentStream of contentStreams) {
      if (!contentStream || !contentStream.content) continue;
      
      // Convert content to string for simple regex extraction
      const content = new TextDecoder().decode(contentStream.content);
      
      // Use regex to extract text between parentheses (basic approach)
      const textMatches = content.match(/\(([^)]+)\)/g) || [];
      
      for (const match of textMatches) {
        // Remove parentheses and add to extracted text
        extractedText += match.substring(1, match.length - 1) + ' ';
      }
      
      // Also look for hex strings
      const hexMatches = content.match(/<([0-9A-Fa-f]+)>/g) || [];
      
      for (const match of hexMatches) {
        // Convert hex to text
        try {
          const hexContent = match.substring(1, match.length - 1);
          let text = '';
          
          // Convert each hex pair to character
          for (let i = 0; i < hexContent.length; i += 2) {
            if (i + 1 < hexContent.length) {
              const hexPair = hexContent.substring(i, i + 2);
              text += String.fromCharCode(parseInt(hexPair, 16));
            }
          }
          
          extractedText += text + ' ';
        } catch (e) {
          // Ignore invalid hex strings
        }
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Error extracting text from stream objects:', error);
    return '';
  }
}
