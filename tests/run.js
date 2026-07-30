#!/usr/bin/env node
'use strict';

/** Minimal zero-dependency test runner for ste-check. */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { analyze, maskMarkdown, countWords, splitSentences, DEFAULTS } = require('../scripts/ste-check.js');

const opts = { ...DEFAULTS, allowIng: new Set() };
const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`  ok    ${name}\n`);
  } catch (e) {
    failed++;
    process.stdout.write(`  FAIL  ${name}\n        ${e.message}\n`);
  }
}

const rulesIn = (findings) => new Set(findings.map((f) => f.rule));
const byRule = (findings, rule) => findings.filter((f) => f.rule === rule);

/* ------------------------------------------------------------- unit checks */

test('maskMarkdown preserves length and newlines', () => {
  const src = '# Hi\n\n```\ncode here\n```\n\ntext\n';
  const out = maskMarkdown(src);
  assert.strictEqual(out.length, src.length, 'length changed');
  assert.strictEqual(out.split('\n').length, src.split('\n').length, 'line count changed');
});

test('maskMarkdown blanks fenced code', () => {
  const src = 'before\n\n```\nutilize prior to\n```\n\nafter\n';
  assert.ok(!maskMarkdown(src).includes('utilize'), 'code fence not masked');
});

test('maskMarkdown blanks inline code', () => {
  assert.ok(!maskMarkdown('Use `utilize` here.').includes('utilize'), 'inline code not masked');
});

test('countWords ignores markdown emphasis', () => {
  assert.strictEqual(countWords('**Set** the *valve* to OFF.'), 5);
});

test('splitSentences does not split on abbreviations', () => {
  const s = splitSentences('Use the tool, e.g. a wrench. Then stop.', 0);
  assert.strictEqual(s.length, 2, `expected 2 sentences, got ${s.length}`);
});

test('splitSentences does not split decimals', () => {
  const s = splitSentences('Tighten to 20.5 Nm. Then stop.', 0);
  assert.strictEqual(s.length, 2, `expected 2 sentences, got ${s.length}`);
});

/* --------------------------------------------------------- fixture: clean */

test('clean fixture produces no errors', () => {
  const findings = analyze(fixture('clean.md'), opts);
  const errors = findings.filter((f) => f.severity === 'error');
  assert.strictEqual(errors.length, 0, `unexpected errors: ${JSON.stringify(errors.map((e) => [e.line, e.rule, e.message]))}`);
});

/* ---------------------------------------------------- fixture: violations */

const v = analyze(fixture('violations.md'), opts);

test('detects over-long descriptive sentence', () => {
  const hits = byRule(v, 'sentence-length');
  assert.ok(hits.length >= 1, 'no sentence-length finding');
});

