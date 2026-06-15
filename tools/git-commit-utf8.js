#!/usr/bin/env node
// git-commit-utf8.js
//
// Amend or create a git commit with a UTF-8 message file.
// Required on Windows + PowerShell: `git commit -F <file>` reads the file
// using the system default ANSI code page (GBK on Chinese Windows),
// which mangles UTF-8 Chinese/Japanese text. This wrapper:
//
//   1. Reads the message file in Node.js (always UTF-8 correct).
//   2. Pipes the content to `git commit -F -` via stdin (no shell, no
//      cmd.exe, no file path mangling, no code page interference).
//   3. Forces git to use UTF-8 via `-c i18n.commitEncoding=UTF-8` and
//      `-c i18n.logOutputEncoding=UTF-8`.
//
// Why stdin (not file path):
//   When you pass `-F <file-path>` via cmd.exe, git's file read can be
//   affected by the active code page (936 GBK on Chinese Windows) even
//   with i18n.commitEncoding=UTF-8 set. Piping the UTF-8 bytes via
//   stdin bypasses this entirely — Node writes raw UTF-8 to git, git
//      reads stdin and stores as commitEncoding (UTF-8). Round-trip clean.
//
// ⚠️ VERIFICATION CAVEAT (very important):
//   On Chinese Windows + PowerShell, `git log` / `git cat-file` output
//   displayed in the PowerShell console looks like mojibake (?? or 鏂?
//   style) even when the commit message is **correctly stored UTF-8**.
//   This is a PowerShell console rendering issue (code page 936 / GBK),
//   not a data issue. To actually verify commit message bytes are
//   correct UTF-8, read the raw commit object via Node and decode:
//
//     node -e "const b=require('child_process').execSync('git cat-file commit HEAD',{encoding:'buffer'}); \
//              const sep=b.indexOf(Buffer.from('\\n\\n')); \
//              const msg=b.slice(sep+2).toString('utf8'); \
//              console.log(msg.substring(0,200))"
//
//   If the first 200 chars show the correct Chinese/Japanese text, the
//   commit is correct. Don't trust `git log` on this Windows setup.
//
// MEMORY.md reference: see Rule 6 (Windows UTF-8 commit workaround).
//
// Usage:
//   node tools/git-commit-utf8.js <workspace> <message-file> [--amend]
//
// Behavior:
//   - Always uses `git commit -F -` (reads stdin). Supports multi-line
//     subject + body. The --amend flag adds --amend.
//   - DO NOT use `git commit -m "msg"` for multi-line UTF-8 — it only
//     takes the first line as subject, dropping the body.

const { spawnSync } = require('child_process');
const fs = require('fs');

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

  // Read as UTF-8 explicitly (Node.js does this correctly regardless of OS code page)
  const msg = fs.readFileSync(msgFile, 'utf8');
  console.log(`[OK] Read ${msg.length} chars from ${msgFile}`);
  console.log(`[OK] First 80 chars: ${msg.substring(0, 80).replace(/\n/g, '\\n')}`);

  // Build git args as an array (no shell, no cmd.exe, no path mangling)
  const gitArgs = [
    '-c', 'i18n.commitEncoding=UTF-8',
    '-c', 'i18n.logOutputEncoding=UTF-8',
    'commit',
    '-F', '-',                              // read message from stdin
  ];
  if (amend) gitArgs.push('--amend');

  // Spawn git with stdin pipe. Pass msg as UTF-8 buffer to git's stdin.
  // spawnSync with input option writes the bytes to the child's stdin.
  const res = spawnSync('git', gitArgs, {
    cwd: workspace,
    env: {
      ...process.env,
      LC_ALL: 'C.UTF-8',
      LANG: 'C.UTF-8',
    },
    input: msg,                              // UTF-8 string → auto-encoded to bytes
    input_encoding: 'utf8',
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit'],  // pipe stdin, inherit stdout/stderr
  });

  if (res.status !== 0) {
    console.error(`[FAIL] git commit exited with status ${res.status}`);
    if (res.stderr) console.error(res.stderr);
    process.exit(res.status || 1);
  }

  console.log(`[OK] Commit ${amend ? 'amended' : 'created'}`);
  console.log(`[NOTE] New hash:`);
  spawnSync('git', ['log', '-1', '--pretty=format:%H'], {
    cwd: workspace,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  console.log('');
}

main();
