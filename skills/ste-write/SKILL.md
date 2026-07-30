---
name: ste-write
description: Write, rewrite, or check technical documentation in ASD-STE100 Simplified Technical English — a controlled language that makes docs clear for non-native English readers and for machine parsing. Use when the user asks for docs in Simplified Technical English or STE, asks to simplify or de-jargon technical writing, mentions ASD-STE100 or controlled language, or asks to check a document against STE rules. Do NOT use for marketing copy, narrative prose, or any text where voice and nuance are the point.
---

# Simplified Technical English

ASD-STE100 is a controlled language for technical documentation. The aerospace
industry made it so that readers who do not speak English as a first language
can understand maintenance instructions correctly. It has two parts:

- **Part 1** — 53 writing rules in 9 sections.
- **Part 2** — a dictionary of approximately 900 approved words and 1,200
  non-approved words with their approved alternatives.

The current version is Issue 9, released on 15 January 2025.

## Important limit of this skill

This skill applies the Part 1 rules. It does **not** contain the Part 2
dictionary, because the dictionary is copyright ASD, Brussels, and cannot be
redistributed. You must not claim that text is STE-compliant. You can only say
that the text follows the mechanical rules that were checked.

To get the official specification, tell the user to register for a free copy
at <https://asd-ste100.org>. A licensed checker is the authority on dictionary
compliance.

## When to apply STE

Apply STE to: procedures, installation guides, API and tool descriptions,
error messages, runbooks, README files, and safety instructions.

Do not apply STE to: marketing copy, blog posts, design rationale, commit
messages, or code comments that explain intent. STE removes nuance on purpose.
Text that needs nuance becomes worse in STE, not better.

## The rules

Read `references/writing-rules.md` for the full rule set with examples. Read
`references/word-choices.md` for common wordy phrases and plainer alternatives.
Read `references/background.md` for the history and the licence position.

The rules that change the most text:

1. **One word, one meaning.** Use each word for one meaning and one part of
   speech. Do not write "test the unit" if you also write "run a test". Pick
   one sense. Use a different word for the other sense.
2. **Sentence length.** A procedural sentence has 20 words or fewer. A
   descriptive sentence has 25 words or fewer.
3. **Paragraph length.** A descriptive paragraph has 6 sentences or fewer.
4. **One instruction per sentence.** Do not join two steps with "and".
5. **Active voice.** Use the passive voice only in descriptive text. Use it
   only when you do not know who does the action.
6. **Simple tenses only.** Use the infinitive, the imperative, the simple
   present, the simple past, and the simple future. Use a past participle only
   as an adjective.
7. **No -ing forms** unless the word is a technical noun, or modifies one.
8. **Keep the articles and the short words.** Write "the pump", not "pump".
   Do not remove words to make the sentence shorter.
9. **Noun clusters** have 3 words or fewer. Break longer ones with a
   preposition: "the pump failure rate table" becomes "the table of pump
   failure rates".
<!-- ste-check:ignore -->
10. **No contractions.** Write "do not", not "don't".
11. **Warnings and cautions come before the step**, not after it. Start a
    warning with a clear command.

## Workflow

### To write new documentation

1. Write the content first. Get the facts correct.
2. Apply the rules above.
3. Run the checker on the result (see below).
4. Fix each finding, or say why the finding is a false positive.

### To rewrite existing documentation

1. Read the source text.
2. Rewrite it. Keep every technical fact. Change only the language.
3. Show the user a before-and-after comparison with the rule for each change.
4. Run the checker on the new text.
5. Tell the user which findings you did not fix, and why.

Never drop a technical fact to satisfy a rule. If a sentence cannot go below
the word limit without a loss of meaning, split it into two sentences. If it
still cannot, keep the fact and tell the user.

### To check a document

Run the bundled checker:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ste-check.js" --verbose path/to/doc.md
```

Useful options:

- `--json` for machine-readable output.
- `--markdown` for a report you can paste into a pull request.
- `--allow-ing word1,word2` when an -ing word is a technical noun in this domain.
- `--fail-on warn` to make warnings fail the build.

The checker finds mechanical problems only. It checks sentence length,
paragraph length, passive voice, -ing forms, noun clusters, contractions,
wordy phrases, and sentences that contain more than one instruction.

The checker cannot find dictionary problems. Read the text yourself for word
choice. The `review` severity marks low-confidence findings; check each one
before you change it.

## Reporting

When you report results, give the user:

- The rewritten text.
- A short table: before, after, and the rule that caused the change.
- The checker output.
- A clear statement that this is a mechanical check, not a compliance claim.
