#!/usr/bin/env node
// Qwen code reviewer — diff in, findings out. Trigger-agnostic:
//   local: `node scripts/review.mjs` (or the /qwen-review command)
//   CI:    `node scripts/review.mjs --ci --base origin/main` (see .github/workflows)
// Model/provider come from review.config.json; the API key stays in env.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// --- config -----------------------------------------------------------------
const config = JSON.parse(readFileSync(resolve(ROOT, 'review.config.json'), 'utf8'));

// Load QWEN_API_KEY from a local .env if present (gitignored); CI injects it directly.
try {
  process.loadEnvFile(resolve(ROOT, '.env'));
} catch {
  /* no .env — rely on the real environment */
}
const apiKey = process.env.QWEN_API_KEY;
if (!apiKey) {
  console.error('QWEN_API_KEY is not set (put it in .env locally or in CI secrets).');
  process.exit(2);
}

// --- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const getOpt = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

// --- diff -------------------------------------------------------------------
const git = (a) =>
  execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });

let diff;
if (hasFlag('--staged')) {
  diff = git(['diff', '--staged']);
} else if (getOpt('--range')) {
  diff = git(['diff', getOpt('--range')]);
} else {
  const base = getOpt('--base', config.baseRef);
  diff = git(['diff', `${base}...HEAD`]);
}

if (!diff.trim()) {
  console.log('No changes to review.');
  process.exit(0);
}

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim();

// --- prompt -----------------------------------------------------------------
const system = `You are a senior code reviewer. Review ONLY the changes in the unified diff.
Report concrete problems: bugs, security issues, broken logic, missed edge cases, and clear simplifications.
Skip style nitpicks unless they cause real risk.

Respond in Markdown. If there are no issues, write exactly: "No issues found."
Otherwise, one block per finding:

### [SEVERITY] path/to/file:line
**Problem:** ...
**Suggestion:** ...

SEVERITY is one of HIGH, MEDIUM, LOW.

End your reply with a final line in exactly this format and nothing after it:
SEVERITY_MAX: <HIGH|MEDIUM|LOW|NONE>
Set it to the highest severity among your findings, or NONE if there are no issues.`;

// Delimit the diff with plain markers (not a Markdown fence) so triple backticks
// inside the diff — common in this repo's docs — can't terminate the block early.
const userMsg = `Review the changes in this unified diff. It is delimited by markers, not Markdown:\n\nBEGIN_DIFF\n${diff}\nEND_DIFF`;

// --- call Qwen (OpenAI-compatible chat/completions) -------------------------
let res;
try {
  res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
    }),
    signal: AbortSignal.timeout(config.timeoutMs ?? 120000),
  });
} catch (err) {
  console.error(`Qwen request failed: ${err.message}`);
  process.exit(2);
}

if (!res.ok) {
  console.error(`Qwen API error ${res.status}: ${await res.text()}`);
  process.exit(2);
}

const data = await res.json();
const report = data.choices?.[0]?.message?.content?.trim();
if (!report) {
  console.error('Qwen returned an empty response.');
  process.exit(2);
}

// --- write report -----------------------------------------------------------
mkdirSync(resolve(ROOT, 'reviews'), { recursive: true });
const outPath = resolve(ROOT, 'reviews', `${branch.replace(/[^\w.-]+/g, '-')}.md`);
const header = `# Qwen review — \`${branch}\`\n\nModel: \`${config.model}\` · ${new Date().toISOString()}\n\n---\n\n`;
writeFileSync(outPath, header + report + '\n');
console.log(`Report written to ${outPath}`);

// --- severity gate (only with --ci; manual runs never fail) -----------------
// Read the machine-readable trailer, not the prose, so prompt-format drift can't
// silently green a PR. Fail closed: a missing trailer fails the check too.
if (hasFlag('--ci')) {
  const order = { none: 0, low: 1, medium: 2, high: 3 };
  const threshold = order[(config.failOn ?? 'high').toLowerCase()] ?? 3;
  const trailer = report.match(/^SEVERITY_MAX:\s*(HIGH|MEDIUM|LOW|NONE)\s*$/im);
  if (!trailer) {
    console.error('Review has no SEVERITY_MAX trailer — cannot gate, failing the check.');
    process.exit(1);
  }
  if ((order[trailer[1].toLowerCase()] ?? 0) >= threshold) {
    console.error(`Found issues at or above "${config.failOn}" severity — failing the check.`);
    process.exit(1);
  }
}
