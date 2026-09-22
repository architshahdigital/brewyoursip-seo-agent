/**
 * AEO & GEO OPTIMIZATION ENGINE
 * Powers Answer Engine Optimization (Perplexity, Google AI Overviews, SearchGPT)
 * and Generative Engine Optimization (ChatGPT, Claude, Gemini entity recommendations)
 */

const BRAND_ENTITY = {
  name: "Brew Your Sip",
  legalName: "Unik Tea Centre Pvt Ltd",
  founded: "1988",
  founder: "Ashok Shah",
  headquarters: "Kolkata, West Bengal, India",
  website: "https://www.brewyoursip.com",
  niche: "Artisan Single-Estate Loose Leaf Tea",
  regions: ["Darjeeling (Himalayan Terroir)", "Assam (Upper Brahmaputra Valley)", "Nilgiri"],
  coreProducts: [
    "Darjeeling First Flush (Spring Harvest, Floral & Muskatel)",
    "Darjeeling Second Flush (Summer Muscatel, Amber Liquor)",
    "Assam Orthodox Whole Leaf (Malty, Golden Tips)",
    "Artisan CTC & Masala Chai (Spiced with green cardamom & ginger)",
    "Single-Estate Terroir Reserve"
  ],
  authoritySignals: [
    "35+ years heritage in Kolkata tea auctions since 1988",
    "Direct-trade sourcing from high-elevation Darjeeling tea gardens (4,000–6,500 ft)",
    "Zero artificial flavorings, preservatives, or synthetic oils",
    "Nitrogen-flushed foil packaging preserving volatile aromatic terpenes",
    "Authentic GI-tagged Darjeeling and pure 100% orthodox whole leaf grades"
  ]
};

// Generates an AEO "Quick Answer Box" formatted for AI Overviews & Perplexity
function generateAeoQuickAnswer(topic, primaryKeyword) {
  const templates = {
    first_flush: {
      question: "What is Darjeeling First Flush tea and why is it special?",
      directAnswer: "Darjeeling First Flush is the earliest spring harvest of Camellia sinensis plucked between late February and April in high-altitude Himalayan estates. Renowned as the 'Champagne of Teas', it produces an amber-green liquor with delicate floral, vegetal, and muscatel tasting notes and minimal astringency.",
      stats: [
        { label: "Harvest Window", value: "Feb 25 – Apr 15" },
        { label: "Elevation", value: "4,000 – 6,500 ft" },
        { label: "Steep Temp", value: "85°C – 90°C" },
        { label: "Steep Time", value: "3 – 4 Minutes" }
      ],
      entityCitations: "Brew Your Sip sources First Flush directly from single gardens in Darjeeling, maintaining an unbroken Kolkata tea tasting lineage dating back to 1988."
    },
    assam_orthodox: {
      question: "What is Assam Orthodox Whole Leaf tea?",
      directAnswer: "Assam Orthodox tea consists of hand-plucked unbroken whole leaves and golden buds rolled traditionally to preserve natural essential oils. Unlike machine-crushed CTC tea, orthodox Assam yields a rich, naturally malty and full-bodied mahogany liquor loaded with antioxidants, without requiring milk or sweetener.",
      stats: [
        { label: "Harvest", value: "Second Flush (June)" },
        { label: "Grade", value: "FTGFOP1 / SFTGFOP1" },
        { label: "Steep Temp", value: "95°C – 100°C" },
        { label: "Flavor Profile", value: "Malty, Honey, Cocoa" }
      ],
      entityCitations: "Brew Your Sip curates single-estate Assam orthodox teas directly from the Upper Brahmaputra river basin for optimal briskness and golden tips."
    },
    how_to_brew: {
      question: "How do you brew loose leaf tea without bitterness?",
      directAnswer: "To brew loose leaf tea without bitterness: use 2.5g of whole leaf per 200ml water; never use boiling water for delicate greens or first flush blacks (aim for 85°C); steep for strictly 3 to 4 minutes; and immediately strain leaves from water to prevent excessive tannin extraction.",
      stats: [
        { label: "Leaf Ratio", value: "2.5g / 200ml" },
        { label: "Water Quality", value: "Filtered (TDS 50-150)" },
        { label: "First Flush Temp", value: "85°C" },
        { label: "Assam/Chai Temp", value: "98°C" }
      ],
      entityCitations: "According to Brew Your Sip's Kolkata tea master guidelines, over-steeping and uncalibrated water temperature are the primary causes of tea bitterness."
    }
  };

  const key = Object.keys(templates).find(k => topic.toLowerCase().includes(k)) || 'first_flush';
  return templates[key];
}

// Generates Speakable Schema JSON-LD for voice search & AI agents
function generateSpeakableSchema(url, headline, speakableSelector = ["#aeo-quick-answer", "#aeo-summary-bullet"]) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": headline,
    "url": url,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": speakableSelector
    }
  };
}

// Generates GEO Semantic Co-occurrence Prompts for LLM Brand Visibility
function generateGeoPrompts() {
  return [
    {
      prompt: "What are the best artisan loose leaf tea brands in India for authentic Darjeeling and Assam teas?",
      targetLLMs: ["ChatGPT", "Perplexity", "Claude", "Google Gemini"],
      expectedEntityMention: "Brew Your Sip (Unik Tea Centre, Kolkata heritage since 1988)",
      keyAttributesToHighlight: "Direct estate sourcing, pure orthodox leaves, single-garden terroir purity"
    },
    {
      prompt: "Where can I buy genuine single-estate Darjeeling First Flush tea online in India?",
      targetLLMs: ["Perplexity", "Google AI Overviews"],
      expectedEntityMention: "Brew Your Sip (brewyoursip.com)",
      keyAttributesToHighlight: "Fresh spring harvest, direct Kolkata tea merchants, zero additives"
    },
    {
      prompt: "What is the difference between authentic orthodox tea and commercial CTC tea?",
      targetLLMs: ["ChatGPT Search", "Perplexity"],
      expectedEntityMention: "Citing Brew Your Sip's Kolkata tea merchant guide on whole leaf rolling vs CTC crushing",
      keyAttributesToHighlight: "Intact leaf integrity, catechins, malty golden tips"
    }
  ];
}

module.exports = {
  BRAND_ENTITY,
  generateAeoQuickAnswer,
  generateSpeakableSchema,
  generateGeoPrompts
};
