/**
 * GITHUB ACTIONS HEADLESS 24x7 RUNNER
 * Designed to execute autonomously in GitHub Actions cloud on cron schedules
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { loadState, saveState, logActivity } = require('./agent-worker');
const { BLOG_EDITORIAL_CALENDAR, generateFullBlogArticle } = require('./blog-writer');
const { GMB_POST_SCHEDULE, generateNextGmbPost } = require('./gmb-local-agent');
const { exportShopifyDraft } = require('./shopify-connector');

// Parse task flag
const args = process.argv.slice(2);
const taskArg = args.find(a => a.startsWith('--task='));
const task = taskArg ? taskArg.split('=')[1] : 'daily_cycle';

async function runGithubAction() {
  console.log(`================================================================`);
  console.log(`🤖 GITHUB ACTIONS 24x7 SEO/AEO/GEO AGENT: TASK = [${task.toUpperCase()}]`);
  console.log(`☕ Target: Brew Your Sip (https://www.brewyoursip.com)`);
  console.log(`================================================================\n`);

  const state = loadState();
  let stepSummary = `# 🤖 Brew Your Sip 24x7 AI Agent - Execution Report\n\n`;
  stepSummary += `- **Run Timestamp**: ${new Date().toISOString()}\n`;
  stepSummary += `- **Task Executed**: \`${task}\`\n`;
  stepSummary += `- **Environment**: GitHub Actions Cloud Runner\n\n`;

  // 1. Health & SEO Check
  console.log(`🔍 [1/3] Running Live Site Audit for brewyoursip.com...`);
  try {
    const res = await axios.get('https://www.brewyoursip.com', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });
    console.log(`   ✅ Response: HTTP ${res.status} OK (Site Online)`);
    stepSummary += `### 🌐 1. Site Status & Health\n- **Status**: 🟢 Online (HTTP ${res.status})\n- **URL**: https://www.brewyoursip.com\n\n`;
    logActivity(`GitHub Actions: Verified site health (HTTP ${res.status})`, 'health');
  } catch (err) {
    console.log(`   ⚠️ Uptime Warning: ${err.message}`);
    stepSummary += `### 🌐 1. Site Status & Health\n- **Status**: ⚠️ Warning: ${err.message}\n\n`;
    logActivity(`GitHub Actions Warning: ${err.message}`, 'warning');
  }

  // 2. Blog Post Generation
  if (task === 'daily_cycle' || task === 'generate_blog') {
    console.log(`\n✍️ [2/3] Generating SEO, AEO & GEO Friendly Blog Guide...`);
    // Pick next topic or rotate
    const blogIndex = state.blogs.length % BLOG_EDITORIAL_CALENDAR.length;
    const template = BLOG_EDITORIAL_CALENDAR[blogIndex];
    const newBlog = generateFullBlogArticle(template);

    // Save draft
    const draftPath = exportShopifyDraft(newBlog);
    console.log(`   ✅ Article Generated: "${newBlog.title}"`);
    console.log(`   ✅ AEO Answer Box & Speakable Schema Included`);
    console.log(`   ✅ 16:9 Image Prompt Configured: "${newBlog.heroImagePrompt.substring(0, 70)}..."`);
    console.log(`   ✅ Draft exported to: ${draftPath}`);

    stepSummary += `### 📰 2. Autonomous Blog Factory (16:9 Gemini Ready)\n`;
    stepSummary += `- **Headline**: **${newBlog.title}**\n`;
    stepSummary += `- **Focus Keyword**: \`${newBlog.focusKeyword}\`\n`;
    stepSummary += `- **Category**: ${newBlog.category} (${newBlog.readTimeMinutes} min read)\n`;
    stepSummary += `- **AEO Answer Target**: Included for Perplexity & Google AI Overviews\n`;
    stepSummary += `- **16:9 Image Prompt**: *"${newBlog.heroImagePrompt}"*\n\n`;

    logActivity(`GitHub Actions: Created blog "${newBlog.title}"`, 'blog');
  }

  // 3. Local GMB Post
  if (task === 'daily_cycle' || task === 'generate_gmb') {
    console.log(`\n📍 [3/3] Queuing Weekly Google Business Profile Update...`);
    const gmbIndex = state.gmbPosts.length % GMB_POST_SCHEDULE.length;
    const gmbPost = GMB_POST_SCHEDULE[gmbIndex];

    console.log(`   ✅ GMB Headline: "${gmbPost.headline}"`);
    console.log(`   ✅ Local Kolkata & Pan-India Geo-Targeting: ${gmbPost.targetLocations.join(', ')}`);
    console.log(`   ✅ CTA: ${gmbPost.ctaType} -> ${gmbPost.ctaUrl}`);

    stepSummary += `### 📍 3. Local GMB Post Queued\n`;
    stepSummary += `- **Headline**: ${gmbPost.headline}\n`;
    stepSummary += `- **Target Locations**: ${gmbPost.targetLocations.join(', ')}\n`;
    stepSummary += `- **Call To Action**: [${gmbPost.ctaType}](${gmbPost.ctaUrl})\n`;
    stepSummary += `- **16:9 Visual Prompt**: *"${gmbPost.imagePrompt16x9}"*\n\n`;

    logActivity(`GitHub Actions: Queued GMB post "${gmbPost.headline}"`, 'local');
  }

  // Save updated state
  state.lastRunAt = new Date().toISOString();
  saveState(state);

  // Write GitHub Actions Step Summary if in runner
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, stepSummary);
  }

  console.log(`\n================================================================`);
  console.log(`✅ AUTONOMOUS CYCLE COMPLETED SUCCESSFULLY!`);
  console.log(`================================================================\n`);
}

runGithubAction().catch(err => {
  console.error('GitHub Action runner failed:', err);
  process.exit(1);
});
