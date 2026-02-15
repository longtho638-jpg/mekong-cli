/**
 * 🛡️ PROXY RULES VALIDATOR — 防 (Phòng Thủ)
 * 
 * 始計 Boot-time validation: Cross-checks running code vs PROXY_RULES.md
 * If ANY rule drifts from the locked config, WARNS on stderr immediately.
 * 
 * Rules Source: PROXY_RULES.md (locked 2026-02-15)
 */

const config = require('../config');

const RULES = {
    PROXY_PORT: 11436,
    BANNED_IN_WORKERS: ['GOOGLE_KEYS'],
    ALLOWED_FALLBACK_MODELS: ['gemini-3-flash', 'gemini-3-pro-high'],
    MIN_GAP_MS: 0,
    AG_HOURLY_BUDGET: 'UNLIMITED',
    ACCOUNTS: ['billwill.mentor@gmail.com', 'cashback.mentoring@gmail.com'],
};

function validate() {
    const warnings = [];
    if (!RULES.ALLOWED_FALLBACK_MODELS.includes(config.FALLBACK_MODEL_NAME)) {
        warnings.push(`FALLBACK_MODEL_NAME '${config.FALLBACK_MODEL_NAME}' not in PROXY_RULES whitelist: [${RULES.ALLOWED_FALLBACK_MODELS}]`);
    }
    const gateMs = config.API_RATE_GATE_MS;
    if (gateMs !== undefined && gateMs !== RULES.MIN_GAP_MS) {
        warnings.push(`API_RATE_GATE_MS=${gateMs} but PROXY_RULES says ${RULES.MIN_GAP_MS} (Nuclear Speed)`);
    }
    if (config.CLOUD_BRAIN_URL && !config.CLOUD_BRAIN_URL.includes(`:${RULES.PROXY_PORT}`)) {
        warnings.push(`CLOUD_BRAIN_URL '${config.CLOUD_BRAIN_URL}' does not use port ${RULES.PROXY_PORT}`);
    }
    if (config.MODEL_FALLBACK_CHAIN) {
        for (const model of config.MODEL_FALLBACK_CHAIN) {
            if (model.includes('gemini-1.5') || model.includes('gemini-2.0')) {
                warnings.push(`MODEL_FALLBACK_CHAIN contains old model '${model}' — should use gemini-3-*`);
            }
        }
    }
    for (const banned of RULES.BANNED_IN_WORKERS) {
        if (process.env[banned] && process.env[banned].trim().length > 0) {
            warnings.push(`ENV ${banned} is SET but BANNED by PROXY_RULES §2`);
        }
    }
    return warnings;
}

function validateProxyRules() {
    const warnings = validate();
    if (warnings.length === 0) {
        process.stderr.write(`[防 PROXY_RULES] ✅ All ${Object.keys(RULES).length} rules PASS\n`);
        return true;
    }
    process.stderr.write(`[防 PROXY_RULES] ⚠️ ${warnings.length} MISMATCH(ES) vs PROXY_RULES.md:\n`);
    for (const w of warnings) {
        process.stderr.write(`  ❌ ${w}\n`);
    }
    process.stderr.write(`[防 PROXY_RULES] Fix code or update PROXY_RULES.md to align!\n`);
    return false;
}

module.exports = { validateProxyRules, validate, RULES };
