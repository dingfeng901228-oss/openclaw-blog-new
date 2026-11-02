//! HTML templates for the static site.
//!
//! The markup is a faithful copy of what the Next.js build emits. Where
//! React escapes text for HTML (`'` becomes `&#x27;`, `&` becomes
//! `&amp;`), the copy keeps the escaped form, so the rendered output is
//! byte-identical to production.

use crate::site;

/// Replace `{{key}}` placeholders in `text` with the given values.
pub fn fill(text: &str, pairs: &[(&str, &str)]) -> String {
    let mut out = text.to_string();
    for (k, v) in pairs {
        out = out.replace(&format!("{{{{{k}}}}}"), v);
    }
    out
}

/// Page metadata plus the shared `<head>`.
pub struct Layout<'a> {
    pub locale: &'a str,
    pub title: String,
    pub description: String,
    pub canonical: String,
    /// Page-specific `<meta>`/`<link>` tags (Open Graph, Twitter card,
    /// article metadata, page-level hreflang alternates).
    pub extra_head: String,
    pub body: String,
}

/// The `<head>` for a page.
///
/// The four `rel="alternate"` links at the top come from the layout's
/// own metadata and point at the locale home pages. A page may add its
/// own alternates further down -- exactly as Next.js merges layout and
/// page metadata.
pub fn head(l: &Layout<'_>) -> String {
    let mut alts = String::new();
    for loc in site::LOCALES {
        alts.push_str(&format!(
            "<link rel=\"alternate\" hrefLang=\"{}\" href=\"{}/{}\"/>",
            loc,
            site::ORIGIN,
            loc
        ));
    }
    alts.push_str(&format!(
        "<link rel=\"alternate\" hrefLang=\"x-default\" href=\"{}/{}\"/>",
        site::ORIGIN,
        site::DEFAULT_LOCALE
    ));

    // The stylesheets: three @font-face sheets produced by next/font and
    // the main Tailwind sheet. The order matches the Next.js build.
    let stylesheets = concat!(
        "<link rel=\"stylesheet\" href=\"/_next/static/css/7b736202f0b1dbfd.css\"/>",
        "<link rel=\"stylesheet\" href=\"/_next/static/css/dc96312f8ebc3948.css\"/>",
        "<link rel=\"stylesheet\" href=\"/_next/static/css/774d3b65fbbdfab6.css\"/>",
        "<link rel=\"stylesheet\" href=\"/_next/static/css/site.css\"/>",
    );

    // next/font preloads the three variable font files it uses above the
    // fold, and emits a `next-size-adjust` meta tag for the fallback
    // metrics. The names are content hashes from the Next.js build.
    let font_preloads = concat!(
        "<link rel=\"preload\" href=\"/_next/static/media/b4d22b1bb46a35b5-s.p.woff2\" as=\"font\" crossorigin=\"\" type=\"font/woff2\"/>",
        "<link rel=\"preload\" href=\"/_next/static/media/e4af272ccee01ff0-s.p.woff2\" as=\"font\" crossorigin=\"\" type=\"font/woff2\"/>",
        "<link rel=\"preload\" href=\"/_next/static/media/fea9bcfa8bc9e724-s.p.woff2\" as=\"font\" crossorigin=\"\" type=\"font/woff2\"/>",
    );

    let tpl = r##"<meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>{{font_preloads}}{{stylesheets}}<meta name="next-size-adjust" content=""/>{{alts}}<meta name="theme-color" content="#FFFFFF"/><title>{{title}}</title><meta name="description" content="{{description}}"/><meta name="application-name" content="OpenClaw Blog"/><link rel="manifest" href="/manifest.json"/><meta name="robots" content="index, follow"/><link rel="canonical" href="{{canonical}}"/>{{extra}}<link rel="icon" href="/favicon.svg" type="image/svg+xml"/><link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png"/><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"/><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" type="image/png"/>{{jsonld}}"##;

    fill(
        tpl,
        &[
            ("font_preloads", font_preloads),
            ("stylesheets", stylesheets),
            ("alts", &alts),
            ("title", &crate::render::escape_html(&l.title)),
            ("description", &crate::render::escape_attr(&l.description)),
            ("canonical", &crate::render::escape_attr(&l.canonical)),
            ("extra", &l.extra_head),
            ("jsonld", &website_jsonld(l.locale)),
        ],
    )
}

