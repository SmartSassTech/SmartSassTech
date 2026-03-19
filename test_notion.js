const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });
const notion = new Client({ auth: process.env.NOTION_API_KEY });
async function run() {
  try {
    const response = await notion.databases.query({
      database_id: 'da201fe9-c3d7-4ae9-a5f3-662f13e76c46',
    });
    console.log('Success, articles:', response.results.length);
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
