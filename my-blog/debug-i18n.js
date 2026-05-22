const fs = require('fs');
const matter = require('gray-matter');

const locales = ['en', 'ja', 'zh'];
const posts = fs.readdirSync('src/content/blog/en').filter(f => f.endsWith('.mdx'));

console.log('Analyzing all posts across locales...\n');

const issues = [];

posts.forEach(post => {
  const slug = post.replace('.mdx', '');
  const contentLengths = {};
  const firstLines = {};
  
  locales.forEach(loc => {
    const f = 'src/content/blog/' + loc + '/' + slug + '.mdx';
    const raw = fs.readFileSync(f, 'utf-8');
    const { data, content } = matter(raw);
    const firstLine = content.split('\n').filter(l => l.trim())[0] || '';
    contentLengths[loc] = raw.length;
    firstLines[loc] = firstLine.substring(0, 80);
  });
  
  // Check if JA/ZH content is same as EN (indicates untranslated)
  const enFirst = firstLines['en'];
  const jaSame = firstLines['ja'] === enFirst;
  const zhSame = firstLines['zh'] === enFirst;
  
  if (jaSame || zhSame) {
    issues.push({
      slug,
      jaSame,
      zhSame,
      enFirst: enFirst.substring(0, 60)
    });
  }
});

console.log('Posts with potential translation issues (content matches EN):\n');
issues.forEach(i => {
  console.log('  ' + i.slug);
  console.log('    JA same as EN:', i.jaSame);
  console.log('    ZH same as EN:', i.zhSame);
  console.log('    EN first line:', i.enFirst);
  console.log('');
});

console.log('Total posts checked:', posts.length);
console.log('Posts with content matching EN:', issues.length);