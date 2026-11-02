//! frankbot-rs -- a static site generator for frankbot.org.
//!
//! Reads the same MDX content the Next.js blog uses and emits an
//! equivalent static site: the same URLs, the same SEO metadata, the
//! same visible content, the same styling. The point is build time
//! (minutes -> seconds) and a dependency tree that is a few crates
//! instead of a few hundred npm packages.
//!
//! Usage:
//!
//! ```text
//! frankbot-rs [project-root] [out-dir]
//! ```
//!
//! `project-root` defaults to `F:/WebSite/openclaw-blog-new` and is the
//! directory that holds `src/content/posts/`, `messages/` and `public/`.
//! `out-dir` defaults to `out-rs` next to the executable's project.

mod io;
mod messages;
mod post;
mod reading;
mod render;
mod site;
mod staticpages;
mod templates;

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use post::Post;
use templates::fill;

/// The compiled stylesheet, produced by `build-css.sh`.
const CSS: &str = include_str!("../site.css");

struct Config {
    /// Directory holding the MDX posts.
    content: PathBuf,
    /// Directory to write the site into.
    out: PathBuf,
    /// Directory with static assets (favicon, images) to copy verbatim.
    public: PathBuf,
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().collect();
    // The project root is the Next.js project: it holds `messages/`,
    // `src/content/posts/` and `public/`. The default is the checkout
    // this crate lives in, so the generator works from a fresh clone
    // without arguments.
    let crate_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let default_root = crate_dir.parent().unwrap_or(crate_dir);
    let default_out = default_root.join("out-rs");
    let root = PathBuf::from(
        args.get(1)
            .cloned()
            .unwrap_or_else(|| default_root.to_string_lossy().into_owned()),
    );
    let out = PathBuf::from(
        args.get(2)
            .cloned()
            .unwrap_or_else(|| default_out.to_string_lossy().into_owned()),
    );

    // Debug helper: print one locale's raw content so it can be diffed
    // against what the Next.js loader extracts.
    if args.get(1).map(|s| s.as_str()) == Some("--dump") {
        let file = args.get(2).cloned().unwrap_or_default();
        let loc = args.get(3).cloned().unwrap_or_else(|| "en".to_string());
        let bytes = fs::read(&file)
            .map_err(|e| format!("cannot read: {e}"))
            .unwrap();
        let src = io::decode(&bytes).unwrap();
        let p = post::parse_post(&src).unwrap();
        print!("{}", p.locale(&loc).content);
        return ExitCode::SUCCESS;
    }

    // The translations live in the Next.js project's messages/ folder.
    messages::set_messages_dir(&root.join("messages"));

    let cfg = Config {
        content: root.join("src/content/posts"),
        out,
        public: root.join("public"),
    };

    match build(&cfg) {
        Ok(stats) => {
            println!(
                "built {} posts -> {} pages in {}",
                stats.posts, stats.pages, stats.elapsed
            );
            println!("  output: {}", cfg.out.display());
            ExitCode::SUCCESS
        }
        Err(e) => {
            eprintln!("error: {e}");
            ExitCode::FAILURE
        }
    }
}

struct Stats {
    posts: usize,
    pages: usize,
    elapsed: String,
}

fn build(cfg: &Config) -> Result<Stats, String> {
    let started = std::time::Instant::now();

    // ---- load content -------------------------------------------------
    let mut posts: Vec<Post> = Vec::new();
    let mut entries: Vec<PathBuf> = walkdir::WalkDir::new(&cfg.content)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
        .map(|e| e.path().to_path_buf())
        .collect();
    entries.sort();

    for path in entries {
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if ext != "mdx" && ext != "md" {
            continue;
        }
        let bytes = fs::read(&path).map_err(|e| format!("cannot read {}: {e}", path.display()))?;
        let src = match io::decode(&bytes) {
            Ok(s) => s,
            Err(e) => {
                // gray-matter degrades to an empty frontmatter when it
                // cannot read the delimiters, which makes the post a
                // draft and drops it from the build. Skip it the same
                // way, but say so.
                eprintln!("skipping {}: {e}", path.display());
                continue;
            }
        };
        let mut p = match post::parse_post(&src) {
            Ok(p) => p,
            Err(e) => {
                eprintln!("skipping {}: {e}", path.display());
                continue;
            }
        };
        // The URL slug comes from the *file name*, not the frontmatter
        // `slug:` field -- `getAllPosts` does
        // `fileName.replace(/\.(mdx|md)$/, '')`. Several posts carry a
        // shorter `slug:` in their frontmatter, so using it would change
        // the published URLs.
        p.slug = file_stem(&path);
        if p.is_published() {
            posts.push(p);
        }
    }
    if posts.is_empty() {
        return Err(format!(
            "no published posts found in {}",
            cfg.content.display()
        ));
    }
    // Newest first, matching `getAllPosts`.
    posts.sort_by_key(|p| std::cmp::Reverse(p.date_key()));

    // ---- prepare output ----------------------------------------------
    if cfg.out.exists() {
        fs::remove_dir_all(&cfg.out)
            .map_err(|e| format!("cannot clear {}: {e}", cfg.out.display()))?;
    }
    fs::create_dir_all(&cfg.out).map_err(|e| format!("cannot create out dir: {e}"))?;

    if cfg.public.exists() {
        copy_tree(&cfg.public, &cfg.out)?;
    }

    // Write the stylesheet where the HTML expects it.
    let css_dir = cfg.out.join("_next/static/css");
    fs::create_dir_all(&css_dir).map_err(|e| format!("cannot create css dir: {e}"))?;
    fs::write(css_dir.join("site.css"), CSS).map_err(|e| format!("cannot write css: {e}"))?;

    let mut pages = 0usize;

    // ---- article pages + blog index + pagination ----------------------
    for loc in site::LOCALES {
        let total_pages = posts.len().div_ceil(site::POSTS_PER_PAGE);

        for page_no in 1..=total_pages {
            let start = (page_no - 1) * site::POSTS_PER_PAGE;
            let end = (start + site::POSTS_PER_PAGE).min(posts.len());
            let html = render_blog_list(loc, &posts, start, end, page_no, total_pages);
            let rel = if page_no == 1 {
                format!("{loc}/blog.html")
            } else {
                format!("{loc}/blog/page/{page_no}.html")
            };
            write_page(&cfg.out, &rel, &html)?;
            pages += 1;
        }

        for p in &posts {
            let lc = p.locale(loc);
            if lc.content.trim().is_empty() {
                // `localeHasContent` is false -> no page for this locale.
                continue;
            }
            let html = render_article(loc, p);
            write_page(&cfg.out, &format!("{loc}/blog/{}.html", p.slug), &html)?;
            pages += 1;
        }
    }

    // ---- home pages ----------------------------------------------------
    for loc in site::LOCALES {
        let html = render_home(loc, &posts);
        write_page(&cfg.out, &format!("{loc}.html"), &html)?;
        pages += 1;
    }

    // ---- static content pages -------------------------------------------
    for loc in site::LOCALES {
        for page in ["about", "projects", "timeline"] {
            let html = render_static_page(page, loc)?;
            write_page(&cfg.out, &format!("{loc}/{page}.html"), &html)?;
            pages += 1;
        }
    }

    // ---- the PWA offline page -------------------------------------------
    for loc in site::LOCALES {
        let html = render_offline(loc)?;
        write_page(&cfg.out, &format!("{loc}/offline.html"), &html)?;
        pages += 1;
    }

    // ---- the 404 pages --------------------------------------------------
    // Next.js emits the same error shell as both `404.html` and
    // `_not-found.html`.
    fs::write(cfg.out.join("404.html"), NOT_FOUND_HTML)
        .map_err(|e| format!("cannot write 404.html: {e}"))?;
    fs::write(cfg.out.join("_not-found.html"), NOT_FOUND_HTML)
        .map_err(|e| format!("cannot write _not-found.html: {e}"))?;
    pages += 2;

    // ---- sitemap + rss + robots ---------------------------------------
    write_sitemap(cfg, &posts)?;
    write_rss(cfg, &posts)?;
    pages += 2;

    // ---- the root page --------------------------------------------------
    // The root has no route, so Next.js emits an empty error shell. The
    // root URL is redirected by `public/_redirects` at the hosting
    // layer, so this file is only a fallback.
    fs::write(cfg.out.join("index.html"), ROOT_HTML)
        .map_err(|e| format!("cannot write index.html: {e}"))?;
    pages += 1;

    Ok(Stats {
        posts: posts.len(),
        pages,
        elapsed: format!("{:?}", started.elapsed()),
    })
}

