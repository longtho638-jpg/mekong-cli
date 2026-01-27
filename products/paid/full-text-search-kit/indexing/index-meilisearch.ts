import { SearchClient } from '../src/core/search-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple check for env vars
const HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const API_KEY = process.env.MEILI_ADMIN_KEY || 'masterKey';
const INDEX_NAME = process.env.INDEX_NAME || 'products';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function run() {
  console.log(`Initializing Meilisearch client for host ${HOST}...`);

  const client = new SearchClient({
    type: 'meilisearch',
    config: {
      host: HOST,
      apiKey: API_KEY,
    },
  });

  await client.init();

  console.log(`Configuring index ${INDEX_NAME}...`);
  await client.configureIndex(INDEX_NAME, {
    name: INDEX_NAME,
    searchableAttributes: ['name', 'description', 'brand', 'category'],
    filterableAttributes: ['brand', 'category', 'price'],
    sortableAttributes: ['price', 'popularity'],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness'
    ]
  });

  console.log(`Indexing ${data.length} documents...`);
  await client.addDocuments(INDEX_NAME, data);

  console.log('Done!');
}

run().catch(console.error);