/// The `WebSite` JSON-LD block the layout emits on every page.
fn website_jsonld(locale: &str) -> String {
    // The description is localised in the Next.js layout.
    let desc = match locale {
        "ja" => {
            "AIエンジニア / 独立開発者 / テッククリエイター。AI、Web開発、自動化について探索する技術ブログ。"
        }
        "zh" => "AI工程师 / 独立开发者 / 技术创造者。探索AI、Web开发、自动化的技术博客。",
        _ => {
            "AI Engineer / Independent Developer / Tech Creator. Thoughts on AI, web development, and automation."
        }
    };
    // A plain string, not a raw string: a `"` directly before a raw
    // string's terminator would be swallowed by it.
    let mut s = String::from(
        "<script type=\"application/ld+json\">{\"@context\":\"https://schema.org\",\"@type\":\"WebSite\",\"name\":\"OpenClaw Blog\",\"url\":\"",
    );
    s.push_str(site::ORIGIN);
    s.push('/');
    s.push_str(locale);
    s.push_str("\",\"description\":\"");
    s.push_str(&crate::render::escape_json(desc));
    s.push_str("\",\"potentialAction\":{\"@type\":\"SearchAction\",\"target\":{\"@type\":\"EntryPoint\",\"urlTemplate\":\"");
    s.push_str(site::ORIGIN);
    s.push('/');
    s.push_str(locale);
    s.push_str("/blog?q={search_term_string}\"},\"query-input\":\"required name=search_term_string\"}}</script>");
    s
}

/// The site header.
///
/// Copied verbatim from the built Next.js output. The locale changes the
/// internal links and which language button is marked as current.
pub fn header(locale: &str) -> String {
    // The separator dot sits between items, so only the last item omits
    // it.
    let langs = [
        ("ja", "JP", false),
        ("zh", "中文", false),
        ("en", "EN", true),
    ];
    let mut pairs: Vec<(String, String)> = Vec::new();
    for (code, label, is_last) in langs {
        let mut btn = if code == locale {
            BTN_ACTIVE.replace("{label}", label)
        } else {
            BTN_PLAIN.replace("{label}", label)
        };
        if !is_last {
            btn.push_str(DOT);
        }
        let group = format!("<span class=\"flex items-center\">{btn}</span>");
        pairs.push((format!("lang_{code}"), group));
    }
    // The nav labels come from messages/{locale}.json.
    let (home, blog, about) = crate::messages::nav_labels(locale);

    let mut all: Vec<(&str, &str)> = vec![
        ("loc", locale),
        ("nav_home", &home),
        ("nav_blog", &blog),
        ("nav_about", &about),
    ];
    for (k, v) in &pairs {
        all.push((k.as_str(), v.as_str()));
    }

    fill(HEADER_TEMPLATE, &all)
}

/// The site footer. It is identical in every locale.
pub fn footer(_locale: &str) -> String {
    FOOTER_TEMPLATE.to_string()
}

/// Full HTML document.
pub fn page(l: &Layout<'_>) -> String {
    page_with(l, "")
}

/// Build the document, adding any page-specific styled-jsx CSS.
///
/// styled-jsx injects its rules at runtime, right before the closing
/// `</body>`. The static build has no runtime, so the same rules are
/// emitted there.
pub fn page_with(l: &Layout<'_>, extra_jsx_css: &str) -> String {
    let mut head = head(l);
    // The runtime. The Next.js build loads React and framer-motion
    // from /_next/static/chunks; the static build ships one small
    // dependency-free file that restores the same behaviours.
    head.push_str("<script src=\"/site.js\" defer></script>");
    let mut jsx = String::from(FOOTER_JSX_CSS);
    jsx.push_str(MOTION_CSS);
    if !extra_jsx_css.is_empty() {
        jsx.push_str(extra_jsx_css);
    }
    // Two things the Next.js App Router emits on every page and that a
    // static build has to reproduce:
    //
    // * `<div hidden=""><!--$--><!--/$--></div>` -- the runtime's
    //   Suspense boundary placeholder, the first child of <body>.
    // * the `InstallPrompt` button -- a fixed-position child of <body>,
    //   after the page container.
    format!(
        "<!DOCTYPE html><html lang=\"{}\" class=\"__variable_d8ebd1 __variable_c16693 __variable_1ca127\"><head>{}</head><body class=\"min-h-screen bg-bg-primary font-sans antialiased\"><div hidden=\"\"><!--$--><!--/$--></div>{}<button class=\"text-xs text-text-muted hover:text-text-secondary transition-colors duration-200\" style=\"position:fixed;bottom:16px;left:16px;z-index:40;padding:4px 8px\">Add to Home Screen</button><style>{}</style></body></html>",
        l.locale, head, l.body, jsx
    )
}