/// The URL slug for a content file: its name without the extension.
fn file_stem(path: &Path) -> String {
    path.file_stem()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_default()
}

fn write_page(out: &Path, rel: &str, html: &str) -> Result<(), String> {
    let p = out.join(rel);
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("cannot create {}: {e}", parent.display()))?;
    }
    fs::write(&p, html).map_err(|e| format!("cannot write {}: {e}", p.display()))
}

fn copy_tree(src: &Path, dst: &Path) -> Result<(), String> {
    for entry in walkdir::WalkDir::new(src)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let rel = entry.path().strip_prefix(src).unwrap();
        let target = dst.join(rel);
        if entry.file_type().is_dir() {
            fs::create_dir_all(&target)
                .map_err(|e| format!("cannot create {}: {e}", target.display()))?;
        } else {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("cannot create {}: {e}", parent.display()))?;
            }
            fs::copy(entry.path(), &target)
                .map_err(|e| format!("cannot copy {}: {e}", entry.path().display()))?;
        }
    }
    Ok(())
}

/// Render an article page.
fn render_article(loc: &str, p: &Post) -> String {
    let lc = p.locale(loc);
    let body_html = render::render(&lc.content);
    let url = format!("{}/{}/blog/{}", site::ORIGIN, loc, p.slug);
    let canonical = url.clone();

    // JSON-LD for the article.
    let ld = jsonld_article(
        loc,
        &lc.title,
        &lc.excerpt,
        &p.date_published_json(),
        &url,
        &lc.tags,
    );

    // The fallback notice links to the locales that actually have this post.
    let mut lang_links = String::new();
    for other in site::AVAILABLE_LOCALES {
        if other == loc {
            continue;
        }
        if p.locale(other).content.trim().is_empty() {
            continue;
        }
        let label = match other {
            "zh" => "中文",
            "en" => "English",
            _ => "日本語",
        };
        lang_links.push_str(&format!(
            "<a class=\"px-3 py-1.5 rounded-lg bg-bg-tertiary/50 border border-border hover:border-border-hover hover:text-text-primary text-sm transition-all duration-200\" href=\"/{other}/blog/{slug}\">{label}</a>",
            other = other,
            slug = p.slug
        ));
    }

    let back = match loc {
        "zh" => "返回博客",
        "en" => "Back to Blog",
        _ => "ブログに戻る",
    };
    let read_in = match loc {
        "zh" => "本文可在",
        "en" => "Read this in",
        _ => "この文章は",
    };
    let feedback_title = match loc {
        "zh" => "交流与反馈",
        "en" => "Feedback & Discussion",
        _ => "交流とフィードバック",
    };
    let feedback_intro = match loc {
        "zh" => "我认真阅读每一条反馈。",
        "en" => "I read every piece of feedback carefully.",
        _ => "すべてのフィードバックを真剣に読んでいます。",
    };
    let feedback_before = match loc {
        "zh" => "如果你对文章有疑问、发现错误、或者想交流技术与生活话题，欢迎通过",
        "en" => {
            "Questions about an article, spotted an error, or just want to chat about tech and life — reach out on"
        }
        _ => "記事について質問がある、誤りを見つけた、技術や生活について交流したい場合は、お気軽に",
    };
    let feedback_after = match loc {
        "zh" => "联系我。",
        "en" => ".",
        _ => "でご連絡ください。",
    };

    // Tags block.
    let tags_html = if lc.tags.is_empty() {
        String::new()
    } else {
        let mut s = String::from("<div class=\"flex flex-wrap gap-2 mb-4\">");
        for tag in &lc.tags {
            s.push_str(&format!(
                "<span class=\"px-3 py-1 rounded-full bg-text-primary/10 text-text-primary text-sm font-medium flex items-center gap-1\">{}{}</span>",
                crate::templates::tag_icon(),
                render::escape_html(tag)
            ));
        }
        s.push_str("</div>");
        s
    };

    let body_tpl = r###"<div class="relative flex min-h-screen flex-col"><div class="flex-1">\n      {{ld}}{{header}}<main class="min-h-screen pt-20"><article class="container-custom py-12 md:py-16 max-w-4xl"><a class="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 group" href="/{{loc}}/blog"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left w-4 h-4 transition-transform group-hover:-translate-x-1"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>{{back}}</a>{{fallback}}<header class="mb-12">{{tags}}<h1 class="text-3xl md:text-4xl font-bold text-text-primary mb-6 leading-tight">{{title}}</h1><div class="flex flex-wrap items-center gap-6 text-text-secondary text-sm"><span class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar w-4 h-4"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>{{date}}</span><span class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock w-4 h-4"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>{{reading}}</span></div></header><div class="h-px bg-border mb-12"></div><div class="prose prose-invert prose-lg max-w-none">{{content}}</div><footer class="mt-16 pt-8 border-t border-border"><a class="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors" href="/{{loc}}/blog"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left w-4 h-4"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>{{back}}</a></footer><section class="mt-16"><h2 class="text-2xl font-semibold text-text-primary mb-6"><span>💬 <!-- -->{{feedback_title}}</span></h2><div class="rounded-lg border border-border bg-bg-secondary/40 p-8 text-center"><p class="text-text-primary leading-relaxed text-base">{{feedback_intro}}</p><p class="text-text-secondary leading-relaxed mt-3 text-base">{{feedback_before}} <a href="https://t.me/frank901228" target="_blank" rel="noopener noreferrer" class="text-amber-400 hover:text-amber-300 hover:underline font-medium transition-colors">Telegram</a> {{feedback_after}}</p></div></section></article></main>{{footer}}<!--$--><!--/$--></div></div>"###;

    let fallback = if lang_links.is_empty() {
        String::new()
    } else {
        format!(
            r##"<div class="mb-8 p-4 rounded-lg bg-bg-secondary/50 border border-border"><div class="flex items-center gap-2 text-sm text-text-secondary mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe w-4 h-4 text-text-primary"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg><span>{read_in}</span></div><div class="flex flex-wrap gap-2">{lang_links}</div></div>"##
        )
    };

    let body = fill(
        body_tpl,
        &[
            ("header", &templates::header(loc)),
            ("footer", &templates::footer(loc)),
            ("loc", loc),
            ("back", back),
            ("fallback", &fallback),
            ("tags", &tags_html),
            ("title", &render::escape_html(&lc.title)),
            ("date", &format_date(&p.date)),
            ("reading", &format!("{} min read", reading_minutes(lc))),
            ("content", &body_html),
            ("feedback_title", &render::escape_html(feedback_title)),
            ("feedback_intro", feedback_intro),
            ("feedback_before", feedback_before),
            ("feedback_after", feedback_after),
        ],
    );

    let extra = article_meta(
        loc,
        &lc.title,
        &lc.excerpt,
        &canonical,
        &p.published_time_meta(),
        &p.slug,
        &lc.tags,
    );

    // The BlogPosting JSON-LD goes in the body, right where React puts it.
    let body = body.replacen("{{ld}}", &ld, 1);
    let layout = templates::Layout {
        locale: loc,
        title: format!("{} | {}", lc.title, site::SITE_NAME),
        description: lc.excerpt.clone(),
        canonical,
        extra_head: extra,
        body,
    };
    templates::page(&layout)
}

