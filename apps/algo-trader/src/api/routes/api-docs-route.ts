/**
 * API Docs Route — Swagger UI for interactive API documentation
 *
 * Serves Swagger UI at /api-docs endpoint
 * Loads OpenAPI spec from /src/swagger.yaml
 */

import { FastifyInstance } from 'fastify';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Register API docs route
 */
export async function registerApiDocsRoute(fastify: FastifyInstance): Promise<void> {
  // Serve Swagger UI HTML
  fastify.get('/api-docs', async (_request, reply) => {
    const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Algo-Trader API Docs</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: '/api/swagger.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        showExtensions: true,
        showCommonExtensions: true,
      });
    };
  </script>
</body>
</html>
    `;

    return reply.type('text/html').send(swaggerHtml);
  });

  // Serve OpenAPI spec
  fastify.get('/api/swagger.yaml', async (_request, reply) => {
    try {
      const swaggerPath = path.join(__dirname, '../swagger.yaml');

      if (!fs.existsSync(swaggerPath)) {
        return reply.code(404).send({
          success: false,
          error: 'Swagger spec not found',
          message: 'Please build the project first',
        });
      }

      const swaggerContent = fs.readFileSync(swaggerPath, 'utf-8');
      return reply.type('application/yaml').send(swaggerContent);
    } catch (error) {
      fastify.log.error(`[ApiDocs] Error serving swagger.yaml: ${error instanceof Error ? error.message : String(error)}`);
      return reply.code(500).send({
        success: false,
        error: 'Failed to load OpenAPI spec',
      });
    }
  });

  // Redirect /docs to /api-docs
  fastify.get('/docs', async (_request, reply) => {
    return reply.redirect('/api-docs');
  });
}
