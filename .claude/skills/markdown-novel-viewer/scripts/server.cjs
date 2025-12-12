#!/usr/bin/env node

/**
 * Markdown Novel Viewer Server
 * Background HTTP server rendering markdown files with calm, book-like UI
 *
 * Usage:
 *   node server.cjs --file ./plan.md [--port 3456] [--open] [--stop] [--host 0.0.0.0]
 *   node server.cjs --dir ./plans [--port 3456] [--open]  # Dashboard-only mode
 *
 * Options:
 *   --file <path>   Path to markdown file or plan directory
 *   --dir <path>    Path to plans directory (dashboard-only mode)
 *   --port <number> Server port (default: 3456, auto-increment if busy)
 *   --host <addr>   Host to bind (default: localhost, use 0.0.0.0 for all interfaces)
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
    dir: null,
    port: DEFAULT_PORT,
    host: 'localhost',
    open: false,
    stop: false,
    background: false,
    isChild: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--file' && argv[i + 1]) {
      args.file = argv[++i];
    } else if ((arg === '--dir' || arg === '--plans') && argv[i + 1]) {
      args.dir = argv[++i];
    } else if (arg === '--port' && argv[i + 1]) {
      args.port = parseInt(argv[++i], 10);
    } else if (arg === '--host' && argv[i + 1]) {
      args.host = argv[++i];
    } else if (arg === '--open') {
      args.open = true;
    } else if (arg === '--stop') {
      args.stop = true;
    } else if (arg === '--background') {
      args.background = true;
    } else if (arg === '--child') {
      args.isChild = true;
    } else if (!arg.startsWith('--') && !args.file && !args.dir) {
      // Positional argument - could be file or directory
      args.file = arg;
    }
  }

  return args;
}

/**
 * Resolve input path and determine mode (file vs dashboard-only)
 * @param {string} input - Input path
 * @param {string} cwd - Current working directory
 * @returns {{filePath: string|null, plansDir: string|null, dashboardOnly: boolean}}
 */
