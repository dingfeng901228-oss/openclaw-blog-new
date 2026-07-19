const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');
const OUTPUT_DIR = path.join(process.cwd(), 'src/content/posts'); // new directory
const LOCALES = ['en', 'ja', 'zh'];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('=== Blog i18n Migration: 3 files → 1 file ===\n');

// Get all unique slugs from EN directory
const enFiles = fs.readdirSync(path.join(CONTENT_DIR, 'en')).filter(f => f.endsWith('.mdx'));
console.log(`Found ${enFiles.length} posts to migrate\n`);

const results = {
  success: 0,
  failed: 0,
  missing: []
};

enFiles.forEach(file => {
  const slug = file.replace('.mdx', '');
  console.log(`Processing: ${slug}`);
  
  try {
    const localeData = {};
    let allHaveContent = true;
    
    LOCALES.forEach(loc => {
      const filePath = path.join(CONTENT_DIR, loc, file);
      if (!fs.existsSync(filePath)) {
        console.log(`  ✗ ${loc}: FILE MISSING`);
        allHaveContent = false;
        return;
      }
      
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      
      localeData[loc] = {
        title: data.title || '',
        excerpt: data.excerpt || '',
        content: content,
        tags: data.tags || [],
        category: data.category || 'Uncategorized',
      };
      
      // Check if content is just English (untranslated)
      const firstLine = content.split('\n').filter(l => l.trim())[0] || '';
      const hasCJK = /[\u4e00-\u9fff]/.test(firstLine);
      
      console.log(`  ${loc}: title="${data.title?.substring(0, 30)}" content_start="${firstLine.substring(0, 40)}" CJK=${hasCJK}`);
    });
    
    if (!allHaveContent) {
      results.missing.push(slug);
      results.failed++;
      console.log(`  ✗ SKIPPED - missing locale files\n`);
      return;
    }
    
    // Create single file with frontmatter
    const newPost = {
      slug,
      date: localeData['en'].date || new Date().toISOString().split('T')[0],
      translationKey: slug,
      status: 'published',
      ...localeData
    };
    
    // Write as YAML frontmatter + content sections
    const yaml = require('js-yaml');
    const outputContent = `---\n${yaml.dump(newPost, { indent: 2, lineWidth: -1 })}---`;
    
    const outputPath = path.join(OUTPUT_DIR, `${slug}.mdx`);
    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    
    console.log(`  ✓ Migrated to: ${outputPath}\n`);
    results.success++;
    
  } catch (err) {
    console.log(`  ✗ ERROR: ${err.message}\n`);
    results.failed++;
  }
});

console.log('\n=== Migration Complete ===');
console.log(`Success: ${results.success}`);
console.log(`Failed: ${results.failed}`);
if (results.missing.length > 0) {
  console.log(`Missing locales: ${results.missing.join(', ')}`);
}