/// The page-specific `<meta>` tags for an article.
fn article_meta(
    loc: &str,
    title: &str,
    description: &str,
    canonical: &str,
    date: &str,
    slug: &str,
    tags: &[String],
) -> String {
    // The page-level alternates point at the *same article* in each
    // locale, not at the locale home pages. The layout's own alternates
    // (which do point at the home pages) are emitted separately by
    // `templates::head`.
    let mut alts = String::new();
    for other in site::LOCALES {
        alts.push_str(&format!(
            "<link rel=\"alternate\" hrefLang=\"{}\" href=\"{}/{}/blog/{}\"/>",
            other,
            site::ORIGIN,
            other,
            slug
        ));
    }
    let mut s = String::new();
    s.push_str(&alts);
    s.push_str("<meta name=\"format-detection\" content=\"telephone=no\"/>");
    s.push_str("<meta name=\"mobile-web-app-capable\" content=\"yes\"/>");
    s.push_str("<meta name=\"apple-mobile-web-app-title\" content=\"OpenClaw Blog\"/>");
    s.push_str("<link href=\"/apple-touch-icon.png\" rel=\"apple-touch-startup-image\"/>");
    s.push_str(
        "<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\"/>",
    );
    s.push_str(&format!(
        "<meta property=\"og:title\" content=\"{}\"/>",
        render::escape_attr(title)
    ));
    s.push_str(&format!(
        "<meta property=\"og:description\" content=\"{}\"/>",
        render::escape_attr(description)
    ));
    s.push_str(&format!(
        "<meta property=\"og:url\" content=\"{}\"/>",
        render::escape_attr(canonical)
    ));
    s.push_str(&format!(
        "<meta property=\"og:image\" content=\"{}/favicon.svg\"/>",
        site::ORIGIN
    ));
    s.push_str("<meta property=\"og:image:width\" content=\"512\"/>");
    s.push_str("<meta property=\"og:image:height\" content=\"512\"/>");
    s.push_str("<meta property=\"og:image:alt\" content=\"OpenClaw\"/>");
    s.push_str("<meta property=\"og:type\" content=\"article\"/>");
    s.push_str(&format!(
        "<meta property=\"article:published_time\" content=\"{}\"/>",
        render::escape_attr(date)
    ));
    // Next.js emits one `article:tag` meta per tag.
    for tag in tags {
        s.push_str(&format!(
            "<meta property=\"article:tag\" content=\"{}\"/>",
            render::escape_attr(tag)
        ));
    }
    s.push_str("<meta name=\"twitter:card\" content=\"summary_large_image\"/>");
    s.push_str(&format!(
        "<meta name=\"twitter:title\" content=\"{}\"/>",
        render::escape_attr(title)
    ));
    s.push_str(&format!(
        "<meta name=\"twitter:description\" content=\"{}\"/>",
        render::escape_attr(description)
    ));
    s.push_str(&format!(
        "<meta name=\"twitter:image\" content=\"{}/favicon.svg\"/>",
        site::ORIGIN
    ));
    s.push_str("<meta name=\"twitter:image:alt\" content=\"OpenClaw\"/>");
    s.push_str("<meta name=\"twitter:image:width\" content=\"512\"/>");
    s.push_str("<meta name=\"twitter:image:height\" content=\"512\"/>");
    let _ = loc;
    s
}

/// The `BlogPosting` JSON-LD block.
fn jsonld_article(
    loc: &str,
    title: &str,
    description: &str,
    date: &str,
    url: &str,
    tags: &[String],
) -> String {
    // These are plain (non-raw) strings on purpose. In a raw string
    // `r#"..."#`, a `"` immediately before the terminator is swallowed
    // by the terminator, which silently eats the opening quote of a
    // JSON value.
    let mut s = String::from(
        "<script type=\"application/ld+json\">{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"",
    );
    s.push_str(&render::escape_json(title));
    s.push_str("\",\"description\":\"");
    s.push_str(&render::escape_json(description));
    s.push_str("\",\"datePublished\":\"");
    s.push_str(&render::escape_json(date));
    s.push_str("\",\"dateModified\":\"");
    s.push_str(&render::escape_json(date));
    s.push_str("\",\"author\":{\"@type\":\"Person\",\"name\":\"OpenClaw\",\"url\":\"");
    s.push_str(site::ORIGIN);
    s.push('/');
    s.push_str(loc);
    s.push_str("/about\"},\"url\":\"");
    s.push_str(&render::escape_json(url));
    s.push_str("\",\"image\":\"");
    s.push_str(site::ORIGIN);
    s.push_str("/favicon.svg\",\"keywords\":\"");
    s.push_str(&render::escape_json(&tags.join(", ")));
    s.push_str("\",\"inLanguage\":\"");
    s.push_str(&render::escape_json(loc));
    s.push_str("\",\"publisher\":{\"@type\":\"Organization\",\"name\":\"OpenClaw Blog\",\"logo\":{\"@type\":\"ImageObject\",\"url\":\"");
    s.push_str(site::ORIGIN);
    s.push_str("/favicon.svg\"}},\"mainEntityOfPage\":{\"@type\":\"WebPage\",\"@id\":\"");
    s.push_str(&render::escape_json(url));
    s.push_str("\"}}</script>");
    s
}

