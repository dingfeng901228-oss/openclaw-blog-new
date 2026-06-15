#!/usr/bin/env node
// git-stage-and-commit-utf8.js
//
// Stage one or more files AND create a UTF-8 commit in one step.
// Combines:
//   1. `git -c i18n.commitEncoding=UTF-8 add <files...>`  (avoid the
//      "nothing added to commit but untracked files present" /
//      "no changes added to commit" gotcha that bit me 3x in one session)
//   2. `node tools/git-commit-utf8.js`  (handles commit message UTF-8)
//
// Why this exists:
//   The original `git-commit-utf8.js` only handles commit message UTF-8.
//   It assumes the caller already staged files. Forgetting `git add` is
//   the #1 gotcha (3 commits in this session all failed first run because
//   of it). This wrapper removes the manual `git add` step.
//
// MEMORY.md reference: see Rule 6 (Windows UTF-8 commit workaround).
//
// Usage:
//   node tools/git-stage-and-commit-utf8.js <workspace> -m <message-file> <file1> [file2...]
//   node tools/git-stage-and-commit-utf8.js <workspace> -m <message-file> <file1> --amend
//
// Examples:
//   node tools/git-stage-and-commit-utf8.js C:\workspace -m .\.git\msg.txt memory\foo.md
//   node tools/git-stage-and-commit-utf8.js C:\workspace -m .\.git\msg.txt memory\foo.md skills\bar\SKILL.md --amend
//
// Behavior:
//   - Parses: workspace = argv[0], -m/--message flag, msg-file, then 1+ files
//   - `git -c i18n.commitEncoding=UTF-8 add <files...>` (UTF-8 safe add)
//   - Then invokes `git-commit-utf8.js` (UTF-8 safe commit message)
//   - Supports `--amend` flag (passed through)

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('Usage: node git-stage-and-commit-utf8.js <workspace> -m <message-file> <file1> [file2...] [--amend]');
    console.error('Example: node git-stage-and-commit-utf8.js C:\\ws -m .\\msg.txt memory\\foo.md');
    process.exit(1);
  }

  const workspace = args[0];
  const mIdx = args.findIndex(a => a === '-m' || a === '--message');
  if (mIdx === -1 || mIdx + 1 >= args.length) {
    console.error('[ERROR] -m <message-file> flag required');
    process.exit(1);
  }
  const msgFile = args[mIdx + 1];

  // files = everything between workspace and -m, but skip the --amend flag
  const files = args.slice(1, mIdx).filter(a => a !== '--amend');
  const amend = args.includes('--amend');

  if (files.length === 0) {
    console.error('[ERROR] At least one file to stage is required');
    process.exit(1);
  }
  if (!fs.existsSync(msgFile)) {
    console.error(`[ERROR] Message file not found: ${msgFile}`);
    process.exit(1);
  }
  if (!fs.existsSync(workspace)) {
    console.error(`[ERROR] Workspace not found: ${workspace}`);
    process.exit(1);
  }

  console.log(`[STAGE] ${files.length} file(s) in ${workspace}`);
  for (const f of files) {
    console.log(`  - ${f}`);
  }

  // Step 1: git add (UTF-8 safe)
  const addArgs = [
    '-c', 'i18n.commitEncoding=UTF-8',
    'add',
    ...files,
  ];
  const addRes = spawnSync('git', addArgs, {
    cwd: workspace,
    env: {
      ...process.env,
      LC_ALL: 'C.UTF-8',
      LANG: 'C.UTF-8',
    },
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (addRes.status !== 0) {
    console.error(`[FAIL] git add exited with status ${addRes.status}`);
    process.exit(addRes.status || 1);
  }
  console.log(`[OK] Staged ${files.length} file(s)`);

  // Step 2: verify something is actually staged
  const statusRes = spawnSync('git', ['status', '--short'], {
    cwd: workspace,
    encoding: 'utf8',
  });
  const stagedLines = (statusRes.stdout || '')
    .split('\n')
    .filter(l => /^[AM]\s/.test(l) || /^[AMR]\d*\s/.test(l));
  if (stagedLines.length === 0) {
    console.error('[FAIL] No staged changes detected after `git add`. Aborting commit to avoid empty commit.');
    process.exit(1);
  }
  console.log(`[OK] ${stagedLines.length} staged change(s) ready to commit`);

  // Step 3: delegate to git-commit-utf8.js for the UTF-8 commit message
  const wrapperPath = path.join(workspace, 'tools', 'git-commit-utf8.js');
  if (!fs.existsSync(wrapperPath)) {
    console.error(`[ERROR] Wrapper not found: ${wrapperPath}`);
    console.error('This script must be co-located with git-commit-utf8.js in <workspace>/tools/');
    process.exit(1);
  }

  const commitArgs = [wrapperPath, workspace, msgFile];
  if (amend) commitArgs.push('--amend');

  const commitRes = spawnSync('node', commitArgs, {
    cwd: workspace,
    env: {
      ...process.env,
      LC_ALL: 'C.UTF-8',
      LANG: 'C.UTF-8',
    },
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (commitRes.status !== 0) {
    console.error(`[FAIL] Commit wrapper exited with status ${commitRes.status}`);
    process.exit(commitRes.status || 1);
  }

  console.log(`[DONE] Staged + committed ${files.length} file(s)${amend ? ' (amended)' : ''}`);
}

main();
