'use strict';

/** Shared mode state for the STE hooks. */

const fs = require('fs');
const os = require('os');
const path = require('path');

const MODES = ['off', 'prose', 'strict'];
const DEFAULT_MODE = 'prose';

function claudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function modePath() {
  return path.join(claudeDir(), '.ste-mode');
}

/**
 * Read the active mode. Order of precedence:
 *   1. STE_MODE environment variable
 *   2. the mode file written by /ste-mode
 *   3. the default
 * Never throws. An unreadable or unknown value falls back to the default.
 */
function getMode() {
  const fromEnv = (process.env.STE_MODE || '').trim().toLowerCase();
  if (MODES.includes(fromEnv)) return fromEnv;
  try {
    const raw = fs.readFileSync(modePath(), 'utf8').trim().toLowerCase();
    if (MODES.includes(raw)) return raw;
  } catch (e) { /* no file yet */ }
  return DEFAULT_MODE;
}

/** Write the mode. Returns true on success, false on any failure. */
function setMode(mode) {
  if (!MODES.includes(mode)) return false;
  try {
    const p = modePath();
    // Do not follow a symlink at the target path.
    try {
      if (fs.lstatSync(p).isSymbolicLink()) fs.unlinkSync(p);
    } catch (e) { /* not present */ }
    fs.writeFileSync(p, mode + '\n', { encoding: 'utf8', mode: 0o600 });
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { MODES, DEFAULT_MODE, getMode, setMode, modePath, claudeDir };