function resolveInput(input, cwd) {
  if (!input) return { filePath: null, plansDir: null, dashboardOnly: false };

  // Resolve relative to CWD
  const resolved = path.isAbsolute(input) ? input : path.resolve(cwd, input);

  if (!fs.existsSync(resolved)) {
    return { filePath: null, plansDir: null, dashboardOnly: false };
  }

  const stats = fs.statSync(resolved);

  // If it's a file, return it directly
  if (stats.isFile()) {
    if (resolved.endsWith('.md')) {
      return { filePath: resolved, plansDir: null, dashboardOnly: false };
    }
    return { filePath: null, plansDir: null, dashboardOnly: false };
  }

  // It's a directory - check if it's a plan directory or a plans collection
  if (stats.isDirectory()) {
    // Check for plan.md in this directory (it's a single plan)
    const planFile = path.join(resolved, 'plan.md');
    if (fs.existsSync(planFile)) {
      return { filePath: planFile, plansDir: null, dashboardOnly: false };
    }

    // Check for any .md file in this directory
    const mdFiles = fs.readdirSync(resolved).filter(f => f.endsWith('.md'));
    if (mdFiles.length > 0) {
      return { filePath: path.join(resolved, mdFiles[0]), plansDir: null, dashboardOnly: false };
    }

    // Check if it contains subdirectories with plan.md files (it's a plans collection)
    const subdirs = fs.readdirSync(resolved).filter(f => {
      const subpath = path.join(resolved, f);
      return fs.statSync(subpath).isDirectory();
    });

    const hasPlans = subdirs.some(subdir => {
      const subPlanFile = path.join(resolved, subdir, 'plan.md');
      return fs.existsSync(subPlanFile);
    });

    if (hasPlans) {
      // Dashboard-only mode - no specific file, just the plans directory
      return { filePath: null, plansDir: resolved, dashboardOnly: true };
    }
  }

  return { filePath: null, plansDir: null, dashboardOnly: false };
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

  // Determine input (--dir takes precedence for dashboard mode)
  const input = args.dir || args.file;

  // Validate input
  if (!input) {
    console.error('Error: --file or --dir argument required');
    console.error('Usage:');
    console.error('  node server.cjs --file <path.md> [--port 3456] [--open]');
    console.error('  node server.cjs --dir <plans-dir> [--port 3456] [--open]  # Dashboard mode');
    process.exit(1);
  }

  // Resolve input path
  const { filePath, plansDir: resolvedPlansDir, dashboardOnly } = resolveInput(input, cwd);

  // If --dir was explicitly used, force dashboard mode
  const forceDashboard = !!args.dir;

  if (!filePath && !resolvedPlansDir && !forceDashboard) {
    console.error(`Error: Invalid path: ${input}`);
    console.error('Path must be a markdown file, plan directory, or plans collection.');
    process.exit(1);
  }

  // Determine plans directory
  let plansDir = resolvedPlansDir;
  if (!plansDir && filePath) {
    // Try to detect plans directory from file path
    const fileDir = path.dirname(filePath);
    const cwdPlans = path.join(cwd, 'plans');
    const fileDirParent = path.dirname(fileDir);

    if (fs.existsSync(cwdPlans) && fs.statSync(cwdPlans).isDirectory()) {
      plansDir = cwdPlans;
    } else if (fs.existsSync(fileDirParent) && fs.statSync(fileDirParent).isDirectory()) {
      plansDir = fileDirParent;
    }
  }

  // For --dir mode without resolved plansDir, use the input directly
  if (forceDashboard && !plansDir) {
    const resolvedDir = path.isAbsolute(args.dir) ? args.dir : path.resolve(cwd, args.dir);
    if (fs.existsSync(resolvedDir) && fs.statSync(resolvedDir).isDirectory()) {
      plansDir = resolvedDir;
    } else {
      console.error(`Error: Directory not found: ${args.dir}`);
      process.exit(1);
    }
  }

  // Background mode - spawn child and exit
  if (args.background && !args.isChild) {
    const childArgs = ['--port', String(args.port), '--host', args.host, '--child'];
    if (filePath) {
      childArgs.unshift('--file', filePath);
    } else if (plansDir) {
      childArgs.unshift('--dir', plansDir);
    }
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

    const displayHost = args.host === '0.0.0.0' ? 'localhost' : args.host;
    const url = dashboardOnly || forceDashboard
      ? `http://${displayHost}:${port}/dashboard`
      : `http://${displayHost}:${port}/view${filePath}`;

    console.log(JSON.stringify({
      success: true,
      url,
      file: filePath,
      dir: plansDir,
      port,
      host: args.host,
      mode: dashboardOnly || forceDashboard ? 'dashboard' : 'file'
    }));

    process.exit(0);
  }

  // Find available port
  const port = await findAvailablePort(args.port);
  if (port !== args.port) {
    console.error(`Port ${args.port} in use, using ${port}`);
  }

  // Determine allowed directories for security
  const allowedDirs = [assetsDir, cwd];
  if (filePath) {
    allowedDirs.push(path.dirname(filePath));
  }
  if (plansDir && !allowedDirs.includes(plansDir)) {
    allowedDirs.push(plansDir);
  }

  // Create server with security restrictions
  const server = createHttpServer({
    assetsDir,
    renderMarkdown: (fp) => generateFullPage(fp, assetsDir),
    allowedDirs,
    plansDir
  });

  // Start server
  server.listen(port, args.host, () => {
    const displayHost = args.host === '0.0.0.0' ? 'localhost' : args.host;
    const url = dashboardOnly || forceDashboard
      ? `http://${displayHost}:${port}/dashboard`
      : `http://${displayHost}:${port}/view${filePath}`;

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
        dir: plansDir,
        port,
        host: args.host,
        mode: dashboardOnly || forceDashboard ? 'dashboard' : 'file'
      }));
    } else {
      console.log(`\nMarkdown Novel Viewer`);
      console.log(`${'─'.repeat(40)}`);
      console.log(`URL: ${url}`);
      if (filePath) console.log(`File: ${filePath}`);
      if (plansDir) console.log(`Plans: ${plansDir}`);
      console.log(`Port: ${port}`);
      console.log(`Host: ${args.host}`);
      console.log(`Mode: ${dashboardOnly || forceDashboard ? 'Dashboard' : 'File Viewer'}`);
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
