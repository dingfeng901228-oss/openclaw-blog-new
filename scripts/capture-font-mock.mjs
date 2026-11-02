// Capture the Google Fonts responses and build a deterministic mock.
//
// next/font has no disk cache, so every Next.js build downloads the
// fonts again. Google intermittently answers with an extensionless URL
// (`/l/font?kit=...`), and the loader then crashes on the missing
// file extension -- vercel/next.js#99114. The CI baseline build
// failed at random because of it.
//
// next/font can serve the responses from a file instead:
// NEXT_FONT_GOOGLE_MOCKED_RESPONSES names a module that maps a
// Google Fonts CSS URL to the CSS text. This script captures the
// real responses once, then generates that module from the vendored
// font files, so the baseline build is offline and reproducible.
//
// The capture patches next/font inside node_modules for the duration
// of one build and restores it afterwards. The patch is local and
// temporary; nothing in the repository depends on it.
//
// How the mock reproduces the production output byte for byte:
//
//   * The mock returns the exact CSS Google sent, with every font URL
//     rewritten to a local path that ends in .woff2.
//   * The loader reads a mocked font file from disk when the URL
//     starts with "/", so it gets the same bytes as the real
//     download.
//   * The emitted file name is a digest of the content, so the same
//     bytes produce the same name.
//   * The loader then replaces the URL in the CSS with that emitted
//     name, so the final CSS matches the production build.
//
// Usage:
//     node scripts/capture-font-mock.mjs [repo-root]
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const repo = resolve(process.argv[2] ?? ".");
const loader = join(
  repo,
  "node_modules", "next", "dist", "compiled", "@next", "font", "dist", "google", "loader.js",
);
const backup = `${loader}.capture-backup`;
const ciDir = join(repo, "rust", "ci");
const dumpFile = join(ciDir, "font-dump.jsonl");
const mockFile = join(ciDir, "font-mock.cjs");

if (!existsSync(loader)) {
  console.error(`no next/font loader at ${loader}`);
  console.error("run npm ci first");
  process.exit(1);
}

// The patch writes one JSON line per event to FB_FONT_DUMP. The
// loader runs inside the build process, so the data cannot be kept
// in memory -- the process is gone by the time the build ends.
const HELPER = `
const __fbDump = (entry) => {
    const target = process.env.FB_FONT_DUMP;
    if (!target) return;
    require("node:fs").appendFileSync(target, JSON.stringify(entry) + "\\n");
};
`;

function patch(source) {
  // Keep "use strict" the first statement, so the helper goes after it.
  let out = source.replace('"use strict";', '"use strict";\n' + HELPER);

  // 1. Record the CSS Google returned, keyed by the request URL.
  //    This is before the loader drops the body block, so the mock
  //    serves exactly what the network returned.
  out = out.replace(
    "        // CSS Variables may be set on a body tag, ignore them to keep the CSS module pure\n",
    "        __fbDump({ css: true, url, body: fontFaceDeclarations });\n" +
    "        // CSS Variables may be set on a body tag, ignore them to keep the CSS module pure\n",
  );

  // 2. Record which file every font URL was emitted as.
  out = out.replace(
    "            const selfHostedFileUrl = emitFontFile(fontFileBuffer, ext, preloadFontFile, !!adjustFontFallbackMetrics);\n",
    "            const selfHostedFileUrl = emitFontFile(fontFileBuffer, ext, preloadFontFile, !!adjustFontFallbackMetrics);\n" +
    "            __fbDump({ file: true, url: googleFontFileUrl, emitted: selfHostedFileUrl });\n",
  );

  const cssPatched = out.includes("__fbDump({ css: true");
  const filePatched = out.includes("__fbDump({ file: true");
  if (!cssPatched || !filePatched) {
    console.error("the next/font loader does not have the expected shape");
    console.error("the next version may have changed; patch it by hand");
    process.exit(1);
  }

  return out;
}

mkdirSync(ciDir, { recursive: true });
rmSync(dumpFile, { force: true });

// The webpack cache would skip the font loader entirely, so the
// capture would record nothing.
const nextDir = join(repo, ".next");
if (existsSync(nextDir)) {
  console.log("clearing .next so the font loader runs again");
  rmSync(nextDir, { recursive: true, force: true });
}