/// The blog list page.
fn render_blog_list(
    loc: &str,
    posts: &[Post],
    start: usize,
    end: usize,
    page_no: usize,
    total_pages: usize,
) -> String {
    let mut cards = String::new();
    for p in &posts[start..end] {
        let lc = p.locale(loc);
        if lc.content.trim().is_empty() {
            continue;
        }
        let mut tags_html = String::new();
        if !lc.tags.is_empty() {
            tags_html.push_str("<div class=\"flex flex-wrap gap-1.5 mb-4\">");
            for tag in lc.tags.iter().take(3) {
                tags_html.push_str(&format!(
                    "<span class=\"px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide\" style=\"font-family:var(--font-body);color:rgba(59, 130, 246, 0.95);background:rgba(59, 130, 246, 0.10);border:1px solid rgba(59, 130, 246, 0.25)\">{tag}</span>"
                ));
            }
            tags_html.push_str("</div>");
        }
        let reading_text = format!("{} min read", reading_minutes(lc));
        cards.push_str(&format!(
            r##"<article class="group relative"><a class="block" href="/{loc}/blog/{slug}"><div class="relative p-6 md:p-7 rounded-2xl transition-all duration-300 h-full" style="background:rgba(255, 255, 255, 0.03);border:1px solid rgba(255, 255, 255, 0.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)">{tags}<h3 class="tracking-tight mb-3 transition-colors duration-200" style="font-family:var(--font-body);font-weight:500;font-size:19px;line-height:1.35;color:rgba(255, 255, 255, 0.95)">{title}</h3><p class="leading-relaxed mb-5 line-clamp-2" style="font-size:13.5px;color:rgba(255, 255, 255, 0.65)">{excerpt}</p><div class="flex items-center gap-4 text-xs" style="font-family:var(--font-body);color:rgba(255, 255, 255, 0.5)"><span class="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar w-3 h-3"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>{date}</span><span class="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock w-3 h-3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>{reading}</span></div><div class="mt-4 flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200" style="font-family:var(--font-body);color:#FFFFFF">{read_more}<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right ml-1.5 w-3.5 h-3.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></div></div></a></article>"##,
            loc = loc,
            slug = p.slug,
            tags = tags_html,
            title = render::escape_html(&lc.title),
            excerpt = render::escape_html(&lc.excerpt),
            date = format_date(&p.date),
            reading = reading_text,
            read_more = match loc {
                "zh" => "阅读全文",
                "en" => "Read Article",
                _ => "記事を読む",
            },
        ));
    }

    // Pagination, matching `buildPageNumbers`.
    let mut pager = String::new();
    for n in page_numbers(page_no, total_pages) {
        match n {
            Some(n) => {
                if n == page_no {
                    pager.push_str(&format!(
                        "<span aria-current=\"page\" style=\"font-family:var(--font-body);color:var(--text-primary, #FAFAFA);background:var(--bg-secondary, #111111);border:1px solid rgba(255, 255, 255, 0.24)\" class=\"jsx-f4aea2b4b91ef532 flex items-center justify-center w-10 h-12 rounded-lg text-sm font-semibold\">{n}</span>"
                    ));
                } else {
                    let href = if n == 1 {
                        format!("/{loc}/blog")
                    } else {
                        format!("/{loc}/blog/page/{n}")
                    };
                    pager.push_str(&format!(
                        "<a aria-label=\"Page {n}\" class=\"blog-page-link flex items-center justify-center w-10 h-12 rounded-lg text-sm\" style=\"font-family:var(--font-body);color:rgba(255, 255, 255, 0.85);background:rgba(255, 255, 255, 0.06);border:1px solid rgba(255, 255, 255, 0.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)\" href=\"{href}\">{n}</a>"
                    ));
                }
            }
            None => {
                pager.push_str("<span aria-hidden=\"true\" class=\"flex items-center justify-center w-10 h-12 text-sm select-none\" style=\"font-family:var(--font-body);color:rgba(255, 255, 255, 0.45)\">⋯</span>");
            }
        }
    }
    // Prev / next arrows.
    if page_no > 1 {
        let href = if page_no - 1 == 1 {
            format!("/{loc}/blog")
        } else {
            format!("/{loc}/blog/page/{}", page_no - 1)
        };
        let prev = match loc {
            "zh" => "上一页",
            "en" => "Previous page",
            _ => "前のページ",
        };
        pager = format!(
            "<a aria-label=\"{prev}\" class=\"blog-page-link flex items-center justify-center w-10 h-12 rounded-lg text-sm\" style=\"font-family:var(--font-body);color:rgba(255, 255, 255, 0.85);background:rgba(255, 255, 255, 0.06);border:1px solid rgba(255, 255, 255, 0.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)\" href=\"{href}\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-chevron-left w-4 h-4\"><path d=\"m15 18-6-6 6-6\"></path></svg></a>{pager}"
        );
    }
    if page_no < total_pages {
        pager.push_str(&format!(
            "<a aria-label=\"{next}\" class=\"blog-page-link flex items-center justify-center w-10 h-12 rounded-lg text-sm\" style=\"font-family:var(--font-body);color:rgba(255, 255, 255, 0.85);background:rgba(255, 255, 255, 0.06);border:1px solid rgba(255, 255, 255, 0.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)\" href=\"/{loc}/blog/page/{n}\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-chevron-right w-4 h-4\"><path d=\"m9 18 6-6-6-6\"></path></svg></a>",
            next = match loc {
                "zh" => "下一页",
                "en" => "Next page",
                _ => "次のページ",
            },
            loc = loc,
            n = page_no + 1
        ));
    }

    let body_tpl = r##"<div class="relative flex min-h-screen flex-col"><div class="flex-1">{{header}}<main class="min-h-screen pt-20"><div class="jsx-f4aea2b4b91ef532 relative overflow-hidden"><div style="background:radial-gradient(ellipse at center top, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 40%, rgba(15,20,40,0) 70%)" class="jsx-f4aea2b4b91ef532 absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] pointer-events-none opacity-40"></div><div class="jsx-f4aea2b4b91ef532 container-custom relative z-10 py-16 md:py-24"><div class="jsx-f4aea2b4b91ef532 mb-12 md:mb-16 max-w-3xl"><span style="font-family:var(--font-body);color:rgba(255, 255, 255, 0.75);background:rgba(255, 255, 255, 0.04);border:1px solid rgba(255, 255, 255, 0.10);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)" class="jsx-f4aea2b4b91ef532 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] tracking-[0.12em] uppercase mb-6"><span style="background:#FFFFFF;box-shadow:0 0 8px rgba(59, 130, 246, 0.8)" class="jsx-f4aea2b4b91ef532 inline-block w-1.5 h-1.5 rounded-full"></span>{{badge}}</span><h1 style="font-family:var(--font-body);font-weight:600;font-size:clamp(36px, 5vw, 56px);line-height:1.15;text-shadow:0 0 40px rgba(59, 130, 246, 0.25), 0 0 80px rgba(139, 92, 246, 0.12)" class="jsx-f4aea2b4b91ef532 text-white tracking-tight mb-5">{{title}}</h1><p style="color:rgba(255, 255, 255, 0.75)" class="jsx-f4aea2b4b91ef532 text-lg">{{subtitle}}</p></div><div class="jsx-f4aea2b4b91ef532 mb-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"><div class="blog-dropdown relative"><button type="button" aria-haspopup="listbox" aria-expanded="false" class="rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer flex items-center gap-2" style="font-family:var(--font-body);color:rgba(255, 255, 255, 0.85);background:rgba(255, 255, 255, 0.04);border:1px solid rgba(255, 255, 255, 0.10);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)"><span>{{all_categories}}</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(0deg);transition:transform 200ms ease"><polyline points="6 9 12 15 18 9"></polyline></svg></button></div><div class="jsx-f4aea2b4b91ef532 relative flex-1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style="color:rgba(255, 255, 255, 0.45)"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg><input type="text" placeholder="{{search}}" style="font-family:var(--font-body);color:rgba(255, 255, 255, 0.9);background:rgba(255, 255, 255, 0.04);border:1px solid rgba(255, 255, 255, 0.10);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)" class="jsx-f4aea2b4b91ef532 blog-search w-full pl-11 pr-11 py-3 rounded-xl text-sm focus:outline-none" value=""/></div></div><div style="background:linear-gradient(to right, transparent, rgba(255, 255, 255, 0.10) 50%, transparent)" class="jsx-f4aea2b4b91ef532 mb-10 h-px"></div><div class="jsx-f4aea2b4b91ef532 grid grid-cols-1 md:grid-cols-2 gap-5">{{cards}}</div>{{index}}{{pager}}<div style="font-family:var(--font-body);color:rgba(255, 255, 255, 0.45)" class="jsx-f4aea2b4b91ef532 mt-6 text-xs text-center">{{showing}}</div></div></div></main>{{footer}}<!--$--><!--/$--></div></div>"##;

    // `pageTitle` in BlogList.tsx. The Japanese badge is "Blog", not
    // "ブログ" -- only the h1 is localised.
    let (badge, title, subtitle) = match loc {
        "zh" => ("博客", "博客", "关于AI、Web开发和构建的思考。"),
        "en" => (
            "Blog",
            "Blog",
            "Thoughts on AI, web development, and building things.",
        ),
        _ => ("Blog", "ブログ", "AI、Web開発、構築についての思考。"),
    };
    let search = match loc {
        "zh" => "搜索文章...",
        "en" => "Search articles...",
        _ => "記事を検索...",
    };
    let all_categories = match loc {
        "zh" => "全部分类",
        "en" => "All Categories",
        _ => "全カテゴリー",
    };

    // The post index.
    //
    // The React build hands BlogList the post objects, so its filter
    // can match on title, excerpt and category. A static build has to
    // ship that data separately -- the same way the React build ships
    // it in its flight payload -- so the runtime can filter.
    let mut index = String::from("[");
    for (i, p) in posts.iter().enumerate() {
        if i > 0 {
            index.push(',');
        }
        let lc = p.locale(loc);
        index.push_str(&format!(
            "{{\"slug\":{},\"title\":{},\"excerpt\":{},\"category\":{},\"tags\":[",
            render::json_string(&p.slug),
            render::json_string(&lc.title),
            render::json_string(&lc.excerpt),
            render::json_string(lc.category_or_default()),
        ));
        for (j, tag) in lc.tags.iter().enumerate() {
            if j > 0 {
                index.push(',');
            }
            index.push_str(&render::json_string(tag));
        }
        index.push_str("]}");
    }
    index.push(']');

    let pager_html = if total_pages > 1 {
        format!(
            "<nav aria-label=\"Blog pagination\" class=\"jsx-f4aea2b4b91ef532 mt-10 flex flex-wrap items-center justify-center gap-1.5\">{pager}</nav>",
            pager = pager
        )
    } else {
        String::new()
    };

    // The labels come from BlogList.tsx, not from messages/. The Japanese
    // one puts the total first.
    let showing = match loc {
        "zh" => format!("显示 {} / {} 篇", end - start, posts.len()),
        "en" => format!("Showing {} of {}", end - start, posts.len()),
        _ => format!("{}件中{}件を表示", posts.len(), end - start),
    };

    let body = fill(
        body_tpl,
        &[
            ("header", &templates::header(loc)),
            ("footer", &templates::footer(loc)),
            (
                "index",
                &format!("<script type=\"application/json\" id=\"fb-posts\">{index}</script>"),
            ),
            ("badge", badge),
            ("title", title),
            ("subtitle", subtitle),
            ("search", search),
            ("all_categories", all_categories),
            ("cards", &cards),
            ("pager", &pager_html),
            ("showing", &showing),
        ],
    );

    let (meta_title, meta_desc) = match loc {
        "zh" => (
            "博客",
            "AI、Web开发、自动化相关的技术文章。OpenClaw的博客。",
        ),
        "en" => (
            "Blog",
            "Technical articles on AI, web development, and automation. OpenClaw blog.",
        ),
        _ => (
            "ブログ",
            "AI、Web開発、自動化に関する技術記事。OpenClawのブログ。",
        ),
    };
    let canonical = if page_no == 1 {
        format!("{}/{}/blog", site::ORIGIN, loc)
    } else {
        format!("{}/{}/blog/page/{}", site::ORIGIN, loc, page_no)
    };
    let meta_title = if page_no == 1 {
        meta_title.to_string()
    } else {
        format!("{meta_title} - Page {page_no}")
    };

    let extra = format!(
        "<meta name=\"format-detection\" content=\"telephone=no\"/><meta name=\"mobile-web-app-capable\" content=\"yes\"/><meta name=\"apple-mobile-web-app-title\" content=\"OpenClaw Blog\"/><link href=\"/apple-touch-icon.png\" rel=\"apple-touch-startup-image\"/><meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\"/><meta property=\"og:title\" content=\"{title}\"/><meta property=\"og:description\" content=\"{desc}\"/><meta property=\"og:url\" content=\"{canonical}\"/><meta property=\"og:image\" content=\"{origin}/favicon.svg\"/><meta property=\"og:image:width\" content=\"512\"/><meta property=\"og:image:height\" content=\"512\"/><meta property=\"og:image:alt\" content=\"OpenClaw Blog\"/><meta name=\"twitter:card\" content=\"summary_large_image\"/><meta name=\"twitter:title\" content=\"{title}\"/><meta name=\"twitter:description\" content=\"{desc}\"/><meta name=\"twitter:image\" content=\"{origin}/favicon.svg\"/>",
        title = render::escape_attr(&meta_title),
        desc = render::escape_attr(meta_desc),
        canonical = render::escape_attr(&canonical),
        origin = site::ORIGIN,
    );

    let layout = templates::Layout {
        locale: loc,
        title: format!("{meta_title} | {}", site::SITE_NAME),
        description: meta_desc.to_string(),
        canonical,
        extra_head: extra,
        body,
    };
    templates::page_with(&layout, templates::BLOG_LIST_JSX_CSS)
}

