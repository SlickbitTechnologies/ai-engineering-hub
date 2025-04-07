// Load environment variables
require('dotenv').config();

const express = require('express');
const ViteExpress = require('vite-express');
const axios = require('axios');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Validate API key
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is not set. AI suggestions will not be available.');
}

// Initialize SQLite database
const db = new sqlite3.Database('seo_history.db');

// Drop existing table if exists and create new one
db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS history`);
  db.run(`
    CREATE TABLE history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      title_score INTEGER NOT NULL,
      meta_score INTEGER NOT NULL,
      headings_score INTEGER NOT NULL,
      images_score INTEGER NOT NULL,
      social_score INTEGER NOT NULL,
      links_score INTEGER NOT NULL,
      ai_suggestions TEXT,
      competitor_analysis TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

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
      
      Format the response as JSON with these keys: contentOptimization, technicalSEO, userExperience, socialMedia, priorityActions
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log('Raw AI Response:', response.text()); // Log the raw response
    let suggestions;
    try {
      const text = response.text();
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
      suggestions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    console.log(suggestions, 'dsjkfhksjdfhjkf')


    // Validate the response structure
    const requiredKeys = ['contentOptimization', 'technicalSEO', 'userExperience', 'socialMedia', 'priorityActions'];
    const missingKeys = requiredKeys.filter(key => !suggestions[key]);
    if (missingKeys.length > 0) {
      throw new Error(`Invalid AI response: missing keys ${missingKeys.join(', ')}`);
    }

    return suggestions;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      contentOptimization: ['AI analysis currently unavailable: ' + error.message],
      technicalSEO: ['Please ensure GEMINI_API_KEY is configured correctly'],
      userExperience: [],
      socialMedia: [],
      priorityActions: ['Configure API key to enable AI suggestions']
    };
  }
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

    // Save to history with AI suggestions
    db.run(
      `INSERT INTO history (
        url, overall_score, title_score, meta_score, 
        headings_score, images_score, social_score, links_score,
        ai_suggestions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        url,
        analysis.overallScore,
        analysis.title.score,
        analysis.meta.score,
        analysis.headings.score,
        analysis.images.score,
        analysis.social.score,
        analysis.links.score,
        JSON.stringify(aiSuggestions)
      ]
    );

    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to analyze website',
      message: error.message
    });
  }
});

// Get analysis history
app.get('/api/history', (req, res) => {
  db.all(
    `SELECT * FROM history ORDER BY created_at DESC LIMIT 50`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Failed to fetch history' });
        return;
      }
      rows.forEach(row => {
        if (row.ai_suggestions) {
          row.ai_suggestions = JSON.parse(row.ai_suggestions);
        }
      });
      res.json(rows);
    }
  );
});

// Delete history entry
app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM history WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to delete history entry' });
      return;
    }
    res.json({ message: 'History entry deleted successfully' });
  });
});

// Start the server
const port = process.env.PORT || 3000;
ViteExpress.listen(app, port, () => {
  console.log(`Server is running on port ${port}`);
});