/// The site header, copied from the built Next.js output.
const HEADER_TEMPLATE: &str = r##"<header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent"><nav class="container-custom relative flex items-center h-16"><a class="text-[15px] font-semibold tracking-[-0.01em] text-text-primary transition-colors duration-200 hover:text-text-primary" href="/{{loc}}">Frank&#x27;s Bot</a><div class="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10"><a class="nav-link relative text-[14px] tracking-[-0.005em] py-1 font-normal" href="/{{loc}}"><span>{{nav_home}}</span><span class="absolute bottom-0 left-0 w-0 h-px bg-text-primary transition-all duration-200 group-hover:w-full"></span></a><a class="nav-link relative text-[14px] tracking-[-0.005em] py-1 font-normal" href="/{{loc}}/blog"><span>{{nav_blog}}</span><span class="absolute bottom-0 left-0 w-0 h-px bg-text-primary transition-all duration-200 group-hover:w-full"></span></a><a class="nav-link relative text-[14px] tracking-[-0.005em] py-1 font-normal" href="/{{loc}}/about"><span>{{nav_about}}</span><span class="absolute bottom-0 left-0 w-0 h-px bg-text-primary transition-all duration-200 group-hover:w-full"></span></a></div><div class="ml-auto flex items-center gap-4"><div class="flex items-center gap-1">{{lang_ja}}{{lang_zh}}{{lang_en}}</div></div><button class="md:hidden ml-auto p-2 text-text-secondary hover:text-text-primary transition-colors" aria-label="Toggle menu"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu w-5 h-5"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg></button></nav></header>"##;

/// The site footer, copied from the built Next.js output.
const FOOTER_TEMPLATE: &str = r##"<footer class="jsx-a2842b1a1a80f4d8 footer-root relative"><div class="jsx-a2842b1a1a80f4d8 container-custom pt-10 pb-4 md:pt-12 md:pb-5"><div class="jsx-a2842b1a1a80f4d8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div class="jsx-a2842b1a1a80f4d8 flex flex-col gap-1"><span class="jsx-a2842b1a1a80f4d8 text-base font-semibold tracking-tight text-text-primary">Frank&#x27;s Bot</span><span class="jsx-a2842b1a1a80f4d8 text-sm text-text-muted">Learning. Building. Evolving.</span></div><nav aria-label="Social links" class="jsx-a2842b1a1a80f4d8 flex items-center gap-2"><a href="https://github.com/dingfeng901228-oss" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="jsx-a2842b1a1a80f4d8 footer-social-icon group inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 border border-border text-text-secondary hover:text-text-primary hover:border-border-hover"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github h-[18px] w-[18px] transition-transform duration-200"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg></a><a href="https://t.me" target="_blank" rel="noopener noreferrer" aria-label="Telegram" class="jsx-a2842b1a1a80f4d8 footer-social-icon group inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 border border-border text-text-secondary hover:text-text-primary hover:border-border-hover"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send h-[18px] w-[18px] transition-transform duration-200"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg></a><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" class="jsx-a2842b1a1a80f4d8 footer-social-icon group inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 border border-border text-text-secondary hover:text-text-primary hover:border-border-hover"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-twitter h-[18px] w-[18px] transition-transform duration-200"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></a><a href="https://blog.frank2025.com/" target="_blank" rel="noopener noreferrer" aria-label="Creator" class="jsx-a2842b1a1a80f4d8 footer-social-icon group inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 border border-border text-text-secondary hover:text-text-primary hover:border-border-hover"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open h-[18px] w-[18px] transition-transform duration-200"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></a></nav></div></div><div class="jsx-a2842b1a1a80f4d8 container-custom"><div class="jsx-a2842b1a1a80f4d8 h-px bg-border"></div></div><div class="jsx-a2842b1a1a80f4d8 container-custom py-5 md:py-6"><div class="jsx-a2842b1a1a80f4d8 flex flex-col items-center gap-1 text-center text-text-muted"><p class="jsx-a2842b1a1a80f4d8 text-xs">© 2026 Frank&#x27;s Bot</p><p class="jsx-a2842b1a1a80f4d8 text-[11px] text-text-muted">Created by Frank · Tokyo, Japan</p></div></div></footer>"##;

