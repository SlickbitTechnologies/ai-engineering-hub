import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Create SHA-256 hash from text string
 * @param {string} text - Text to hash
 * @returns {string} - Hexadecimal hash
 */
function createSHA256Hash(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Get user ID from cookies or authorization header
 * @param {Request} request - The incoming request
 * @returns {string|null} - User ID or null
 */
async function getUserId(request) {
  try {
    // Try to get from cookies first (client-side auth)
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (sessionCookie && sessionCookie.value) {
      try {
        // Parse the session cookie which might contain user info
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
        if (sessionData && sessionData.user && sessionData.user.uid) {
          return sessionData.user.uid;
        }
      } catch (e) {
        console.log('Error parsing session cookie:', e);
      }
    }
    
    // Try Authorization header next
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // In a real implementation, you'd verify this token
      // For simplicity, just extract user ID if it's in the right format
      if (token && token.length > 20) {
        return token;
      }
    }
    
    // For development purposes only - allow passing userId as query param
    // REMOVE THIS IN PRODUCTION
    const url = new URL(request.url);
    const devUserId = url.searchParams.get('userId');
    if (process.env.NODE_ENV === 'development' && devUserId) {
      console.warn('⚠️ Using development user ID bypass - NOT SECURE FOR PRODUCTION');
      return devUserId;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Enrich a single template with checksums for all rules missing metadata
 * @param {string} templateId - Template ID
 * @returns {Promise<Object>} - Result with success status and message
 */
async function enrichTemplate(templateId) {
  try {
    const tplRef = doc(db, 'templates', templateId);
    const tplSnap = await getDoc(tplRef);
    
    if (!tplSnap.exists()) {
      return {
        success: false,
        message: `Template ${templateId} not found`
      };
    }

    const template = tplSnap.data();
    let updatedCount = 0;
    
    // Check if template has rules
    if (!template.rules || !Array.isArray(template.rules)) {
      return {
        success: false,
        message: `Template ${templateId} has no rules array`
      };
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
      return {
        success: true,
        message: `Template updated with ${updatedCount} rule checksums added`,
        updatedCount
      };
    } else {
      return {
        success: true,
        message: 'No rules needed updating',
        updatedCount: 0
      };
    }
  } catch (error) {
    console.error(`Error enriching template ${templateId}:`, error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Enrich all templates for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Result with success status and count
 */
async function enrichUserTemplates(userId) {
  try {
    // Query templates for this user
    const templatesQuery = query(
      collection(db, 'templates'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(templatesQuery);
    
    // Track results
    const results = {
      success: true,
      totalTemplates: querySnapshot.size,
      updatedTemplates: 0,
      updatedRules: 0,
      errors: []
    };
    
    // Process each template
    for (const docSnap of querySnapshot.docs) {
      const templateId = docSnap.id;
      const result = await enrichTemplate(templateId);
      
      if (result.success) {
        if (result.updatedCount > 0) {
          results.updatedTemplates++;
          results.updatedRules += result.updatedCount;
        }
      } else {
        results.errors.push({
          templateId,
          error: result.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error enriching user templates:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
}

/**
 * Bypass authorization check in development mode
 * REMOVE THIS IN PRODUCTION
 */
function isDevBypass(request) {
  if (process.env.NODE_ENV !== 'development') return false;
  
  const url = new URL(request.url);
  const bypass = url.searchParams.get('devBypass') === 'true';
  
  if (bypass) {
    console.warn('⚠️ Using development authorization bypass - NOT SECURE FOR PRODUCTION');
  }
  
  return bypass;
}

/**
 * API Route Handler to enrich templates with checksums
 * 
 * Supports:
 * - POST /api/enrich-templates?template=TEMPLATE_ID
 * - POST /api/enrich-templates?all=true (requires auth)
 * - Development: POST /api/enrich-templates?template=TEMPLATE_ID&devBypass=true
 */
export async function POST(request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const templateId = url.searchParams.get('template');
    const all = url.searchParams.get('all') === 'true';
    
    // Get user ID from cookies or auth
    const userId = await getUserId(request);
    const devMode = isDevBypass(request);
    
    // Handle single template enrichment
    if (templateId) {
      // Skip auth check in dev mode with bypass
      if (!userId && !devMode) {
        return NextResponse.json(
          { success: false, message: 'Authentication required. Use devBypass=true in development.' },
          { status: 401 }
        );
      }
      
      // In production, verify template ownership
      if (!devMode && userId) {
        // Verify template ownership - get the template first
        const tplRef = doc(db, 'templates', templateId);
        const tplSnap = await getDoc(tplRef);
        
        if (!tplSnap.exists()) {
          return NextResponse.json(
            { success: false, message: 'Template not found' },
            { status: 404 }
          );
        }
        
        const template = tplSnap.data();
        if (template.userId !== userId) {
          return NextResponse.json(
            { success: false, message: 'Not authorized to modify this template' },
            { status: 403 }
          );
        }
      }
      
      const result = await enrichTemplate(templateId);
      return NextResponse.json(result);
    }
    
    // Handle enriching all user templates
    if (all) {
      if (!userId && !devMode) {
        return NextResponse.json(
          { success: false, message: 'Authentication required for batch operations. Use devBypass=true in development.' },
          { status: 401 }
        );
      }
      
      // Use the provided userId or fallback to query parameter in dev mode
      const targetUserId = userId || url.searchParams.get('userId');
      
      if (!targetUserId) {
        return NextResponse.json(
          { success: false, message: 'User ID required for batch operations' },
          { status: 400 }
        );
      }
      
      const results = await enrichUserTemplates(targetUserId);
      return NextResponse.json(results);
    }
    
    // Invalid request
    return NextResponse.json(
      { success: false, message: 'Invalid request. Use template=ID or all=true' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in enrich-templates route:', error);
    return NextResponse.json(
      { success: false, message: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 