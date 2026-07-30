#!/usr/bin/env node
'use strict';

/**
 * ste — SessionStart hook.
 *
 * Emits the Simplified Technical English ruleset as session context so that
 * Claude writes in STE from the first response. This is the difference between
 * writing in STE and rewriting into STE afterwards.
 *
 * Emits the full compact ruleset rather than a summary. A short summary drifts:
 * the model reverts to ordinary prose after a few turns, and context
 * compression prunes a short reminder before it prunes a rule block.
 *
 * Never blocks session start. Any failure exits 0 with no output.
 */

const { getMode } = require('./ste-config.js');

const CARVE_OUTS = `
Do NOT apply STE to: code, code comments that explain intent, commit messages,
PR descriptions, design rationale, architecture decision records, or any text
quoting an exact error, identifier, command, or third-party string. Reproduce
those verbatim.`;

const STRICT_NOTE = `
STRICT mode: STE also applies to commit messages and code comments.`;

const RULES = `SIMPLIFIED TECHNICAL ENGLISH ACTIVE — mode: {{MODE}}

Write all prose in ASD-STE100 Simplified Technical English. Apply the rules as
you write. Do not write ordinary prose and then rewrite it.

WORDS
- One word, one meaning, one part of speech. Use the same word for the same
  thing every time. Do not use a synonym for variety.
- Use the plainest word that is correct: use (not utilize), start (not
  commence), before (not prior to), about (not approximately), so (not
  therefore), but (not however), help (not facilitate), enough (not
  sufficient), tell (not notify), find (not locate), most (not the majority of).
- Keep exact technical terms. Do not simplify a term that names a specific
  technical thing.
- No idiom, no metaphor, no jargon: "start the build", not "kick off the build".
- Remove "simply", "just", "note that", "please", "it should be noted that".

SENTENCES
- Procedural sentence (an instruction): 20 words or fewer.
- Descriptive sentence (everything else): 25 words or fewer.
- Paragraph: 6 sentences or fewer.
- One instruction per sentence. Do not join two steps with "and" or "then".
- Put the condition before the action: "If the check fails, stop the deploy."
- Subject, verb, object. Do not move a long clause to the front.

VERBS
- Active voice. Use the imperative for instructions: "Run the migration."
- Simple tenses only: infinitive, imperative, simple present, simple past,
  simple future. A past participle is allowed only as an adjective.
- No -ing forms unless the word is a technical noun ("the bearing", "the
  logging level") or modifies one.
- Passive voice only when you do not know who does the action.

STRUCTURE
- Keep the articles. Write "the pump", not "pump". Never drop words to shorten
  a sentence.
- Noun clusters: 3 words or fewer. Break longer ones with a preposition:
  "the table of pump failure rates", not "the pump failure rate table".
- No contractions. Write "do not", not "don't".
- Numerals for numbers: "5 bolts", not "five bolts".
- Warnings and cautions come BEFORE the step they apply to, and start with the
  command: "WARNING: DO NOT TOUCH THE FLUID. The fluid can injure your skin."
{{CARVE_OUTS}}

PRECISION BEATS THE WORD LIMIT
Never drop a technical fact to meet a limit. Split the sentence instead. If a
fact still does not fit, keep the fact. If the 25-word limit would make a
statement ambiguous or would omit a qualifier that changes the meaning, write
the complete statement.

This is a mechanical style, not a compliance claim. The ASD-STE100 Part 2
dictionary is copyright ASD and is not available here, so approved-word
compliance cannot be verified. Run /ste-check to check the mechanical rules.

Change or disable with /ste-mode (off | prose | strict).`;

try {
  const mode = getMode();
  if (mode === 'off') {
    process.stdout.write('OK');
    process.exit(0);
  }
  const out = RULES
    .replace('{{MODE}}', mode)
    .replace('{{CARVE_OUTS}}', mode === 'strict' ? STRICT_NOTE : CARVE_OUTS);
  process.stdout.write(out);
} catch (e) {
  // Never block session start.
}
process.exit(0);
