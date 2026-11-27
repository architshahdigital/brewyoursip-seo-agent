const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

// Agent Modules
const { loadState, saveState, logActivity, triggerTask, performAutonomousCycle, startDaemon } = require('./agent/agent-worker');
const { BRAND_ENTITY, generateAeoQuickAnswer, generateGeoPrompts } = require('./agent/aeo-geo-engine');
const { GMB_POST_SCHEDULE, LOCAL_QA_TEMPLATES, generateNextGmbPost } = require('./agent/gmb-local-agent');
const { BLOG_EDITORIAL_CALENDAR, generateFullBlogArticle } = require('./agent/blog-writer');
const { getImageCatalog } = require('./agent/image-service');
const { syncThemeSeoSchema, exportShopifyDraft } = require('./agent/shopify-connector');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Stopwords for keyword analysis
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'did', 'do',
  'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is',
  'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off',
  'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
  'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'you', 'your', 'yours'
]);

function estimatePixelWidth(text) {
  let width = 0;
  for (const char of text) {
    if (/[ijlI1\.,;:'!]/.test(char)) width += 4;
    else if (/[mwMW@]/.test(char)) width += 14;
    else if (/[A-Z]/.test(char)) width += 10;
    else width += 8;
  }
  return width;
}

function calculateFleschScore(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  if (sentences.length === 0 || words.length === 0) return 60;

  let totalSyllables = 0;
  for (let w of words) {
    w = w.toLowerCase().replace(/(?:[^laeiouy]|ed|es|e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    totalSyllables += m ? m.length : 1;
  }

  const wordsPerSentence = words.length / sentences.length;
  const syllablesPerWord = totalSyllables / words.length;
  const score = 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function analyzeKeywords(text, targetKeyword = '') {
  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
  const totalWords = words.length;
  if (totalWords === 0) return { single: [], twoGram: [], threeGram: [], targetDensity: null };

  const singleCounts = {};
  for (const w of words) singleCounts[w] = (singleCounts[w] || 0) + 1;
  const single = Object.entries(singleCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({
    word, count, density: ((count / totalWords) * 100).toFixed(2)
  }));

  let targetDensity = null;
  if (targetKeyword && targetKeyword.trim()) {
    const tkClean = targetKeyword.trim().toLowerCase();
    const regex = new RegExp(`\\b${tkClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    targetDensity = {
      keyword: targetKeyword,
      count,
      density: totalWords > 0 ? ((count / totalWords) * 100).toFixed(2) : '0.00'
    };
  }

  return { single, targetDensity };
}

function runSeoAudit(html, pageUrl = '', targetKeyword = '', businessCity = '') {
  const $ = cheerio.load(html);
  const startTime = Date.now();

  const audit = {
    url: pageUrl,
    targetKeyword: targetKeyword.trim(),
    businessCity: businessCity.trim(),
    timestamp: new Date().toISOString(),
    overallScore: 0,
    categories: {
      meta: { score: 0, max: 25, title: 'Meta & Search Appearance' },
      headings: { score: 0, max: 15, title: 'Heading Hierarchy' },
      content: { score: 0, max: 20, title: 'Content & Keywords' },
      images: { score: 0, max: 10, title: 'Image SEO' },
      technical: { score: 0, max: 15, title: 'Technical & Links' },
      local: { score: 0, max: 15, title: 'Local SEO & NAP' }
    },
    issues: [],
    meta: {},
    headings: { h1: [], h2: [], h3: [], h4: [] },
    images: { total: 0, missingAlt: 0, nonWebp: 0, sampleMissingAlt: [] },
    links: { total: 0, internal: 0, external: 0, nofollow: 0, insecureBlanks: 0, emptyAnchors: 0 },
    content: {},
    structuredData: { count: 0, schemas: [], hasLocalBusiness: false },
    localSeo: { detectedNap: {} }
  };

  // 1. Meta
  const titleText = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const titlePx = estimatePixelWidth(titleText);

  audit.meta = {
    title: titleText,
    titleLength: titleText.length,
    titlePixelWidth: titlePx,
    description: metaDesc,
    descriptionLength: metaDesc.length,
    canonical,
    viewport,
    ogTitle,
    ogImage
  };

  let metaScore = 0;
  if (!titleText) {
    audit.issues.push({ type: 'critical', category: 'meta', title: 'Missing <title> Tag', description: 'Webpage has no title tag.', suggestedFix: `<title>${targetKeyword ? targetKeyword + ' | ' : ''}Brew Your Sip - Artisan Loose Leaf Tea</title>` });
  } else if (titleText.length > 60 || titlePx > 600) {
    metaScore += 6;
    audit.issues.push({ type: 'warning', category: 'meta', title: 'Title Tag Truncation Risk', description: `Title is ${titleText.length} chars (${titlePx}px). Limit to 60 chars.`, suggestedFix: `Shorten title to <= 60 characters with focus keyword upfront.` });
  } else {
    metaScore += 10;
    audit.issues.push({ type: 'passed', category: 'meta', title: 'Optimal Title Tag Length', description: `Title is ${titleText.length} chars.` });
  }

  if (metaDesc && metaDesc.length >= 80 && metaDesc.length <= 165) {
    metaScore += 8;
    audit.issues.push({ type: 'passed', category: 'meta', title: 'Optimal Meta Description', description: `Found ${metaDesc.length} chars.` });
  } else if (!metaDesc) {
    audit.issues.push({ type: 'critical', category: 'meta', title: 'Missing Meta Description', description: 'No meta description found.', suggestedFix: `<meta name="description" content="Savor direct-trade, unblended Darjeeling First Flush and Assam orthodox loose leaf teas from Kolkata tea merchants since 1988." />` });
  } else {
    metaScore += 4;
  }

  if (viewport) metaScore += 4;
  if (ogTitle && ogImage) metaScore += 3;
  audit.categories.meta.score = Math.min(25, metaScore);

  // 2. Headings
  ['h1', 'h2', 'h3', 'h4'].forEach(tag => {
    $(tag).each((_, el) => {
      const txt = $(el).text().trim();
      if (txt) audit.headings[tag].push(txt);
    });
  });

  let headScore = 0;
  if (audit.headings.h1.length === 1) {
    headScore += 10;
    audit.issues.push({ type: 'passed', category: 'headings', title: 'Single H1 Tag Configured', description: `Found 1 H1: "${audit.headings.h1[0].substring(0, 45)}..."` });
  } else if (audit.headings.h1.length === 0) {
    audit.issues.push({ type: 'critical', category: 'headings', title: 'Missing <h1> Heading', description: 'Page lacks an H1 heading.', suggestedFix: `<h1>Pure Artisan Loose Leaf Tea | Single Estate Terroir</h1>` });
  } else {
    headScore += 5;
    audit.issues.push({ type: 'warning', category: 'headings', title: `Multiple H1 Tags Found (${audit.headings.h1.length})`, description: 'Demote extra H1 tags to H2.' });
  }
  if (audit.headings.h2.length >= 2) headScore += 5;
  audit.categories.headings.score = Math.min(15, headScore);

  // 3. Content
  const clone = $('body').clone();
  clone.find('script, style, noscript, svg, nav, footer, header').remove();
  const rawText = clone.text().replace(/\s+/g, ' ').trim();
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const flesch = calculateFleschScore(rawText);
  const keywords = analyzeKeywords(rawText, targetKeyword);

  audit.content = { wordCount, fleschScore: flesch, keywords };
  let contentScore = 0;
  if (wordCount >= 400) {
    contentScore += 14;
    audit.issues.push({ type: 'passed', category: 'content', title: `Good Content Depth (${wordCount} words)`, description: 'Substantial content for search crawler indexing.' });
  } else {
    contentScore += 7;
    audit.issues.push({ type: 'warning', category: 'content', title: `Light Body Content (${wordCount} words)`, description: 'Aim for 400+ words of topical authority.' });
  }
  if (flesch >= 50) contentScore += 6;
  audit.categories.content.score = Math.min(20, contentScore);

  // 4. Images
  const imgs = $('img');
  audit.images.total = imgs.length;
  imgs.each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt');
    if (alt === undefined || alt === null || alt.trim() === '') {
      audit.images.missingAlt++;
      if (audit.images.sampleMissingAlt.length < 3) audit.images.sampleMissingAlt.push(src);
    }
    if (src && !/\.(webp|avif|svg)(\?.*)?$/i.test(src)) audit.images.nonWebp++;
  });

  let imgScore = 0;
  if (audit.images.total > 0 && audit.images.missingAlt === 0) {
    imgScore += 10;
    audit.issues.push({ type: 'passed', category: 'images', title: 'All Images Have Alt Text', description: 'Optimized for visual search and accessibility.' });
  } else if (audit.images.total > 0) {
    imgScore += Math.round(((audit.images.total - audit.images.missingAlt) / audit.images.total) * 7);
    audit.issues.push({ type: 'warning', category: 'images', title: `${audit.images.missingAlt} Images Missing Alt Text`, description: 'Add descriptive keywords to all product images.' });
  } else {
    imgScore += 5;
  }
  audit.categories.images.score = Math.min(10, imgScore);

  // 5. Technical & Links
  const links = $('a');
  audit.links.total = links.length;
  links.each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('http')) audit.links.external++;
    else if (href && !href.startsWith('#')) audit.links.internal++;
    else if (href === '#') audit.links.emptyAnchors++;
  });

  let techScore = 0;
  if (canonical) techScore += 6;
  if (audit.links.internal >= 3) techScore += 6;
  if (audit.links.emptyAnchors === 0) techScore += 3;
  audit.categories.technical.score = Math.min(15, techScore);

  // 6. Local & Schema
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).html());
      const arr = Array.isArray(j) ? j : (j['@graph'] || [j]);
      arr.forEach(item => {
        if (item['@type']) {
          audit.structuredData.schemas.push(item['@type']);
          if (['LocalBusiness', 'Store', 'Organization'].some(t => item['@type'].includes(t))) {
            audit.structuredData.hasLocalBusiness = true;
          }
        }
      });
    } catch(e) {}
  });

  const fullText = $('body').text();
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(fullText);
  let localScore = 0;
  if (audit.structuredData.hasLocalBusiness) localScore += 7;
  if (hasPhone) localScore += 5;
  if ($('iframe[src*="google.com/maps"]').length > 0) localScore += 3;
  audit.categories.local.score = Math.min(15, localScore);

  audit.overallScore = Math.min(100, Math.round(
    audit.categories.meta.score +
    audit.categories.headings.score +
    audit.categories.content.score +
    audit.categories.images.score +
    audit.categories.technical.score +
    audit.categories.local.score
  ));

  audit.durationMs = Date.now() - startTime;
  return audit;
}

// -------------------------------------------------------------
// CORE ROUTES
// -------------------------------------------------------------

app.post('/api/audit', async (req, res) => {
  const { url, html, targetKeyword, businessCity } = req.body;
  try {
    let htmlContent = html;
    let fetchedUrl = url || '';

    if (!htmlContent && url) {
      const response = await axios.get(url, {
        timeout: 12000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        }
      });
      htmlContent = response.data;
      fetchedUrl = response.request?.res?.responseUrl || url;
    }

    if (!htmlContent) return res.status(400).json({ error: 'Provide a valid URL or HTML content.' });
    const auditResult = runSeoAudit(htmlContent, fetchedUrl, targetKeyword || '', businessCity || '');
    return res.json(auditResult);
  } catch (err) {
    return res.status(500).json({ error: `Crawl error: ${err.message}` });
  }
});

app.get('/api/backlinks', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'data', 'backlinks.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Could not load backlinks database.' });
    try {
      return res.json(JSON.parse(data));
    } catch(e) {
      return res.status(500).json({ error: 'Parse error' });
    }
  });
});

// -------------------------------------------------------------
// 24x7 AUTONOMOUS AGENT API ROUTES
// -------------------------------------------------------------

// Agent Status & Live Heartbeat
app.get('/api/agent/status', (req, res) => {
  const state = loadState();
  return res.json({
    ...state,
    imagesAvailable: getImageCatalog().length,
    entity: BRAND_ENTITY
  });
});

// Trigger Agent Action Immediately
app.post('/api/agent/run-now', (req, res) => {
  const { taskType = "sync_shopify", payload = {} } = req.body;
  const result = triggerTask(taskType, payload);
  return res.json(result);
});

// Get Autonomous Blogs
app.get('/api/agent/blogs', (req, res) => {
  const state = loadState();
  return res.json(state.blogs || []);
});

// Create New Blog On-Demand
app.post('/api/agent/blogs/create', (req, res) => {
  const { topic } = req.body;
  const result = triggerTask('generate_blog', { topic });
  return res.json(result);
});

// Get Local GMB Posts & Q&A
app.get('/api/agent/gmb', (req, res) => {
  const state = loadState();
  return res.json({
    posts: state.gmbPosts || GMB_POST_SCHEDULE,
    qa: LOCAL_QA_TEMPLATES
  });
});

// Create Custom GMB Post
app.post('/api/agent/gmb/create', (req, res) => {
  const { topic } = req.body;
  const result = triggerTask('generate_gmb', { topic });
  return res.json(result);
});

// Get AEO / GEO Entity Intelligence & Prompts
app.get('/api/agent/aeo-geo', (req, res) => {
  return res.json({
    entity: BRAND_ENTITY,
    prompts: generateGeoPrompts()
  });
});

// Get 16:9 Image Catalog
app.get('/api/agent/images', (req, res) => {
  return res.json(getImageCatalog());
});

// Direct Shopify Theme Sync
app.post('/api/shopify/sync-theme', (req, res) => {
  const syncResult = syncThemeSeoSchema();
  logActivity("Manual trigger: Synchronized seo-schema.liquid into Shopify theme", "shopify");
  return res.json(syncResult);
});

app.listen(PORT, () => {
  startDaemon();
  console.log(`====================================================`);
  console.log(`🤖 24x7 AUTONOMOUS SEO / AEO / GEO AGENT RUNNING!`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`☕ Brand: Brew Your Sip (brewyoursip.com)`);
  console.log(`====================================================`);
});
