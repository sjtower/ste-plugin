#!/usr/bin/env node
'use strict';

/**
 * ste — UserPromptSubmit hook.
 *
 * One short line per prompt. The SessionStart rule block anchors the style, but
 * it is the first thing context compression drops in a long session. This line
 * is cheap and keeps the style from drifting back to ordinary prose.
 *
 * Never blocks the prompt. Any failure exits 0 with no output.
 */

const { getMode } = require('./ste-config.js');

try {
  const mode = getMode();
  if (mode !== 'off') {
    process.stdout.write(
      'STE ACTIVE (' + mode + '). Write prose in Simplified Technical English: ' +
      'one meaning per word, active voice, imperative for instructions, ' +
      '20-word instructions and 25-word sentences, 6-sentence paragraphs, ' +
      'keep articles, no contractions, no -ing forms, no idiom. ' +
      'Code, commit messages, and exact quoted strings are exempt. ' +
      'Never drop a technical fact to meet a word limit.'
    );
  }
} catch (e) {
  // Never block the prompt.
}
process.exit(0);
