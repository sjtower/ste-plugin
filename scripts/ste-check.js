#!/usr/bin/env node
'use strict';

/**
 * ste-check — deterministic Simplified Technical English checker.
 *
 * Checks the mechanical rules of ASD-STE100 that can be measured without the
 * copyrighted Part 2 dictionary: sentence length, paragraph length, voice,
 * -ing forms, noun clusters, contractions, and multi-instruction sentences.
 *
 * This tool does NOT verify dictionary compliance. It cannot tell you whether a
 * word is in the ~900-word approved list, because that list is copyright ASD and
 * is not redistributable. A clean report is not a compliance claim.
 *
 * Zero dependencies. Node 18+.
 */

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ config */

const DEFAULTS = {
  maxProcedural: 20,
  maxDescriptive: 25,
  maxParagraph: 6,
  maxNounCluster: 3,
};

const SEVERITY_ORDER = { error: 0, warn: 1, review: 2 };

/**
 * -ing words that STE permits: technical nouns, or modifiers of technical
 * nouns. Extend with --allow-ing or an .stecheckrc.json "allowIng" array.
 */
const ING_ALLOWED = new Set([
  'bearing', 'bearings', 'housing', 'housings', 'casing', 'casings',
  'coating', 'coatings', 'tubing', 'wiring', 'packing', 'landing',
  'engineering', 'warning', 'warnings', 'setting', 'settings', 'string',
  'strings', 'spring', 'springs', 'ring', 'rings', 'fitting', 'fittings',
  'lining', 'linings', 'mounting', 'mountings', 'opening', 'openings',
  'covering', 'coverings', 'grating', 'gratings', 'bushing', 'bushings',
  'training', 'building', 'buildings', 'ceiling', 'ceilings', 'heading',
  'headings', 'reading', 'readings', 'drawing', 'drawings', 'thing',
  'things', 'during', 'morning', 'evening', 'plumbing', 'briefing',
  // software-domain technical nouns
  'logging', 'caching', 'routing', 'polling', 'testing', 'debugging',
  'encoding', 'encodings', 'formatting', 'indexing', 'mapping', 'mappings',
  'binding', 'bindings', 'listing', 'listings', 'templating', 'tooling',
  'versioning', 'namespacing', 'sharding', 'batching', 'streaming',
  'onboarding', 'offboarding', 'monitoring', 'alerting', 'tracing',
  'profiling', 'linting', 'bundling', 'scaffolding', 'seeding',
  'naming', 'ordering', 'tracking', 'staging', 'timing', 'spacing',
  'sizing', 'layering', 'framing', 'pairing', 'queueing', 'queuing',
  // language-about-language nouns, common in documentation about docs
  'meaning', 'meanings', 'writing', 'writings', 'wording', 'spelling',
  'numbering', 'understanding', 'phrasing', 'reasoning',
  'marketing', 'packaging', 'branding', 'accounting', 'billing', 'pricing',
]);

/**
 * Words that end in the letters "ing" but are not -ing verb forms. Without
 * this set, "nothing" and "ceiling" are reported as gerunds.
 */
const NOT_ING_FORMS = new Set([
  'nothing', 'something', 'anything', 'everything', 'thing', 'things',
  'during', 'ceiling', 'ceilings', 'sibling', 'siblings', 'string', 'strings',
  'spring', 'springs', 'king', 'kings', 'ring', 'rings', 'wing', 'wings',
  'being', 'sterling', 'shilling', 'viking', 'lightning', 'morning',
  'evening', 'evenings', 'mornings', 'darling', 'ongoing',
]);

