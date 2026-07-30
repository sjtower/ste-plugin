---
description: Check documentation against the mechanical Simplified Technical English rules
argument-hint: "[file-or-dir ...] (default: changed markdown files on this branch)"
---

Check documentation against the mechanical ASD-STE100 rules.

Target: `$ARGUMENTS`

If `$ARGUMENTS` is empty, check the markdown files that this branch changed:

```bash
git diff --name-only --diff-filter=d main...HEAD -- '*.md' '*.mdx' '*.markdown'
```

If that returns nothing, check the uncommitted changes instead
(`git diff --name-only --diff-filter=d HEAD -- '*.md'`). If there are still no
files, tell the user and stop.

Run the checker:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ste-check.js" --verbose --no-color <files>
```

Then report:

1. The findings, grouped by file, most severe first.
2. For each `review` finding, say whether you think it is a true positive. These
   are low-confidence by design — noun clusters and -ing forms produce false
   positives on technical nouns.
3. A short list of word-choice problems the checker cannot catch, from your own
   read of the text. The checker has no dictionary.

Do not edit any file. This command reports only. If the user wants the fixes
applied, tell them to run `/ste-rewrite`.

End with this statement: the check covers the mechanical rules only, and is not
a claim of ASD-STE100 compliance.
