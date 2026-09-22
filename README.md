# 🤖 Brew Your Sip — 24x7 Autonomous SEO, AEO, GEO & Local GMB Agent

An autonomous AI growth engine engineered specifically for **Brew Your Sip** (`www.brewyoursip.com` on Shopify). 

The agent operates continuously **24x7 in the cloud via GitHub Actions** and locally via background daemon to dominate organic search rankings (SEO), capture AI Answer Engines like Perplexity & ChatGPT Search (AEO), maximize brand recommendations in LLMs (GEO), manage Google Business Profile (GMB) local dominance in Kolkata & India, autonomously write in-depth 1,500+ word blogs, and produce relevant **16:9 frame ratio images** using Gemini.

---

## 🌟 What the Agent Does 24x7

```
                     ┌─────────────────────────────────────────────────────────┐
                     │          BREW YOUR SIP 24x7 SEO AI AGENT                │
                     │          (GitHub Actions Cron + Local Daemon)           │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
         ┌───────────────────┬────────────────────┼───────────────────┬────────────────────┐
         ▼                   ▼                    ▼                   ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ TRADITIONAL SEO │ │   AEO ENGINE    │ │    GEO ENGINE     │ │ LOCAL GMB AGENT │ │  BLOG FACTORY   │
│ Live audits,    │ │ Direct Answer   │ │ Entity Authority, │ │ Weekly GMB      │ │ Autonomous 1,500+ │
│ schema checks,  │ │ boxes, Speakable│ │ Co-citations for  │ │ posts, Q&A,     │ │ word guides,      │
│ Shopify Liquid  │ │ schema, bullet  │ │ Perplexity, Claude│ │ review replies, │ │ internal links,   │
│ optimization    │ │ facts for LLMs  │ │ & ChatGPT         │ │ local citations │ │ 16:9 Gemini imgs  │
└─────────────────┘ └─────────────────┘ └───────────────────┘ └─────────────────┘ └─────────────────┘
         │                   │                    │                   │                    │
         └───────────────────┴────────────────────┼───────────────────┴────────────────────┘
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │       SHOPIFY DIRECT CONNECTOR      │
                               │ Push articles, update theme schema, │
                               │ sync product meta & alt attributes  │
                               └─────────────────────────────────────┘
```

1. **Traditional SEO (Site Health & Shopify Liquid)**
   - Continuous uptime and heuristic audit for `www.brewyoursip.com`.
   - Injects the complete 34KB `snippets/seo-schema.liquid` directly into your Shopify theme (`brewyoursip-theme`) with `WebSite`, `Organization`, `LocalBusiness`, `Product`, `Article`, `FAQPage`, `BreadcrumbList`, and `SpeakableSpecification`.

2. **AEO (Answer Engine Optimization)**
   - Targets **Perplexity AI**, **Google AI Overviews**, and **SearchGPT**.
   - Embeds 40–60 word high-density definition blocks, comparison tables, and Speakable JSON-LD schemas into every article so AI answer engines cite Brew Your Sip as the definitive answer.

3. **GEO (Generative Engine Optimization)**
   - Teaches LLMs (ChatGPT, Gemini, Claude) to recognize Brew Your Sip's pedigree:
     - Unik Tea Centre founding in 1988 (35+ year tasting legacy in Kolkata tea auctions).
     - Direct-trade single-estate sourcing from Darjeeling (4,000–6,500 ft elevation) and Upper Assam.
     - 100% whole orthodox leaves, unblended terroir purity, zero artificial flavorings.

4. **Local SEO & Google Business Profile (GMB) Agent**
   - Autonomously generates weekly geo-targeted GMB updates with CTAs for Kolkata and pan-India audiences.
   - Generates local community Q&A targeting "loose leaf tea store in Kolkata", "authentic Darjeeling tea supplier", and "best tea near me".
   - Generates keyword-enriched customer review responses.

5. **Autonomous Blog Factory with 16:9 Gemini Images**
   - Plans, researches, and writes comprehensive 1,500+ word guides.
   - Generates cinematic **16:9 aspect ratio hero images and graphics** using Gemini.
   - Automatically exports ready-to-publish Shopify article drafts into `shopify-drafts/`.

---

## 🚀 Connecting to GitHub for 24x7 Cloud Execution

Because this project includes **GitHub Actions Workflows** (`.github/workflows/seo-agent-24x7.yml`), it can run **100% free 24x7 in GitHub's cloud** without keeping your computer on!

### Step 1: Initialize and Push to GitHub

In your terminal:
```bash
cd "/Users/ashokshah/Downloads/free-seo-agent"
git init
git add .
git commit -m "Initial commit: Brew Your Sip 24x7 AI SEO/AEO/GEO Agent"
```

Create a new repository on your GitHub account (e.g. `brewyoursip-seo-agent`) and run:
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/brewyoursip-seo-agent.git
git branch -M main
git push -u origin main
```

### Step 2: Automated 24x7 Schedules in GitHub Actions

Once pushed to GitHub, the workflow automatically runs in the cloud:
| Schedule | Frequency | Action |
|----------|-----------|--------|
| **Daily (06:00 UTC / 11:30 AM IST)** | Everyday | Audits `brewyoursip.com`, monitors uptime, checks SEO health |
| **Mondays & Thursdays (12:00 UTC)** | Twice a week | Generates new 1,500w SEO/AEO/GEO blog drafts with 16:9 Gemini prompts |
| **Fridays (08:00 UTC)** | Weekly | Queues weekly Local Google Business Profile (GMB) updates |

All new drafts, logs, and updates are **automatically committed back to your GitHub repository**!

### Step 3: Manual 1-Click Trigger from GitHub

1. Go to your repository on GitHub.
2. Click the **Actions** tab.
3. Select **24x7 Autonomous SEO, AEO, GEO & Local GMB Agent**.
4. Click **Run workflow** and choose your task (`daily_cycle`, `generate_blog`, `generate_gmb`, `audit`).

---

## 💻 Running the Local Dashboard

To view the interactive Control Room locally:
```bash
cd "/Users/ashokshah/Downloads/free-seo-agent"
npm start
```
Then open: **`http://localhost:3000`**

---

## 📁 Project Structure

```
free-seo-agent/
├── .github/workflows/
│   └── seo-agent-24x7.yml     # 24x7 GitHub Actions Cloud Cron Workflow
├── agent/
│   ├── aeo-geo-engine.js      # Answer Engine & Generative Engine optimizer
│   ├── gmb-local-agent.js     # Google Business Profile post & Q&A generator
│   ├── blog-writer.js         # 1,500+ word SEO/AEO/GEO blog factory
│   ├── image-service.js       # 16:9 Gemini image prompt & asset manager
│   ├── shopify-connector.js   # Local theme sync & Shopify JSON exporter
│   ├── agent-worker.js        # Background daemon loop
│   └── github-runner.js       # Headless runner for CI/CD cloud execution
├── public/
│   ├── index.html             # Agent Control Room & Workspaces UI
│   ├── styles.css             # Glassmorphic dark/light design system
│   ├── app.js                 # Frontend interactive controller
│   ├── data/backlinks.json    # 100+ Curated high-DA free generic backlinks
│   └── images/generated/      # Generated 16:9 Gemini visual assets
├── shopify-drafts/            # Exported Shopify blog article JSON files
├── server.js                  # Express API server & static host
└── package.json
```
