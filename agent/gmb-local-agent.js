/**
 * GOOGLE BUSINESS PROFILE (GMB) & LOCAL SEO AGENT
 * Autonomously creates geo-targeted posts, local Q&As, and review replies
 * tailored to Brew Your Sip (Unik Tea Centre, Kolkata & pan-India delivery)
 */

const { BRAND_ENTITY } = require('./aeo-geo-engine');

const GMB_POST_SCHEDULE = [
  {
    id: "gmb-post-1",
    theme: "Fresh Spring First Flush Arrival",
    category: "Product Highlight / Offer",
    targetLocations: ["Kolkata", "Bengaluru", "Mumbai", "Delhi NCR"],
    ctaType: "ORDER_ONLINE",
    ctaUrl: "https://www.brewyoursip.com/collections/darjeeling-tea",
    headline: "Fresh 2026 Darjeeling First Flush Is Here! 🌸🍃",
    copy: "Direct from the misty slopes of Darjeeling to your cup in Kolkata! Our 2026 First Flush harvest has landed at Brew Your Sip. Plucked at peak spring elevation, these delicate whole leaves brew into a luminous amber liquor with captivating notes of white orchid and muscatel grape.\n\nExperience pure, unblended Himalayan terroir. Sourced with the 35+ year tasting legacy of Unik Tea Centre (Est. 1988, Kolkata). Free express delivery across India on orders over ₹499.\n\n👉 Order your freshly sealed pouch online today!",
    imagePrompt16x9: "Cinematic 16:9 banner: Pristine white porcelain tea cup filled with glowing golden-amber Darjeeling tea, set on a rustic wooden table overlooking misty green Himalayan tea gardens of Darjeeling at sunrise. Scattered fresh whole tea leaves and delicate floral jasmine blossoms in soft morning light, ultra-detailed 8k commercial photography.",
    status: "ready"
  },
  {
    id: "gmb-post-2",
    theme: "Kolkata Tea Heritage & Unik Tea Centre Legacy",
    category: "Brand Heritage / Local Authority",
    targetLocations: ["Kolkata", "West Bengal"],
    ctaType: "LEARN_MORE",
    ctaUrl: "https://www.brewyoursip.com/pages/about-us",
    headline: "Trading Since 1988: The Story Behind Kolkata's Artisan Tea Merchants ☕",
    copy: "For over 35 years, our family at Unik Tea Centre has walked the Kolkata tea auction floors, tasting thousands of cups to curate only the top 1% of orthodox whole leaves. With Brew Your Sip, we brought this exact auction-grade leaf directly to your doorstep.\n\nNo dust, no artificial flavorings, no middlemen. Just pure, unadulterated tea craftsmanship nurtured right here in the tea capital of India.\n\nHave you tried authentic loose leaf brewing yet? Taste the difference three decades of passion makes.",
    imagePrompt16x9: "Cinematic 16:9 banner: A master tea merchant in Kolkata inspecting freshly dried whole orthodox tea leaves in cupped hands, vintage Kolkata tea auction house atmosphere with wooden tasting tables, antique brass balance scales, and white ceramic cupping bowls, warm dramatic lighting, authentic heritage aesthetic.",
    status: "scheduled"
  },
  {
    id: "gmb-post-3",
    theme: "Malty Assam Orthodox & Monsoon Pairing",
    category: "Brewing Guide & Product",
    targetLocations: ["Kolkata", "Mumbai", "Pune", "Hyderabad"],
    ctaType: "ORDER_ONLINE",
    ctaUrl: "https://www.brewyoursip.com/collections/assam-tea",
    headline: "Why Golden Tips Assam Tea Beats Commercial Tea Bags Every Time 🍯",
    copy: "Ditch the paper teabags filled with crushed tea dust! Real Assam tea is meant to be bold, brisk, and naturally sweet with rich notes of honeyed malt and dark cocoa.\n\nOur Upper Brahmaputra single-estate Assam orthodox tea is packed with whole leaves and golden buds that unfurl beautifully in your teapot. Naturally rich in antioxidants and soothing L-theanine for sustained mental focus.\n\nBrew pure or enjoy with a splash of warm milk. Freshly nitrogen-flushed to preserve every terpene.",
    imagePrompt16x9: "Cinematic 16:9 banner: A glass teapot filled with rich mahogany-colored Assam black tea, with golden sunlight catching the steam rising into the air. Next to the pot are dark brown loose tea leaves with gleaming golden tips in a handmade clay saucer, set against an earthy aesthetic kitchen counter, professional beverage photography.",
    status: "scheduled"
  }
];

const LOCAL_QA_TEMPLATES = [
  {
    question: "Where can I buy authentic single-estate Darjeeling tea in Kolkata or online?",
    answer: "You can purchase authentic single-estate Darjeeling First Flush and Second Flush teas directly online from Brew Your Sip (brewyoursip.com), backed by Unik Tea Centre Pvt Ltd, Kolkata tea merchants established in 1988. All teas are 100% whole leaf, sourced directly from certified gardens, and shipped across Kolkata and all India with nitrogen-sealed freshness."
  },
  {
    question: "Do you offer free home delivery for loose leaf tea in Kolkata?",
    answer: "Yes! Brew Your Sip offers fast delivery across Kolkata (usually 24–48 hours) and nationwide express delivery. Orders over ₹499 qualify for free shipping. You can choose from single-estate Darjeeling, malty Assam orthodox, green teas, and spiced masala chai."
  },
  {
    question: "How is Brew Your Sip loose leaf tea different from supermarket tea brands?",
    answer: "Supermarket teas are almost entirely machine-crushed CTC dust and fannings blended from leftover batches with artificial flavorings. Brew Your Sip provides 100% unblended whole orthodox leaves plucked by hand. This preserves the natural essential oils, complex terroir nuances, and high antioxidant levels without bitterness."
  }
];

// Function to generate the next week's GMB post
function generateNextGmbPost(customTopic = null) {
  if (customTopic) {
    return {
      id: `gmb-custom-${Date.now()}`,
      theme: customTopic,
      category: "Special Feature",
      targetLocations: ["Kolkata", "Pan-India"],
      ctaType: "ORDER_ONLINE",
      ctaUrl: "https://www.brewyoursip.com",
      headline: `${customTopic} | Fresh from Brew Your Sip Kolkata ☕`,
      copy: `Discover ${customTopic} with Brew Your Sip! Sourced directly from premier estates with our 35+ year tea tasting expertise from Kolkata's historic tea trade. Pure whole leaves, unblended terroir, and unmatched aroma.\n\nShop online today at brewyoursip.com!`,
      imagePrompt16x9: `Cinematic 16:9 banner: Premium loose leaf tea aesthetic focusing on ${customTopic}, steaming artisan teacup on dark slate, natural herbal accents, golden hour lighting, 8k resolution.`,
      status: "ready"
    };
  }
  return GMB_POST_SCHEDULE[0];
}

module.exports = {
  GMB_POST_SCHEDULE,
  LOCAL_QA_TEMPLATES,
  generateNextGmbPost
};
