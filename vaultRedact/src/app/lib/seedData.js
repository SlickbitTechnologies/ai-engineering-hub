import { 
  createRedactionRule, 
  createTemplate, 
  getUserRedactionRules
} from './firebase';

// Common redaction rules for pharmaceutical documents
const commonRules = [
  {
    name: "US Phone Number",
    description: "Detects and redacts US phone numbers in various formats",
    type: "regex",
    pattern: "\\b(\\+?1[-\\s]?)?\\(?([0-9]{3})\\)?[-\\s]?([0-9]{3})[-\\s]?([0-9]{4})\\b",
    category: "PHI",
    severity: "high",
    isEnabled: true
  },
  {
    name: "Email Address",
    description: "Detects and redacts email addresses",
    type: "regex",
    pattern: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b",
    category: "PII",
    severity: "high",
    isEnabled: true
  },
  {
    name: "Patient ID",
    description: "Detects and redacts patient ID numbers (MRN)",
    type: "regex",
    pattern: "\\b(?:Patient|MRN|Medical Record)\\s*(?:ID|Number|#)?:?\\s*([A-Za-z0-9-]{5,12})\\b",
    category: "PHI",
    severity: "high",
    isEnabled: true
  },
  {
    name: "Date of Birth",
    description: "Detects and redacts dates of birth in various formats",
    type: "regex",
    pattern: "\\b(?:DOB|Date of Birth|Birth Date|Born)\\s*:?\\s*([0-9]{1,2}[/\\-][0-9]{1,2}[/\\-][0-9]{2,4})\\b",
    category: "PHI",
    severity: "high",
    isEnabled: true
  }
];

/**
 * Create common redaction rules for a user
 * @param {string} userId - The user ID to create rules for
 * @returns {Promise<Array>} - Array of created rule IDs
 */
export const createCommonRules = async (userId) => {
  try {
    console.log(`Creating common redaction rules for user: ${userId}`);
    
    // First check if the user already has rules
    const existingRules = await getUserRedactionRules(userId);
    if (existingRules && existingRules.length > 0) {
      console.log(`User already has ${existingRules.length} rules, skipping creation`);
      return existingRules.map(rule => rule.id);
    }
    
    // Create each rule and collect the rule IDs
    const rulePromises = commonRules.map(rule => 
      createRedactionRule({
        ...rule,
        userId
      })
    );
    
    const ruleRefs = await Promise.all(rulePromises);
    const ruleIds = ruleRefs.map(ref => ref.id);
    
    console.log(`Created ${ruleIds.length} common rules for user: ${userId}`);
    return ruleIds;
  } catch (error) {
    console.error('Error creating common rules:', error);
    throw error;
  }
};

/**
 * Create common templates using existing rules
 * @param {string} userId - The user ID to create templates for
 * @param {Array<string>} ruleIds - Array of rule IDs to use in templates
 * @returns {Promise<Array>} - Array of created template IDs
 */
export const createCommonTemplates = async (userId, ruleIds) => {
  try {
    console.log(`Creating common templates for user: ${userId}`);
    
    if (!ruleIds || ruleIds.length === 0) {
      // If no rule IDs provided, first create the rules
      ruleIds = await createCommonRules(userId);
    }
    
    // Define templates using the rule IDs
    const templates = [
      {
        name: "Basic PHI Protection",
        description: "Protects patient IDs and dates of birth in medical documents",
        ruleIds: ruleIds.filter((_, index) => [2, 3].includes(index)) // Patient ID and DOB rules
      },
      {
        name: "Contact Information",
        description: "Redacts phone numbers and email addresses",
        ruleIds: ruleIds.filter((_, index) => [0, 1].includes(index)) // Phone and Email rules
      },
      {
        name: "Comprehensive Protection",
        description: "Maximum protection - redacts all personal and health information",
        ruleIds: ruleIds // All rules
      }
    ];
    
    // Create each template
    const templatePromises = templates.map(template => 
      createTemplate(userId, template)
    );
    
    const templateRefs = await Promise.all(templatePromises);
    const templateIds = templateRefs.map(ref => ref.id);
    
    console.log(`Created ${templateIds.length} common templates for user: ${userId}`);
    return templateIds;
  } catch (error) {
    console.error('Error creating common templates:', error);
    throw error;
  }
};

/**
 * Initialize seed data for a new user
 * @param {string} userId - The user ID to initialize data for
 */
export const initializeUserData = async (userId) => {
  try {
    console.log(`Initializing seed data for user: ${userId}`);
    
    // Create rules
    const ruleIds = await createCommonRules(userId);
    
    // Create templates using the rules
    await createCommonTemplates(userId, ruleIds);
    
    console.log(`Successfully initialized seed data for user: ${userId}`);
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
}; 