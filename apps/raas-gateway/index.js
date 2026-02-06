export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const openclawUrl = env.OPENCLAW_URL || "https://raas.agencyos.network";
    // Ensure no double slash if env var has trailing slash
    const baseUrl = openclawUrl.endsWith('/') ? openclawUrl.slice(0, -1) : openclawUrl;

    // --- ROUTE: GET /v1/jobs/:id ---
    // Matches /v1/jobs/UUID-OR-STRING
    if (request.method === "GET" && path.match(/^\/v1\/jobs\/[^/]+$/)) {
      try {
        const engineUrl = `${baseUrl}${path}`;
        const response = await fetch(engineUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.SERVICE_TOKEN}`,
            "X-RaaS-Source": "Moltworker-Gateway"
          }
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Gateway Error", details: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // --- ROUTE: POST /v1/chat/completions (or default) ---
    // 1. Basic Auth / Routing check
    if (request.method !== "POST") {
      return new Response("RaaS Gateway Active. Method Not Allowed.", { status: 405 });
    }

    try {
      const body = await request.json();

      // Normalize input: support both "messages" (OpenAI style) and "prompt" (Simple)
      let messages = body.messages;
      if (!messages && body.prompt) {
        messages = [{ role: "user", content: body.prompt }];
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
         return new Response(JSON.stringify({ error: "Invalid request. Provide 'messages' array or 'prompt' string." }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
      }

      // Security Check on inputs
      const inputString = JSON.stringify(messages);

      // 2. Security Validation (Moltworker Pattern)

      // Block common SQL injection and malicious prompts
      const maliciousPatterns = [
        /ignore previous instructions/i,
        /system prompt/i,
        /reveal your secret/i,
        /DROP TABLE/i,
        /DELETE FROM/i,
        /<script>/i
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(inputString)) {
          return new Response(JSON.stringify({ error: "Security Violation: Malicious prompt detected." }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      // 3. Routing to Engine Layer
      // Use crypto.randomUUID() which is available in Cloudflare Workers
      const userId = request.headers.get("X-User-Id") || crypto.randomUUID();

      const openClawEndpoint = `${baseUrl}/v1/chat/completions`;

      const forwardResponse = await fetch(openClawEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.SERVICE_TOKEN}`,
          "X-RaaS-Source": "Moltworker-Gateway"
        },
        body: JSON.stringify({
          model: body.model || env.DEFAULT_MODEL || "gemini-1.5-pro",
          messages: messages,
          userId: userId
        })
      });

      const result = await forwardResponse.json();
      return new Response(JSON.stringify(result), {
        status: forwardResponse.status,
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Internal Gateway Error", details: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
