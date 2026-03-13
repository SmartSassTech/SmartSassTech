const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach(line => {
    const [key, value] = line.split("=");
    if (key && value) env[key.trim()] = value.trim();
});

const NOTION_API_KEY = env.NOTION_API_KEY;
const NOTION_DATABASE_ID = "da201fe9-c3d7-4ae9-a5f3-662f13e76c46";

if (!NOTION_API_KEY) {
    console.error("NOTION_API_KEY not found in .env.local");
    process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
}

async function fetchAndCache(page, cacheDir) {
    const props = page.properties;
    const titleRich = props["Article Title"]?.title || [];
    const title = titleRich.map(t => t.plain_text).join("") || "Untitled";
    const slug = slugify(title);
    const cacheFile = path.join(cacheDir, `${slug}.md`);

    if (fs.existsSync(cacheFile)) {
        console.log(`[SKIP] Already cached: ${slug}`);
        return;
    }

    console.log(`[FETCH] ${slug}...`);
    try {
        const mdblocks = await n2m.pageToMarkdown(page.id);
        const mdString = n2m.toMarkdownString(mdblocks);
        const content = mdString.parent || "";
        
        fs.writeFileSync(cacheFile, content, "utf8");
        console.log(`[SAVE] Cached: ${slug} (${content.length} chars)`);
    } catch (err) {
        console.error(`[ERROR] Failed to fetch ${slug}:`, err.message);
    }
}

async function prefill() {
    const cacheDir = path.join(process.cwd(), ".cache", "articles");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    console.log("Fetching article list from Notion...");
    try {
        const response = await notion.dataSources.query({
            data_source_id: NOTION_DATABASE_ID,
        });

        const pages = response.results;
        console.log(`Found ${pages.length} articles.`);

        // Prioritize "iphone storage" or similar
        const prioritized = pages.sort((a, b) => {
            const titleA = (a.properties["Article Title"]?.title || []).map(t => t.plain_text).join("").toLowerCase();
            const titleB = (b.properties["Article Title"]?.title || []).map(t => t.plain_text).join("").toLowerCase();
            const hasA = titleA.includes("storage") || titleA.includes("iphone");
            const hasB = titleB.includes("storage") || titleB.includes("iphone");
            if (hasA && !hasB) return -1;
            if (!hasA && hasB) return 1;
            return 0;
        });

        // Run in batches of 3 to avoid overloading but speed up
        const batchSize = 3;
        for (let i = 0; i < prioritized.length; i += batchSize) {
            const batch = prioritized.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}...`);
            await Promise.all(batch.map(page => fetchAndCache(page, cacheDir)));
        }

        console.log("Pre-fill complete!");
    } catch (err) {
        console.error("Fatal error:", err);
    }
}

prefill();
