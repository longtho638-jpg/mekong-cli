#!/usr/bin/env node
/**
 * AG Proxy — Lightweight Antigravity on port 9191
 * Accepts Anthropic format, forwards to Google Gemini
 * Used by anthropic-adapter.js as Provider 2 fallback
 */
const http = require('http');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = 9191;
const GOOGLE_KEYS = (process.env.GOOGLE_ULTRA_KEYS || process.env.GOOGLE_KEYS || '').split(',').filter(Boolean);
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash', 'gemini-2.5-flash'];
// Start from back half of keys to reduce overlap with main adapter (which starts at 0)
let keyIndex = Math.floor(GOOGLE_KEYS.length / 2);
let modelIndex = 0;
let requests = 0;

const ts = () => new Date().toISOString().slice(11, 19);

function anthropicToGemini(body) {
    const contents = [];
    const systemParts = [];
    if (body.system) {
        const txt = typeof body.system === 'string' ? body.system : body.system.map(b => b.text || '').join('\n');
        if (txt.trim()) systemParts.push({ text: txt });
    }
    for (const msg of (body.messages || [])) {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        let text = '';
        if (typeof msg.content === 'string') text = msg.content;
        else if (Array.isArray(msg.content)) text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
        if (text) contents.push({ role, parts: [{ text }] });
    }
    const result = { contents };
    if (systemParts.length > 0) result.systemInstruction = { parts: systemParts };
    // Tool declarations — deep clean for Gemini compatibility
    if (body.tools && body.tools.length > 0) {
        // Only keep fields Gemini actually supports
        const GEMINI_ALLOWED = new Set(['type', 'description', 'properties', 'required', 'enum', 'items', 'format', 'nullable', 'minimum', 'maximum']);
        function cleanSchema(obj) {
            if (!obj || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(cleanSchema);
            const result = {};
            for (const [k, v] of Object.entries(obj)) {
                if (!GEMINI_ALLOWED.has(k)) continue;
                result[k] = cleanSchema(v);
            }
            // Sync required array: only keep props that exist in properties
            if (result.required && result.properties) {
                result.required = result.required.filter(r => r in result.properties);
                if (result.required.length === 0) delete result.required;
            }
            return result;
        }
        const functionDeclarations = body.tools.map(t => {
            const schema = cleanSchema(t.input_schema || {});
            return { name: t.name, description: t.description || t.name, parameters: schema };
        });
        result.tools = [{ functionDeclarations }];
        result.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
    }
    result.generationConfig = { maxOutputTokens: body.max_tokens || 4096 };
    return result;
}

function geminiToAnthropic(geminiResp) {
    const candidate = geminiResp.candidates?.[0];
    if (!candidate) return { type: 'error', error: { type: 'api_error', message: 'No candidate' } };
    const content = [];
    for (const part of (candidate.content?.parts || [])) {
        if (part.text) content.push({ type: 'text', text: part.text });
        if (part.functionCall) {
            content.push({ type: 'tool_use', id: `toolu_${Date.now()}`, name: part.functionCall.name, input: part.functionCall.args || {} });
        }
    }
    return {
        id: `msg_ag_${Date.now()}`, type: 'message', role: 'assistant', content,
        model: 'gemini-2.5-flash', stop_reason: candidate.finishReason === 'STOP' ? 'end_turn' : 'end_turn',
        usage: { input_tokens: geminiResp.usageMetadata?.promptTokenCount || 0, output_tokens: geminiResp.usageMetadata?.candidatesTokenCount || 0 }
    };
}

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', port: PORT, google_keys: GOOGLE_KEYS.length, requests }));
        return;
    }
    if (req.method !== 'POST' || !req.url.startsWith('/v1/messages')) {
        res.writeHead(404); res.end('Not found'); return;
    }
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
        requests++;
        let parsed;
        try { parsed = JSON.parse(body); } catch (e) { res.writeHead(400); res.end('Bad JSON'); return; }

        const key = GOOGLE_KEYS[keyIndex % GOOGLE_KEYS.length];
        keyIndex = (keyIndex + 1) % GOOGLE_KEYS.length;
        const model = MODELS[modelIndex % MODELS.length];
        modelIndex++;

        const geminiBody = anthropicToGemini(parsed);
        const payload = JSON.stringify(geminiBody);
        const gPath = `/v1beta/models/${model}:generateContent?key=${key}`;

        console.log(`[${ts()}] AG:9191 → G[${keyIndex}] ${model} (${Math.round(Buffer.byteLength(body) / 1024)}KB)`);

        const proxyReq = https.request({
            hostname: 'generativelanguage.googleapis.com', port: 443, path: gPath, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        }, (proxyRes) => {
            let responseBody = '';
            proxyRes.on('data', c => responseBody += c);
            proxyRes.on('end', () => {
                try {
                    const r = JSON.parse(responseBody);
                    if (r.error) {
                        console.log(`[${ts()}] ❌ AG G[${keyIndex}]: ${(r.error.message || 'err').slice(0, 200)}`);
                        res.writeHead(502, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: r.error.message } }));
                        return;
                    }
                    const anthropicResp = geminiToAnthropic(r);
                    console.log(`[${ts()}] ✅ AG ${anthropicResp.usage?.output_tokens || 0}tok`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(anthropicResp));
                } catch (e) {
                    res.writeHead(502); res.end(responseBody);
                }
            });
        });
        proxyReq.on('error', (err) => {
            console.error(`[${ts()}] ❌ AG: ${err.message}`);
            res.writeHead(502); res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: err.message } }));
        });
        proxyReq.write(payload); proxyReq.end();
    });
});

server.listen(PORT, () => console.log(`🚀 AG Proxy on http://localhost:${PORT} | Google: ${GOOGLE_KEYS.length} keys`));
