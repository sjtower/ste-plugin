# ste — Simplified Technical English for Claude Code

Write, rewrite, and check technical documentation in
[ASD-STE100 Simplified Technical English](https://asd-ste100.org). STE is a
controlled language. Readers who do not speak English as a first language can
understand it correctly.

STE came from aerospace maintenance manuals. In a maintenance manual, an
ambiguous instruction is a safety problem. The same properties make
documentation clearer for everyone: one meaning per word, active voice, short
sentences, and one instruction at a time. They also make machine-facing text
easier to parse.

## What you get

| Component | What it does |
| --- | --- |
| `ste-write` skill | The 53 Part 1 rules, paraphrased with examples. Loads on demand. |
| `/ste-check` | Runs the deterministic checker on changed markdown and reports findings. |
| `/ste-rewrite` | Rewrites a file or pasted text into STE, with a before-and-after table. |
| `/ste-init` | Adds an STE rule to a repo's `CLAUDE.md` so every agent follows it. |
| `scripts/ste-check.js` | Zero-dependency Node checker. Use it in CI. |

## Install

```bash
/plugin marketplace add sjtower/ste-plugin
```

Then install the `ste` plugin from the marketplace.

The plugin is **on demand**. It has no `SessionStart` hook and does not change
how Claude talks to you. It activates when you ask for STE, or when you run one
of the commands.

## The checker

```bash
node scripts/ste-check.js --verbose docs/
```

```
docs/install.md
      3  error  sentence-length    Descriptive sentence has 38 words (limit 25).
      3  warn   passive-voice      Passive voice: "be inspected".
      3  warn   word-choice        "prior to" is wordy.
      7  error  contraction        Contraction "Don't".
     13  warn   one-instruction    Procedural sentence joins two instructions with "then install".
     23  error  paragraph-length   Paragraph has 8 sentences (limit 6).

3 error, 3 warn, 0 review
```

### What it checks

| Rule | Severity | Notes |
| --- | --- | --- |
| `sentence-length` | error | 20 words procedural, 25 descriptive |
| `paragraph-length` | error | 6 sentences |
| `contraction` | error | "don't" → "do not" |
| `passive-voice` | warn | be-verb followed by a past participle |
| `one-instruction` | warn | two imperatives joined by "and"/"then", or a semicolon |
| `word-choice` | warn | common wordy phrases |
| `ing-form` | review | -ing outside the technical-noun allow list |
| `noun-cluster` | review | more than 3 content words in a row |

`review` findings are low confidence on purpose. Check them before you act.

The checker skips fenced code blocks, inline code, tables, link targets, URLs,
and YAML frontmatter.

### Opting out

Documentation that quotes bad text on purpose can suppress the checker:

```markdown
<!-- ste-check:ignore -->
This single line is not checked.

<!-- ste-check:off -->
Nothing in this region is checked.
Write "do not", not "don't".
<!-- ste-check:on -->
```

### Options

```
--json                 Machine-readable output
--markdown             Markdown report for a pull request
-v, --verbose          Show the fix hint for each finding
-q, --quiet            Hide clean files
--max-procedural  <n>  Word limit for procedural sentences (default 20)
--max-descriptive <n>  Word limit for descriptive sentences (default 25)
--max-paragraph   <n>  Sentence limit per paragraph (default 6)
--max-noun-cluster <n> Word limit for noun clusters (default 3)
--allow-ing a,b,c      Treat these -ing words as technical nouns
--fail-on <level>      Exit 1 at error|warn|review|never (default error)
```

Project defaults go in `.stecheckrc.json` at the repo root:

```json
{
  "maxDescriptive": 25,
  "maxParagraph": 6,
  "allowIng": ["sharding", "checkpointing", "provisioning"]
}
```

### In CI

```yaml
- name: Simplified Technical English
  run: node scripts/ste-check.js --fail-on error docs/ README.md
```

## What this plugin cannot do

**It cannot verify STE compliance.** ASD-STE100 has two parts:

- **Part 1** — 53 writing rules. This plugin paraphrases them.
- **Part 2** — about 900 approved words and 1,200 non-approved words.
  **This plugin does not contain Part 2.**

ASD, Brussels holds the copyright of the dictionary (EU Trade Mark 017966390).
Nobody can redistribute it. The checker therefore measures the mechanical rules
and nothing else. A clean report is not a compliance claim.

Get the specification at no cost, after registration, from
<https://asd-ste100.org>. For certified compliance, use a licensed checker and a
human reviewer.

## When not to use STE

STE removes nuance deliberately. That is the point in a maintenance manual and a
defect everywhere else.

Good fit: procedures, runbooks, install guides, API and tool descriptions, error
messages, safety instructions, agent-facing instructions.

Bad fit: marketing copy, blog posts, design rationale, architecture decision
records, commit messages, code comments that explain *why*.

`/ste-init` asks you to pick a scope for this reason, and warns you off the
broadest one.

## Compatibility

STE is the exact inverse of compression styles such as
[caveman](https://github.com/JuliusBrussee/caveman): STE requires articles and
complete sentences, caveman removes them. Do not run an always-on compression
mode and STE at the same time. This plugin stays on demand so that the two can
live in the same install without a conflict.

## Prior art

Skill folders that cover similar ground, none packaged as a plugin:

- [nuelcyoung/asd-ste100](https://github.com/nuelcyoung/asd-ste100)
- [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill)
- [AminBlg/SimpleEnglish](https://github.com/AminBlg/SimpleEnglish)

This plugin adds marketplace packaging, a deterministic checker with CI output,
and repo-level integration.

## Development

```bash
node tests/run.js
```

## Licence and affiliation

Plugin code and documentation: MIT. See [LICENSE](LICENSE).

ASD-STE100 is copyright ASD, Brussels. This project is **not affiliated with,
endorsed by, or approved by** ASD or the STE Maintenance Group. It paraphrases
the Part 1 rules as a study and writing aid and reproduces no part of the
specification.
