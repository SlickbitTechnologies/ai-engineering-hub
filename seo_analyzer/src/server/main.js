// Load environment variables
require('dotenv').config();

const express = require('express');
const ViteExpress = require('vite-express');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit } = require('firebase/firestore');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Validate API key
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is not set. AI suggestions will not be available.');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
app.use(express.json());

// Function to get AI-powered suggestions
async function getAISuggestions(analysisData, url) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      As an SEO expert, analyze this website data and provide detailed suggestions for improvement:
      URL: ${url}
      
      Current Analysis:
      - Title: ${analysisData.title.content || 'Missing'}
      - Meta Description: ${analysisData.meta.description || 'Missing'}
      - Headings Structure: H1 (${analysisData.headings.h1}), H2 (${analysisData.headings.h2}), H3 (${analysisData.headings.h3})
      - Images: ${analysisData.images.withAlt}/${analysisData.images.total} have alt text
      - Social Tags Status: ${Object.entries(analysisData.social).map(([key, value]) => `${key}: ${value || 'Missing'}`).join(', ')}
      
      Provide specific, actionable recommendations for:
      1. Content Optimization
      2. Technical SEO Improvements
      3. User Experience Enhancements
      4. Social Media Optimization
      5. Priority Action Items
      6. Competitor Analysis
      
      For competitor analysis, analyze the following aspects:
      - Content strategy comparison
      - Keyword targeting opportunities
      - Technical SEO advantages
      - Backlink opportunities
      - Market positioning
      
      IMPORTANT INSTRUCTIONS:
      - Provide between 1 and 5 suggestions for each category - no more, no less
      - Each suggestion should be concise and actionable
      - Do NOT include numbers or bullet points in your suggestions
      - For each suggestion, determine its priority level (high, medium, or low) based on its impact on SEO
      - Format the response as JSON with these keys: contentOptimization, technicalSEO, userExperience, socialMedia, priorityActions, competitorAnalysis
      - For each key, the value must be an array of objects with 'text' and 'priority' properties
      - Each suggestion object should follow this format: { "text": "suggestion text", "priority": "high|medium|low" }
      - Do NOT include category headings in the suggestion text
      - For competitor analysis, focus on actionable insights to outperform competitors
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    let suggestions;
    try {
      const text = response.text();
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      suggestions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    console.log(suggestions, 'suggestions_suggestions_')

    // Standardize the response format - ensure all fields are arrays of objects with text and priority
    const standardizedSuggestions = {
      legend: generatePriorityLegend(),
      contentOptimization: processAndLimitSuggestions(suggestions.contentOptimization, 'Content Optimization'),
      technicalSEO: processAndLimitSuggestions(suggestions.technicalSEO, 'Technical SEO'),
      userExperience: processAndLimitSuggestions(suggestions.userExperience, 'User Experience'),
      socialMedia: processAndLimitSuggestions(suggestions.socialMedia, 'Social Media'),
      priorityActions: processAndLimitSuggestions(suggestions.priorityActions, 'Priority Actions'),
      competitorAnalysis: processAndLimitSuggestions(suggestions.competitorAnalysis, 'Competitor Analysis')
    };

    return standardizedSuggestions;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    const defaultError = (text, priority) => [{
      text: text,
      priority: priority,
      icon: getPriorityStyles(priority).icon,
      display: {
        html: generateErrorDisplay(text, priority),
        text: `${getPriorityStyles(priority).icon} ${text}`
      }
    }];

    return {
      legend: generatePriorityLegend(),
      contentOptimization: defaultError('AI analysis currently unavailable: ' + error.message, 'high'),
      technicalSEO: defaultError('Please ensure GEMINI_API_KEY is configured correctly', 'high'),
      userExperience: defaultError('Check browser console for error details', 'medium'),
      socialMedia: defaultError('Retry the analysis when API service is available', 'medium'),
      priorityActions: defaultError('Configure API key to enable AI suggestions', 'high'),
      competitorAnalysis: defaultError('Unable to perform competitor analysis at this time', 'medium')
    };
  }
}

