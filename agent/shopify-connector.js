/**
 * SHOPIFY CONNECTOR MODULE
 * Directly integrates with Brew Your Sip's Shopify store and local theme
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const THEME_DIR = '/Users/ashokshah/Downloads/brewyoursip-theme';
const SCHEMA_SOURCE = '/Users/ashokshah/Downloads/brewyoursip-schema-and-about/seo-schema.liquid';

// Sync SEO Schema into Shopify theme
function syncThemeSeoSchema() {
  const results = {
    snippetCopied: false,
    themeLiquidUpdated: false,
    errors: []
  };

  try {
    const targetSnippetPath = path.join(THEME_DIR, 'snippets', 'seo-schema.liquid');
    if (fs.existsSync(SCHEMA_SOURCE)) {
      const schemaContent = fs.readFileSync(SCHEMA_SOURCE, 'utf8');
      fs.writeFileSync(targetSnippetPath, schemaContent, 'utf8');
      results.snippetCopied = true;
    } else {
      results.errors.push('Source seo-schema.liquid not found.');
    }

    // Check theme.liquid
    const themeLiquidPath = path.join(THEME_DIR, 'layout', 'theme.liquid');
    if (fs.existsSync(themeLiquidPath)) {
      let themeContent = fs.readFileSync(themeLiquidPath, 'utf8');
      if (!themeContent.includes("render 'seo-schema'") && !themeContent.includes('include "seo-schema"')) {
        // Inject right before </head>
        const injection = "\n  {%- comment -%} Autonomous 24x7 SEO/AEO/GEO Engine Injected Schema {%- endcomment -%}\n  {% render 'seo-schema' %}\n";
        themeContent = themeContent.replace('{{ content_for_header }}', `{{ content_for_header }}${injection}`);
        fs.writeFileSync(themeLiquidPath, themeContent, 'utf8');
        results.themeLiquidUpdated = true;
      } else {
        results.themeLiquidUpdated = true; // already present
      }
    }
  } catch (err) {
    results.errors.push(err.message);
  }

  return results;
}

// Format an article for Shopify Blog Article API
function formatForShopifyBlog(articleData, blogId = "default") {
  return {
    article: {
      title: articleData.title,
      author: "Ashok Shah",
      tags: `tea terroir, ${articleData.focusKeyword}, darjeeling, assam, loose leaf tea, unik tea centre`,
      body_html: articleData.html,
      summary_html: `<p>${articleData.metaDescription}</p>`,
      image: {
        src: `https://www.brewyoursip.com/images/generated/${articleData.heroImageName}.jpg`,
        alt: articleData.imageAlt
      },
      metafields: [
        {
          key: "title_tag",
          value: articleData.title,
          type: "single_line_text_field",
          namespace: "global"
        },
        {
          key: "description_tag",
          value: articleData.metaDescription,
          type: "single_line_text_field",
          namespace: "global"
        }
      ]
    }
  };
}

// Export Shopify Article JSON draft
function exportShopifyDraft(articleData) {
  const draftsDir = path.join(__dirname, '..', 'shopify-drafts');
  if (!fs.existsSync(draftsDir)) {
    fs.mkdirSync(draftsDir, { recursive: true });
  }

  const payload = formatForShopifyBlog(articleData);
  const filePath = path.join(draftsDir, `${articleData.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return filePath;
}

module.exports = {
  syncThemeSeoSchema,
  formatForShopifyBlog,
  exportShopifyDraft
};
