// chatbot-backend/services/fileService.js
import fs from 'fs/promises'; // Use ES module import for built-in modules
import path from 'path';
import pdf from 'pdf-parse';   // Use default import for pdf-parse

const docCache = {}; // Simple in-memory cache

export async function getLocalDocumentContent(filePath, useCache = true) {
 
     const currentFilePath = new URL(import.meta.url).pathname;
     const currentDirPath = path.dirname(process.platform === "win32" && currentFilePath.startsWith('/') ? currentFilePath.substring(1) : currentFilePath);

     // Resolve the absolute path relative to the current module's directory
     const absolutePath = path.resolve(currentDirPath, filePath); // Use path relative to *this* file

     if (useCache && docCache[absolutePath]) {
         console.log(`CACHE HIT: Using cached content for ${absolutePath}`);
         return docCache[absolutePath];
     }

     console.log(`FILE READ: Attempting to read ${absolutePath}`);
     try {
         await fs.access(absolutePath);
         const dataBuffer = await fs.readFile(absolutePath);
         let content = "";

         if (absolutePath.toLowerCase().endsWith(".txt")) {
             try {
                 content = dataBuffer.toString('utf-8');
             } catch (e) {
                 console.warn(`Could not decode ${absolutePath} as UTF-8, trying latin1...`);
                 try {
                     content = dataBuffer.toString('latin1');
                 } catch (decodeErr) {
                     console.error(`Failed to decode TXT ${absolutePath}:`, decodeErr);
                     return null;
                 }
             }
             console.log(`FILE READ: Parsed TXT content from ${absolutePath}`);
         } else if (absolutePath.toLowerCase().endsWith(".pdf")) {
             try {
                 // pdf-parse is typically used with await
                 const pdfData = await pdf(dataBuffer);
                 content = pdfData.text;
                 console.log(`FILE READ: Parsed PDF content from ${absolutePath} (${pdfData.numpages} pages)`);
             } catch (pdfErr) {
                 console.error(`Error parsing PDF ${absolutePath}:`, pdfErr);
                 return null;
             }
         } else {
             console.warn(`Unknown file type for ${absolutePath}, attempting text decode.`);
             try {
                 content = dataBuffer.toString('utf-8');
             } catch (e) {
                  console.error(`Could not decode unknown file type ${absolutePath} as UTF-8.`);
                  return null;
             }
         }

         if (useCache) {
             docCache[absolutePath] = content;
             console.log(`CACHE SET: Cached content for ${absolutePath}`);
         }
         return content;

     } catch (error) {
         if (error.code === 'ENOENT') {
             console.error(`File not found: ${absolutePath}`);
         } else {
             console.error(`Error accessing/reading file ${absolutePath}:`, error);
         }
         return null;
     }
}

export async function savePDF(file, destination) {
  try {
    console.log('Saving PDF to:', destination);
    await fs.writeFile(destination, file.buffer);
    return destination;
  } catch (error) {
    console.error('Error saving PDF:', error);
    throw error;
  }
} 