// Function to generate priority legend section
function generatePriorityLegend() {
  const styles = {
    container: `
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: #F9FAFB;
      border-radius: 8px;
      margin-bottom: 20px;
    `,
    title: `
      font-weight: 600;
      font-size: 1rem;
      color: #111827;
      margin-bottom: 8px;
    `,
    legendItem: `
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
    `,
    icon: `
      flex-shrink: 0;
    `,
    text: `
      color: #4B5563;
    `
  };

  const legendItems = [
    { ...getPriorityStyles('high'), label: 'High Priority - Immediate attention required' },
    { ...getPriorityStyles('medium'), label: 'Medium Priority - Important but not urgent' },
    { ...getPriorityStyles('low'), label: 'Low Priority - Consider implementing when possible' }
  ];

  const legendHTML = `
    <div style="${styles.container}">
      <div style="${styles.title}">Priority Indicators</div>
      ${legendItems.map(item => `
        <div style="${styles.legendItem}">
          <span style="${styles.icon}">${item.icon}</span>
          <span style="${styles.text}">${item.label}</span>
        </div>
      `).join('')}
    </div>
  `;

  return {
    html: legendHTML,
    items: legendItems.map(item => ({
      icon: item.icon,
      color: item.color,
      bgColor: item.bgColor,
      label: item.label
    }))
  };
}

// Helper function to generate error display with consistent styling
function generateErrorDisplay(text, priority) {
  const { icon, color, bgColor } = getPriorityStyles(priority);
  return `
    <div class="suggestion-item ${priority.toLowerCase()}" 
         style="display: flex; align-items: flex-start; gap: 8px; padding: 8px; border-radius: 4px; background: ${bgColor};">
      <span class="priority-icon" style="flex-shrink: 0;">${icon}</span>
      <span class="suggestion-text" style="color: ${color};">${text}</span>
    </div>
  `;
}

// Helper function to get priority weight for sorting
function getPriorityWeight(priority) {
  switch (priority.toLowerCase()) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

// Process suggestions to remove numbering and add priority levels
function processAndLimitSuggestions(value, category) {
  // First convert to array of objects with text and priority
  let suggestions = ensureSuggestionObjects(value);
  
  // Process each suggestion
  suggestions = suggestions.map(suggestion => {
    let text = suggestion.text || '';
    
    // Remove common numbering patterns
    text = text.replace(/^(\d+[.):\-]|\#\d+[.:]?|\(\d+\))\s*/g, '').trim();
    
    // Remove any numbers from the beginning
    text = text.replace(/^\d+\s*/, '');
    
    // Remove category heading if present
    text = text.replace(new RegExp(`^${category}:\\s*`, 'i'), '');

    // Get priority and corresponding styles
    const priority = suggestion.priority || determinePriority(text, category);
    const { icon, color, bgColor } = getPriorityStyles(priority);
    
    return {
      text: text,
      priority: priority,
      icon,
      color,
      bgColor,
      display: {
        html: `<div class="suggestion-item ${priority.toLowerCase()}" style="display: flex; align-items: flex-start; gap: 8px; padding: 8px; border-radius: 4px; background: ${bgColor};">
                <span class="priority-icon" style="flex-shrink: 0;">${icon}</span>
                <span class="suggestion-text" style="color: ${color};">${text}</span>
              </div>`,
        text: `${icon} ${text}` // Plain text version
      }
    };
  });
  
  // Filter out empty suggestions
  suggestions = suggestions.filter(suggestion => suggestion.text.length > 0);
  
  // Sort suggestions by priority (high -> medium -> low)
  suggestions.sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));
  
  // Ensure we have at least 1 suggestion
  if (suggestions.length === 0) {
    const defaultPriority = category === 'Competitor Analysis' ? 'high' : 'medium';
    const defaultText = category === 'Competitor Analysis' 
      ? 'Analyze top competitors in your industry to identify opportunities for improvement'
      : 'Consider improving this area based on industry best practices';
    
    const { icon, color, bgColor } = getPriorityStyles(defaultPriority);
    
    suggestions = [{
      text: defaultText,
      priority: defaultPriority,
      icon,
      color,
      bgColor,
      display: {
        html: `<div class="suggestion-item ${defaultPriority.toLowerCase()}" style="display: flex; align-items: flex-start; gap: 8px; padding: 8px; border-radius: 4px; background: ${bgColor};">
                <span class="priority-icon" style="flex-shrink: 0;">${icon}</span>
                <span class="suggestion-text" style="color: ${color};">${defaultText}</span>
              </div>`,
        text: `${icon} ${defaultText}`
      }
    }];
  }
  
  // Limit to maximum 5 suggestions
  return suggestions.slice(0, 5);
}

