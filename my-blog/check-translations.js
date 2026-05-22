const fs = require('fs');
const matter = require('gray-matter');

const postsDir = 'src/content/posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));

console.log('=== Translation Status Check (New Schema) ===\n');

const LOCALES = ['en', 'ja', 'zh'];

files.forEach(file => {
  const slug = file.replace('.mdx', '');
  const raw = fs.readFileSync(postsDir + '/' + file, 'utf-8');
  const { data } = matter(raw);
  
  const results = {};
  let allGood = true;
  
  LOCALES.forEach(loc => {
    const content = data[loc]?.content || '';
    const firstLine = content.split('\n').filter(l => l.trim())[0] || '';
    const enFirst = (data.en?.content || '').split('\n').filter(l => l.trim())[0] || '';
    
    const isUntranslated = loc !== 'en' && firstLine === enFirst && enFirst !== '';
    const isEmpty = !content.trim();
    
    results[loc] = {
      hasContent: !isEmpty,
      firstLine: firstLine.substring(0, 50),
      isUntranslated,
      isEmpty
    };
    
    if (isUntranslated || isEmpty) allGood = false;
  });
  
  if (!allGood) {
    console.log('❌ ' + slug + ':');
    LOCALES.forEach(loc => {
      if (results[loc].isUntranslated) console.log('   ' + loc + ': UNTRANSLATED (same as EN)');
      else if (results[loc].isEmpty) console.log('   ' + loc + ': EMPTY');
      else console.log('   ' + loc + ': ✅ ' + results[loc].firstLine);
    });
    console.log('');
  } else {
    console.log('✅ ' + slug + ' - all translated');
  }
});