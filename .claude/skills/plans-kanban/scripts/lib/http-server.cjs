/**
 * HTTP server for plans-kanban dashboard
 * Routes: /kanban, /api/plans, /assets/*, /file/*
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { scanPlans } = require('./plan-scanner.cjs');
const { renderDashboard } = require('./dashboard-renderer.cjs');

// Allowed base directories for file access
let allowedBaseDirs = [];

/**
 * Set allowed directories for file serving
 * @param {string[]} dirs - Array of allowed directory paths
 */
function setAllowedDirs(dirs) {
  allowedBaseDirs = dirs.map(d => path.resolve(d));
}

/**
 * Validate path is within allowed directories
 * @param {string} filePath - Path to validate
 * @returns {boolean} - True if path is safe
 */
function isPathSafe(filePath) {
  const resolved = path.resolve(filePath);
  if (resolved.includes('..') || filePath.includes('\0')) {
    return false;
  }
  if (allowedBaseDirs.length === 0) {
    return true;
  }
  return allowedBaseDirs.some(dir => resolved.startsWith(dir));
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function sendResponse(res, statusCode, contentType, content) {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
}

function sendError(res, statusCode, message) {
  sendResponse(res, statusCode, 'text/html', `
    <!DOCTYPE html>
    <html>
    <head><title>Error ${statusCode}</title></head>
    <body style="font-family: system-ui; padding: 2rem;">
      <h1>Error ${statusCode}</h1>
      <p>${message}</p>
    </body>
    </html>
  `);
}

function serveFile(res, filePath, skipValidation = false) {
  if (!skipValidation && !isPathSafe(filePath)) {
    sendError(res, 403, 'Access denied');
    return;
  }

  if (!fs.existsSync(filePath)) {
    sendError(res, 404, 'File not found');
    return;
  }

  const content = fs.readFileSync(filePath);
  sendResponse(res, 200, getMimeType(filePath), content);
}

/**
 * Create HTTP server for kanban dashboard
 * @param {Object} options - Server options
 * @param {string} options.assetsDir - Static assets directory
 * @param {string[]} options.allowedDirs - Allowed directories for file access
 * @param {string} options.plansDir - Plans directory for dashboard
 * @returns {http.Server}
 */
function createHttpServer(options) {
  const { assetsDir, allowedDirs = [], plansDir } = options;

  if (allowedDirs.length > 0) {
    setAllowedDirs(allowedDirs);
  }

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Route: /assets/* - serve static files
    if (pathname.startsWith('/assets/')) {
      const relativePath = pathname.replace('/assets/', '');
      if (relativePath.includes('..')) {
        sendError(res, 403, 'Access denied');
        return;
      }
      const assetPath = path.join(assetsDir, relativePath);
      serveFile(res, assetPath, true);
      return;
    }

    // Route: /file/* - serve local files (images, etc.)
    if (pathname.startsWith('/file/')) {
      const filePath = pathname.replace('/file', '');
      if (!isPathSafe(filePath)) {
        sendError(res, 403, 'Access denied');
        return;
      }
      serveFile(res, filePath);
      return;
    }

    // Route: /api/plans - JSON API for plans data
    if (pathname === '/api/plans') {
      const customDir = parsedUrl.query?.dir;
      const dir = customDir || plansDir;

      if (customDir && !isPathSafe(customDir)) {
        sendError(res, 403, 'Access denied');
        return;
      }

      if (!dir) {
        sendResponse(res, 200, 'application/json', JSON.stringify({ plans: [], error: 'Plans directory not configured' }));
        return;
      }

      try {
        const plans = scanPlans(dir);
        sendResponse(res, 200, 'application/json', JSON.stringify({ plans }));
      } catch (err) {
        console.error('[http-server] API error:', err.message);
        sendResponse(res, 500, 'application/json', JSON.stringify({ error: 'Error scanning plans' }));
      }
      return;
    }

    // Route: / or /kanban - render dashboard
    if (pathname === '/' || pathname === '/kanban') {
      const customDir = parsedUrl.query?.dir;
      const dir = customDir || plansDir;

      if (customDir && !isPathSafe(customDir)) {
        sendError(res, 403, 'Access denied');
        return;
      }

      if (!dir) {
        sendError(res, 400, 'Plans directory not configured');
        return;
      }

      try {
        const plans = scanPlans(dir);
        const html = renderDashboard(plans, { assetsDir, plansDir: dir });
        sendResponse(res, 200, 'text/html', html);
      } catch (err) {
        console.error('[http-server] Dashboard error:', err.message);
        sendError(res, 500, 'Error rendering dashboard');
      }
      return;
    }

    // Default: 404
    sendError(res, 404, 'Not found');
  });

  return server;
}

module.exports = {
  createHttpServer,
  getMimeType,
  sendResponse,
  sendError,
  serveFile,
  isPathSafe,
  setAllowedDirs,
  MIME_TYPES
};
