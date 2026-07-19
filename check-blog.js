const fs = require('fs');
const matter = require('gray-matter');

// Check what getPostBySlug returns for ja locale
const post = 'being-helpful';
const content = fs.readFileSync('src/content/posts/' + post + '.mdx', 'utf-8');
const { data } = matter(content);

console.log('=== Simulating getPostBySlug("ja", "being-helpful") ===\n');
console.log('locale:', 'ja');
console.log('title:', data.ja?.title || '(empty)');
console.log('excerpt:', (data.ja?.excerpt || '').substring(0, 60));
console.log('tags:', data.ja?.tags);
console.log('category:', data.ja?.category);
console.log('content length:', (data.ja?.content || '').length);
console.log();

console.log('=== What BlogList renders for each post ===\n');
const posts = fs.readdirSync('src/content/posts').filter(f => f.endsWith('.mdx'));

for (const p of posts) {
  const c = fs.readFileSync('src/content/posts/' + p, 'utf-8');
  const d = matter(c).data;
  const ja = d.ja || {};
  console.log(p.replace('.mdx', '') + ':');
  console.log('  JA title:', (ja.title || '').substring(0, 50));
  console.log('  JA excerpt:', (ja.excerpt || '').substring(0, 50));
}