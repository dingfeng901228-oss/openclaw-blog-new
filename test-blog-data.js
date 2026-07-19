// Test what getAllPosts('ja') actually returns
const path = require('path');
const matter = require('gray-matter');

// Manually simulate what blog.ts does
function getContentDir() {
  return path.join(process.cwd(), 'src/content/posts');
}

function getLocaleContent(data, locale) {
  const localeData = data[locale];
  if (!localeData) {
    return {
      title: '(no content)',
      excerpt: '(no content)',
      content: '(no content)',
      tags: [],
      category: 'Uncategorized',
    };
  }
  return {
    title: localeData.title || '',
    excerpt: localeData.excerpt || '',
    content: localeData.content || '',
    tags: localeData.tags || [],
    category: localeData.category || 'Uncategorized',
  };
}

const contentDir = getContentDir();
const files = require('fs').readdirSync(contentDir).filter(f => f.endsWith('.mdx'));

// Simulate getAllPosts('ja')
console.log('=== Simulating getAllPosts("ja") ===\n');
console.log('(This is what BlogList receives)\n');

for (const fileName of files) {
  const slug = fileName.replace(/\.(mdx|md)$/, '');
  const filePath = path.join(contentDir, fileName);
  const fileContent = require('fs').readFileSync(filePath, 'utf-8');
  const { data } = matter(fileContent);
  
  const jaContent = getLocaleContent(data, 'ja');
  
  console.log(`[${slug}]`);
  console.log(`  title: ${jaContent.title.substring(0, 60)}`);
  console.log(`  excerpt: ${jaContent.excerpt.substring(0, 60)}`);
  console.log(`  tags: ${jaContent.tags.join(', ')}`);
  console.log();
}

console.log('\n=== Checking first-post details ===');
const fp = files.find(f => f.includes('first-post'));
if (fp) {
  const fc = require('fs').readFileSync(path.join(contentDir, fp), 'utf-8');
  const { data } = matter(fc);
  console.log('JA content first 200 chars:');
  console.log((data.ja?.content || '').substring(0, 200));
}