test('detects contraction', () => {
  const hits = byRule(v, 'contraction');
  assert.ok(hits.some((f) => /Don't/i.test(f.message)), `no contraction finding: ${JSON.stringify(hits.map((h) => h.message))}`);
});

test('detects passive voice', () => {
  const hits = byRule(v, 'passive-voice');
  assert.ok(hits.some((f) => /was replaced/i.test(f.message)), `no passive finding: ${JSON.stringify(hits.map((h) => h.message))}`);
});

test('detects wordy phrase "prior to"', () => {
  const hits = byRule(v, 'word-choice');
  assert.ok(hits.some((f) => /prior to/i.test(f.message)), 'no "prior to" finding');
});

test('detects "utilize"', () => {
  const hits = byRule(v, 'word-choice');
  assert.ok(hits.some((f) => /utilize/i.test(f.message)), 'no "utilize" finding');
});

test('detects two instructions joined by "and then"', () => {
  const hits = byRule(v, 'one-instruction');
  assert.ok(hits.length >= 1, 'no one-instruction finding');
});

test('detects over-long paragraph', () => {
  const hits = byRule(v, 'paragraph-length');
  assert.ok(hits.length >= 1, 'no paragraph-length finding');
});

test('ignores content inside fenced code blocks', () => {
  const codeFenceLine = fixture('violations.md').split('\n').findIndex((l) => l.includes('This code block is not checked')) + 1;
  assert.ok(!v.some((f) => f.line === codeFenceLine), `finding reported inside code fence at line ${codeFenceLine}`);
});

test('ignores content inside inline code', () => {
  const line = fixture('violations.md').split('\n').findIndex((l) => l.includes('Inline `')) + 1;
  const hits = v.filter((f) => f.line === line && f.rule === 'contraction');
  assert.strictEqual(hits.length, 0, 'flagged a contraction inside inline code');
});

test('every finding carries a line, rule, severity, and hint', () => {
  for (const f of v) {
    assert.ok(Number.isInteger(f.line) && f.line > 0, `bad line: ${JSON.stringify(f)}`);
    assert.ok(f.rule && f.severity && f.message && f.hint, `incomplete finding: ${JSON.stringify(f)}`);
    assert.ok(['error', 'warn', 'review'].includes(f.severity), `bad severity: ${f.severity}`);
  }
});

test('a sentence does not bleed across two list items', () => {
  // Without per-item segmentation these two short items merge into one
  // 21-word "sentence" and trip the procedural limit.
  const src = [
    '# Title',
    '',
    '- **Part 1** — 53 writing rules. This plugin paraphrases them.',
    '- **Part 2** — about 900 approved words and 1,200 non-approved words.',
    '',
  ].join('\n');
  const hits = byRule(analyze(src, opts), 'sentence-length');
  assert.strictEqual(hits.length, 0, `false positive: ${JSON.stringify(hits.map((h) => h.message))}`);
});

test('a genuinely long list item is still flagged', () => {
  const src = '- Remove the panel from the assembly and then carefully install the replacement gasket into the groove before you tighten every bolt.\n';
  const hits = byRule(analyze(src, opts), 'sentence-length');
  assert.strictEqual(hits.length, 1, `expected 1 finding, got ${hits.length}`);
});

test('ste-check:off / :on suppresses a region', () => {
  const src = 'Don\'t do this.\n\n<!-- ste-check:off -->\nDon\'t do this either.\n<!-- ste-check:on -->\n\nDon\'t do this.\n';
  const hits = byRule(analyze(src, opts), 'contraction');
  assert.strictEqual(hits.length, 2, `expected 2 findings outside the region, got ${hits.length}`);
});

test('ste-check:ignore suppresses the next line only', () => {
  const src = '<!-- ste-check:ignore -->\nDon\'t flag this.\n\nDon\'t miss this.\n';
  const hits = byRule(analyze(src, opts), 'contraction');
  assert.strictEqual(hits.length, 1, `expected 1 finding, got ${hits.length}`);
});

test('a word inside a matched phrase is not reported twice', () => {
  const hits = byRule(analyze('Work in close proximity to the panel.\n', opts), 'word-choice');
  assert.strictEqual(hits.length, 1, `expected 1 finding, got ${hits.length}: ${JSON.stringify(hits.map((h) => h.message))}`);
  assert.ok(/in close proximity to/.test(hits[0].message), 'expected the phrase finding to win');
});

test('a word outside any phrase is still reported', () => {
  const hits = byRule(analyze('Check the proximity of the panel.\n', opts), 'word-choice');
  assert.strictEqual(hits.length, 1, `expected 1 finding, got ${hits.length}`);
});

test('findings are sorted by line', () => {
  for (let i = 1; i < v.length; i++) {
    assert.ok(v[i].line >= v[i - 1].line, `out of order at index ${i}`);
  }
});

/* ------------------------------------------------------------------ hooks */

const { execFileSync } = require('child_process');
const hook = (name, env) => execFileSync('node', [path.join(__dirname, '..', 'hooks', name)], {
  encoding: 'utf8',
  env: { ...process.env, ...env },
});

test('activate hook emits the ruleset in prose mode', () => {
  const out = hook('ste-activate.js', { STE_MODE: 'prose' });
  assert.ok(/SIMPLIFIED TECHNICAL ENGLISH ACTIVE/.test(out), 'no activation banner');
  assert.ok(/mode: prose/.test(out), 'mode not reported');
  assert.ok(/20 words or fewer/.test(out), 'sentence limit missing');
  assert.ok(/Do NOT apply STE to/.test(out), 'carve-outs missing in prose mode');
});

test('activate hook drops the carve-outs in strict mode', () => {
  const out = hook('ste-activate.js', { STE_MODE: 'strict' });
  assert.ok(/mode: strict/.test(out), 'mode not reported');
  assert.ok(/STRICT mode/.test(out), 'strict note missing');
  assert.ok(!/Do NOT apply STE to/.test(out), 'prose carve-outs leaked into strict');
});

test('activate hook stays silent when off', () => {
  const out = hook('ste-activate.js', { STE_MODE: 'off' });
  assert.strictEqual(out.trim(), 'OK', `expected bare OK, got: ${out.slice(0, 60)}`);
});

test('reminder hook emits one line when active', () => {
  const out = hook('ste-reminder.js', { STE_MODE: 'prose' });
  assert.ok(/STE ACTIVE \(prose\)/.test(out), 'no reminder');
  assert.strictEqual(out.split('\n').length, 1, 'reminder must be a single line');
});

test('reminder hook stays silent when off', () => {
  assert.strictEqual(hook('ste-reminder.js', { STE_MODE: 'off' }).trim(), '', 'expected no output');
});

test('an unknown STE_MODE falls back to the default', () => {
  const out = hook('ste-activate.js', { STE_MODE: 'banana' });
  assert.ok(/mode: prose/.test(out), 'bad mode did not fall back to prose');
});

test('hooks never exit non-zero', () => {
  for (const name of ['ste-activate.js', 'ste-reminder.js']) {
    for (const mode of ['off', 'prose', 'strict', 'nonsense']) {
      hook(name, { STE_MODE: mode }); // execFileSync throws on non-zero exit
    }
  }
});

test('the ruleset stays within a sane token budget', () => {
  const out = hook('ste-activate.js', { STE_MODE: 'prose' });
  const approxTokens = Math.ceil(out.length / 4);
  assert.ok(approxTokens < 900, `ruleset is ~${approxTokens} tokens; keep it under 900`);
});

/* ---------------------------------------------------------------- summary */

process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
if (failed) {
  process.stdout.write('\nAll findings in violations.md:\n');
  for (const f of v) process.stdout.write(`  ${String(f.line).padStart(3)}  ${f.severity.padEnd(6)} ${f.rule.padEnd(18)} ${f.message}\n`);
}
process.exit(failed ? 1 : 0);
