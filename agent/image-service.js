/**
 * GEMINI 16:9 IMAGE GENERATION SERVICE
 * Manages 16:9 ratio visual assets for SEO/AEO/GEO blogs and GMB posts.
 * Uses pre-generated 16:9 assets in public/images/generated/ and optionally
 * calls Gemini Imagen 3 API when GEMINI_API_KEY is configured.
 */

const path = require('path');
const fs = require('fs');
const axios = require('axios');

const GENERATED_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'generated');

const IMAGE_CATALOG = [
  {
    id: "darjeeling_first_flush_16_9",
    title: "Darjeeling First Flush Spring Harvest",
    aspectRatio: "16:9",
    filename: "darjeeling_first_flush_16_9.jpg",
    relativePath: "/images/generated/darjeeling_first_flush_16_9.jpg",
    altText: "Fresh spring harvest Darjeeling First Flush tea leaves in high-altitude Himalayan plantation with morning mist",
    category: "Terroir & Plantation",
    articleSlug: "darjeeling-first-flush-terroir-guide-2026",
    prompt: "Cinematic 16:9 wide shot: Sun rising over the misty emerald-green terrace slopes of Darjeeling Himalayan tea plantations, Kanchenjunga snow peak in distant golden glow. In foreground, delicate two-leaves-and-a-bud fresh tea shoot with morning dew drops, shallow depth of field, ultra-detailed 8k award-winning commercial beverage photography."
  },
  {
    id: "assam_orthodox_vs_ctc_16_9",
    title: "Assam Orthodox Whole Leaf vs Machine CTC",
    aspectRatio: "16:9",
    filename: "assam_orthodox_vs_ctc_16_9.jpg",
    relativePath: "/images/generated/assam_orthodox_vs_ctc_16_9.jpg",
    altText: "Visual comparison between whole leaf orthodox Assam tea with golden tips and round machine CTC tea granules on dark slate",
    category: "Tea Education & Comparison",
    articleSlug: "assam-orthodox-vs-ctc-tea-guide",
    prompt: "Cinematic 16:9 wide macro shot: Side-by-side presentation on dark natural slate stone. On left side, rich whole-leaf Assam orthodox black tea with glistening golden tips. On right side, uniform machine-processed round CTC tea granules. In background, an artisan glass teacup filled with steaming deep amber-copper tea, dramatic warm studio lighting, 8k commercial tea advertising photography."
  },
  {
    id: "brew_loose_leaf_without_bitterness_16_9",
    title: "Brewing Loose Leaf Tea Masterclass",
    aspectRatio: "16:9",
    filename: "brew_loose_leaf_without_bitterness_16_9.jpg",
    relativePath: "/images/generated/brew_loose_leaf_without_bitterness_16_9.jpg",
    altText: "Clear borosilicate glass teapot with golden-amber loose leaf tea unfurling in hot water with natural morning light",
    category: "Brewing Masterclass",
    articleSlug: "how-to-brew-loose-leaf-tea-without-bitterness",
    prompt: "Cinematic 16:9 wide shot: Clear borosilicate glass teapot filled with luminous golden-amber loose leaf tea unfurling in swirling hot water, gentle steam rising, placed on a modern dark slate countertop alongside a wooden measuring scoop, delicate tea cup, morning sun flare, award-winning food and beverage photography, 8k."
  }
];

function getImageCatalog() {
  return IMAGE_CATALOG;
}

function getImageForArticle(articleSlug) {
  return IMAGE_CATALOG.find(img => img.articleSlug === articleSlug) || IMAGE_CATALOG[0];
}

// Ensures a 16:9 JPEG file exists on disk; generates via Gemini Imagen if GEMINI_API_KEY is set
async function ensureHeroImageFile(heroImageName, prompt) {
  if (!fs.existsSync(GENERATED_IMAGES_DIR)) {
    fs.mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
  }

  const safeName = (heroImageName || 'darjeeling_first_flush_16_9').replace(/[^a-zA-Z0-9_-]/g, '');
  const targetPath = path.join(GENERATED_IMAGES_DIR, `${safeName}.jpg`);

  if (fs.existsSync(targetPath)) {
    return { path: targetPath, generated: false };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && prompt) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
      const res = await axios.post(url, {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          outputOptions: { mimeType: 'image/jpeg' }
        }
      }, { timeout: 30000 });

      const b64 = res.data && res.data.predictions && res.data.predictions[0] && res.data.predictions[0].bytesBase64Encoded;
      if (b64) {
        fs.writeFileSync(targetPath, Buffer.from(b64, 'base64'));
        return { path: targetPath, generated: true };
      }
    } catch (err) {
      console.warn(`   ⚠️ Gemini image generation fallback: ${err.message}`);
    }
  }

  // Fallback to existing default 16:9 image so WordPress never gets a broken image
  const fallbackPath = path.join(GENERATED_IMAGES_DIR, 'darjeeling_first_flush_16_9.jpg');
  return { path: fs.existsSync(fallbackPath) ? fallbackPath : null, generated: false };
}

module.exports = {
  getImageCatalog,
  getImageForArticle,
  ensureHeroImageFile
};