/** Words that never count toward a noun cluster. */
const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'so', 'yet', 'if', 'then',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'into',
  'onto', 'over', 'under', 'about', 'after', 'before', 'between', 'through',
  'during', 'without', 'within', 'against', 'per', 'via', 'up', 'down', 'out',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'do', 'does', 'did', 'have', 'has', 'had',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'not', 'no', 'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your',
  'we', 'our', 'they', 'their', 'he', 'she', 'his', 'her', 'them', 'us',
  'i', 'me', 'my', 'all', 'any', 'each', 'both', 'more', 'most', 'other',
  'some', 'such', 'only', 'same', 'than', 'too', 'very', 'when', 'where',
  'which', 'who', 'whom', 'why', 'how', 'what', 'there', 'here',
  // Finite verbs that are not part of a noun cluster.
  'cannot', 'requires', 'require', 'removes', 'includes', 'contains',
  'provides', 'allows', 'returns', 'verify', 'means', 'gives', 'makes',
  'uses', 'needs', 'shows', 'holds', 'gets', 'gets', 'gives', 'gives',
]);

/** Irregular past participles that signal passive voice after a be-verb. */
const IRREGULAR_PARTICIPLES = new Set([
  'made', 'done', 'set', 'put', 'sent', 'built', 'held', 'kept', 'left',
  'lost', 'met', 'paid', 'read', 'run', 'said', 'seen', 'shown', 'shut',
  'told', 'taken', 'given', 'written', 'driven', 'known', 'grown', 'drawn',
  'thrown', 'blown', 'broken', 'chosen', 'frozen', 'spoken', 'stolen',
  'woken', 'worn', 'torn', 'born', 'found', 'bound', 'wound', 'ground',
  'brought', 'bought', 'caught', 'taught', 'fought', 'sought', 'thought',
  'cut', 'hit', 'let', 'shut', 'split', 'spread', 'cost', 'hurt',
]);

const BE_VERBS = new Set(['is', 'are', 'was', 'were', 'be', 'been', 'being', 'am']);

/**
 * Plain-English simplifications consistent with STE principles.
 *
 * IMPORTANT: this is NOT the ASD-STE100 Part 2 dictionary and is not derived
 * from it. It is a short, non-exhaustive list of common wordy constructions and
 * their plainer equivalents, of the kind published in public writing guides.
 * The approved word for any given case is defined by the official specification.
 */
const WORD_CHOICES = new Map(Object.entries({
  'utilize': 'use',
  'utilise': 'use',
  'utilization': 'use',
  'commence': 'start',
  'terminate': 'stop',
  'endeavor': 'try',
  'endeavour': 'try',
  'ascertain': 'find out',
  'facilitate': 'help',
  'accomplish': 'do',
  'possess': 'have',
  'purchase': 'buy',
  'obtain': 'get',
  'sufficient': 'enough',
  'numerous': 'many',
  'additional': 'more',
  'approximately': 'about',
  'currently': 'now',
  'previously': 'before',
  'subsequently': 'then',
  'therefore': 'so',
  'however': 'but',
  'furthermore': 'also',
  'moreover': 'also',
  'nevertheless': 'but',
  'regarding': 'about',
  'concerning': 'about',
  'assist': 'help',
  'attempt': 'try',
  'initiate': 'start',
  'indicate': 'show',
  'require': 'need',
  'demonstrate': 'show',
  'modification': 'change',
  'notification': 'message',
  'functionality': 'function',
  'leverage': 'use',
  'aforementioned': 'this',
}));

/** Multi-word wordy phrases. Checked before single words. */
const PHRASE_CHOICES = new Map(Object.entries({
  'prior to': 'before',
  'subsequent to': 'after',
  'in order to': 'to',
  'in the event that': 'if',
  'in the event of': 'if',
  'due to the fact that': 'because',
  'owing to the fact that': 'because',
  'for the purpose of': 'to',
  'with the exception of': 'except',
  'in the vicinity of': 'near',
  'at this point in time': 'now',
  'at the present time': 'now',
  'a large number of': 'many',
  'a number of': 'some',
  'in excess of': 'more than',
  'is able to': 'can',
  'are able to': 'can',
  'has the ability to': 'can',
  'it is necessary to': 'you must',
  'it is possible to': 'you can',
  'make sure that': 'make sure',
  'in conjunction with': 'with',
  'in accordance with': 'per',
  'as a means of': 'to',
  'take into consideration': 'consider',
  'on a regular basis': 'regularly',
}));