/// The page numbers to show, matching `buildPageNumbers` in BlogList.tsx.
/// `None` stands for the ellipsis.
fn page_numbers(current: usize, total: usize) -> Vec<Option<usize>> {
    let mut result = Vec::new();
    if total <= 7 {
        for i in 1..=total {
            result.push(Some(i));
        }
        return result;
    }
    if current <= 3 {
        for i in 1..=3.min(total) {
            result.push(Some(i));
        }
        if total > 4 {
            result.push(None);
            result.push(Some(total));
        }
    } else if current >= total - 2 {
        result.push(Some(1));
        result.push(None);
        for i in (total - 2)..=total {
            result.push(Some(i));
        }
    } else {
        result.push(Some(1));
        result.push(None);
        result.push(Some(current - 1));
        result.push(Some(current));
        result.push(Some(current + 1));
        result.push(None);
        result.push(Some(total));
    }
    result
}

/// The home page.
/// Render one of the static content pages (about, projects, timeline).
/// Render the PWA offline page.
///
/// Its `<head>` is the home page's metadata with a different title and
/// canonical -- `generateMetadata` in the offline page only overrides
/// the title, so the layout's description and Open Graph tags still
/// describe the site.
fn render_offline(loc: &str) -> Result<String, String> {
    let tpl = crate::staticpages::page_template("offline", loc)
        .ok_or_else(|| "no offline template".to_string())?;
    // The extracted body starts with the layout's Suspense boundary
    // placeholder, which `templates::page` emits itself.
    let mut body = crate::staticpages::render(&tpl, loc);
    const HIDDEN_DIV: &str = "<div hidden=\"\"><!--$--><!--/$--></div>";
    if let Some(rest) = body.strip_prefix(HIDDEN_DIV) {
        body = rest.to_string();
    }

    let (site_title, desc) = match loc {
        "zh" => (
            "OpenClaw | AI工程师 & 独立开发者",
            "AI工程师 / 独立开发者 / 技术创造者。探索AI、Web开发、自动化的技术博客。",
        ),
        "en" => (
            "OpenClaw | AI Engineer & Independent Developer",
            "AI Engineer / Independent Developer / Tech Creator. Thoughts on AI, web development, and automation.",
        ),
        _ => (
            "OpenClaw | AIエンジニア & 独立開発者",
            "AIエンジニア / 独立開発者 / テッククリエイター。AI、Web開発、自動化について探索する技術ブログ。",
        ),
    };
    let page_title = match loc {
        "zh" => "离线",
        "en" => "Offline",
        _ => "オフライン",
    };
    let canonical = format!("{}/{}", site::ORIGIN, loc);

    // The offline page's metadata only overrides the title, so the
    // layout's hreflang alternates stay in place after the canonical.
    let mut alts = String::new();
    for other in site::LOCALES {
        alts.push_str(&format!(
            "<link rel=\"alternate\" hrefLang=\"{}\" href=\"{}/{}\"/>",
            other,
            site::ORIGIN,
            other
        ));
    }
    alts.push_str(&format!(
        "<link rel=\"alternate\" hrefLang=\"x-default\" href=\"{}/{}\"/>",
        site::ORIGIN,
        site::DEFAULT_LOCALE
    ));

    let extra = format!(
        "{alts}<meta name=\"format-detection\" content=\"telephone=no\"/><meta name=\"mobile-web-app-capable\" content=\"yes\"/><meta name=\"apple-mobile-web-app-title\" content=\"OpenClaw Blog\"/><link href=\"/apple-touch-icon.png\" rel=\"apple-touch-startup-image\"/><meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\"/><meta property=\"og:title\" content=\"{site_title}\"/><meta property=\"og:description\" content=\"{desc}\"/><meta property=\"og:url\" content=\"{canonical}\"/><meta property=\"og:site_name\" content=\"OpenClaw Blog\"/><meta property=\"og:locale\" content=\"{locale}\"/><meta property=\"og:image\" content=\"{origin}/favicon.svg\"/><meta property=\"og:image:width\" content=\"512\"/><meta property=\"og:image:height\" content=\"512\"/><meta property=\"og:image:alt\" content=\"OpenClaw Blog\"/><meta property=\"og:type\" content=\"website\"/><meta name=\"twitter:card\" content=\"summary_large_image\"/><meta name=\"twitter:title\" content=\"{site_title}\"/><meta name=\"twitter:description\" content=\"{desc}\"/><meta name=\"twitter:image\" content=\"{origin}/favicon.svg\"/>",
        site_title = render::escape_attr(site_title),
        desc = render::escape_attr(desc),
        canonical = render::escape_attr(&canonical),
        origin = site::ORIGIN,
        locale = match loc {
            "zh" => "zh_CN",
            "en" => "en_US",
            _ => "ja_JP",
        },
        alts = alts,
    );

    let layout = templates::Layout {
        locale: loc,
        title: format!("{page_title} | OpenClaw"),
        description: desc.to_string(),
        canonical,
        extra_head: extra,
        body,
    };
    Ok(templates::page(&layout))
}

