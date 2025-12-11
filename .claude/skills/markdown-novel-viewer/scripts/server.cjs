#!/usr/bin/env node

/**
 * Markdown Novel Viewer Server
 * Background HTTP server rendering markdown files with calm, book-like UI
 *
 * Usage:
 *   node server.cjs --file ./plan.md [--port 3456] [--open] [--stop]
 *
 * Options:
 *   --file <path>   Path to markdown file or plan directory (required unless --stop)
 *   --port <number> Server port (default: 3456, auto-increment if busy)
 *   --open          Auto-open browser after start
 *   --stop          Stop all running servers
 *   --background    Run in background (detached)
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const { findAvailablePort, DEFAULT_PORT } = require('./lib/port-finder.cjs');
const { writePidFile, stopAllServers, setupShutdownHandlers, findRunningInstances } = require('./lib/process-mgr.cjs');
const { createHttpServer } = require('./lib/http-server.cjs');
const { renderMarkdownFile, renderTOCHtml } = require('./lib/markdown-renderer.cjs');
const { generateNavSidebar, generateNavFooter, detectPlan } = require('./lib/plan-navigator.cjs');

// Parse command line arguments
function parseArgs(argv) {
  const args = {
    file: null,
    port: DEFAULT_PORT,
    open: false,
    stop: false,
    background: false,
    isChild: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--file' && argv[i + 1]) {
      args.file = argv[++i];
    } else if (arg === '--port' && argv[i + 1]) {
      args.port = parseInt(argv[++i], 10);
    } else if (arg === '--open') {
      args.open = true;
    } else if (arg === '--stop') {
      args.stop = true;
    } else if (arg === '--background') {
      args.background = true;
    } else if (arg === '--child') {
      args.isChild = true;
    } else if (!arg.startsWith('--') && !args.file) {
      // Positional argument for file
      args.file = arg;
    }
  }

  return args;
}

// Resolve file path (handle relative paths, directories)
function resolveFilePath(input, cwd) {
  if (!input) return null;

  // Resolve relative to CWD
  let resolved = path.isAbsolute(input) ? input : path.resolve(cwd, input);

  // If directory, look for plan.md
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    const planFile = path.join(resolved, 'plan.md');
    if (fs.existsSync(planFile)) {
      return planFile;
    }
    // Look for any .md file
    const mdFiles = fs.readdirSync(resolved).filter(f => f.endsWith('.md'));
    if (mdFiles.length > 0) {
      return path.join(resolved, mdFiles[0]);
    }
  }

  return resolved;
}

// Open browser
function openBrowser(url) {
  const platform = process.platform;
  let cmd;

  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    cmd = `start "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch {
    // Ignore browser open errors
  }
}

// Generate full HTML page from markdown
function generateFullPage(filePath, assetsDir) {
  const { html, toc, frontmatter, title } = renderMarkdownFile(filePath);
  const tocHtml = renderTOCHtml(toc);
  const navSidebar = generateNavSidebar(filePath);
  const navFooter = generateNavFooter(filePath);
  const planInfo = detectPlan(filePath);

  // Read template
  const templatePath = path.join(assetsDir, 'template.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders (use regex with 'g' flag for multiple occurrences)
  template = template
    .replace(/\{\{title\}\}/g, title)
    .replace('{{toc}}', tocHtml)
    .replace('{{nav-sidebar}}', navSidebar)
    .replace('{{nav-footer}}', navFooter)
    .replace('{{content}}', html)
    .replace('{{has-plan}}', planInfo.isPlan ? 'has-plan' : '')
    .replace('{{frontmatter}}', JSON.stringify(frontmatter || {}));

  return template;
}

// Main function
async function main() {
  const args = parseArgs(process.argv);
  const cwd = process.cwd();
  const assetsDir = path.join(__dirname, '..', 'assets');

  // Handle --stop
  if (args.stop) {
    const instances = findRunningInstances();
    if (instances.length === 0) {
      console.log('No server running to stop');
      process.exit(0);
    }
    const stopped = stopAllServers();
    console.log(`Stopped ${stopped} server(s)`);
    process.exit(0);
  }

  // Validate file argument
  if (!args.file) {
    console.error('Error: --file argument required');
    console.error('Usage: node server.cjs --file <path.md> [--port 3456] [--open]');
    process.exit(1);
  }

  // Resolve file path
  const filePath = resolveFilePath(args.file, cwd);
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${args.file}`);
    process.exit(1);
  }

  if (!filePath.endsWith('.md')) {
    console.error(`Error: Not a markdown file: ${filePath}`);
    process.exit(1);
  }

  // Background mode - spawn child and exit
  if (args.background && !args.isChild) {
    const childArgs = ['--file', filePath, '--port', String(args.port), '--child'];
    if (args.open) childArgs.push('--open');

    const child = spawn(process.execPath, [__filename, ...childArgs], {
      detached: true,
      stdio: 'ignore',
      cwd: cwd
    });
    child.unref();

    // Wait briefly for child to start and report
    await new Promise(r => setTimeout(r, 500));

    // Find the port the child is using
    const instances = findRunningInstances();
    const instance = instances.find(i => i.port >= args.port);
    const port = instance ? instance.port : args.port;

    console.log(JSON.stringify({
      success: true,
      url: `http://localhost:${port}/view${filePath}`,
      file: filePath,
      port
    }));

    process.exit(0);
  }

  // Find available port
  const port = await findAvailablePort(args.port);
  if (port !== args.port) {
    console.error(`Port ${args.port} in use, using ${port}`);
  }

  // Determine allowed directories for security (file dir + cwd)
  const fileDir = path.dirname(filePath);
  const allowedDirs = [fileDir, cwd, assetsDir];

  // Create server with security restrictions
  const server = createHttpServer({
    assetsDir,
    renderMarkdown: (fp) => generateFullPage(fp, assetsDir),
    allowedDirs
  });

  // Start server
  server.listen(port, () => {
    const url = `http://localhost:${port}/view${filePath}`;

    // Write PID file
    writePidFile(port, process.pid);

    // Setup shutdown handlers
    setupShutdownHandlers(port, () => {
      server.close();
    });

    // Output for CLI/command integration
    if (args.isChild || process.env.CLAUDE_COMMAND) {
      console.log(JSON.stringify({
        success: true,
        url,
        file: filePath,
        port
      }));
    } else {
      console.log(`\nMarkdown Novel Viewer`);
      console.log(`${'─'.repeat(40)}`);
      console.log(`URL: ${url}`);
      console.log(`File: ${filePath}`);
      console.log(`Port: ${port}`);
      console.log(`\nPress Ctrl+C to stop\n`);
    }

    // Open browser
    if (args.open) {
      openBrowser(url);
    }
  });

  server.on('error', (err) => {
    console.error(`Server error: ${err.message}`);
    process.exit(1);
  });
}

// Run
main().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
