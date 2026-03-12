/**
 * `mekong plugin` — Plugin management.
 *
 *   mekong plugin list                     List loaded plugins
 *   mekong plugin load <path>              Load a plugin
 *   mekong plugin unload <name>            Unload a plugin
 *   mekong plugin validate <path>          Validate plugin manifest
 *   mekong plugin create                   Interactive plugin scaffold
 *   mekong plugin permissions <name>       View plugin permissions
 */
import type { Command } from 'commander';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { PluginLoader } from '../../plugins/loader.js';
import { createPluginApi } from '../../plugins/api.js';
import type { PluginManifest } from '../../plugins/types.js';

const PLUGIN_DIRS = [
  join(homedir(), '.mekong', 'plugins'),
  join(process.cwd(), 'mekong-plugins'),
];

/** Minimal no-op API for CLI context (no live engine deps needed) */
function buildNoopApi() {
  return createPluginApi('cli', [], {
    toolRegistry: { register: () => undefined },
    agentPool: { registerDefinition: () => undefined },
    config: {},
    memory: { get: async () => undefined, set: async () => undefined },
    eventBus: { emit: () => undefined, on: () => undefined },
    llmRouter: { chat: async () => ({ content: '' }) },
    logger: {
      debug: (m: string) => console.debug(m),
      info: (m: string) => console.info(m),
      warn: (m: string) => console.warn(m),
      error: (m: string) => console.error(m),
    },
  });
}