/// The active language button.
const BTN_ACTIVE: &str = r##"<button disabled="" aria-current="true" class="px-1 py-0.5 text-xs font-medium transition-colors duration-200 focus:outline-none text-text-primary">{label}</button>"##;

/// An inactive language button.
const BTN_PLAIN: &str = r##"<button class="px-1 py-0.5 text-xs font-medium transition-colors duration-200 focus:outline-none text-text-muted hover:text-text-secondary">{label}</button>"##;

/// The separator dot between language buttons.
const DOT: &str =
    r##"<span class="text-text-muted/40 text-xs select-none" aria-hidden="true">·</span>"##;

/// The CSS the `Footer` component injects through styled-jsx.
///
/// styled-jsx renders it at runtime, so it lives inside the JS
/// chunk rather than in any stylesheet. The static build has to
/// emit it as a `<style>` tag to look the same.
pub const FOOTER_JSX_CSS: &str = r##".footer-root.jsx-a2842b1a1a80f4d8{animation:footerFadeIn 600ms ease-out 100ms both}.footer-social-icon.jsx-a2842b1a1a80f4d8:hover svg{transform:scale(1.1)}@keyframes footerFadeIn{from{opacity:0;transform:translatey(8px)}to{opacity:1;transform:translatey(0)}}"##;

/// The lucide "tag" icon that precedes every tag pill.
pub fn tag_icon() -> &'static str {
    r##"<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag w-3 h-3"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>"##
}

/// The CSS the `BlogList` component injects through styled-jsx.
pub const BLOG_LIST_JSX_CSS: &str = r##".blog-search.jsx-f4aea2b4b91ef532{transition:border-color 200ms ease,background 200ms ease,box-shadow 200ms ease}.blog-page-link.jsx-f4aea2b4b91ef532{transition:color 200ms ease,background 200ms ease,border-color 200ms ease,box-shadow 200ms ease,transform 200ms ease}.blog-page-link.jsx-f4aea2b4b91ef532:hover{color:#fff!important;border-color:rgba(59,130,246,.5)!important;background:rgba(59,130,246,.08)!important;box-shadow:0 0 16px rgba(59,130,246,.2);transform:translatey(-1px)}.blog-page-link.jsx-f4aea2b4b91ef532:active{transform:translatey(0)}.blog-search.jsx-f4aea2b4b91ef532:focus{border-color:rgba(59,130,246,.6)!important;background:rgba(59,130,246,.05)!important;box-shadow:0 0 0 4px rgba(59,130,246,.1),0 0 24px rgba(59,130,246,.18)}@keyframes dropdownOpen{from{opacity:0;transform:scale(.96)translatey(-6px)}to{opacity:1;transform:scale(1)translatey(0)}}.blog-clear.jsx-f4aea2b4b91ef532{color:rgba(255,255,255,.5);transition:color 200ms ease}.blog-clear.jsx-f4aea2b4b91ef532:hover{color:#3b82f6}.blog-clear-link.jsx-f4aea2b4b91ef532{transition:color 200ms ease}.blog-clear-link.jsx-f4aea2b4b91ef532:hover{color:#3b82f6!important}.blog-cta-link.jsx-f4aea2b4b91ef532{transition:text-decoration 200ms ease}.blog-cta-link.jsx-f4aea2b4b91ef532:hover{text-decoration:underline}"##;

