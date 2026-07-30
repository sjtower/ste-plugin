---
description: Add a Simplified Technical English rule to this repo's CLAUDE.md and AGENTS.md
argument-hint: "[path to repo root] (default: current repo)"
---

Set up this repository so that every agent writes its documentation in
Simplified Technical English.

Target repo: `$ARGUMENTS` (default: the current working directory).

## Steps

1. Find the repo root (`git rev-parse --show-toplevel`).

2. Check which agent instruction files exist: `CLAUDE.md`, `AGENTS.md`,
   `GEMINI.md`, `.cursor/rules/`. Report what you found.

3. **Check whether the STE block is already present.** Look for the marker
   `<!-- ste:begin -->`. If it is there, tell the user and offer to update it
   rather than add a second copy.

4. **Ask the user which scope they want** before you write anything:
   - **Docs only** — the rule applies to `docs/`, `README.md`, and other
     markdown. Recommended.
   - **Docs and user-facing strings** — also error messages and CLI help.
   - **Everything user-readable** — also code comments and commit messages.
     Warn them that this is usually a bad fit; commit messages and rationale
     comments need nuance that STE removes.

5. **Show the user the exact block you will add, and get a clear yes** before
   you edit any file. Never edit an existing `CLAUDE.md` without approval — it
   may hold rules the user depends on.

6. Append this block, with `<scope>` replaced by their answer:

```markdown
<!-- ste:begin -->
## Documentation language

Write <scope> in ASD-STE100 Simplified Technical English.

- One word, one meaning, one part of speech. Use the same word for the same
  thing every time.
- Procedural sentence: 20 words or fewer. Descriptive sentence: 25 words or
  fewer. Paragraph: 6 sentences or fewer.
- One instruction per sentence. Do not join two steps with "and".
- Active voice. Imperative for procedures.
- Simple tenses only. No -ing forms unless the word is a technical noun.
- Keep the articles. Do not drop words to shorten a sentence.
- Noun clusters: 3 words or fewer.
- No contractions, no idiom, no "simply" or "just".
- Warnings and cautions come before the step they apply to.

Do not apply this to commit messages, design rationale, or code comments that
explain intent.

Check with: `node <path>/scripts/ste-check.js --verbose <files>`
<!-- ste:end -->
```

7. Offer to add a CI job that runs the checker on changed markdown. Show the
   workflow before you create the file, and get approval. Do not create it
   unless they say yes.

8. Offer to add `.stecheckrc.json` at the repo root if they want non-default
   limits or a project `allowIng` list.

Report what you changed, file by file.
