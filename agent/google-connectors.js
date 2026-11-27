/**
 * GOOGLE SEARCH CONSOLE (GSC) & GOOGLE BUSINESS PROFILE (GMB) CONNECTORS
 * Uses built-in Node crypto + axios (zero extra dependencies)
 */

const crypto = require('crypto');
const axios = require('axios');

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(JSON.stringify(input));
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Get Google OAuth2 access token from a Service Account JSON string
async function getServiceAccountToken(serviceAccountJsonStr, scope) {
  const sa = typeof serviceAccountJsonStr === 'string'
    ? JSON.parse(serviceAccountJsonStr)
    : serviceAccountJsonStr;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: sa.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const signingInput = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = base64UrlEncode(signer.sign(sa.private_key));
  const jwt = `${signingInput}.${signature}`;

  const res = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt
  }).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000
  });

  return res.data.access_token;
}

// Fetch real search analytics & sitemap status from Google Search Console
async function fetchGscInsights(siteUrlOverride = null) {
  const saJson = (process.env.GSC_SERVICE_ACCOUNT_JSON || '').trim();
  const primarySiteUrl = (siteUrlOverride || process.env.GSC_SITE_URL || 'https://www.brewyoursip.com/').trim();

  if (!saJson) {
    return {
      connected: false,
      skipped: true,
      reason: 'GSC_SERVICE_ACCOUNT_JSON secret not set.'
    };
  }

  try {
    const token = await getServiceAccountToken(
      saJson,
      'https://www.googleapis.com/auth/webmasters.readonly'
    );

    const endDate = new Date();
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const fmt = d => d.toISOString().split('T')[0];

    const candidates = Array.from(new Set([
      primarySiteUrl,
      'https://www.brewyoursip.com/',
      'sc-domain:brewyoursip.com',
      'https://brewyoursip.com/'
    ].filter(Boolean)));

    let siteUrl = primarySiteUrl;
    let analyticsRes = null;
    let lastErr = null;

    for (const candidate of candidates) {
      const encodedSite = encodeURIComponent(candidate);
      try {
        analyticsRes = await axios.post(
          `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
          {
            startDate: fmt(startDate),
            endDate: fmt(endDate),
            dimensions: ['query'],
            rowLimit: 15
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000
          }
        );
        siteUrl = candidate;
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!analyticsRes) {
      throw lastErr;
    }

    const encodedSite = encodeURIComponent(siteUrl);

    let sitemaps = [];
    try {
      const smRes = await axios.get(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      sitemaps = (smRes.data.sitemap || []).map(s => ({
        path: s.path,
        lastSubmitted: s.lastSubmitted,
        errors: s.errors || 0,
        warnings: s.warnings || 0
      }));
    } catch (_) {}

    const rows = (analyticsRes.data.rows || []).map(r => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: +(r.ctr * 100).toFixed(2),
      position: +r.position.toFixed(1)
    }));

    return {
      connected: true,
      siteUrl,
      period: `${fmt(startDate)} to ${fmt(endDate)}`,
      topQueries: rows,
      sitemaps
    };
  } catch (err) {
    return {
      connected: false,
      error: err.response?.data?.error?.message || err.message
    };
  }
}

// Publish a local post directly to Google Business Profile (GMB)
async function publishGmbPost(gmbPost) {
  const clientId = process.env.GBP_CLIENT_ID;
  const clientSecret = process.env.GBP_CLIENT_SECRET;
  const refreshToken = process.env.GBP_REFRESH_TOKEN;
  const accountId = process.env.GBP_ACCOUNT_ID;
  const locationId = process.env.GBP_LOCATION_ID;

  if (!clientId || !clientSecret || !refreshToken || !accountId || !locationId) {
    return {
      published: false,
      skipped: true,
      reason: 'GBP_CLIENT_ID / GBP_CLIENT_SECRET / GBP_REFRESH_TOKEN / GBP_ACCOUNT_ID / GBP_LOCATION_ID secrets not set.'
    };
  }

  try {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });

    const accessToken = tokenRes.data.access_token;

    const ctaMap = {
      ORDER_ONLINE: 'ORDER',
      LEARN_MORE: 'LEARN_MORE',
      SHOP: 'SHOP',
      BOOK: 'BOOK'
    };

    const body = {
      languageCode: 'en',
      summary: `${gmbPost.headline}\n\n${gmbPost.body}`.slice(0, 1500),
      topicType: 'STANDARD',
      callToAction: {
        actionType: ctaMap[gmbPost.ctaType] || 'LEARN_MORE',
        url: gmbPost.ctaUrl || 'https://www.brewyoursip.com'
      }
    };

    const res = await axios.post(
      `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    return {
      published: true,
      name: res.data.name,
      state: res.data.state,
      searchUrl: res.data.searchUrl
    };
  } catch (err) {
    return {
      published: false,
      error: err.response?.data?.error?.message || err.message
    };
  }
}

module.exports = {
  fetchGscInsights,
  publishGmbPost
};
