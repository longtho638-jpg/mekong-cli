/**
 * Core HTTP server for markdown-novel-viewer
 * Handles routing for markdown, static assets, and local files
 *
 * Security: Paths are validated to prevent directory traversal attacks
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { scanPlans } = require('./plan-scanner.cjs');
const { renderDashboard } = require('./dashboard-renderer.cjs');

// Allowed base directories for file access (set at runtime)
let allowedBaseDirs = [];

/**
 * Set allowed directories for file serving
 * @param {string[]} dirs - Array of allowed directory paths
 */
function setAllowedDirs(dirs) {
  allowedBaseDirs = dirs.map(d => path.resolve(d));
}

/**
 * Validate path is within allowed directories (prevents path traversal)
 * @param {string} filePath - Path to validate
 * @param {string[]} allowedDirs - Allowed base directories
 * @returns {boolean} - True if path is safe
 */
function isPathSafe(filePath, allowedDirs = allowedBaseDirs) {
  const resolved = path.resolve(filePath);

  // Check for path traversal attempts
  if (resolved.includes('..') || filePath.includes('\0')) {
    return false;
  }

  // If no allowed dirs set, allow only project paths
  if (allowedDirs.length === 0) {
    return true; // During initialization, allow all
  }

  // Must be within one of the allowed directories
  return allowedDirs.some(dir => resolved.startsWith(dir));
}

/**
 * Sanitize error message to prevent path disclosure
 * @param {string} message - Original error message
 * @returns {string} - Sanitized message
 */
function sanitizeErrorMessage(message) {
  // Remove absolute paths from error messages
  return message.replace(/\/[^\s'"<>]+/g, '[path]');
}

// MIME type mapping
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
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf'
};

/**
 * Get MIME type for file extension
 * @param {string} filePath - File path
 * @returns {string} - MIME type
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Send response with content
 * @param {http.ServerResponse} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {string} contentType - Content type
 * @param {Buffer|string} content - Response content
 */
function sendResponse(res, statusCode, contentType, content) {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
}

/**
 * Send error response (sanitized to prevent information disclosure)
 * @param {http.ServerResponse} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
function sendError(res, statusCode, message) {
  const safeMessage = sanitizeErrorMessage(message);
  sendResponse(res, statusCode, 'text/html', `
    <!DOCTYPE html>
    <html>
    <head><title>Error ${statusCode}</title></head>
    <body style="font-family: system-ui; padding: 2rem;">
      <h1>Error ${statusCode}</h1>
      <p>${safeMessage}</p>
    </body>
    </html>
  `);
}

/**
 * Serve static file with path validation
 * @param {http.ServerResponse} res - Response object
 * @param {string} filePath - File path
 * @param {boolean} skipValidation - Skip path validation (for internal assets)
 */
function serveFile(res, filePath, skipValidation = false) {
  // Security: Validate path unless explicitly skipped
  if (!skipValidation && !isPathSafe(filePath)) {
    sendError(res, 403, 'Access denied');
    return;
  }

  if (!fs.existsSync(filePath)) {
    sendError(res, 404, 'File not found');
    return;
  }

  const content = fs.readFileSync(filePath);
  const mimeType = getMimeType(filePath);
  sendResponse(res, 200, mimeType, content);
}

/**
 * Create HTTP server with routing
 * @param {Object} options - Server options
 * @param {string} options.assetsDir - Static assets directory
 * @param {Function} options.renderMarkdown - Markdown render function (filePath) => html
 * @param {string[]} options.allowedDirs - Allowed directories for file access
 * @param {string} options.plansDir - Plans directory for dashboard
 * @returns {http.Server} - HTTP server instance
 */
function createHttpServer(options) {
  const { assetsDir, renderMarkdown, allowedDirs = [], plansDir } = options;

  // Set allowed directories for path validation
  if (allowedDirs.length > 0) {
    setAllowedDirs(allowedDirs);
  }

  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Route: /assets/* - serve static files from assets directory (internal, skip validation)
    if (pathname.startsWith('/assets/')) {
      const relativePath = pathname.replace('/assets/', '');
      // Security: Prevent escaping assets directory
      if (relativePath.includes('..')) {
        sendError(res, 403, 'Access denied');
        return;
      }
      const assetPath = path.join(assetsDir, relativePath);
      serveFile(res, assetPath, true); // Skip validation for internal assets
      return;
    }

    // Route: /file/* - serve local files (images, etc.) - validated
    if (pathname.startsWith('/file/')) {
      const filePath = pathname.replace('/file', '');

      // Security: Validate file path
      if (!isPathSafe(filePath)) {
        sendError(res, 403, 'Access denied');
        return;
      }

      serveFile(res, filePath);
      return;
    }

    // Route: /api/files - DISABLED for security (directory listing)
    if (pathname === '/api/files') {
      sendError(res, 403, 'Directory listing disabled');
      return;
    }

    // Route: /dashboard - render plans dashboard
    if (pathname === '/dashboard') {
      const customDir = parsedUrl.query?.dir;
      const dir = customDir || plansDir;

      // Security: Validate custom directory
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

    // Route: /api/dashboard - JSON API for plans data
    if (pathname === '/api/dashboard') {
      const customDir = parsedUrl.query?.dir;
      const dir = customDir || plansDir;

      // Security: Validate custom directory
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

    // Route: / or /view/* - render markdown
    if (pathname === '/' || pathname.startsWith('/view/')) {
      const filePath = pathname === '/' ? null : pathname.replace('/view', '');

      if (!filePath) {
        sendError(res, 400, 'No file specified. Use /view/path/to/file.md');
        return;
      }

      // Security: Validate file path
      if (!isPathSafe(filePath)) {
        sendError(res, 403, 'Access denied');
        return;
      }

      if (!fs.existsSync(filePath)) {
        sendError(res, 404, 'Markdown file not found');
        return;
      }

      try {
        const html = renderMarkdown(filePath);
        sendResponse(res, 200, 'text/html', html);
      } catch (err) {
        sendError(res, 500, 'Error rendering markdown');
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
  sanitizeErrorMessage,
  MIME_TYPES
};
