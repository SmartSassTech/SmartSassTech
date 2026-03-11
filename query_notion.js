const { Client } = require("@notionhq/client");
require("dotenv").config({ path: ".env.local" });
const notion = new Client({ auth: process.env.NOTION_API_KEY });
async function main() {
    try {
        const db = await notion.databases.retrieve({ database_id: "efe850c2-e88e-42e9-9ce8-d23b5c9377e5" });
        console.log(JSON.stringify(db.properties, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}
main();
