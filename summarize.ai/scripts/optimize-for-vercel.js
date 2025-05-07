/**
 * Script to optimize Next.js build for Vercel deployment
 * This helps prevent common deployment issues
 */
const fs = require('fs');
const path = require('path');

console.log('Running Vercel build optimization script...');

// Helper function to fix 'use client' directive in files
function fixUseClientDirective(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file has 'use client'
  if (!content.includes("'use client'") && !content.includes('"use client"')) {
    console.log(`${filePath} doesn't have 'use client' directive`);
    return;
  }
  
  // Remove the existing 'use client' directive
  content = content.replace(/(['"]use client['"];?\n+)/g, '');
  
  // Add 'use client' at the very beginning
  const newContent = `'use client';\n\n${content}`;
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Fixed 'use client' directive in ${filePath}`);
}

// Helper function to add dynamic directive to files
function addDynamicDirectiveToFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has dynamic directive
  if (content.includes('export const dynamic = ')) {
    console.log(`${filePath} already has dynamic directive`);
    return;
  }
  
  // Check if the file has 'use client'
  const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
  
  let newContent;
  
  if (hasUseClient) {
    // If 'use client' exists, add dynamic directive after it
    newContent = content.replace(/(['"]use client['"];?\n+)/, "$1// Dynamic directive for Vercel deployment\nexport const dynamic = 'force-dynamic';\n\n");
  } else {
    // If no 'use client', add it and the dynamic directive
    newContent = `'use client';\n\n// Dynamic directive for Vercel deployment\nexport const dynamic = 'force-dynamic';\n\n${content}`;
  }
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Added dynamic directive to ${filePath}`);
}

// Main optimization function
function optimizeBuild() {
  try {
    // Ensure all page files have dynamic directive
    const pageDir = path.join(__dirname, '..', 'app');
    
    // List of important page files to optimize
    const pagesToOptimize = [
      path.join(pageDir, 'page.tsx'),
      path.join(pageDir, 'layout.tsx'),
      path.join(pageDir, 'text-summarize', 'page.tsx'),
      path.join(pageDir, 'pdf-summarize', 'page.tsx'),
      path.join(pageDir, 'audio-summarize', 'page.tsx'),
      path.join(pageDir, 'translate', 'page.tsx'),
      path.join(pageDir, 'youtube-summarize', 'page.tsx'),
      path.join(pageDir, 'web-scrape', 'page.tsx'),
      path.join(pageDir, 'history', 'page.tsx'),
    ];
    
    // First fix 'use client' directives
    console.log('Fixing use client directives...');
    pagesToOptimize.forEach(fixUseClientDirective);
    
    // Then add dynamic directives
    console.log('Adding dynamic directives...');
    pagesToOptimize.forEach(addDynamicDirectiveToFile);
    
    console.log('Build optimization complete!');
  } catch (error) {
    console.error('Error during build optimization:', error);
    process.exit(1);
  }
}

// Run the optimization
optimizeBuild(); 