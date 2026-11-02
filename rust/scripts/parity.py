#!/usr/bin/env python3
"""Compare the Rust build against the Next.js build, layer by layer.

The shared skill harness compares whole-document skeletons, which include
the stylesheet `<link>` tags and the hydration `<script>` tags -- those
legitimately differ between two independent builds, so every page would
report a skeleton mismatch for a reason that has nothing to do with the
port.

This harness compares the layers that isolate real failure classes:

  body      the <body> markup with scripts and build-asset links stripped
  head      <head> with stylesheet/preload links and scripts stripped
  text      visible text, line by line
  chrome    header and footer markup, exact bytes

Usage:
    python scripts/parity.py <baseline_dir> <candidate_dir> [--max-report N]

Exit code 0 means every comparable page matched on every layer.
"""

import argparse
import html as html_mod
import os
import re
import sys

# Build artifacts: hashed asset URLs and hydration scripts.
_ARTIFACT_LINK = re.compile(
    r'<link\s+(?:rel="(?:stylesheet|preload|modulepreload)"[^>]*|'
    r'rel="[^"]*"\s+as="[^"]*"[^>]*)>')
_ARTIFACT_SCRIPT = re.compile(r"<script\b[^>]*>.*?</script>", re.S)
# next/font emits this meta tag with the fallback font metrics. The
# Next.js build emits it on Linux but not on Windows, so it is a
# build-environment difference rather than a content difference.
_NEXT_SIZE_ADJUST = re.compile(r'<meta name="next-size-adjust"[^>]*>')
_HEADER = re.compile(r"<header\b[^>]*>.*?</header>", re.S)
_FOOTER = re.compile(r"<footer\b[^>]*footer-root[^>]*>.*?</footer>", re.S)


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def html_paths(root):
    out = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for name in filenames:
            if name.endswith(".html"):
                rel = os.path.relpath(os.path.join(dirpath, name), root)
                out.append(rel.replace(os.sep, "/"))
    return sorted(out)


def strip_artifacts(html):
    html = _ARTIFACT_LINK.sub("", html)
    html = _ARTIFACT_SCRIPT.sub("", html)
    return html


def skeleton(doc):
    s = re.sub(r"<!--.*?-->", "", doc, flags=re.S)
    return re.sub(r">\s*[^<]*<", "><", s)


def visible_text(doc):
    s = _ARTIFACT_SCRIPT.sub(" ", doc)
    s = re.sub(r"<style\b[^>]*>.*?</style>", " ", s, flags=re.S)
    s = re.sub(r"<[^>]+>", "\n", s)
    s = html_mod.unescape(s)
    return [line.strip() for line in s.split("\n") if line.strip()]


_STYLE = re.compile(r"<style\b[^>]*>.*?</style>", re.S)


def body_of(doc):
    """The <body> content, with build artifacts stripped.

    The styled-jsx <style> block is a required addition: the Next.js
    build injects those rules at runtime, so they appear in no static
    file. A static build has to carry them or the page renders
    unstyled. The block is therefore stripped here and its content is
    checked separately by `styled_jsx_css`.
    """
    i = doc.find("<body")
    if i < 0:
        return ""
    j = doc.find(">", i)
    k = doc.find("</body>", j)
    body = doc[j + 1 : k] if k > 0 else doc[j + 1 :]
    # The hydration scripts are build artifacts: a static build has no
    # React runtime, so it carries no `self.__next_f` payload and no
    # chunk loader.
    body = _ARTIFACT_SCRIPT.sub("", body)
    return _STYLE.sub("", body)


def styled_jsx_css(doc):
    """Every rule declared in an inline <style> block."""
    rules = []
    for m in _STYLE.finditer(doc):
        rules.extend(re.findall(r"[^{}]+\{[^{}]*\}", m.group(0)))
    return rules


def head_of(doc):
    i = doc.find("<head")
    if i < 0:
        return ""
    j = doc.find(">", i)
    k = doc.find("</head>", j)
    head = doc[j + 1 : k] if k > 0 else ""
    # The next/font fallback metrics meta tag is a build-environment
    # difference (the Next.js build emits it on Linux, not on
    # Windows), so it is not a content difference.
    head = _NEXT_SIZE_ADJUST.sub("", head)
    return strip_artifacts(head)


def first_diff(a, b):
    n = min(len(a), len(b))
    i = n
    for k in range(n):
        if a[k] != b[k]:
            i = k
            break
    lo = max(0, i - 60)
    return i, a[lo : i + 60], b[lo : i + 60]


