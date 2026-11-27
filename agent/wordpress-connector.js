/**
 * WORDPRESS CONNECTOR MODULE
 * Integrates with Brew Your Sip's WordPress / WooCommerce site (www.brewyoursip.com)
 * Supports:
 * 1. Uploading 16:9 hero images to WordPress Media Library (/wp-json/wp/v2/media)
 * 2. Creating or updating posts via WordPress REST API (/wp-json/wp/v2/posts) with featured_media & Yoast/RankMath meta
 * 3. Exporting WordPress-ready JSON & Gutenberg HTML drafts into wordpress-drafts/
 * 4. Generating wp_head JSON-LD & Yoast REST meta PHP snippet in wordpress-schema/
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { ensureHeroImageFile } = require('./image-service');

const WP_DRAFTS_DIR = path.join(__dirname, '..', 'wordpress-drafts');
const WP_SCHEMA_DIR = path.join(__dirname, '..', 'wordpress-schema');

// Generate WordPress PHP snippet for wp_head JSON-LD + Yoast REST API meta registration
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
 * Plugin Name: Brew Your Sip SEO / AEO / GEO Schema & Yoast REST Connector
 * Description: Autonomous JSON-LD Organization, LocalBusiness, Speakable Schema, and Yoast SEO REST API meta registration for www.brewyoursip.com.
 * Version: 1.1.0
 * Author: Brew Your Sip SEO Agent
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// 1. Expose Yoast SEO & Rank Math meta keys to the WordPress REST API so the autonomous agent can set Title, Meta Description, and Focus Keyphrase
add_action( 'init', function() {
    $seo_meta_keys = array(
        '_yoast_wpseo_title',
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_focuskw',
        'rank_math_title',
        'rank_math_description',
        'rank_math_focus_keyword',
    );

    foreach ( $seo_meta_keys as $meta_key ) {
        register_post_meta( 'post', $meta_key, array(
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => 'string',
            'auth_callback' => function() {
                return current_user_can( 'edit_posts' );
            },
        ) );
    }
} );

// 2. Inject Organization, LocalBusiness, and Speakable JSON-LD into wp_head
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
function formatForWordPress(articleData, uploadedMedia = null) {
  let html = articleData.html || '';

  if (uploadedMedia && uploadedMedia.source_url) {
    const localImgPattern = new RegExp(`/images/generated/${articleData.heroImageName}\\.jpg`, 'g');
    html = html.replace(localImgPattern, uploadedMedia.source_url);
  }

  const speakableTag = articleData.speakableSchema
    ? `\n<script type="application/ld+json">\n${JSON.stringify(articleData.speakableSchema, null, 2)}\n</script>`
    : '';

  const payload = {
    title: articleData.title,
    slug: articleData.slug,
    status: process.env.WP_POST_STATUS || 'draft',
    content: `${html}${speakableTag}`,
    excerpt: articleData.metaDescription,
    // Compatible with Yoast SEO & Rank Math REST meta registration
    meta: {
      _yoast_wpseo_title: articleData.title,
      _yoast_wpseo_metadesc: articleData.metaDescription,
      _yoast_wpseo_focuskw: articleData.focusKeyword,
      rank_math_title: articleData.title,
      rank_math_description: articleData.metaDescription,
      rank_math_focus_keyword: articleData.focusKeyword
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

  if (uploadedMedia && uploadedMedia.id) {
    payload.featured_media = uploadedMedia.id;
  }

  return payload;
}

// Upload 16:9 image to WordPress Media Library
async function uploadMediaToWordPress(wpUrl, authHeader, filePath, altText, title) {
  if (!filePath || !fs.existsSync(filePath)) return null;

  const filename = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);

  try {
    const res = await axios.post(`${wpUrl}/wp-json/wp/v2/media`, fileBuffer, {
      timeout: 30000,
      maxBodyLength: Infinity,
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'image/jpeg'
      }
    });

    const mediaId = res.data.id;
    const sourceUrl = res.data.source_url;

    // Attach alt_text & title metadata for Image SEO
    if (mediaId && (altText || title)) {
      await axios.post(`${wpUrl}/wp-json/wp/v2/media/${mediaId}`, {
        alt_text: altText || title,
        title: title || filename
      }, {
        timeout: 10000,
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json'
        }
      }).catch(() => {});
    }

    return { id: mediaId, source_url: sourceUrl };
  } catch (err) {
    console.warn(`   ⚠️ WordPress Media upload failed (${filename}): ${err.response?.data?.message || err.message}`);
    return null;
  }
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

// Publish or update directly on live WordPress via REST API (if credentials configured)
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

  const authHeader = Buffer.from(`${wpUser}:${wpAppPassword}`).toString('base64');

  // 1. Ensure 16:9 image exists (generates via Gemini if GEMINI_API_KEY set) & upload to WP Media Library
  const imgResult = await ensureHeroImageFile(articleData.heroImageName, articleData.heroImagePrompt);
  const uploadedMedia = await uploadMediaToWordPress(
    wpUrl,
    authHeader,
    imgResult.path,
    articleData.imageAlt,
    articleData.title
  );

  const payload = formatForWordPress(articleData, uploadedMedia);
  const { _agentMetadata, ...wpBody } = payload;

  try {
    // 2. Check if post with this slug already exists so we update cleanly instead of duplicating
    let existingPostId = null;
    try {
      const checkRes = await axios.get(`${wpUrl}/wp-json/wp/v2/posts`, {
        params: { slug: articleData.slug, status: 'any', per_page: 1 },
        timeout: 10000,
        headers: { 'Authorization': `Basic ${authHeader}` }
      });
      if (Array.isArray(checkRes.data) && checkRes.data.length > 0) {
        existingPostId = checkRes.data[0].id;
      }
    } catch (_) {}

    const endpoint = existingPostId
      ? `${wpUrl}/wp-json/wp/v2/posts/${existingPostId}`
      : `${wpUrl}/wp-json/wp/v2/posts`;

    let res;
    try {
      res = await axios.post(endpoint, wpBody, {
        timeout: 20000,
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (metaErr) {
      // If Yoast meta keys aren't registered in REST yet, retry without `meta` so the post & image still publish
      const msg = metaErr.response?.data?.message || metaErr.message || '';
      if (metaErr.response?.status === 400 || msg.includes('meta')) {
        const { meta, ...bodyWithoutMeta } = wpBody;
        res = await axios.post(endpoint, bodyWithoutMeta, {
          timeout: 20000,
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json'
          }
        });
        return {
          published: true,
          updated: Boolean(existingPostId),
          postId: res.data.id,
          status: res.data.status,
          link: res.data.link,
          mediaId: uploadedMedia ? uploadedMedia.id : null,
          mediaUrl: uploadedMedia ? uploadedMedia.source_url : null,
          yoastWarning: 'Yoast REST meta not registered yet — install wordpress-schema/brewyoursip-seo-schema.php in WordPress to auto-populate Yoast fields.'
        };
      }
      throw metaErr;
    }

    return {
      published: true,
      updated: Boolean(existingPostId),
      postId: res.data.id,
      status: res.data.status,
      link: res.data.link,
      mediaId: uploadedMedia ? uploadedMedia.id : null,
      mediaUrl: uploadedMedia ? uploadedMedia.source_url : null,
      yoastSynced: true
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