/// The entrance animations the Next.js build performs with framer-motion.
///
/// framer-motion writes its `initial` state as an inline `opacity:0`
/// and animates it to `opacity:1` with its client runtime. A static
/// build has no runtime, so without these rules the content would stay
/// invisible.
///
/// A CSS animation overrides an inline style in the cascade, so these
/// rules key on the inline `opacity:0` and leave the markup
/// byte-identical to the Next.js build.
pub const MOTION_CSS: &str = r##"/* Entrance animations.
 *
 * The Next.js build renders framer-motion's `initial` state as an inline
 * `opacity:0` and animates it to `opacity:1` with its client runtime.
 * A static build has no runtime, so without these rules the content
 * would never become visible.
 *
 * A CSS animation overrides an inline style in the cascade, so these
 * rules can key on the inline `opacity:0` without changing a byte of
 * the markup. The timings match the framer-motion transitions they
 * replace.
 */
@keyframes fb-in-y20{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fb-in-y12{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fb-in-y10{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fb-in-y8{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fb-in-y6{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes fb-in-x-30{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
@keyframes fb-in-x30{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes fb-fade{from{opacity:0}to{opacity:1}}
@keyframes fb-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes fb-blink{0%,100%{opacity:1}50%{opacity:0}}
@media (prefers-reduced-motion:no-preference){
[style="background:rgba(255, 255, 255,0.6)"]{animation:fb-blink 1s ease-in-out infinite}
div.relative:has(> div.absolute.inset-0.rounded-full){animation:fb-float 4s ease-in-out infinite}
[style="opacity:0;transform:translateY(20px)"]{animation:fb-in-y20 .6s ease-out both}
[style="opacity:0;transform:translateY(12px)"]{animation:fb-in-y12 .5s ease-out both}
[style="opacity:0;transform:translateY(10px)"]{animation:fb-in-y10 .6s ease-out .25s both}
[style="opacity:0;transform:translateY(8px)"]{animation:fb-in-y8 .5s ease-out .15s both}
[style="opacity:0;transform:translateY(6px)"]{animation:fb-in-y6 .4s ease-out .45s both}
[style="opacity:0"]{animation:fb-fade .4s ease-out .55s both}
[style="font-weight:600;font-size:clamp(32px, 5vw, 56px);opacity:0;transform:translateY(10px)"]{animation:fb-in-y10 .6s ease-out .25s both}
[style="font-size:15px;font-weight:400;opacity:0;transform:translateY(8px)"]{animation:fb-in-y8 .5s ease-out .35s both}
[style="font-family:var(--font-body);color:rgba(255, 255, 255, 0.45);opacity:0"],[style="font-family:var(--font-body);color:rgba(255,255,255,0.45);opacity:0"]{animation:fb-fade .6s ease-out both}
[style="background:rgba(255, 255, 255, 0.02);border:1px solid rgba(255, 255, 255, 0.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transform:translateY(20px)"],[style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transform:translateY(20px)"]{animation:fb-in-y20 .4s ease-out .3s both}
[style="font-family:var(--font-body);color:rgba(255, 255, 255, 0.8);opacity:0;transform:translateY(6px)"],[style="font-family:var(--font-body);color:rgba(255,255,255,0.8);opacity:0;transform:translateY(6px)"]{animation:fb-in-y6 .25s ease-out both}
}"##;

/// The AboutContent styled-jsx block.
///
/// Next.js scopes styled-jsx to a per-component hash and the runtime
/// injects the rules on the client. A static build has to emit them
/// itself; the hash is part of the class names in the markup, so the
/// rules have to use the same one.
pub const ABOUT_JSX_CSS: &str = r##"/* The AboutContent styled-jsx block, scoped to the hash Next.js
 * assigned to that component. */
.about-info-card.jsx-84354c272b88dca4{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:border-color 200ms ease,background 200ms ease}
.about-info-card.jsx-84354c272b88dca4:hover{border-color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.06)}
.about-info-card.jsx-84354c272b88dca4:hover .about-info-text.jsx-84354c272b88dca4{color:#ffffff}
.about-tech-tag.jsx-84354c272b88dca4:hover{color:#3b82f6!important;border-color:rgba(255,255,255,0.4)!important;background:rgba(255,255,255,0.08)!important}"##;