const CONTRACTIONS = /\b(?:can't|won't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|shouldn't|wouldn't|couldn't|mustn't|it's|that's|there's|you're|we're|they're|i'm|let's|you'll|we'll|they'll|you've|we've|they've|i've)\b/gi;

/** Sentence-initial verbs that mark an imperative (procedural) sentence. */
const IMPERATIVE_HINTS = new Set([
  'add', 'apply', 'attach', 'be', 'build', 'calculate', 'call', 'change',
  'check', 'clean', 'clear', 'click', 'close', 'configure', 'connect', 'copy',
  'create', 'cut', 'delete', 'disconnect', 'do', 'download', 'edit', 'enter',
  'examine', 'find', 'fit', 'get', 'give', 'go', 'hold', 'increase', 'insert',
  'install', 'keep', 'lift', 'loosen', 'make', 'measure', 'move', 'open',
  'operate', 'press', 'pull', 'push', 'put', 'read', 'record', 'release',
  'remove', 'repeat', 'replace', 'reset', 'restart', 'run', 'save', 'select',
  'send', 'set', 'start', 'stop', 'switch', 'take', 'test', 'tighten', 'turn',
  'type', 'update', 'upload', 'use', 'verify', 'wait', 'write',
]);

/* --------------------------------------------------------------- utilities */

/**
 * Replace every character of markdown constructs that must not be checked with
 * a space, preserving newlines and total length so byte offsets stay valid.
 */
function maskMarkdown(text) {
  const chars = text.split('');
  const blank = (start, end) => {
    for (let i = start; i < end && i < chars.length; i++) {
      if (chars[i] !== '\n') chars[i] = ' ';
    }
  };

  // Fenced code blocks (``` or ~~~).
  const fence = /^([ \t]*)(`{3,}|~{3,})[^\n]*\n([\s\S]*?)(?:^[ \t]*\2[^\n]*$|\z)/gm;
  let m;
  while ((m = fence.exec(text)) !== null) {
    blank(m.index, m.index + m[0].length);
  }

  const maskPattern = (re) => {
    let hit;
    while ((hit = re.exec(text)) !== null) {
      blank(hit.index, hit.index + hit[0].length);
    }
  };

  // Explicit opt-out regions, for docs that quote bad text on purpose:
  //   <!-- ste-check:off -->  ...not checked...  <!-- ste-check:on -->
  const offOn = /<!--\s*ste-check:off\s*-->[\s\S]*?(?:<!--\s*ste-check:on\s*-->|$)/g;
  maskPattern(offOn);
  // Single-line opt-out: <!-- ste-check:ignore --> masks the line that follows.
  const ignoreNext = /<!--\s*ste-check:ignore\s*-->[^\n]*\n[^\n]*/g;
  maskPattern(ignoreNext);

  maskPattern(/`[^`\n]+`/g);                 // inline code
  maskPattern(/<!--[\s\S]*?-->/g);           // html comments
  maskPattern(/^[ \t]{4,}\S[^\n]*$/gm);      // indented code blocks
  maskPattern(/\]\([^)\s]+\)/g);             // link targets, keeps [text]
  maskPattern(/^[ \t]*\|[^\n]*\|[ \t]*$/gm); // markdown tables
  maskPattern(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm); // horizontal rules
  maskPattern(/https?:\/\/\S+/g);            // bare urls
  maskPattern(/^---\n[\s\S]*?\n---/g);       // yaml frontmatter

  return chars.join('');
}

function buildLineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function offsetToLine(lineStarts, offset) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

