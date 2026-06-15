#!/usr/bin/env node
// git-commit-utf8.js
//
// Amend or create a git commit with a UTF-8 message file.
// Required on Windows + PowerShell: `git commit -F <file>` reads the file
// using the system default ANSI code page (GBK on Chinese Windows),
// which mangles UTF-8 Chinese/Japanese text. This wrapper forces UTF-8
// interpretation by using Node.js (which defaults to UTF-8) + git config
// i18n.commitEncoding=UTF-8 + LC_ALL=C.UTF-8 env var.
//
// Usage:
//   node tools/git-commit-utf8.js <workspace> <message-file> [--amend]
//
// Or as a one-off:
//   node -e "require('child_process').execSync('node tools/git-commit-utf8.js', {stdio: 'inherit'})"
//
// MEMORY.md reference: see Rule 6 (Windows UTF-8 commit workaround).

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node git-commit-utf8.js <workspace> <message-file> [--amend]');
    console.error('Example: node git-commit-utf8.js C:\\path\\to\\repo .\\msg.txt --amend');
    process.exit(1);
  }

  const workspace = args[0];
  const msgFile = args[1];
  const amend = args.includes('--amend');

  if (!fs.existsSync(msgFile)) {
    console.error(`[ERROR] Message file not found: ${msgFile}`);
    process.exit(1);
  }

  // Read as UTF-8 explicitly
  const msg = fs.readFileSync(msgFile, 'utf8');
  console.log(`[OK] Read ${msg.length} chars from ${msgFile}`);
  console.log(`[OK] First 80 chars: ${msg.substring(0, 80).replace(/\n/g, '\\n')}`);

  // Build git command
  const gitCmd = [
    'git',
    '-c', 'i18n.commitEncoding=UTF-8',
    '-c', 'i18n.logOutputEncoding=UTF-8',
    'commit',
    amend ? '--amend' : '-m',
    amend ? `-F "${msgFile}"` : `"${msg.replace(/"/g, '\\"')}"`,
  ].join(' ');

  // Execute with UTF-8 env
  execSync(gitCmd, {
    cwd: workspace,
    env: {
      ...process.env,
      LC_ALL: 'C.UTF-8',
      LANG: 'C.UTF-8',
    },
    encoding: 'utf8',
    stdio: 'inherit',
  });

  console.log(`[OK] Commit ${amend ? 'amended' : 'created'}`);
  console.log(`[NOTE] New hash:`);
  execSync('git log -1 --pretty=format:%H', { cwd: workspace, encoding: 'utf8', stdio: 'inherit' });
  console.log('');
}

main();