// Helper function to get priority styles including icon, color, and background color
function getPriorityStyles(priority) {
  switch (priority.toLowerCase()) {
    case 'high':
      return {
        icon: '🔴',
        color: '#DC2626', // Red text
        bgColor: 'rgba(254, 226, 226, 0.5)' // Light red background
      };
    case 'medium':
      return {
        icon: '⚠️',
        color: '#D97706', // Orange text
        bgColor: 'rgba(254, 243, 199, 0.5)' // Light orange background
      };
    case 'low':
      return {
        icon: '💡',
        color: '#059669', // Green text
        bgColor: 'rgba(209, 250, 229, 0.5)' // Light green background
      };
    default:
      return {
        icon: '❓',
        color: '#6B7280', // Gray text
        bgColor: 'rgba(243, 244, 246, 0.5)' // Light gray background
      };
  }
}

// Helper function to ensure suggestions are in object format with text and priority
function ensureSuggestionObjects(value) {
  if (!value) return [];
  
  // If already an array, ensure each item has text, priority, and display properties
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'string') {
        const priority = 'medium';
        const { icon, color, bgColor } = getPriorityStyles(priority);
        return formatSuggestionObject(item, priority, icon, color, bgColor);
      }
      if (item && typeof item === 'object') {
        const priority = item.priority || 'medium';
        const text = item.text || String(item);
        const { icon, color, bgColor } = getPriorityStyles(priority);
        return formatSuggestionObject(text, priority, icon, color, bgColor);
      }
      const priority = 'medium';
      const { icon, color, bgColor } = getPriorityStyles(priority);
      return formatSuggestionObject(String(item), priority, icon, color, bgColor);
    });
  }
  
  // If it's an object with a text property
  if (value && typeof value === 'object') {
    if (value.text) {
      const priority = value.priority || 'medium';
      const { icon, color, bgColor } = getPriorityStyles(priority);
      return [formatSuggestionObject(value.text, priority, icon, color, bgColor)];
    }
    // If it's just an object with properties
    return Object.values(value).map(item => {
      const priority = 'medium';
      const { icon, color, bgColor } = getPriorityStyles(priority);
      return formatSuggestionObject(String(item), priority, icon, color, bgColor);
    });
  }
  
  // If it's a string
  if (typeof value === 'string') {
    const priority = 'medium';
    const { icon, color, bgColor } = getPriorityStyles(priority);
    return [formatSuggestionObject(value, priority, icon, color, bgColor)];
  }
  
  return [];
}

// Helper function to format suggestion object with consistent structure
function formatSuggestionObject(text, priority, icon, color, bgColor) {
  return {
    text,
    priority,
    icon,
    color,
    bgColor,
    display: {
      html: `<div class="suggestion-item ${priority.toLowerCase()}" style="display: flex; align-items: flex-start; gap: 8px; padding: 8px; border-radius: 4px; background: ${bgColor};">
              <span class="priority-icon" style="flex-shrink: 0;">${icon}</span>
              <span class="suggestion-text" style="color: ${color};">${text}</span>
            </div>`,
      text: `${icon} ${text}`
    }
  };
}

