import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

interface PrivacyAnalysisResult {
  overallScore: number;
  gdprScore: number;
  ccpaScore: number;
  dpdpaScore: number;
  complianceBreakdown: {
    compliant: number;
    needsAttention: number;
    highRisk: number;
  };
  gaps: Array<{
    title: string;
    regulation: string;
    riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  }>;
  insights: Array<{
    title: string;
    regulation: string;
    article: string;
    description: string;
    riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  }>;
  lastAnalyzed: string;
}

// Use Gemini Pro model for text analysis - updated to use correct model name
const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });

// Safety settings for the model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Analyze privacy policy document using Gemini AI
export async function analyzePrivacyPolicyWithGemini(
  policyText: string,
  regulationsToCheck: { gdpr: boolean; ccpa: boolean; dpdpa: boolean }
): Promise<PrivacyAnalysisResult> {
  try {
    // Build the regulations to check based on user selection
    const selectedRegulations = [];
    if (regulationsToCheck.gdpr) selectedRegulations.push('GDPR');
    if (regulationsToCheck.ccpa) selectedRegulations.push('CCPA');
    if (regulationsToCheck.dpdpa) selectedRegulations.push('DPDPA');
    
    // If none selected, default to GDPR
    if (selectedRegulations.length === 0) selectedRegulations.push('GDPR');

    // Truncate policy text if it's too long to avoid token limits
    const maxTextLength = 60000; // Approximate limit for Gemini
    const truncatedText = policyText.length > maxTextLength 
      ? policyText.substring(0, maxTextLength) + "... [text truncated due to length]" 
      : policyText;

    // Create the prompt for Gemini
    const prompt = `
    You are a professional privacy policy analyzer with expertise in global privacy regulations. Please analyze the following privacy policy text for compliance with relevant regulations.
    
    The user has specifically selected these regulations for analysis: ${selectedRegulations.join(', ')}.
    
    For each regulation, evaluate:
    1. Data collection and processing purposes
    2. User consent mechanisms
    3. Data subject rights
    4. Data retention policies
    5. Data security measures
    6. Third-party sharing policies
    7. Children's privacy requirements
    8. International data transfers
    
    Privacy Policy Text:
    "${truncatedText}"

    Please provide your analysis STRICTLY in the following JSON format with no additional text or explanation outside the JSON structure:
    {
      "overallScore": <score from 0 to 100>,
      "gdprScore": <score from 0 to 100, or 0 if GDPR not selected>,
      "ccpaScore": <score from 0 to 100, or 0 if CCPA not selected>,
      "dpdpaScore": <score from 0 to 100, or 0 if DPDPA not selected>,
      "complianceBreakdown": {
        "compliant": <percentage of requirements that are fully compliant>,
        "needsAttention": <percentage of requirements that need attention>,
        "highRisk": <percentage of requirements that are high risk>
      },
      "gaps": [
        {
          "title": "<title of the gap>",
          "regulation": "<regulation name - must be one of: GDPR, CCPA, DPDPA, or General>",
          "riskLevel": "<must be exactly one of: High Risk, Medium Risk, or Low Risk>"
        },
        ...
      ],
      "insights": [
        {
          "title": "<title of the insight>",
          "regulation": "<regulation name - must be one of: GDPR, CCPA, DPDPA, or General>",
          "article": "<specific article or section reference>",
          "description": "<suggestion for improvement>",
          "riskLevel": "<must be exactly one of: High Risk, Medium Risk, or Low Risk>"
        },
        ...
      ]
    }

    Important guidelines:
    - Only include gaps and insights for the selected regulations
    - Set scores to 0 for regulations that were not selected
    - The "riskLevel" fields must be EXACTLY one of: "High Risk", "Medium Risk", or "Low Risk"
    - The "regulation" fields must be EXACTLY one of: "GDPR", "CCPA", "DPDPA", or "General"
    - Only respond with the JSON object, no additional text
    - Do not include trailing commas in the JSON
    - Ensure all percentage values add up to 100
    `;

    // Generate content from Gemini
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    const response = result.response;
    const text = response.text();
    
    // Extract the JSON object from the response text
    // Using regex to find JSON object pattern in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON response from Gemini');
    }
    
    const jsonStr = jsonMatch[0];
    
    // Parse and validate the JSON response
    try {
      const parsedResult = JSON.parse(jsonStr) as PrivacyAnalysisResult;
      
      // Ensure scores are numbers between 0-100
      parsedResult.overallScore = Math.max(0, Math.min(100, parsedResult.overallScore));
      parsedResult.gdprScore = regulationsToCheck.gdpr ? Math.max(0, Math.min(100, parsedResult.gdprScore)) : 0;
      parsedResult.ccpaScore = regulationsToCheck.ccpa ? Math.max(0, Math.min(100, parsedResult.ccpaScore)) : 0;
      parsedResult.dpdpaScore = regulationsToCheck.dpdpa ? Math.max(0, Math.min(100, parsedResult.dpdpaScore)) : 0;
      
      // Normalize compliance breakdown to ensure it adds up to 100%
      const breakdown = parsedResult.complianceBreakdown;
      const total = breakdown.compliant + breakdown.needsAttention + breakdown.highRisk;
      if (total > 0 && total !== 100) {
        const factor = 100 / total;
        breakdown.compliant = Math.round(breakdown.compliant * factor);
        breakdown.needsAttention = Math.round(breakdown.needsAttention * factor);
        breakdown.highRisk = 100 - breakdown.compliant - breakdown.needsAttention;
      }
      
      // Filter gaps and insights to only include selected regulations
      if (!regulationsToCheck.gdpr) {
        parsedResult.gaps = parsedResult.gaps.filter(gap => gap.regulation !== 'GDPR');
        parsedResult.insights = parsedResult.insights.filter(insight => insight.regulation !== 'GDPR');
      }
      
      if (!regulationsToCheck.ccpa) {
        parsedResult.gaps = parsedResult.gaps.filter(gap => gap.regulation !== 'CCPA');
        parsedResult.insights = parsedResult.insights.filter(insight => insight.regulation !== 'CCPA');
      }
      
      if (!regulationsToCheck.dpdpa) {
        parsedResult.gaps = parsedResult.gaps.filter(gap => gap.regulation !== 'DPDPA');
        parsedResult.insights = parsedResult.insights.filter(insight => insight.regulation !== 'DPDPA');
      }
      
      // Add the timestamp of analysis
      parsedResult.lastAnalyzed = new Date().toISOString();
      
      return parsedResult;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError, 'Response was:', jsonStr);
      throw new Error('Failed to parse Gemini AI response');
    }
  } catch (error) {
    console.error('Error analyzing privacy policy with Gemini:', error);
    
    // Return a fallback analysis result in case of error
    return {
      overallScore: 0,
      gdprScore: regulationsToCheck.gdpr ? 0 : 0,
      ccpaScore: regulationsToCheck.ccpa ? 0 : 0,
      dpdpaScore: regulationsToCheck.dpdpa ? 0 : 0,
      complianceBreakdown: {
        compliant: 0,
        needsAttention: 0,
        highRisk: 100
      },
      gaps: [{
        title: 'Error in AI analysis',
        regulation: 'General',
        riskLevel: 'High Risk'
      }],
      insights: [{
        title: 'Error analyzing document',
        regulation: 'General',
        article: 'N/A',
        description: 'There was an error analyzing the document with AI. Please try again or use manual analysis.',
        riskLevel: 'High Risk'
      }],
      lastAnalyzed: new Date().toISOString()
    };
  }
} 