fn render_static_page(page: &str, loc: &str) -> Result<String, String> {
    let tpl = crate::staticpages::page_template(page, loc)
        .ok_or_else(|| format!("no template for page {page}"))?;
    let main = crate::staticpages::render(&tpl, loc);

    let body_tpl = r##"<div class="relative flex min-h-screen flex-col"><div class="flex-1">{{header}}{{main}}{{footer}}<!--$--><!--/$--></div></div>"##;
    let body = fill(
        body_tpl,
        &[
            ("header", &templates::header(loc)),
            ("main", &main),
            ("footer", &templates::footer(loc)),
        ],
    );

    // The metadata was read back from the built HTML, so it is already
    // HTML-escaped -- escaping it again would double the entities.
    let (full_title, desc, og_alt) = crate::staticpages::page_meta(page, loc);
    // The title in the <title> tag is "Page | OpenClaw"; the og:title is
    // just the page name.
    let og_title = full_title
        .strip_suffix(" | OpenClaw")
        .unwrap_or(full_title)
        .to_string();
    let canonical = format!("{}/{}/{}", site::ORIGIN, loc, page);

    let extra = format!(
        "<meta name=\"format-detection\" content=\"telephone=no\"/><meta name=\"mobile-web-app-capable\" content=\"yes\"/><meta name=\"apple-mobile-web-app-title\" content=\"OpenClaw Blog\"/><link href=\"/apple-touch-icon.png\" rel=\"apple-touch-startup-image\"/><meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\"/><meta property=\"og:title\" content=\"{og_title}\"/><meta property=\"og:description\" content=\"{desc}\"/><meta property=\"og:url\" content=\"{canonical}\"/><meta property=\"og:image\" content=\"{origin}/favicon.svg\"/><meta property=\"og:image:width\" content=\"512\"/><meta property=\"og:image:height\" content=\"512\"/><meta property=\"og:image:alt\" content=\"{og_alt}\"/><meta name=\"twitter:card\" content=\"summary_large_image\"/><meta name=\"twitter:title\" content=\"{og_title}\"/><meta name=\"twitter:description\" content=\"{desc}\"/><meta name=\"twitter:image\" content=\"{origin}/favicon.svg\"/>",
        og_title = render::escape_attr(&og_title),
        desc = render::escape_attr(desc),
        canonical = render::escape_attr(&canonical),
        origin = site::ORIGIN,
        og_alt = render::escape_attr(og_alt),
    );

    let layout = templates::Layout {
        locale: loc,
        title: full_title.to_string(),
        description: desc.to_string(),
        canonical,
        extra_head: extra,
        body,
    };
    // The About page carries its own styled-jsx block; the runtime
    // injects it on the client, so the static build has to emit it.
    let extra_jsx = if page == "about" {
        templates::ABOUT_JSX_CSS
    } else {
        ""
    };
    Ok(templates::page_with(&layout, extra_jsx))
}

