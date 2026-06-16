#!/usr/bin/env node
// pre-push hook for my-blog
// Blocks pushes that contain files outside the my-blog/ path
// This prevents workspace-private content (SOUL.md, MEMORY.md, skills/, etc.) from being pushed to the public my-blog repo
//
// Triggered automatically by: git push
// Can be bypassed with: git push --no-verify (NOT recommended)
//
// Companion to Rule 7 in SOUL.md

const { execSync } = require('child_process');

const MY_BLOG_REMOTE = 'new-origin';

// Workspace-private files that must NEVER end up in my-blog public repo.
// These are Frank's personal files. Even if they get committed to my-blog's
// shared .git (e.g., because my-blog is a subdirectory of workspace),
// they should be blocked from pushing to my-blog's public remote.
const FORBIDDEN_FILES = new Set([
  'SOUL.md', 'MEMORY.md', 'AGENTS.md', 'USER.md', 'TOOLS.md',
  'IDENTITY.md', 'HEARTBEAT.md', 'SOP.md', 'PLAYBOOK.md',
  'README.md', 'LICENSE', '.gitignore',
]);

// Workspace-private paths (prefixes) that must NEVER end up in my-blog.
const FORBIDDEN_PREFIXES = [
  'memory/',
  'scripts/',
  'docs/',
  'skills/',
  'brain/',
  'blog-temp/',
  'agent-blog/',
  'openclaw-blog-new/',
  'frank-blog-new/',
  'dingfeng-site/',
  'dingfeng-new/',
  'ntcchurch-site/',
  'frank-website/',
  'sentinel-ai/',
  'minimax-portal/',
  'huashu-nuwa/',
  'everyone-can-use-english/',
  'playbooks/',
  'repos/',
  'study/',
  'raw/',
  'resume/',
  'newsletter/',
  'how-to-ask-questions-the-smart-way-master/',
  'the-craft-of-selfteaching-master/',
];

// Allow only my-blog/ prefixed paths. (No other prefixes are valid in my-blog.)
const ALLOWED_PREFIX = 'my-blog/';

function isAllowed(file) {
  if (file.startsWith(ALLOWED_PREFIX)) return true;
  if (file.startsWith('.github/')) return true;
  return false;
}

function isForbidden(file) {
  // Strip any leading 'my-blog/' prefix to check the underlying path
  const base = file.startsWith(ALLOWED_PREFIX) ? file.substring(ALLOWED_PREFIX.length) : file;
  if (FORBIDDEN_FILES.has(base)) return true;
  for (const prefix of FORBIDDEN_PREFIXES) {
    if (base.startsWith(prefix) || base === prefix.slice(0, -1)) return true;
  }
  return false;
}

function die(msg) {
  console.error('=== pre-push: BLOCKED ===');
  console.error(msg);
  process.exit(1);
}

try {
  // Get the remote being pushed to (from argv, git passes remote name as $1, URL as $2)
  const remote = process.argv[2] || MY_BLOG_REMOTE;
  if (remote !== MY_BLOG_REMOTE) {
    // Not pushing to my-blog's remote, no check needed
    process.exit(0);
  }

  // Read ref data from STDIN (git passes one line per ref being pushed)
  // Format: <local_ref> <local_sha1> <remote_ref> <remote_sha1>
  const stdinData = require('fs').readFileSync(0, 'utf8');
  const refLines = stdinData.split('\n').filter(Boolean);
  const refs = [];
  for (const line of refLines) {
    const parts = line.split(' ');
    if (parts.length >= 4) {
      refs.push({
        localRef: parts[0],
        localSha: parts[1],
        remoteRef: parts[2],
        remoteSha: parts[3],
      });
    }
  }

  if (refs.length === 0) {
    // No refs from stdin (e.g., dry run or hook called manually)
    console.error('[my-blog pre-push] WARNING: no ref data from stdin, skipping check');
    process.exit(0);
  }

  // Collect all files in the diff
  const violatingFiles = new Set();
  
  for (const ref of refs) {
    let diff = '';
    if (ref.remoteSha && ref.remoteSha !== '0000000000000000000000000000000000000000') {
      // Existing remote ref — diff from remote SHA to local SHA
      try {
        diff = execSync(`git diff --name-only --diff-filter=ACMRT ${ref.remoteSha} ${ref.localSha}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      } catch (e) {
        // Diff failed, skip
      }
    } else {
      // New branch — enumerate all files in the local commits being pushed
      try {
        diff = execSync(`git diff-tree --no-commit-id --name-only -r ${ref.localSha}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      } catch (e) {
        // Could not enumerate, skip
      }
    }
    
    for (const file of diff.split('\n').filter(Boolean)) {
      // Check forbidden FIRST (security check has priority)
      if (isForbidden(file)) {
        violatingFiles.add(file);
        continue;
      }
      // Then check allowed (whitelist)
      if (isAllowed(file)) continue;
      // Neither — block conservatively
      violatingFiles.add(file);
    }
  }
  
  if (violatingFiles.size > 0) {
    const fileList = [...violatingFiles].slice(0, 20).join('\n  ');
    const more = violatingFiles.size > 20 ? `\n  ... and ${violatingFiles.size - 20} more` : '';
    die(`Push contains ${violatingFiles.size} file(s) outside the my-blog/ path:\n  ${fileList}${more}\n\nThese look like workspace-private content (SOUL.md, MEMORY.md, skills/, etc.) that should NOT be in the public my-blog repo.\n\nTo fix:\n  1. cd out of my-blog and commit these files to workspace, not my-blog\n  2. Or: run filter-repo to remove them from my-blog history (see MEMORY.md Rule 7)\n  3. Or: bypass with --no-verify (NOT recommended)\n\nThis guard enforces Rule 7: 'all automated actions must be explicitly scoped'.\n`);
  }
  
  console.log('[my-blog pre-push] OK: all ' + refs.length + ' ref(s) scoped to my-blog/');
  process.exit(0);
} catch (e) {
  console.error('=== pre-push: ERROR ===');
  console.error(e.message);
  // Fail-closed: if we can't verify, block the push
  process.exit(1);
}
