---
description: Rewrite text or a file into Simplified Technical English
argument-hint: "[file] or paste the text after the command"
---

Rewrite the target into ASD-STE100 Simplified Technical English.

Target: `$ARGUMENTS`

If `$ARGUMENTS` names a file, read it. If `$ARGUMENTS` is prose, rewrite that
prose. If `$ARGUMENTS` is empty, ask the user for the text and stop.

Load the `ste-write` skill first. Follow the rules in its
`references/writing-rules.md`.

## Rules for this rewrite

1. **Keep every technical fact.** Never drop a fact to satisfy a word limit.
   Split the sentence instead. If a fact still does not fit, keep the fact and
   flag it to the user.
2. **Do not touch code.** Leave fenced code blocks, inline code, command lines,
   file paths, identifiers, and URLs exactly as they are.
3. **Do not change headings' meaning.** You may simplify heading wording.
4. **Keep the document structure.** Same sections, same order, same lists.

## Output

Show the user:

1. The rewritten text in full.
2. A comparison table of the substantive changes:

   | Before | After | Rule |
   | --- | --- | --- |

   Include only changes that a reviewer would question. Do not list every
   article you added.
3. Anything you could not fix, and why.

## Then verify

Write the result to a file and run the checker on it:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ste-check.js" --verbose --no-color <file>
```

Report the remaining findings. If a finding is a false positive, say so and say
why.

If the user gave a file path, ask before you overwrite the original. Do not
overwrite it without a clear yes.

End with this statement: the rewrite follows the mechanical rules that were
checked, and is not a claim of ASD-STE100 compliance, because the Part 2
dictionary is not available to this tool.
