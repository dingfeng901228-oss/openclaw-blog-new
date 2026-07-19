const fs = require('fs');
const matter = require('gray-matter');

// Test reading a migrated file with actual Japanese content
const file = 'src/content/posts/tokyo-tech-scene.mdx';
const raw = fs.readFileSync(file, 'utf-8');
const { data } = matter(raw);

console.log('=== Testing tokyo-tech-scene ===\n');
console.log('en.title:', data.en?.title);
console.log('ja.title:', data.ja?.title);
console.log('zh.title:', data.zh?.title);

// Check first content lines
const enFirst = (data.en?.content || '').split('\n').filter(l => l.trim())[0] || '';
const jaFirst = (data.ja?.content || '').split('\n').filter(l => l.trim())[0] || '';
const zhFirst = (data.zh?.content || '').split('\n').filter(l => l.trim())[0] || '';

console.log('\nen first line:', enFirst.substring(0, 60));
console.log('ja first line:', jaFirst.substring(0, 60));
console.log('zh first line:', zhFirst.substring(0, 60));

// Check if content is the same
console.log('\nEN===JA:', enFirst === jaFirst);
console.log('EN===ZH:', enFirst === zhFirst);