const ABBREVIATIONS = /(?:\b(?:e\.g|i\.e|etc|vs|approx|fig|no|ref|min|max|sec|cf|al|inc|ltd|co|dr|mr|mrs|ms|st|vol|ch|pp|ex)\.)$/i;

/**
 * Split a block into sentences, returning { text, offset } with offsets
 * relative to the start of the whole document.
 */
function splitSentences(block, blockOffset) {
  const out = [];
  let start = 0;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;

    const head = block.slice(start, i + 1);
    if (ABBREVIATIONS.test(head.trimEnd())) continue;
    // A decimal point or version number, e.g. "3.14" or "v1.2".
    if (ch === '.' && /\d$/.test(block[i - 1] || '') && /\d/.test(block[i + 1] || '')) continue;
    // Single capital letter before the dot is likely an initial.
    if (ch === '.' && /(?:^|\s)[A-Z]$/.test(block.slice(Math.max(0, i - 2), i))) continue;

    const rest = block.slice(i + 1);
    if (rest.length && !/^\s/.test(rest)) continue;
    if (rest.length && !/^\s+["'(\[]?[A-Z0-9]/.test(rest) && rest.trim().length) continue;

    const piece = block.slice(start, i + 1);
    if (piece.trim()) out.push({ text: piece.trim(), offset: blockOffset + start + (piece.length - piece.trimStart().length) });
    start = i + 1;
  }

  const tail = block.slice(start);
  if (tail.trim()) {
    out.push({ text: tail.trim(), offset: blockOffset + start + (tail.length - tail.trimStart().length) });
  }
  return out;
}

/** Strip markdown list markers, heading hashes, and blockquote marks. */
function stripBlockMarkers(line) {
  return line
    .replace(/^[ \t]*>[ \t]?/, '')
    .replace(/^[ \t]*#{1,6}[ \t]+/, '')
    .replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/, '');
}

function countWords(sentence) {
  const cleaned = sentence
    .replace(/[*_~]/g, '')
    .replace(/\[([^\]]*)\]/g, '$1')
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

function isImperative(sentence) {
  const first = stripBlockMarkers(sentence).trim().split(/\s+/)[0] || '';
  return IMPERATIVE_HINTS.has(first.toLowerCase().replace(/[^a-z]/g, ''));
}

/* ------------------------------------------------------------------ checks */

function checkSentenceLength(sentence, ctx, opts, push) {
  const words = countWords(sentence.text);
  const procedural = ctx.isListItem || isImperative(sentence.text);
  const limit = procedural ? opts.maxProcedural : opts.maxDescriptive;
  if (words > limit) {
    push({
      rule: 'sentence-length',
      severity: 'error',
      offset: sentence.offset,
      message: `${procedural ? 'Procedural' : 'Descriptive'} sentence has ${words} words (limit ${limit}).`,
      hint: 'Split it into two sentences, or remove the qualifying clause.',
      excerpt: sentence.text,
    });
  }
}

function checkMultipleInstructions(sentence, ctx, opts, push) {
  if (!(ctx.isListItem || isImperative(sentence.text))) return;
  const body = stripBlockMarkers(sentence.text);

  if (/;/.test(body)) {
    push({
      rule: 'one-instruction',
      severity: 'warn',
      offset: sentence.offset,
      message: 'Procedural sentence contains a semicolon, which usually joins two instructions.',
      hint: 'Give one instruction per sentence. Split at the semicolon.',
      excerpt: sentence.text,
    });
    return;
  }

  const words = body.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, ''));
  const andIndexes = words.map((w, i) => (w === 'and' || w === 'then' ? i : -1)).filter((i) => i > 0);
  for (const i of andIndexes) {
    const next = words[i + 1];
    if (next && IMPERATIVE_HINTS.has(next)) {
      push({
        rule: 'one-instruction',
        severity: 'warn',
        offset: sentence.offset,
        message: `Procedural sentence joins two instructions with "${words[i]} ${next}".`,
        hint: 'Give one instruction per sentence. Make this two numbered steps.',
        excerpt: sentence.text,
      });
      return;
    }
  }
}

