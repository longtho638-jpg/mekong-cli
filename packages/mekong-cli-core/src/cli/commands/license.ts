/**
 * `mekong license` — License management subcommands.
 *
 *   mekong license status       Show current license tier and status
 *   mekong license activate     Activate a license key
 *   mekong license deactivate   Remove stored license key
 *   mekong license info         Show full license details
 */
import type { Command } from 'commander';
import { LicenseStore } from '../../license/store.js';
import { LicenseGate } from '../../license/gate.js';
import { verifyLicense, computeSignature } from '../../license/verifier.js';
import { RemoteLicenseClient } from '../../license/remote.js';
import { TIER_QUOTAS } from '../../license/types.js';
import type { LicenseKey } from '../../license/types.js';

function formatQuota(n: number): string {
  return n === -1 ? 'unlimited' : String(n);
}

export function registerLicenseCommand(program: Command): void {
  const license = program
    .command('license')
    .description('License management');

  license
    .command('status')
    .description('Show current license tier and status')
    .action(async () => {
      const gate = new LicenseGate();
      const result = await gate.validate();
      if (!result.ok) {
        console.error('Error reading license:', result.error.message);
        process.exit(1);
      }
      const v = result.value;
      console.log(`\nLicense Status`);
      console.log(`  Tier    : ${v.tier}`);
      console.log(`  Valid   : ${v.valid}`);
      if (v.remainingDays > 0) {
        console.log(`  Expires : ${v.remainingDays} day(s) remaining`);
      }
      if (v.message) console.log(`  Note    : ${v.message}`);
      console.log('');
    });

  license
    .command('activate')
    .description('Activate a license key (local validation)')
    .requiredOption('--key <key>', 'License key string (JSON or RAAS-xxx format)')
    .option('--remote', 'Validate against remote API before storing')
    .action(async (opts: { key: string; remote?: boolean }) => {
      const store = new LicenseStore();

      // Support raw JSON key passed directly
      let licenseKey: LicenseKey;
      try {
        licenseKey = JSON.parse(opts.key) as LicenseKey;
      } catch {
        console.error('Error: --key must be a JSON-encoded LicenseKey object.');
        console.error('Example: mekong license activate --key \'{"key":"RAAS-xxx",...}\'');
        process.exit(1);
      }

      if (opts.remote) {
        const client = new RemoteLicenseClient();
        const remoteResult = await client.validate(licenseKey.key);
        if (!remoteResult.ok) {
          console.error('Remote validation failed:', remoteResult.error.message);
          process.exit(1);
        }
        licenseKey = remoteResult.value;
      } else {
        // Local: verify signature
        const verify = verifyLicense(licenseKey);
        if (!verify.valid) {
          console.error(`License validation failed: ${verify.message}`);
          process.exit(1);
        }
      }

      const saved = await store.save(licenseKey);
      if (!saved.ok) {
        console.error('Failed to save license:', saved.error.message);
        process.exit(1);
      }

      console.log(`\nLicense activated successfully!`);
      console.log(`  Tier  : ${licenseKey.tier}`);
      console.log(`  Owner : ${licenseKey.owner}`);
      console.log('');
    });

  license
    .command('deactivate')
    .description('Remove stored license key (revert to free tier)')
    .action(async () => {
      const store = new LicenseStore();
      const result = await store.clear();
      if (!result.ok) {
        console.error('Error removing license:', result.error.message);
        process.exit(1);
      }
      console.log('\nLicense deactivated. Running on free tier.\n');
    });

  license
    .command('info')
    .description('Show full license and quota details')
    .action(async () => {
      const gate = new LicenseGate();
      const result = await gate.validate();
      if (!result.ok) {
        console.error('Error reading license:', result.error.message);
        process.exit(1);
      }
      const v = result.value;
      const q = TIER_QUOTAS[v.tier];
      console.log(`\nLicense Info`);
      console.log(`  Tier              : ${v.tier}`);
      console.log(`  Status            : ${v.valid ? 'active' : 'inactive'}`);
      if (v.remainingDays > 0) console.log(`  Remaining days    : ${v.remainingDays}`);
      if (v.message) console.log(`  Message           : ${v.message}`);
      console.log(`\nQuotas (${v.tier})`);
      console.log(`  LLM calls/day     : ${formatQuota(q.llmCallsPerDay)}`);
      console.log(`  Tool runs/day     : ${formatQuota(q.toolRunsPerDay)}`);
      console.log(`  SOP runs/day      : ${formatQuota(q.sopRunsPerDay)}`);
      console.log(`  Storage           : ${q.storageBytes === -1 ? 'unlimited' : `${q.storageBytes / (1024 * 1024)} MB`}`);
      console.log('');
    });

  // Helper to generate a signed test key (dev/debug only)
  license
    .command('generate-test-key')
    .description('Generate a signed test license key (development only)')
    .option('--tier <tier>', 'License tier', 'starter')
    .option('--days <days>', 'Validity in days', '30')
    .option('--owner <owner>', 'Owner name', 'test-user')
    .action((opts: { tier: string; days: string; owner: string }) => {
      const issuedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + parseInt(opts.days, 10) * 86400_000).toISOString();
      const partial = {
        key: `RAAS-${opts.tier.toUpperCase()}-${Date.now()}`,
        tier: opts.tier as LicenseKey['tier'],
        status: 'active' as const,
        issuedAt,
        expiresAt,
        owner: opts.owner,
      };
      const signature = computeSignature(partial);
      const full: LicenseKey = { ...partial, signature };
      console.log('\nGenerated test key (JSON):');
      console.log(JSON.stringify(full, null, 2));
      console.log('\nActivate with:');
      console.log(`  mekong license activate --key '${JSON.stringify(full)}'`);
      console.log('');
    });
}
