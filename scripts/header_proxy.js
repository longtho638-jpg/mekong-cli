const http = require('http');
const https = require('https');
const url = require('url');

// Target Pinggy URL
const TARGET_URL = process.argv[2];
if (!TARGET_URL) {
    console.error("Usage: node header_proxy.js <Target_Url> <Local_Port>");
    process.exit(1);
}
const PORT = parseInt(process.argv[3]) || 11435;

console.log(`🚀 Header Proxy Active: localhost:${PORT} -> ${TARGET_URL}`);
console.log(`👉 Injecting User-Agent: Mozilla/5.0`);

const server = http.createServer((req, res) => {
    const targetParsed = url.parse(TARGET_URL);

    const options = {
        hostname: targetParsed.hostname,
        port: 443,
        path: req.url,
        method: req.method,
        headers: {
            ...req.headers,
            'host': targetParsed.host, // Important for SNI
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'origin': 'https://colab.research.google.com',
            'referer': 'https://colab.research.google.com/'
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (e) => {
        console.error(`Proxy Error: ${e.message}`);
        res.writeHead(502);
        res.end('Proxy Error');
    });

    req.pipe(proxyReq, { end: true });
});

server.listen(PORT);