function checkPassiveVoice(sentence, ctx, opts, push) {
  const body = stripBlockMarkers(sentence.text);
  const tokens = body.split(/\s+/);
  for (let i = 0; i < tokens.length - 1; i++) {
    const word = tokens[i].toLowerCase().replace(/[^a-z]/g, '');
    if (!BE_VERBS.has(word)) continue;

    // Allow one adverb between the be-verb and the participle.
    for (let j = i + 1; j <= i + 2 && j < tokens.length; j++) {
      const cand = tokens[j].toLowerCase().replace(/[^a-z]/g, '');
      if (!cand) continue;
      if (j === i + 1 && /ly$/.test(cand)) continue;
      const looksParticiple = (/ed$/.test(cand) && cand.length > 3) || IRREGULAR_PARTICIPLES.has(cand);
      if (!looksParticiple) break;
      const shown = `${tokens[i]} ${tokens[j]}`.replace(/[^\w\s'-]+$/, '');
      push({
        rule: 'passive-voice',
        severity: 'warn',
        offset: sentence.offset,
        message: `Passive voice: "${shown}".`,
        hint: 'Use the active voice. Name the agent that does the action.',
        excerpt: sentence.text,
      });
      return;
    }
  }
}

function checkIngForms(sentence, ctx, opts, push) {
  const body = stripBlockMarkers(sentence.text);
  const re = /\b([A-Za-z]{4,}ing)\b/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const word = m[1].toLowerCase();
    if (NOT_ING_FORMS.has(word) || ING_ALLOWED.has(word) || opts.allowIng.has(word)) continue;
    push({
      rule: 'ing-form',
      severity: 'review',
      offset: sentence.offset + m.index,
      message: `"${m[1]}" is an -ing form.`,
      hint: 'STE allows -ing only as a technical noun or as a modifier of one. Otherwise use a simple tense. Add the word to allowIng if it is a technical noun here.',
      excerpt: sentence.text,
    });
  }
}

function checkNounCluster(sentence, ctx, opts, push) {
  const body = stripBlockMarkers(sentence.text)
    .replace(/['’]s\b/g, '')   // drop possessives, not the head noun
    .replace(/['’]/g, '');     // keep contractions as one token

  // Any punctuation ends a noun cluster. Tokenise into words and BREAK marks so
  // that a comma-separated list is not read as one long cluster.
  const tokens = [];
  const tokenRe = /([A-Za-z][A-Za-z-]*)|([^\sA-Za-z]+)/g;
  let t;
  while ((t = tokenRe.exec(body)) !== null) {
    tokens.push(t[1] !== undefined ? t[1] : 'BREAK');
  }

  let run = [];
  const flush = () => {
    if (run.length > opts.maxNounCluster) {
      push({
        rule: 'noun-cluster',
        severity: 'review',
        offset: sentence.offset,
        message: `Possible noun cluster of ${run.length} words: "${run.join(' ')}".`,
        hint: `Use at most ${opts.maxNounCluster} words in a noun cluster. Break it up with a preposition, for example "the rate of failure of the pump".`,
        excerpt: sentence.text,
      });
    }
    run = [];
  };
  for (const raw of tokens) {
    if (raw === 'BREAK') { flush(); continue; }
    const w = raw.toLowerCase();
    const isContent = !FUNCTION_WORDS.has(w) && !/ed$|ly$|ing$/.test(w);
    if (isContent) run.push(raw);
    else flush();
  }
  flush();
}

function checkWordChoice(sentence, ctx, opts, push) {
  const body = stripBlockMarkers(sentence.text);
  const lower = body.toLowerCase();

  for (const [phrase, better] of PHRASE_CHOICES) {
    let idx = lower.indexOf(phrase);
    while (idx !== -1) {
      const before = lower[idx - 1];
      const after = lower[idx + phrase.length];
      if ((!before || !/\w/.test(before)) && (!after || !/\w/.test(after))) {
        push({
          rule: 'word-choice',
          severity: 'warn',
          offset: sentence.offset + idx,
          message: `"${phrase}" is wordy.`,
          hint: `Consider "${better}".`,
          excerpt: sentence.text,
        });
      }
      idx = lower.indexOf(phrase, idx + phrase.length);
    }
  }

  const re = /\b([A-Za-z]+)\b/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const better = WORD_CHOICES.get(m[1].toLowerCase());
    if (!better) continue;
    push({
      rule: 'word-choice',
      severity: 'warn',
      offset: sentence.offset + m.index,
      message: `"${m[1]}" is not the plainest choice.`,
      hint: `Consider "${better}".`,
      excerpt: sentence.text,
    });
  }
}

function checkContractions(sentence, ctx, opts, push) {
  const body = stripBlockMarkers(sentence.text);
  CONTRACTIONS.lastIndex = 0;
  let m;
  while ((m = CONTRACTIONS.exec(body)) !== null) {
    push({
      rule: 'contraction',
      severity: 'error',
      offset: sentence.offset + m.index,
      message: `Contraction "${m[0]}".`,
      hint: 'Write the full form. STE does not allow contractions.',
      excerpt: sentence.text,
    });
  }
}

const SENTENCE_CHECKS = [
  checkSentenceLength,
  checkMultipleInstructions,
  checkPassiveVoice,
  checkIngForms,
  checkNounCluster,
  checkWordChoice,
  checkContractions,
];

/* ------------------------------------------------------------------- engine */

function analyze(raw, opts) {
  const masked = maskMarkdown(raw);
  const lineStarts = buildLineIndex(raw);
  const findings = [];
  const push = (f) => {
    findings.push({ ...f, line: offsetToLine(lineStarts, f.offset) });
  };

  // Walk blocks: runs of consecutive non-blank lines.
  const lines = masked.split('\n');
  let i = 0;
  while (i < lines.length) {
    if (!lines[i].trim()) { i++; continue; }
    const startLine = i;
    while (i < lines.length && lines[i].trim()) i++;
    const endLine = i;

    const blockOffset = lineStarts[startLine];
    const blockText = masked.slice(blockOffset, lineStarts[endLine] !== undefined ? lineStarts[endLine] - 1 : masked.length);

    const firstLine = lines[startLine];
    const isHeading = /^[ \t]*#{1,6}[ \t]+/.test(firstLine);
    const isListItem = /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/.test(firstLine);

    if (isHeading) {
      // Headings get word-choice and contraction checks only.
      const s = { text: blockText.trim(), offset: blockOffset };
      checkWordChoice(s, {}, opts, push);
      checkContractions(s, {}, opts, push);
      continue;
    }

    // A run of list lines is many items, not one paragraph. Segment it so a
    // sentence never bleeds from one item into the next.
    const segments = [];
    if (isListItem) {
      const marker = /^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/;
      let segStart = startLine;
      for (let k = startLine + 1; k < endLine; k++) {
        if (!marker.test(lines[k])) continue;
        segments.push([segStart, k]);
        segStart = k;
      }
      segments.push([segStart, endLine]);
    } else {
      segments.push([startLine, endLine]);
    }

    const ctx = { isListItem };
    let sentences = [];
    for (const [from, to] of segments) {
      const off = lineStarts[from];
      const end = lineStarts[to] !== undefined ? lineStarts[to] - 1 : masked.length;
      const segSentences = splitSentences(masked.slice(off, end), off);
      for (const s of segSentences) {
        if (!/[A-Za-z]/.test(s.text)) continue;
        for (const check of SENTENCE_CHECKS) check(s, ctx, opts, push);
      }
      sentences = sentences.concat(segSentences);
    }

    if (!isListItem && sentences.length > opts.maxParagraph) {
      push({
        rule: 'paragraph-length',
        severity: 'error',
        offset: blockOffset,
        message: `Paragraph has ${sentences.length} sentences (limit ${opts.maxParagraph}).`,
        hint: 'Split the paragraph, or move some sentences into a list.',
        excerpt: sentences[0].text,
      });
    }
  }

  findings.sort((a, b) => a.line - b.line || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  return findings;
}

/* ------------------------------------------------------------------ output */

const COLORS = {
  error: '[31m', warn: '[33m', review: '[36m',
  dim: '[2m', bold: '[1m', reset: '[0m',
};

function renderText(results, opts) {
  const useColor = opts.color;
  const c = (key, s) => (useColor ? COLORS[key] + s + COLORS.reset : s);
  const out = [];
  let totals = { error: 0, warn: 0, review: 0 };

  for (const { file, findings } of results) {
    if (!findings.length) {
      if (!opts.quiet) out.push(`${c('bold', file)}  ${c('dim', 'no findings')}`);
      continue;
    }
    out.push(c('bold', file));
    for (const f of findings) {
      totals[f.severity]++;
      out.push(
        `  ${c('dim', String(f.line).padStart(5))}  ${c(f.severity, f.severity.padEnd(6))} ${c('dim', f.rule.padEnd(18))} ${f.message}`
      );
      if (opts.verbose && f.hint) out.push(`         ${c('dim', '↳ ' + f.hint)}`);
    }
    out.push('');
  }

  const sum = totals.error + totals.warn + totals.review;
  out.push(
    sum === 0
      ? c('dim', 'Clean. Note: mechanical rules only; dictionary compliance is not checked.')
      : `${totals.error} error, ${totals.warn} warn, ${totals.review} review  ${c('dim', '— mechanical rules only; dictionary compliance is not checked.')}`
  );
  return out.join('\n');
}

function renderMarkdown(results) {
  const out = ['# Simplified Technical English report', ''];
  let any = false;
  for (const { file, findings } of results) {
    out.push(`## ${file}`, '');
    if (!findings.length) { out.push('No findings.', ''); continue; }
    any = true;
    out.push('| Line | Severity | Rule | Finding |', '| ---: | --- | --- | --- |');
    for (const f of findings) {
      out.push(`| ${f.line} | ${f.severity} | \`${f.rule}\` | ${f.message.replace(/\|/g, '\\|')} |`);
    }
    out.push('');
  }
  out.push('---', '', '_Mechanical rules only. This report does not check the ASD-STE100 Part 2 dictionary and is not a compliance claim._');
  return out.join('\n');
}

/* -------------------------------------------------------------------- main */

function loadConfig(startDir) {
  let dir = path.resolve(startDir);
  for (;;) {
    const candidate = path.join(dir, '.stecheckrc.json');
    if (fs.existsSync(candidate)) {
      try { return JSON.parse(fs.readFileSync(candidate, 'utf8')); }
      catch (e) { process.stderr.write(`ste-check: cannot parse ${candidate}: ${e.message}\n`); return {}; }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return {};
    dir = parent;
  }
}

function collectFiles(inputs) {
  const files = [];
  const walk = (p) => {
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      for (const entry of fs.readdirSync(p)) {
        if (entry === 'node_modules' || entry === '.git' || entry.startsWith('.')) continue;
        walk(path.join(p, entry));
      }
    } else if (/\.(md|markdown|mdx|txt)$/i.test(p)) {
      files.push(p);
    }
  };
  for (const input of inputs) {
    if (!fs.existsSync(input)) {
      process.stderr.write(`ste-check: no such path: ${input}\n`);
      process.exitCode = 2;
      continue;
    }
    walk(input);
  }
  return files;
}

function parseArgs(argv) {
  const opts = {
    ...DEFAULTS,
    format: 'text',
    color: process.stdout.isTTY && !process.env.NO_COLOR,
    quiet: false,
    verbose: false,
    allowIng: new Set(),
    failOn: 'error',
    inputs: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const num = (v) => Number.parseInt(v, 10);
    switch (a) {
      case '--json': opts.format = 'json'; break;
      case '--markdown': case '--md': opts.format = 'markdown'; break;
      case '--quiet': case '-q': opts.quiet = true; break;
      case '--verbose': case '-v': opts.verbose = true; break;
      case '--no-color': opts.color = false; break;
      case '--max-procedural': opts.maxProcedural = num(argv[++i]); break;
      case '--max-descriptive': opts.maxDescriptive = num(argv[++i]); break;
      case '--max-paragraph': opts.maxParagraph = num(argv[++i]); break;
      case '--max-noun-cluster': opts.maxNounCluster = num(argv[++i]); break;
      case '--allow-ing': argv[++i].split(',').forEach((w) => opts.allowIng.add(w.trim().toLowerCase())); break;
      case '--fail-on': opts.failOn = argv[++i]; break;
      case '--help': case '-h': opts.help = true; break;
      default:
        if (a.startsWith('-')) { process.stderr.write(`ste-check: unknown option ${a}\n`); process.exit(2); }
        opts.inputs.push(a);
    }
  }
  return opts;
}

const USAGE = `ste-check — deterministic Simplified Technical English checker

Usage: ste-check [options] <file-or-dir>...

Options:
  --json                 Machine-readable output
  --markdown, --md       Markdown report
  -v, --verbose          Show the fix hint for each finding
  -q, --quiet            Hide files that have no findings
  --no-color             Disable colour
  --max-procedural  <n>  Word limit for procedural sentences (default 20)
  --max-descriptive <n>  Word limit for descriptive sentences (default 25)
  --max-paragraph   <n>  Sentence limit per paragraph (default 6)
  --max-noun-cluster <n> Word limit for noun clusters (default 3)
  --allow-ing a,b,c      Treat these -ing words as technical nouns
  --fail-on <level>      Exit 1 at error|warn|review|never (default error)

Config: .stecheckrc.json in the file's directory or a parent.

This tool checks the mechanical rules only. It cannot check the ASD-STE100
Part 2 dictionary, which is copyright ASD and is not redistributable.
A clean report is not a claim of compliance.`;

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.inputs.length) {
    process.stdout.write(USAGE + '\n');
    process.exit(opts.help ? 0 : 2);
  }

  const cfg = loadConfig(opts.inputs[0]);
  if (cfg.maxProcedural) opts.maxProcedural = cfg.maxProcedural;
  if (cfg.maxDescriptive) opts.maxDescriptive = cfg.maxDescriptive;
  if (cfg.maxParagraph) opts.maxParagraph = cfg.maxParagraph;
  if (cfg.maxNounCluster) opts.maxNounCluster = cfg.maxNounCluster;
  if (Array.isArray(cfg.allowIng)) cfg.allowIng.forEach((w) => opts.allowIng.add(String(w).toLowerCase()));

  const files = collectFiles(opts.inputs);
  const results = files.map((file) => ({
    file: path.relative(process.cwd(), file) || file,
    findings: analyze(fs.readFileSync(file, 'utf8'), opts),
  }));

  if (opts.format === 'json') {
    process.stdout.write(JSON.stringify({ results }, null, 2) + '\n');
  } else if (opts.format === 'markdown') {
    process.stdout.write(renderMarkdown(results) + '\n');
  } else {
    process.stdout.write(renderText(results, opts) + '\n');
  }

  if (opts.failOn === 'never') return;
  const threshold = SEVERITY_ORDER[opts.failOn];
  if (threshold === undefined) return;
  const hit = results.some((r) => r.findings.some((f) => SEVERITY_ORDER[f.severity] <= threshold));
  if (hit) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { analyze, maskMarkdown, splitSentences, countWords, DEFAULTS };