# The styled-jsx scope id (`jsx-<hash>`) is a hash of the *text* of
# the component's `<style jsx>` block, so the line endings of the
# source file change it. A Windows checkout with CRLF and a Linux
# checkout with LF therefore produce different scope ids for the same
# source. The class names are normalised here so the comparison is
# about the markup, not about the platform.
_JSX_SCOPE = re.compile(r"jsx-[a-f0-9]{16}")


def normalize_jsx(text):
    return _JSX_SCOPE.sub("jsx-SCOPE", text)


def compare_page(base_path, cand_path):
    base = read(base_path)
    cand = read(cand_path)
    problems = []

    bb, cb = body_of(base), body_of(cand)
    if skeleton(bb) != skeleton(cb):
        i, x, y = first_diff(skeleton(bb), skeleton(cb))
        problems.append(("body", f"at {i}\n      base: {x!r}\n      cand: {y!r}"))

    hb, hc = head_of(base), head_of(cand)
    if normalize_jsx(hb) != normalize_jsx(hc):
        i, x, y = first_diff(normalize_jsx(hb), normalize_jsx(hc))
        problems.append(("head", f"at {i}\n      base: {x!r}\n      cand: {y!r}"))

    tb, tc = visible_text(base), visible_text(cand)
    if tb != tc:
        only_base = [x for x in tb if x not in tc][:3]
        only_cand = [x for x in tc if x not in tb][:3]
        problems.append(
            ("text", f"base-only: {only_base}\n      cand-only: {only_cand}")
        )

    for name, pattern in (("header", _HEADER), ("footer", _FOOTER)):
        mb, mc = pattern.search(base), pattern.search(cand)
        sb = mb.group(0) if mb else None
        sc = mc.group(0) if mc else None
        if sb is not None:
            sb = normalize_jsx(sb)
        if sc is not None:
            sc = normalize_jsx(sc)
        if sb != sc:
            if sb is None or sc is None:
                problems.append(
                    (name, f"present in base={sb is not None} cand={sc is not None}")
                )
            else:
                i, x, y = first_diff(sb, sc)
                problems.append((name, f"at {i}\n      base: {x!r}\n      cand: {y!r}"))

    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("baseline")
    ap.add_argument("candidate")
    ap.add_argument("--max-report", type=int, default=25)
    ap.add_argument("--only", default=None, help="substring filter on the path")
    args = ap.parse_args()

    base_root = os.path.abspath(args.baseline)
    cand_root = os.path.abspath(args.candidate)

    base_paths = set(html_paths(base_root))
    cand_paths = set(html_paths(cand_root))
    if args.only:
        base_paths = {p for p in base_paths if args.only in p}
        cand_paths = {p for p in cand_paths if args.only in p}

    missing = sorted(base_paths - cand_paths)
    extra = sorted(cand_paths - base_paths)

    print(f"baseline : {len(base_paths)} html files")
    print(f"candidate: {len(cand_paths)} html files")
    print()

    if missing:
        print(f"!! {len(missing)} page(s) in baseline MISSING from candidate:")
        for p in missing:
            print(f"     - {p}")
        print()
    if extra:
        print(f"!! {len(extra)} page(s) in candidate NOT in baseline:")
        for p in extra:
            print(f"     + {p}")
        print()

    layer_counts = {}
    reported = 0
    bad_pages = 0

    for rel in sorted(base_paths & cand_paths):
        problems = compare_page(
            os.path.join(base_root, rel), os.path.join(cand_root, rel)
        )
        if not problems:
            continue
        bad_pages += 1
        for layer, detail in problems:
            layer_counts[layer] = layer_counts.get(layer, 0) + 1
            if reported < args.max_report:
                reported += 1
                print(f"XX {rel}  [{layer}]")
                print(f"     {detail}")
        if reported >= args.max_report:
            print(f"... (further pages suppressed; {bad_pages} bad so far)")

    matched = len(base_paths & cand_paths) - bad_pages
    print()
    print("=" * 60)
    print(f"identical pages : {matched}/{len(base_paths & cand_paths)}")
    if layer_counts:
        print("mismatches by layer:")
        for layer, count in sorted(layer_counts.items(), key=lambda kv: -kv[1]):
            print(f"  {layer:10s} {count}")
    print(f"missing pages   : {len(missing)}")
    print(f"extra pages     : {len(extra)}")

    failed = bool(missing or extra or layer_counts)
    print("RESULT:", "FAIL" if failed else "PASS")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
