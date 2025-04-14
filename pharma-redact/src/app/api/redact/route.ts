import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with the 2.0 Flash model
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Helper function for regex-based entity detection as a fallback
async function detectEntitiesWithRegex(text: string, pageNumber: number): Promise<any[]> {
    const entities: any[] = [];

    // Define regex patterns for common sensitive information
    const patterns = [
        {
            pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            category: 'EMAIL'
        },
        {
            pattern: /\(\d{3}\)\s*\d{3}-\d{4}/g,
            category: 'PHONE'
        },
        {
            pattern: /Dr\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g,
            category: 'PERSON'
        },
        {
            pattern: /\b[A-Z][a-z]+(?:endo|labs|pharmaceuticals)\b/gi,
            category: 'COMPANY'
        },
        {
            pattern: /\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr),?\s+[A-Z][a-z]+,?\s+[A-Z]{2}\s+\d{5}/g,
            category: 'ADDRESS'
        },
    ];

    // Apply each pattern
    for (const { pattern, category } of patterns) {
        let match;
        // Reset the regex before each use
        pattern.lastIndex = 0;

        while ((match = pattern.exec(text)) !== null) {
            entities.push({
                text: match[0],
                category,
                page: pageNumber,
                start: match.index,
                end: match.index + match[0].length,
                confidence: 0.7
            });
        }
    }

    return entities;
}

export async function POST(request: NextRequest) {
    try {
        const { text, pageNumber, context, templateId } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
        }

        // Get the model - use gemini-2.0-flash as requested
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Improved prompt with template-specific rules
        const prompt = `
You are an AI assistant specialized in identifying sensitive information in pharmaceutical and clinical trial documents that needs to be redacted.

Analyze the following text from page ${pageNumber} and identify sensitive information that should be redacted.
Context of this section: ${context || 'clinical protocol'}

RULES FOR REDACTION:
1. ALWAYS REDACT the following types of PII:
   - Full names of individuals (tag as PERSON) such as investigators, sponsors, contacts
   - Email addresses (tag as EMAIL)
   - Physical addresses including city, state, postal code (tag as ADDRESS)
   - Phone numbers in any format (tag as PHONE)
   - Social Security Numbers (SSNs) in any format (tag as SSN)
   - Fax numbers (tag as FAX)
   
2. ALWAYS REDACT the following clinical trial information:
   - Sponsor company names (tag as COMPANY)
   - Tertiary/Exploratory endpoints (tag as ENDPOINT)
   - Trial site locations (tag as LOCATION) 
   - Trial-specific identifiers (tag as IDENTIFIER)
   
3. NEVER REDACT the following:
   - Standard medical or scientific terminology
   - Drug names that are already publicly disclosed
   - Names of public institutions or published journals
   - General condition names (e.g., "Polycystic Ovary Syndrome")

Look specifically for these common patterns seen in clinical documents:
- Email addresses like "name@domain.com" (tag as EMAIL)
- Phone numbers in formats like "(XXX) XXX-XXXX" (tag as PHONE)
- Names with titles like "Dr. First Last" (tag as PERSON)
- Company names followed by "Labs" or "Pharmaceuticals" (tag as COMPANY)
- Addresses with street numbers, city names, states and zip codes (tag as ADDRESS)

Be extremely precise with the character offsets (start/end). The indexes should point to the exact position of the entity in the text string.

Text to analyze (page ${pageNumber}):
"""
${text}
"""

Return a JSON array of entities in this EXACT format with NO markdown formatting:
[
  {
    "text": "exact text to redact",
    "category": "PERSON|EMAIL|PHONE|ADDRESS|SSN|FAX|COMPANY|ENDPOINT|LOCATION|IDENTIFIER",
    "page": ${pageNumber},
    "start": character_offset_start,
    "end": character_offset_end,
    "confidence": 0.9
  }
]

If no sensitive information is found, return an empty array: []
`;

        // Call Google Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text().trim();

        console.log("Gemini API Response:", responseText.substring(0, 100) + "...");

        // Clean up markdown formatting that Gemini might add
        responseText = responseText.replace(/```json\s*/g, '');
        responseText = responseText.replace(/```\s*$/g, '');
        responseText = responseText.replace(/```/g, '');

        // Additional cleanup for any explanatory text before or after JSON
        const jsonArrayMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonArrayMatch) {
            responseText = jsonArrayMatch[0];
        }

        // Failsafe: If API doesn't return proper entities, add some standard redactions
        // based on common patterns in clinical protocols
        let entities = [];

        try {
            // Try to parse the response directly
            entities = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Error parsing initial response:", parseError);
            console.error("Cleaned response:", responseText);

            // If still having issues parsing, try a more aggressive approach
            try {
                // Look for anything that resembles a JSON array
                const stricterJsonMatch = responseText.match(/\[\s*\{[^]*?\}\s*\]/);
                if (stricterJsonMatch) {
                    entities = JSON.parse(stricterJsonMatch[0]);
                }
            } catch (secondParseError) {
                console.error("Error with stricter JSON parsing:", secondParseError);
                entities = [];
            }
        }

        // If no entities were found by the API, try to apply regex-based detection
        // for common patterns seen in the screenshot
        if (!entities || entities.length === 0) {
            console.log("No entities detected by API, applying failsafe regex patterns");

            // Try to detect entities using regex
            entities = await detectEntitiesWithRegex(text, pageNumber);
        }

        return NextResponse.json({ entities });
    } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
    }
} 