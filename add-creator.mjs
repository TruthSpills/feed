// Run after verifying the affiliate account and its checkout commission rate.
// node add-creator.mjs ORIGINALSUPAD "Super D"
import { readFileSync, writeFileSync } from 'node:fs';
const [code, name] = process.argv.slice(2);
if (!/^[A-Za-z0-9_-]{1,32}$/.test(code || '') || !name?.trim()) {
  throw new Error('Supply an approved affiliate code and display name.');
}
const root = new URL('./', import.meta.url);
const pagePath = new URL('index.html', root);
const page = readFileSync(pagePath, 'utf8');
const start = 'const creatorNames = new Map(';
const offset = page.indexOf(start) + start.length;
const end = page.indexOf(');', offset);
if (offset < start.length || end < offset) throw new Error('Creator directory missing.');
const creators = new Map(JSON.parse(page.slice(offset, end)));
creators.set(code, name.trim());
const directory = JSON.stringify([...creators], null, 1).replaceAll('<', '\\u003c');
const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', root), 'utf8'));
manifest.id = '/';
manifest.start_url = '/?creator_install=' + code;
writeFileSync(new URL('creator-' + code + '.webmanifest', root), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(pagePath, page.slice(0, offset) + directory + page.slice(end));
console.log('Publish the page and creator manifest. Share https://hackthai.com/?ref=' + code);
