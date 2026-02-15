/**
 * 📱 Telegram Client — Notification sender
 * 
 * Sends status updates to Telegram bot for monitoring.
 * 
 * Usage:
 *   const { sendTelegram } = require('./telegram-client');
 *   sendTelegram('Mission completed successfully');
 */

const config = require('../config');

const { log } = require('./brain-tmux');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

async function sendTelegram(message) {
    if (!BOT_TOKEN || !CHAT_ID) {
        log('[telegram] No BOT_TOKEN or CHAT_ID configured — skipping');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: `🦞 TÔM HÙM: ${message}`,
                parse_mode: 'HTML',
            }),
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            log(`[telegram] API error: ${response.status}`);
            return false;
        }

        return true;
    } catch (err) {
        log(`[telegram] Send error: ${err.message}`);
        return false;
    }
}

module.exports = { sendTelegram };
