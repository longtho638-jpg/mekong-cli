/**
 * 🛰️ SYSTEM STATUS REGISTRY — Global State Monitor
 * 
 * Tracks ephemeral system states like Rate Limits, Thermal Throttling,
 * and Provider Health across restarts.
 * 
 * Strategy: Persistent JSON state file + in-memory cache.
 */

const fs = require('fs');
const path = require('path');
const STATUS_FILE = path.join(__dirname, '../data/system-status.json');

let state = {
    pro_limit_hit: false,
    pro_limit_reset_at: null,
    thermal_throttle_active: false,
    last_updated: null
};

let proResetTimer = null;

function loadStatus() {
    try {
        if (fs.existsSync(STATUS_FILE)) {
            const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
            state = { ...state, ...data };
        }
    } catch (e) { }
    return state;
}

function saveStatus() {
    state.last_updated = new Date().toISOString();
    try {
        if (!fs.existsSync(path.dirname(STATUS_FILE))) {
            fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
        }
        fs.writeFileSync(STATUS_FILE, JSON.stringify(state, null, 2));
    } catch (e) { }
}

function setProLimitHit(isHit, resetAt = null) {
    state.pro_limit_hit = isHit;
    state.pro_limit_reset_at = resetAt || (isHit ? 'Unknown' : null);
    if (isHit) {
        if (proResetTimer) clearTimeout(proResetTimer);
        proResetTimer = setTimeout(() => {
            state.pro_limit_hit = false;
            state.pro_limit_reset_at = null;
            proResetTimer = null;
            saveStatus();
            console.log('[STATUS] Pro rate limit auto-reset after 60min');
        }, 60 * 60_000);
    } else {
        if (proResetTimer) { clearTimeout(proResetTimer); proResetTimer = null; }
    }
    saveStatus();
}

function isProAvailable() {
    loadStatus();
    // Auto-reset if reset_at is in the past (if we can parse it)
    if (state.pro_limit_hit && state.pro_limit_reset_at) {
        // Basic check for 6am reset (Chairman's screenshot)
        // For now, we trust the manual flip or auto-detect
    }
    return !state.pro_limit_hit;
}

module.exports = {
    loadStatus,
    saveStatus,
    setProLimitHit,
    isProAvailable,
    state
};
