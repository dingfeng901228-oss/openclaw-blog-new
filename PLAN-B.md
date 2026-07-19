# i18n Blog - Single File Per Post (方案B)

## Problem Summary
- Current: 3 files per post (en/, ja/, zh/)
- JA/ZH body content is UNTRANSLATED (copied from EN)
- No validation to prevent publishing incomplete translations
- No locale-aware fallback

## Solution B: Single File Per Post
Each post is ONE file with all 3 locales embedded.

### New Schema
```yaml
---
slug: post-name
date: 2026-05-21
translationKey: post-name  # shared across all locales
status: draft  # only published when all 3 locales complete

en:
  title: English Title
  excerpt: English excerpt
  content: |
    English body content...
  tags: [AI, Philosophy]
  category: AI

ja:
  title: 日本語タイトル
  excerpt: 日本語の抜粋
  content: |
    日本語の本文...
  tags: [AI, 哲学]
  category: AI

zh:
  title: 中文标题
  excerpt: 中文摘要
  content: |
    中文正文...
  tags: [AI, 哲学]
  category: AI
---
```

### Benefits
1. **All 3 locales guaranteed in ONE place** - can't have one without others
2. **Validation is trivial** - just check if en/ja/zh all exist
3. **No cross-locale contamination** - content is explicitly separated
4. **Language switcher always accurate** - if locale exists, show it

### Migration Steps
1. Create new schema structure
2. Write migration script to convert 3 files → 1 file
3. Update `blog.ts` to read new format
4. Update `Post` type
5. Add post-creation validation
6. Build and deploy

### Key Files to Modify
- `src/lib/types.ts` - add `localeContent` structure to Post
- `src/lib/blog.ts` - rewrite `getAllPosts()`, `getPostBySlug()`
- Create migration script
- Update `[slug]/page.tsx` to use new structure