interface ParsedItem {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

async function parseTextWithGemini(text: string): Promise<ParsedItem> {
  try {
    const prompt = `
      Parse this shopping item text into a structured format.
      Input: "${text}"
      Rules:
      - If quantity is not specified, assume quantity is 1
      - If unit is not specified, assume unit is "each"
      - Extract only: name, quantity, and unit
      - Name should be the item name only, WITHOUT the unit or quantity
      - Remove any units from the name field
      - Quantity should be a number
      - Unit should be one of: kg, g, lb, oz, each, pieces
      
      Respond ONLY with a JSON object in this exact format:
      {
        "name": "item name without unit",
        "quantity": number,
        "unit": "unit",
        "sku": "sku"
      }

      example input:"2 kg chicken breast"
      example output:{"name":"chicken breast","quantity":2,"unit":"kg","sku":""}

      example input:"100g chicken"
      example output:{"name":"chicken","quantity":100,"unit":"g","sku":""}

      example input:"chicken"
      example output:{"name":"chicken","quantity":1,"unit":"each","sku":""}
    `;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to parse item with Gemini');
    }

    const data = await response.json();
    const parsedText = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON object from the response
    const jsonMatch = parsedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Additional cleanup to ensure no units in name
    const cleanName = parsed.name.toLowerCase()
      .replace(/(kg|g|lb|oz|pieces|each)\s*$/i, '')
      .trim();
   
    return {
      name: cleanName,
      sku: '',
      quantity: parsed.quantity,
      unit: parsed.unit.toLowerCase()
    };
  } catch (error) {
    console.error('Error parsing item:', error);
    // Fallback parsing for basic cases
    const words = text.toLowerCase().trim().split(' ');
    
    // If first word is a number, use it as quantity
    const firstWord = words[0];
    const quantity = !isNaN(Number(firstWord)) ? Number(firstWord) : 1;
    
    // Check for unit
    const unitWords = ['kg', 'g', 'lb', 'oz', 'pieces'];
    let unit = 'each';
    let nameWords = quantity === 1 ? words : words.slice(1);
    
    // Find and remove unit from name
    for (const unitWord of unitWords) {
      const unitIndex = nameWords.indexOf(unitWord);
      if (unitIndex !== -1) {
        unit = unitWord;
        nameWords = [...nameWords.slice(0, unitIndex), ...nameWords.slice(unitIndex + 1)];
        break;
      }
    }
    
    return {
      name: nameWords.join(' ').trim(),
      sku: '',
      quantity,
      unit
    };
  }
}

export async function parseItems(input: string): Promise<ParsedItem[]> {
  const items = input.split('\n').filter(item => item.trim());
  return Promise.all(items.map(item => parseTextWithGemini(item)));
}

export type { ParsedItem }; 