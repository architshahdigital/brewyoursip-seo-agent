/**
 * WORDPRESS CONNECTOR MODULE
 * Integrates with Brew Your Sip's WordPress / WooCommerce site (www.brewyoursip.com)
 * Supports:
 * 1. Direct publishing/drafting via WordPress REST API (/wp-json/wp/v2/posts)
 * 2. Exporting WordPress-ready JSON & Gutenberg HTML drafts into wordpress-drafts/
 * 3. Generating wp_head JSON-LD PHP schema snippet in wordpress-schema/
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const WP_DRAFTS_DIR = path.join(__dirname, '..', 'wordpress-drafts');
const WP_SCHEMA_DIR = path.join(__dirname, '..', 'wordpress-schema');

// Generate WordPress PHP snippet for wp_head JSON-LD (Organization, WebSite, Speakable)
function syncWordPressSchema() {
  const results = {
    schemaGenerated: false,
    schemaPath: '',
    errors: []
  };

  try {
    if (!fs.existsSync(WP_SCHEMA_DIR)) {
      fs.mkdirSync(WP_SCHEMA_DIR, { recursive: true });
    }

    const phpPath = path.join(WP_SCHEMA_DIR, 'brewyoursip-seo-schema.php');
    const phpSnippet = `<?php
/**
 * Plugin Name: Brew Your Sip SEO / AEO / GEO Schema Injector
 * Description: Autonomous JSON-LD Organization, LocalBusiness, WebSite, and Speakable Schema for www.brewyoursip.com (WordPress / WooCommerce).
 * Version: 1.0.0
 * Author: Brew Your Sip SEO Agent
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'wp_head', function() {
    $org_schema = array(
        '@context' => 'https://schema.org',
        '@type' => array( 'Organization', 'LocalBusiness' ),
        'name' => 'Brew Your Sip',
        'legalName' => 'Unik Tea Centre Pvt Ltd',
        'url' => 'https://www.brewyoursip.com',
        'foundingDate' => '1988',
        'founder' => array(
            '@type' => 'Person',
            'name' => 'Ashok Shah',
            'jobTitle' => 'Founder & Master Tea Taster'
        ),
        'address' => array(
            '@type' => 'PostalAddress',
            'addressLocality' => 'Kolkata',
            'addressRegion' => 'West Bengal',
            'addressCountry' => 'IN'
        ),
        'description' => 'Artisan single-estate Darjeeling and Assam orthodox loose leaf tea backed by 35+ years of Kolkata tea auction heritage since 1988.'
    );

    echo "\\n<!-- Brew Your Sip Autonomous SEO/AEO/GEO Schema -->\\n";
    echo '<script type="application/ld+json">' . wp_json_encode( $org_schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\\n";

    if ( is_single() ) {
        $speakable = array(
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => get_the_title(),
            'url' => get_permalink(),
            'speakable' => array(
                '@type' => 'SpeakableSpecification',
                'cssSelector' => array( '#aeo-quick-answer', '.eeat-editorial-banner' )
            )
        );
        echo '<script type="application/ld+json">' . wp_json_encode( $speakable, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\\n";
    }
}, 5 );
`;

    fs.writeFileSync(phpPath, phpSnippet, 'utf8');
    results.schemaGenerated = true;
    results.schemaPath = phpPath;
  } catch (err) {
    results.errors.push(err.message);
  }

  return results;
}

// Format an article for WordPress REST API (/wp-json/wp/v2/posts)
function formatForWordPress(articleData) {
  const speakableTag = articleData.speakableSchema
    ? `\n<script type="application/ld+json">\n${JSON.stringify(articleData.speakableSchema, null, 2)}\n</script>`
    : '';

  return {
    title: articleData.title,
    slug: articleData.slug,
    status: process.env.WP_POST_STATUS || 'draft',
    content: `${articleData.html}${speakableTag}`,
    excerpt: articleData.metaDescription,
    // Compatible with Yoast SEO & Rank Math REST meta registration
    meta: {
      rank_math_title: articleData.title,
      rank_math_description: articleData.metaDescription,
      rank_math_focus_keyword: articleData.focusKeyword,
      _yoast_wpseo_title: articleData.title,
      _yoast_wpseo_metadesc: articleData.metaDescription,
      _yoast_wpseo_focuskw: articleData.focusKeyword
    },
    _agentMetadata: {
      category: articleData.category,
      focusKeyword: articleData.focusKeyword,
      heroImageName: articleData.heroImageName,
      heroImagePrompt16x9: articleData.heroImagePrompt,
      imageAlt: articleData.imageAlt,
      eeatScore: articleData.eeatAudit ? articleData.eeatAudit.score : 100
    }
  };
}

// Export WordPress JSON & HTML drafts locally
function exportWordPressDraft(articleData) {
  if (!fs.existsSync(WP_DRAFTS_DIR)) {
    fs.mkdirSync(WP_DRAFTS_DIR, { recursive: true });
  }

  const payload = formatForWordPress(articleData);
  const jsonPath = path.join(WP_DRAFTS_DIR, `${articleData.slug}.json`);
  const htmlPath = path.join(WP_DRAFTS_DIR, `${articleData.slug}.html`);

  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(htmlPath, payload.content, 'utf8');

  return jsonPath;
}

// Publish or draft directly to live WordPress via REST API (if credentials configured)
async function publishToWordPress(articleData) {
  const wpUrl = (process.env.WP_URL || 'https://www.brewyoursip.com').replace(/\/+$/, '');
  const wpUser = process.env.WP_USERNAME;
  const wpAppPassword = process.env.WP_APP_PASSWORD;

  if (!wpUser || !wpAppPassword) {
    return {
      published: false,
      skipped: true,
      reason: 'WP_USERNAME or WP_APP_PASSWORD not set. Saved locally in wordpress-drafts/.'
    };
  }

  const payload = formatForWordPress(articleData);
  // Strip internal-only metadata before sending to WP REST API
  const { _agentMetadata, ...wpBody } = payload;

  const auth = Buffer.from(`${wpUser}:${wpAppPassword}`).toString('base64');

  try {
    const res = await axios.post(`${wpUrl}/wp-json/wp/v2/posts`, wpBody, {
      timeout: 15000,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      published: true,
      postId: res.data.id,
      status: res.data.status,
      link: res.data.link
    };
  } catch (err) {
    const errMsg = err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : err.message;
    return {
      published: false,
      error: errMsg
    };
  }
}

module.exports = {
  syncWordPressSchema,
  formatForWordPress,
  exportWordPressDraft,
  publishToWordPress
};
