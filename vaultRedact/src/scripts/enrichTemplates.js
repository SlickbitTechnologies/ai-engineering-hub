import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import crypto from 'crypto';

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Create SHA-256 hash for a given text
 * @param {string} text - Text to hash
 * @returns {string} - Hexadecimal hash
 */
function createSHA256Hash(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Enrich a single template's rules with checksums
 * @param {string} templateId - Template ID
 * @returns {Promise<boolean>} - Success status
 */
async function enrichTemplate(templateId) {
  try {
    console.log(`Processing template: ${templateId}`);
    const tplRef = doc(db, 'templates', templateId);
    const tplSnap = await getDoc(tplRef);
    
    if (!tplSnap.exists()) {
      console.error(`Template ${templateId} not found`);
      return false;
    }

    const template = tplSnap.data();
    let updatedCount = 0;
    
    // Check if template has rules
    if (!template.rules || !Array.isArray(template.rules)) {
      console.warn(`Template ${templateId} has no rules array, skipping`);
      return false;
    }
    
    // Update rules with checksums
    const updatedRules = template.rules.map(rule => {
      if (!rule) return rule;
      
      // Skip if already has version or checksum
      if (rule.version || rule.checksum) {
        return rule;
      }

      // Add checksum based on pattern or aiPrompt
      if (rule.pattern) {
        updatedCount++;
        return {
          ...rule,
          checksum: createSHA256Hash(rule.pattern)
        };
      } else if (rule.aiPrompt) {
        updatedCount++;
        return {
          ...rule,
          checksum: createSHA256Hash(rule.aiPrompt)
        };
      } else {
        // No pattern or aiPrompt, add basic version
        updatedCount++;
        return {
          ...rule,
          version: '1.0.0'
        };
      }
    });

    // Only update if changes were made
    if (updatedCount > 0) {
      await updateDoc(tplRef, { rules: updatedRules });
      console.log(`Template ${templateId} updated with ${updatedCount} rule checksums added.`);
      return true;
    } else {
      console.log(`Template ${templateId} had no rules needing updates.`);
      return false;
    }
  } catch (error) {
    console.error(`Error enriching template ${templateId}:`, error);
    return false;
  }
}

/**
 * Process all templates in the database
 * @param {string|null} userId - Optional user ID to filter by
 * @returns {Promise<void>}
 */
async function enrichAllTemplates(userId = null) {
  try {
    console.log('Starting template enrichment process...');
    
    // Build query
    let templatesQuery;
    if (userId) {
      console.log(`Fetching templates for user: ${userId}`);
      templatesQuery = query(
        collection(db, 'templates'),
        where('userId', '==', userId)
      );
    } else {
      console.log('Fetching all templates');
      templatesQuery = collection(db, 'templates');
    }
    
    const querySnapshot = await getDocs(templatesQuery);
    console.log(`Found ${querySnapshot.size} templates`);
    
    // Process each template
    let successCount = 0;
    let errorCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const success = await enrichTemplate(doc.id);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    console.log('\nEnrichment process completed:');
    console.log(`- Total templates: ${querySnapshot.size}`);
    console.log(`- Successfully updated: ${successCount}`);
    console.log(`- Errors/skipped: ${errorCount}`);
  } catch (error) {
    console.error('Error in enrichment process:', error);
  }
}

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

// Handle different commands
async function run() {
  if (command === 'single' && param) {
    // Process single template
    await enrichTemplate(param);
  } else if (command === 'user' && param) {
    // Process templates for specific user
    await enrichAllTemplates(param);
  } else if (command === 'all') {
    // Process all templates
    await enrichAllTemplates();
  } else {
    console.log('Usage:');
    console.log('  node enrichTemplates.js single <templateId>  - Enrich a specific template');
    console.log('  node enrichTemplates.js user <userId>        - Enrich all templates for a user');
    console.log('  node enrichTemplates.js all                  - Enrich all templates');
  }
  
  // Exit when done
  process.exit(0);
}

// Run the script
run().catch(console.error); 