const original = readFileSync(loader, "utf8");
copyFileSync(loader, backup);
writeFileSync(loader, patch(original), "utf8");
console.log("patched next/font");

try {
  console.log("running the Next.js build (this downloads the fonts)...");
  // next is invoked through node directly: "npm" is a shell script
  // on Windows, which execFileSync cannot spawn.
  execFileSync(
    process.execPath,
    [join(repo, "node_modules", "next", "dist", "bin", "next"), "build", "--webpack"],
    {
      cwd: repo,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production", FB_FONT_DUMP: dumpFile },
    },
  );
} finally {
  copyFileSync(backup, loader);
  rmSync(backup, { force: true });
  console.log("restored next/font");
}

if (!existsSync(dumpFile)) {
  console.error(`the capture produced nothing at ${dumpFile}`);
  process.exit(1);
}

const lines = readFileSync(dumpFile, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

// The server and the client compiler both run the loader, so every
// event appears twice.
const cssByUrl = new Map();
const fileByUrl = new Map();
for (const entry of lines) {
  if (entry.css) cssByUrl.set(entry.url, entry.body);
  else fileByUrl.set(entry.url, entry.emitted);
}

if (cssByUrl.size === 0 || fileByUrl.size === 0) {
  console.error("the capture is incomplete");
  process.exit(1);
}

const mediaDir = join(repo, "rust", "assets", "_next", "static", "media");
const mock = {};
let missing = 0;

for (const [url, css] of cssByUrl) {
  let out = css;
  for (const [fontUrl, emitted] of fileByUrl) {
    if (!out.includes(fontUrl)) continue;
    const name = emitted.split("/").pop().split("?")[0];
    if (!existsSync(join(mediaDir, name))) {
      console.error(`the vendored file is missing: ${name}`);
      missing++;
      continue;
    }
    // The loader reads a mocked font file from disk when the URL
    // starts with "/". The path has to keep the .woff2 extension,
    // because the loader takes the extension from the URL and
    // crashes without one.
    out = out.split(fontUrl).join(`/FRANKBOT_FONT_DIR/${name}`);
  }
  mock[url] = out;
}

if (missing > 0) {
  console.error(`${missing} vendored font files are missing`);
  process.exit(1);
}

// A font URL that was not captured would still point at Google, and
// the loader would read the URL text as if it were the font.
for (const [url, css] of Object.entries(mock)) {
  if (css.includes("fonts.gstatic.com")) {
    console.error(`the capture missed a font URL in ${url}`);
    process.exit(1);
  }
}

const body = `// Generated by scripts/capture-font-mock.mjs -- do not edit.
//
// next/font downloads the fonts from Google at build time. Google
// intermittently answers with extensionless URLs, which crashes the
// loader (vercel/next.js#99114), so the CI baseline build would fail
// at random.
//
// This module serves the same responses from the vendored files
// instead. next/font reads NEXT_FONT_GOOGLE_MOCKED_RESPONSES as a
// module path and requires it.
const path = require("node:path");

const MEDIA_DIR = path.join(__dirname, "..", "assets", "_next", "static", "media");

// The loader reads a mocked font file from disk only when the URL
// starts with "/". On Windows an absolute path starts with a drive
// letter instead, so the drive is dropped: a leading-slash path
// resolves against the current drive, which is the drive the build
// runs on.
const LOCAL_MEDIA_DIR = process.platform === "win32"
    ? "/" + path.resolve(MEDIA_DIR).replace(/^[A-Za-z]:[\\\\/]/, "").replace(/\\\\/g, "/")
    : path.resolve(MEDIA_DIR);

const responses = ${JSON.stringify(mock, null, 2)};

module.exports = new Proxy(responses, {
    get(target, url) {
        const css = target[url];
        if (css === undefined) return undefined;
        return css.split("/FRANKBOT_FONT_DIR/").join(LOCAL_MEDIA_DIR + "/");
    },
});
`;

writeFileSync(mockFile, body, "utf8");
rmSync(dumpFile, { force: true });

console.log(`\nwrote ${mockFile}`);
console.log(`  ${Object.keys(mock).length} css responses`);
console.log(`  ${fileByUrl.size} font files`);