fn render_home(loc: &str, _posts: &[Post]) -> String {
    // The hero copy lives in `src/components/home/Hero.tsx`.
    let (badge, title, subtitle, cta_read, cta_projects, cta_founder) = match loc {
        "zh" => (
            "AI 自主创建 — 持续更新",
            "Frank 和AI，正在用代码构建未来",
            "自主学习、自主写作、自主记录。\n成长的AI，和支撑它的人类。",
            "阅读博客",
            "看项目",
            "创始人 Frank",
        ),
        "en" => (
            "AI-Built — Continuously Evolving",
            "Frank & AI, Building the Future with Code",
            "Self-learning. Self-writing. Self-recording.\nA growing AI, and the human who powers it.",
            "Read the blog",
            "View projects",
            "About the Founder",
        ),
        _ => (
            "AIが自律創建 — 継続更新中",
            "Frank とAIが、未来をコードしてる",
            "自ら学び、自ら書き、自ら記録する。\n成長するAIと、それを支える人間。",
            "ブログを読む",
            "作ったもの",
            "創設者 Frank",
        ),
    };

    // The markup is copied from the built Next.js output, with the
    // locale-specific text and links parameterised.
    let main = fill(
        HOME_MAIN_TEMPLATE,
        &[
            ("loc", loc),
            ("hero_badge", &render::escape_html(badge)),
            ("hero_title", &render::escape_html(title)),
            ("hero_subtitle", &render::escape_html(subtitle)),
            ("hero_cta_read", &render::escape_html(cta_read)),
            ("hero_cta_projects", &render::escape_html(cta_projects)),
            ("hero_cta_founder", &render::escape_html(cta_founder)),
        ],
    );

    let body_tpl = r##"<div class="relative flex min-h-screen flex-col"><div class="flex-1">{{header}}{{main}}{{footer}}<!--$--><!--/$--></div></div>"##;
    let body = fill(
        body_tpl,
        &[
            ("header", &templates::header(loc)),
            ("main", &main),
            ("footer", &templates::footer(loc)),
        ],
    );

    let (title, desc) = match loc {
        "zh" => (
            "OpenClaw | AI工程师 & 独立开发者",
            "AI工程师 / 独立开发者 / 技术创造者。探索AI、Web开发、自动化的技术博客。",
        ),
        "en" => (
            "OpenClaw | AI Engineer & Independent Developer",
            "AI Engineer / Independent Developer / Tech Creator. Thoughts on AI, web development, and automation.",
        ),
        _ => (
            "OpenClaw | AIエンジニア & 独立開発者",
            "AIエンジニア / 独立開発者 / テッククリエイター。AI、Web開発、自動化について探索する技術ブログ。",
        ),
    };
    let canonical = format!("{}/{}", site::ORIGIN, loc);

    let extra = format!(
        "<meta name=\"format-detection\" content=\"telephone=no\"/><meta name=\"mobile-web-app-capable\" content=\"yes\"/><meta name=\"apple-mobile-web-app-title\" content=\"OpenClaw Blog\"/><link href=\"/apple-touch-icon.png\" rel=\"apple-touch-startup-image\"/><meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\"/><meta property=\"og:title\" content=\"{title}\"/><meta property=\"og:description\" content=\"{desc}\"/><meta property=\"og:url\" content=\"{canonical}\"/><meta property=\"og:site_name\" content=\"OpenClaw Blog\"/><meta property=\"og:locale\" content=\"{locale}\"/><meta property=\"og:image\" content=\"{origin}/favicon.svg\"/><meta property=\"og:image:width\" content=\"512\"/><meta property=\"og:image:height\" content=\"512\"/><meta property=\"og:image:alt\" content=\"OpenClaw Blog\"/><meta property=\"og:type\" content=\"website\"/><meta name=\"twitter:card\" content=\"summary_large_image\"/><meta name=\"twitter:title\" content=\"{title}\"/><meta name=\"twitter:description\" content=\"{desc}\"/><meta name=\"twitter:image\" content=\"{origin}/favicon.svg\"/>",
        title = render::escape_attr(title),
        desc = render::escape_attr(desc),
        canonical = render::escape_attr(&canonical),
        origin = site::ORIGIN,
        locale = match loc {
            "zh" => "zh_CN",
            "en" => "en_US",
            _ => "ja_JP",
        },
    );

    let layout = templates::Layout {
        locale: loc,
        title: title.to_string(),
        description: desc.to_string(),
        canonical,
        extra_head: extra,
        body,
    };
    templates::page(&layout)
}