// Function to analyze SEO tags
const analyzeSEO = (html, url) => {
  const $ = cheerio.load(html);
  const results = {
    title: {
      content: $('title').text(),
      score: 0,
      suggestions: []
    },
    meta: {
      description: $('meta[name="description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content'),
      viewport: $('meta[name="viewport"]').attr('content'),
      robots: $('meta[name="robots"]').attr('content'),
      score: 0,
      suggestions: []
    },
    headings: {
      h1: $('h1').length,
      h2: $('h2').length,
      h3: $('h3').length,
      score: 0,
      suggestions: []
    },
    images: {
      total: $('img').length,
      withAlt: $('img[alt]').length,
      score: 0,
      suggestions: []
    },
    social: {
      ogTitle: $('meta[property="og:title"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      twitterCard: $('meta[name="twitter:card"]').attr('content'),
      twitterTitle: $('meta[name="twitter:title"]').attr('content'),
      twitterDescription: $('meta[name="twitter:description"]').attr('content'),
      twitterImage: $('meta[name="twitter:image"]').attr('content'),
      score: 0,
      suggestions: []
    },
    links: {
      internal: 0,
      external: 0,
      score: 0,
      suggestions: []
    },
    // performance: {
    //   loadTime: 0,
    //   resourceCount: $('*').length,
    //   score: 0,
    //   suggestions: []
    // }
  };

  // Analyze title
  if (!results.title.content) {
    results.title.suggestions.push('Missing title tag');
    results.title.score = 0;
  } else if (results.title.content.length < 30 || results.title.content.length > 60) {
    results.title.suggestions.push('Title length should be between 30-60 characters');
    results.title.score = 50;
  } else {
    results.title.score = 100;
  }

  // Analyze meta description
  if (!results.meta.description) {
    results.meta.suggestions.push('Missing meta description');
    results.meta.score = 0;
  } else if (results.meta.description.length < 120 || results.meta.description.length > 160) {
    results.meta.suggestions.push('Meta description length should be between 120-160 characters');
    results.meta.score = 50;
  } else {
    results.meta.score = 100;
  }

  // Analyze headings
  if (results.headings.h1 === 0) {
    results.headings.suggestions.push('Missing H1 tag');
    results.headings.score = 0;
  } else if (results.headings.h1 > 1) {
    results.headings.suggestions.push('Multiple H1 tags found - consider using only one');
    results.headings.score = 50;
  } else {
    results.headings.score = 100;
  }

  // Analyze images
  if (results.images.total === 0) {
    results.images.suggestions.push('No images found');
    results.images.score = 0;
  } else if (results.images.withAlt < results.images.total) {
    results.images.suggestions.push('Some images are missing alt attributes');
    results.images.score = Math.round((results.images.withAlt / results.images.total) * 100);
  } else {
    results.images.score = 100;
  }

  // Analyze social tags
  let socialScore = 0;
  const socialTags = ['ogTitle', 'ogDescription', 'ogImage', 'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage'];
  socialTags.forEach(tag => {
    if (results.social[tag]) {
      socialScore += 100 / socialTags.length;
    } else {
      results.social.suggestions.push(`Missing ${tag}`);
    }
  });
  results.social.score = Math.round(socialScore);

  // Analyze links
  $('a').each((i, link) => {
    const href = $(link).attr('href');
    if (href) {
      if (href.startsWith('http') && !href.includes(url)) {
        results.links.external++;
      } else {
        results.links.internal++;
      }
    }
  });
  results.links.score = results.links.internal + results.links.external > 0 ? 100 : 0;
  if (results.links.score === 0) {
    results.links.suggestions.push('No links found');
  }

  // Calculate overall score
  const overallScore = Math.round(
    (results.title.score +
      results.meta.score +
      results.headings.score +
      results.images.score +
      results.social.score +
      results.links.score) / 6
  );

  return {
    ...results,
    overallScore
  };
};

// Endpoint to analyze a website
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await axios.get(url);
    const analysis = analyzeSEO(response.data, url);
    
    // Get AI-powered suggestions
    const aiSuggestions = await getAISuggestions(analysis, url);
    analysis.aiSuggestions = aiSuggestions;

    // Save to Firebase
    try {
      const docRef = await addDoc(collection(db, 'history'), {
        url,
        overallScore: analysis.overallScore,
        titleScore: analysis.title.score,
        metaScore: analysis.meta.score,
        headingsScore: analysis.headings.score,
        imagesScore: analysis.images.score,
        socialScore: analysis.social.score,
        linksScore: analysis.links.score,
        aiSuggestions,
        createdAt: new Date().toISOString()
      });
      console.log('Analysis saved with ID:', docRef.id);
    } catch (dbError) {
      console.error('Error saving to Firebase:', dbError);
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to analyze website',
      message: error.message
    });
  }
});

// Get analysis history
app.get('/api/history', async (req, res) => {
  try {
    const historyQuery = query(
      collection(db, 'history'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(historyQuery);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Delete history entry
app.delete('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDoc(doc(db, 'history', id));
    res.json({ message: 'History entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
ViteExpress.listen(app, port, () => {
  console.log(`Server is running on port ${port}`);
});
