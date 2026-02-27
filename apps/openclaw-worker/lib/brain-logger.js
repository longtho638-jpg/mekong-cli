/**
 * brain-logger.js
 *
 * Centralized logging utility for brain modules.
 * Writes to stderr and LOG_FILE simultaneously.
 * MUST NOT import from other brain-* modules (prevents circular deps).
 */

const fs = require('fs');
const config = require('../config');

function log(msg) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const formatted = `[${timestamp}] [tom-hum] ${msg}\n`;
  try { process.stderr.write(formatted); } catch (e) { /* EPIPE safe */ }
  try { fs.appendFileSync(config.LOG_FILE, formatted); } catch (e) { }
}

module.exports = { log };
