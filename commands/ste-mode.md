---
description: Turn always-on Simplified Technical English off, or switch its scope
argument-hint: "off | prose | strict | status"
---

Set the always-on STE mode.

Requested mode: `$ARGUMENTS`

## Modes

| Mode | Effect |
| --- | --- |
| `off` | No STE. Ordinary prose. The skill and the commands still work on demand. |
| `prose` | Default. STE for explanatory prose and documentation. Code, commit messages, PR descriptions, design rationale, and exact quoted strings are exempt. |
| `strict` | STE for everything, including commit messages and code comments. |

If `$ARGUMENTS` is empty or is `status`, report the current mode and stop.

## Steps

1. Read the current mode:

```bash
node -e "console.log(require('${CLAUDE_PLUGIN_ROOT}/hooks/ste-config.js').getMode())"
```

2. If the user gave a mode, set it:

```bash
node -e "const c=require('${CLAUDE_PLUGIN_ROOT}/hooks/ste-config.js'); process.exit(c.setMode('<mode>')?0:1)"
```

3. If the write fails, say so and tell the user they can set `STE_MODE` in the
   environment instead. The environment variable wins over the file.

4. Report the old mode and the new mode.

5. Tell the user that the change applies from the next session. The rule block
   is injected at session start, so the current session keeps the old mode.
   Follow the new mode yourself for the rest of this session anyway.