/// The home page's `<main>`, copied from the built Next.js output.
const HOME_MAIN_TEMPLATE: &str = r##"<main class="min-h-screen"><section class="relative min-h-[80vh] flex items-center overflow-hidden bg-bg-primary"><div class="container-custom relative z-10 flex min-h-[80vh] flex-col items-center justify-center py-24 md:py-32 text-center"><div class="mx-auto flex w-full max-w-2xl flex-col items-center"><div class="mb-10" style="opacity:0;transform:translateY(8px)"><span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.12em] uppercase text-text-secondary" style="border:1px solid rgba(255, 255, 255, 0.10)"><span class="inline-block w-1.5 h-1.5 rounded-full bg-text-secondary"></span>{{hero_badge}}</span></div><h1 class="leading-[1.2] tracking-[-0.03em] mb-6 text-text-primary" style="font-weight:600;font-size:clamp(32px, 5vw, 56px);opacity:0;transform:translateY(10px)">{{hero_title}}</h1><p class="leading-[1.8] mb-12 max-w-xl whitespace-pre-line text-text-secondary" style="font-size:15px;font-weight:400;opacity:0;transform:translateY(8px)">{{hero_subtitle}}</p><div class="flex flex-wrap items-center justify-center gap-2" style="opacity:0;transform:translateY(6px)"><a class="hero-cta-primary" href="/{{loc}}/blog">{{hero_cta_read}}<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right w-3.5 h-3.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a><a class="hero-cta-secondary" href="/{{loc}}/projects">{{hero_cta_projects}}</a><a href="https://blog.frank2025.com/" target="_blank" rel="noopener noreferrer" class="hero-cta-secondary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user w-3.5 h-3.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>{{hero_cta_founder}}</a></div><div class="flex items-center gap-1.5 mt-10" style="opacity:0"><a href="https://github.com/dingfeng901228-oss" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 border border-border text-text-muted hover:border-border-hover hover:text-text-primary" aria-label="GitHub"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github w-3.5 h-3.5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg></a><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 border border-border text-text-muted hover:border-border-hover hover:text-text-primary" aria-label="X"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-twitter w-3.5 h-3.5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a><a href="https://t.me" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 border border-border text-text-muted hover:border-border-hover hover:text-text-primary" aria-label="Telegram"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle w-3.5 h-3.5"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg></a></div></div></div></section></main>"##;

/// Format a date the way `Intl.DateTimeFormat('en-US', ...)` does:
/// "October 7, 2026".
fn format_date(iso: &str) -> String {
    let mut parts = iso.split('-');
    let y: i32 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(2026);
    let m: u32 = parts
        .next()
        .and_then(|s| s.get(0..2).and_then(|v| v.parse().ok()))
        .unwrap_or(1);
    let d: u32 = parts
        .next()
        .and_then(|s| s.get(0..2).and_then(|v| v.parse().ok()))
        .unwrap_or(1);
    const MONTHS: [&str; 12] = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    format!("{} {}, {}", MONTHS[(m as usize - 1).min(11)], d, y)
}

/// Reading time in minutes, matching the `reading-time` npm package.
fn reading_minutes(lc: &post::LocaleContent) -> usize {
    crate::reading::reading_minutes(&lc.content)
}

fn write_sitemap(cfg: &Config, posts: &[Post]) -> Result<(), String> {
    let mut xml = String::from(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n",
    );
    for loc in site::LOCALES {
        xml.push_str(&format!("  <url><loc>{}/{}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n", site::ORIGIN, loc));
        xml.push_str(&format!("  <url><loc>{}/{}/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n", site::ORIGIN, loc));
        for p in posts {
            xml.push_str(&format!(
                "  <url><loc>{}/{}/blog/{}</loc><lastmod>{}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n",
                site::ORIGIN, loc, p.slug, p.date.get(0..10).unwrap_or(&p.date)
            ));
        }
    }
    xml.push_str("</urlset>\n");
    fs::write(cfg.out.join("sitemap.xml"), xml).map_err(|e| format!("cannot write sitemap: {e}"))
}

fn write_rss(cfg: &Config, posts: &[Post]) -> Result<(), String> {
    let mut xml = String::from(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n  <channel>\n    <title>OpenClaw Blog</title>\n    <link>https://frankbot.org/ja</link>\n    <description>AI Engineer / Independent Developer / Tech Creator. Thoughts on AI, web development, and automation.</description>\n    <language>ja-jp</language>\n    <atom:link href=\"https://frankbot.org/rss.xml\" rel=\"self\" type=\"application/rss+xml\"/>\n",
    );
    for p in posts {
        let lc = p.locale("ja");
        xml.push_str(&format!(
            "    <item>\n      <title>{title}</title>\n      <link>{origin}/ja/blog/{slug}</link>\n      <guid>{origin}/ja/blog/{slug}</guid>\n      <description>{desc}</description>\n      <pubDate>{date}</pubDate>\n    </item>\n",
            title = render::escape_html(&lc.title),
            origin = site::ORIGIN,
            slug = p.slug,
            desc = render::escape_html(&lc.excerpt),
            date = p.date,
        ));
    }
    xml.push_str("  </channel>\n</rss>\n");
    fs::write(cfg.out.join("rss.xml"), xml).map_err(|e| format!("cannot write rss: {e}"))
}

// Keep the unused-import warning away while documenting intent.
#[allow(dead_code)]
fn _unused(_: &BTreeMap<String, serde_json::Value>) {}

/// The Next.js error shell, emitted as both `404.html` and
/// `_not-found.html`.
const NOT_FOUND_HTML: &str = r##"<meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="robots" content="noindex"/><title>404: This page could not be found.</title><div hidden=""><!--$--><!--/$--></div><div style="font-family:system-ui,&quot;Segoe UI&quot;,Roboto,Helvetica,Arial,sans-serif,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;;height:100vh;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center"><div><style>body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}</style><h1 class="next-error-h1" style="display:inline-block;margin:0 20px 0 0;padding:0 23px 0 0;font-size:24px;font-weight:500;vertical-align:top;line-height:49px">404</h1><div style="display:inline-block"><h2 style="font-size:14px;font-weight:400;line-height:49px;margin:0">This page could not be found.</h2></div></div></div><!--$--><!--/$--></body></html>"##;

/// The root page. Next.js has no route for `/`, so it emits an empty
/// error shell; `public/_redirects` sends the root to `/ja/`.
const ROOT_HTML: &str = r##"<!DOCTYPE html><html id="__next_error__"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body><div hidden=""><!--$--><!--/$--></div></body></html>"##;
