/* frankbot.org -- static runtime.
 *
 * The Next.js build shipped these behaviours through React and
 * framer-motion. A static build has no runtime, so this file restores
 * the parts a reader can actually notice:
 *
 *   - the header's scrolled state
 *   - the language switcher
 *   - the mobile menu
 *   - the blog search box and the category filter
 *   - the terminal line rotation on the about page
 *   - the avatar float
 *   - the PWA install prompt
 *
 * Everything here is progressive enhancement: the page is complete
 * without it. The script is deliberately dependency-free so the static
 * site keeps a near-zero JavaScript budget.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* The locale of the current page, taken from <html lang>. */
  function currentLocale() {
    var lang = document.documentElement.getAttribute("lang") || "ja";
    return lang === "zh" || lang === "en" ? lang : "ja";
  }

  /* The path of the current page, without the locale segment.
   *
   * The Next.js build swaps the locale segment in `usePathname()`
   * and leaves everything else alone -- including the `.html`
   * extension the static export serves. Keeping the extension means
   * the link works on any static host, not only on one that
   * resolves extensionless URLs.
   */
  function pathWithoutLocale() {
    var path = window.location.pathname;
    var m = path.match(/^\/(ja|zh|en)(\/.*)?$/);
    return m && m[2] ? m[2] : "/";
  }

  /* ------------------------------------------------------------------ *
   * Header: the background fades in once the page is scrolled.
   * ------------------------------------------------------------------ */

  function initHeaderScroll() {
    var header = $("header");
    if (!header) return;
    var scrolled = false;
    function update() {
      var next = window.scrollY > 20;
      if (next === scrolled) return;
      scrolled = next;
      header.classList.toggle("bg-[rgba(10,10,10,0.85)]", next);
      header.classList.toggle("backdrop-blur-xl", next);
      header.classList.toggle("border-b", next);
      header.classList.toggle("border-[rgba(255,255,255,0.06)]", next);
      header.classList.toggle("bg-transparent", !next);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ *
   * Language switcher.
   *
   * The Next.js build renders three buttons and swaps the locale in the
   * path on click. Here the same buttons navigate to the equivalent
   * page in the other locale.
   * ------------------------------------------------------------------ */

  function initLanguageSwitcher() {
    var locale = currentLocale();
    var buttons = $$("header button");
    var labels = { ja: "JP", zh: "中文", en: "EN" };
    var order = ["ja", "zh", "en"];

    buttons.forEach(function (btn) {
      var text = (btn.textContent || "").trim();
      var target = null;
      order.forEach(function (code) {
        if (labels[code] === text) target = code;
      });
      if (!target || target === locale) return;

      btn.removeAttribute("disabled");
      btn.removeAttribute("aria-current");
      btn.setAttribute("role", "link");
      btn.setAttribute("tabindex", "0");
      btn.style.cursor = "pointer";
      btn.addEventListener("click", function () {
        window.location.href = "/" + target + pathWithoutLocale();
      });
      btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Mobile menu.
   * ------------------------------------------------------------------ */

  function initMobileMenu() {
    var toggle = $('button[aria-label="Toggle menu"]');
    var header = $("header");
    if (!toggle || !header) return;

    var panel = null;
    var open = false;

    function buildPanel() {
      var nav = $("header nav");
      var locale = currentLocale();
      var labels = { ja: { home: "ホーム", blog: "ブログ", about: "プロフィール" },
                     zh: { home: "首页", blog: "博客", about: "关于" },
                     en: { home: "Home", blog: "Blog", about: "About" } };
      var t = labels[locale];

      panel = document.createElement("div");
      panel.className =
        "md:hidden border-t border-[rgba(255,255,255,0.06)] bg-[rgba(10,10,10,0.98)]";
      var inner = document.createElement("div");
      inner.className = "container-custom py-4 flex flex-col gap-1";
      [["", t.home], ["blog", t.blog], ["about", t.about]].forEach(function (pair) {
        var a = document.createElement("a");
        a.className = "nav-link text-[14px] tracking-[-0.005em] py-3 font-normal";
        a.href = "/" + locale + (pair[0] ? "/" + pair[0] : "");
        a.textContent = pair[1];
        inner.appendChild(a);
      });
      panel.appendChild(inner);
      panel.style.display = "none";
      panel.style.overflow = "hidden";
      panel.style.height = "0px";
      panel.style.opacity = "0";
      header.appendChild(panel);
    }

    function setState(next) {
      open = next;
      toggle.setAttribute("aria-expanded", next ? "true" : "false");
      if (next) {
        // The height has to be measured while the panel is laid out;
        // a display:none panel has no height to report.
        panel.style.display = "block";
        panel.style.height = "auto";
        panel.style.opacity = "1";
        // scrollHeight is the content box; the 1px border-top sits
        // outside it, so the outer height is one pixel more -- which
        // is what the framer-motion `height: auto` animation settles
        // on.
        var h = panel.scrollHeight + 1;
        panel.style.height = h + "px";
      } else {
        panel.style.height = "0px";
        panel.style.opacity = "0";
        panel.style.display = "none";
      }
      // Swap the menu icon for the close icon.
      var svg = toggle.querySelector("svg");
      if (svg) {
        svg.innerHTML = next
          ? '<path d="M18 6L6 18"></path><path d="m6 6 12 12"></path>'
          : '<line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line>';
      }
    }

    buildPanel();
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", function () {
      setState(!open);
    });
    window.addEventListener("resize", function () {
      if (open && window.innerWidth >= 768) setState(false);
    });
  }

  /* ------------------------------------------------------------------ *
   * Blog list: the search box and the category filter.
   * ------------------------------------------------------------------ */

  function initBlogFilter() {
    var input = $(".blog-search");
    var grid = $(".grid.grid-cols-1.md\\:grid-cols-2");
    if (!input || !grid) return;

    /* The post index.
     *
     * The React build hands BlogList the post objects, so its filter
     * matches on title, excerpt and category. The static build ships
     * the same data as JSON next to the list.
     */
    var posts = [];
    var dataEl = document.getElementById("fb-posts");
    if (dataEl) {
      try {
        posts = JSON.parse(dataEl.textContent || "[]");
      } catch (err) {
        posts = [];
      }
    }
    var bySlug = {};
    posts.forEach(function (p) {
      bySlug[p.slug] = p;
    });

    var cards = $$("article", grid);
    var dropdown = $(".blog-dropdown");
    var button = dropdown ? $("button", dropdown) : null;
    var counter = grid.parentNode
      ? $(".mt-6.text-xs.text-center", grid.parentNode)
      : null;

    /* The card's slug comes from its link; the index is keyed by slug. */
    function postOf(card) {
      var a = card.querySelector("a[href]");
      if (!a) return null;
      var m = a.getAttribute("href").match(/\/blog\/([^/]+)$/);
      return m ? bySlug[m[1]] || null : null;
    }

    var state = { query: "", category: null };

    function apply() {
      var shown = 0;
      cards.forEach(function (card) {
        var post = postOf(card);
        var title = post ? post.title : "";
        var excerpt = post ? post.excerpt : "";
        var category = post ? post.category : "";
        var haystack = (title + " " + excerpt).toLowerCase();
        var q = state.query.toLowerCase();

        var matchesSearch = !q || haystack.indexOf(q) !== -1;
        var matchesCategory =
          !state.category || category === state.category;

        var show = matchesSearch && matchesCategory;
        card.style.display = show ? "" : "none";
        if (show) shown++;
      });

      if (counter) {
        // "Showing {count} of {total}" -- the total is the whole blog,
        // the count is what survived the filter.
        counter.textContent = counter.textContent.replace(
          /\d+/,
          String(shown)
        );
      }
    }

    input.addEventListener("input", function () {
      state.query = input.value.trim();
      apply();
    });

    if (dropdown && button) {
      var list = document.createElement("div");
      list.className =
        "absolute left-0 top-full mt-2 min-w-[180px] rounded-xl py-1.5 z-20";
      list.style.background = "rgba(20,20,20,0.98)";
      list.style.border = "1px solid rgba(255,255,255,0.12)";
      list.style.backdropFilter = "blur(12px)";
      list.style.boxShadow = "0 12px 32px rgba(0,0,0,0.5)";
      list.style.display = "none";

      /* The category list is the sorted set of every post's category,
       * exactly as `getAllCategories` builds it. */
      var cats = [];
      posts.forEach(function (p) {
        if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category);
      });
      cats.sort();

      function addItem(label, value) {
        var b = document.createElement("button");
        b.type = "button";
        b.className =
          "w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors";
        b.style.color = "rgba(255,255,255,0.85)";
        b.style.fontFamily = "var(--font-body)";
        b.textContent = label;
        b.addEventListener("click", function () {
          state.category = value;
          apply();
          close();
        });
        list.appendChild(b);
      }

      var allLabel = button.querySelector("span");
      var allText = allLabel ? allLabel.textContent : "All";
      addItem(allText, null);
      cats.forEach(function (c) {
        addItem(c, c);
      });

      dropdown.appendChild(list);

      function open() {
        list.style.display = "block";
        button.setAttribute("aria-expanded", "true");
        var chev = button.querySelector("svg");
        if (chev) chev.style.transform = "rotate(180deg)";
      }
      function close() {
        list.style.display = "none";
        button.setAttribute("aria-expanded", "false");
        var chev = button.querySelector("svg");
        if (chev) chev.style.transform = "rotate(0deg)";
      }

      button.addEventListener("click", function (e) {
        e.stopPropagation();
        if (list.style.display === "none") open();
        else close();
      });
      document.addEventListener("click", function (e) {
        if (!dropdown.contains(e.target)) close();
      });
    }

    /* The search term survives a page change. */
    $$("nav[aria-label='Blog pagination'] a").forEach(function (a) {
      a.addEventListener("click", function () {
        var term = input.value.trim();
        if (!term) return;
        try {
          sessionStorage.setItem("fb-search", term);
        } catch (err) {
          /* private mode: the term is simply not preserved */
        }
      });
    });

    try {
      var saved = sessionStorage.getItem("fb-search");
      if (saved) {
        input.value = saved;
        state.query = saved;
        apply();
        sessionStorage.removeItem("fb-search");
      }
    } catch (err) {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ *
   * About page: the terminal line rotation and the avatar float.
   * ------------------------------------------------------------------ */

  var TERMINAL_LINES = [
    "Learning AI...",
    "Building Websites...",
    "Automating Workflows...",
    "Exploring Japan IT...",
    "Status: Online"
  ];

  function initTerminal() {
    /* The rotating line is the only span whose inline style carries
     * both the translucent white and the 6px offset. The element is
     * cached, because setting `style.animation` makes the browser
     * re-serialize the style attribute, which changes the very text
     * the lookup matches on. */
    var el = $$("span").filter(function (s) {
      var st = s.getAttribute("style") || "";
      return (
        st.indexOf("translateY(6px)") !== -1 &&
        /rgba\(255,\s*255,\s*255,\s*0\.8\)/.test(st)
      );
    })[0];
    if (!el) return;
    var index = 0;

    setInterval(function () {
      index = (index + 1) % TERMINAL_LINES.length;
      el.textContent = TERMINAL_LINES[index];
      // Restart the entrance animation the React build plays on each
      // new line.
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "fb-in-y6 .3s ease-out both";
    }, 2500);
  }

  function initAvatarFloat() {
    /* The float is done in CSS (see MOTION_CSS); nothing to do here. */
  }

  /* ------------------------------------------------------------------ *
   * PWA install prompt.
   * ------------------------------------------------------------------ */

  function initInstallPrompt() {
    /* The Next.js build renders this button into the static markup and
     * only makes it work once the browser offers the prompt. The
     * static build ships the same button, so it has to be wired up --
     * not added a second time.
     *
     * iOS Safari has no `beforeinstallprompt`; there the button shows
     * an inline disclosure with the manual steps instead. */
    var buttons = $$("body button").filter(function (b) {
      return (b.textContent || "").trim() === "Add to Home Screen";
    });
    var button = buttons.length ? buttons[buttons.length - 1] : null;
    if (!button) return;

    var deferred = null;
    var installed = false;
    var dismissed = false;
    var iosHelp = null;

    function isStandalone() {
      return (
        window.navigator.standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches
      );
    }
    function isIOS() {
      return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !("MSStream" in window)
      );
    }

    try {
      if (sessionStorage.getItem("pwa-install-dismissed") === "1") {
        dismissed = true;
      }
    } catch (err) {
      /* private mode */
    }

    function hide() {
      if (button) button.remove();
      if (iosHelp) iosHelp.remove();
    }

    function showIOSHelp() {
      if (iosHelp) return;
      iosHelp = document.createElement("div");
      iosHelp.style.cssText =
        "position:fixed;bottom:16px;left:16px;right:16px;z-index:40;padding:12px 16px;" +
        "max-width:420px;background:rgba(10, 10, 10, 0.95);" +
        "border:1px solid rgba(255, 255, 255, 0.10);border-radius:6px;line-height:1.6";
      iosHelp.innerHTML =
        '<div style="font-weight:500;margin-bottom:6px;color:var(--text-primary, #FAFAFA)">Add to Home Screen</div>' +
        '<ol style="padding-left:18px;margin:0">' +
        "<li>Tap the <strong>Share</strong> button (square with arrow).</li>" +
        "<li>Scroll and tap <strong>Add to Home Screen</strong>.</li>" +
        "<li>Confirm by tapping <strong>Add</strong>.</li>" +
        "</ol>" +
        '<div style="margin-top:8px;font-size:11px;color:var(--text-muted, #6B6B6B)">Tap anywhere to dismiss</div>';
      iosHelp.addEventListener("click", function () {
        dismiss();
      });
      document.body.appendChild(iosHelp);
    }

    function dismiss() {
      dismissed = true;
      hide();
      try {
        sessionStorage.setItem("pwa-install-dismissed", "1");
      } catch (err) {
        /* private mode */
      }
    }

    if (isStandalone()) {
      installed = true;
    }
    if (installed || dismissed) {
      hide();
      return;
    }

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
    });

    window.addEventListener("appinstalled", function () {
      installed = true;
      deferred = null;
      hide();
    });

    button.addEventListener("click", function () {
      if (deferred) {
        deferred.prompt();
        deferred.userChoice.then(function (choice) {
          if (choice.outcome === "accepted") installed = true;
          deferred = null;
          if (installed) hide();
        });
      } else if (isIOS()) {
        showIOSHelp();
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function boot() {
    initHeaderScroll();
    initLanguageSwitcher();
    initMobileMenu();
    initBlogFilter();
    initTerminal();
    initAvatarFloat();
    initInstallPrompt();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
