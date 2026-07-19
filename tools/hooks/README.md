# my-blog pre-push hook

This hook blocks pushes from the `my-blog` repository to `new-origin` if the diff contains workspace-private files.

## Why

`my-blog` is a subdirectory of the workspace, sharing the same `.git` directory. When workspace's auto-commit cron runs and commits files like `SOUL.md`, `MEMORY.md`, `skills/`, `memory/` etc., they end up in the same git history as my-blog's content. Without a guard, these can leak to the public `my-blog` remote on GitHub.

## What it blocks

The hook blocks any push where the diff contains:

- **Workspace-private files** (top-level): `SOUL.md`, `MEMORY.md`, `AGENTS.md`, `USER.md`, `TOOLS.md`, `IDENTITY.md`, `HEARTBEAT.md`, `SOP.md`, `PLAYBOOK.md`, `README.md`, `LICENSE`, `.gitignore`
- **Workspace-private paths** (any depth under `my-blog/`): `memory/`, `scripts/`, `docs/`, `skills/`, `brain/`, `blog-temp/`, `agent-blog/`, `openclaw-blog-new/`, `frank-blog-new/`, `dingfeng-site/`, `dingfeng-new/`, `ntcchurch-site/`, `frank-website/`, `sentinel-ai/`, `minimax-portal/`, `huashu-nuwa/`, `everyone-can-use-english/`, `playbooks/`, `repos/`, `study/`, `raw/`, `resume/`, `newsletter/`, `how-to-ask-questions-the-smart-way-master/`, `the-craft-of-selfteaching-master/`

The check works on file paths AFTER git's `my-blog/` prefix is stripped. So `my-blog/SOUL.md` is correctly detected as a workspace `SOUL.md` leak.

## What it allows

- Files under `my-blog/` (any path): legitimate my-blog content
- `.github/`: CI workflows

## Install

After cloning the repo:

**macOS / Linux:**
```bash
bash tools/hooks/setup.sh
```

**Windows (PowerShell):**
```powershell
powershell -File tools/hooks/setup.ps1
```

Or manually:
```bash
cp tools/hooks/pre-push.js .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

## Test

```bash
echo 'refs/heads/master HEAD refs/heads/master HEAD~1' | node .git/hooks/pre-push new-origin https://test
```

A clean push prints `[my-blog pre-push] OK: all 1 ref(s) scoped to my-blog/`.

A blocked push prints `=== pre-push: BLOCKED ===` and a list of violating files.

## Bypass (NOT recommended)

```bash
git push new-origin master --no-verify
```

If you must bypass (e.g., for a legitimate case), document why in the commit message.

## Companion to SOUL.md Rule 7

This hook enforces Rule 7 from SOUL.md:

> **All automated actions must be explicitly scoped + secret-scan zero hits before push.**

Specifically: workspace content must not leak to my-blog's public remote.