export function registerPluginCommand(program: Command): void {
  const plugin = program
    .command('plugin')
    .description('Plugin management — load, unload, validate, and create plugins');

  plugin.command('list')
    .description('List loaded plugins')
    .action(async () => {
      const loader = new PluginLoader(PLUGIN_DIRS, buildNoopApi());
      const { loaded, failed } = await loader.loadAll();
      const plugins = loader.getPlugins();

      if (plugins.length === 0 && failed.length === 0) {
        console.log('No plugins found in:', PLUGIN_DIRS.join(', '));
        console.log('Use `mekong plugin load <path>` to load a plugin.');
        return;
      }

      if (plugins.length > 0) {
        console.log(`\nLoaded plugins (${loaded.length}):\n`);
        for (const p of plugins) {
          const provides = Object.entries(p.manifest.provides)
            .filter(([, v]) => Array.isArray(v) && v.length > 0)
            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
            .join(' | ');
          console.log(`  ${p.manifest.name} v${p.manifest.version}`);
          console.log(`    ${p.manifest.description}`);
          if (provides) console.log(`    Provides: ${provides}`);
          console.log(`    Permissions: ${p.manifest.permissions.join(', ') || 'none'}`);
        }
      }

      if (failed.length > 0) {
        console.log(`\nFailed to load (${failed.length}):\n`);
        for (const f of failed) {
          console.log(`  ${f.name}: ${f.error}`);
        }
      }
    });

  plugin.command('load <path>')
    .description('Load a plugin from path (directory or manifest.json)')
    .action(async (pluginPath: string) => {
      const loader = new PluginLoader([], buildNoopApi());
      const manifestPath = pluginPath.endsWith('.json')
        ? pluginPath
        : join(pluginPath, 'plugin.json');

      const result = await loader.load(manifestPath);
      if (!result.ok) {
        console.error('Failed to load plugin:', result.error.message);
        process.exit(1);
      }
      const inst = result.value;
      console.log(`Loaded plugin: ${inst.manifest.name} v${inst.manifest.version}`);
      console.log(`Description: ${inst.manifest.description}`);
    });

  plugin.command('unload <name>')
    .description('Unload a plugin by name')
    .action(async (name: string) => {
      const loader = new PluginLoader(PLUGIN_DIRS, buildNoopApi());
      await loader.loadAll();
      const result = await loader.unload(name);
      if (!result.ok) {
        console.error('Failed to unload plugin:', result.error.message);
        process.exit(1);
      }
      console.log(`Unloaded plugin: ${name}`);
    });

  plugin.command('validate <path>')
    .description('Validate plugin manifest (plugin.json)')
    .action(async (pluginPath: string) => {
      const manifestPath = pluginPath.endsWith('.json')
        ? pluginPath
        : join(pluginPath, 'plugin.json');

      try {
        const raw = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(raw) as PluginManifest;

        const errors: string[] = [];
        if (!manifest.name) errors.push('Missing: name');
        if (!manifest.version) errors.push('Missing: version');
        if (!manifest.description) errors.push('Missing: description');
        if (!manifest.author) errors.push('Missing: author');
        if (!manifest.mekongVersion) errors.push('Missing: mekongVersion');
        if (!manifest.main) errors.push('Missing: main');
        if (!Array.isArray(manifest.permissions)) errors.push('Missing: permissions (must be array)');

        if (errors.length > 0) {
          console.error('\nValidation failed:');
          errors.forEach(e => console.error(`  [ERROR] ${e}`));
          process.exit(1);
        }

        console.log(`Manifest valid: ${manifest.name} v${manifest.version}`);
        console.log(`Permissions: ${manifest.permissions.join(', ') || 'none'}`);
        const provides = Object.entries(manifest.provides)
          .filter(([, v]) => Array.isArray(v) && (v as string[]).length > 0)
          .map(([k, v]) => `${k}(${(v as string[]).length})`)
          .join(', ');
        if (provides) console.log(`Provides: ${provides}`);
      } catch (e) {
        console.error('Could not read manifest:', e instanceof Error ? e.message : String(e));
        process.exit(1);
      }
    });

  plugin.command('create')
    .description('Scaffold a new plugin directory')
    .option('--name <name>', 'Plugin name (e.g. my-plugin)')
    .option('--dir <dir>', 'Output directory', '.')
    .action(async (opts: { name?: string; dir: string }) => {
      const name = opts.name ?? 'my-plugin';
      const outDir = join(opts.dir, name);

      const manifest: PluginManifest = {
        name,
        version: '0.1.0',
        description: `${name} — Mekong CLI plugin`,
        author: 'your-name',
        mekongVersion: '0.3.0',
        provides: { tools: [], agents: [], hooks: [] },
        requires: {},
        main: 'index.js',
        permissions: [],
      };

      const indexJs = `/**
 * ${name} plugin entry point.
 * Export a 'hooks' object implementing PluginHooks.
 */
export const hooks = {
  async onLoad() {
    console.log('[${name}] Plugin loaded');
  },
  async onUnload() {
    console.log('[${name}] Plugin unloaded');
  },
};
`;

      try {
        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(join(outDir, 'plugin.json'), JSON.stringify(manifest, null, 2), 'utf-8');
        await fs.writeFile(join(outDir, 'index.js'), indexJs, 'utf-8');
        await fs.writeFile(join(outDir, 'README.md'), `# ${name}\n\nA Mekong CLI plugin.\n`, 'utf-8');

        console.log(`\nPlugin scaffolded at: ${outDir}`);
        console.log('Files created:');
        console.log(`  plugin.json  — manifest`);
        console.log(`  index.js     — entry point`);
        console.log(`  README.md    — documentation`);
        console.log(`\nNext: mekong plugin validate ${outDir}`);
        console.log(`      mekong plugin load ${outDir}`);
      } catch (e) {
        console.error('Failed to scaffold plugin:', e instanceof Error ? e.message : String(e));
        process.exit(1);
      }
    });

  plugin.command('permissions <name>')
    .description('View permissions for a loaded plugin')
    .action(async (name: string) => {
      const loader = new PluginLoader(PLUGIN_DIRS, buildNoopApi());
      await loader.loadAll();
      const plugins = loader.getPlugins();
      const inst = plugins.find(p => p.manifest.name === name);
      if (!inst) {
        console.error(`Plugin "${name}" not found. Run \`mekong plugin list\` to see loaded plugins.`);
        process.exit(1);
      }
      console.log(`\nPermissions for ${inst.manifest.name} v${inst.manifest.version}:\n`);
      if (inst.manifest.permissions.length === 0) {
        console.log('  (no permissions declared)');
      } else {
        inst.manifest.permissions.forEach(p => console.log(`  - ${p}`));
      }
    });
}
