/**
 * Script to fix 'use client' directive issues
 * This ensures the directive is properly placed at the top of the file
 */
const fs = require('fs');
const path = require('path');

console.log('Running use client directive fix script...');

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

// Main function
function fixFiles() {
  try {
    // Ensure all page files have correct 'use client' directive
    const pageDir = path.join(__dirname, '..', 'app');
    
    // List of important page files to fix
    const pagesToFix = [
      path.join(pageDir, 'page.tsx'),
      path.join(pageDir, 'text-summarize', 'page.tsx'),
      path.join(pageDir, 'pdf-summarize', 'page.tsx'), 
      path.join(pageDir, 'audio-summarize', 'page.tsx'),
      path.join(pageDir, 'translate', 'page.tsx'),
      path.join(pageDir, 'youtube-summarize', 'page.tsx'),
      path.join(pageDir, 'web-scrape', 'page.tsx'),
      path.join(pageDir, 'history', 'page.tsx'),
    ];
    
    pagesToFix.forEach(fixUseClientDirective);
    
    console.log('Use client directive fix complete!');
  } catch (error) {
    console.error('Error during fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixFiles(); 