#!/usr/bin/env node
/**
 * RaaS Gateway CLI - Entry Point
 * JWT authenticated client for raas.agencyos.network
 */

import { Command, Option } from 'commander';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
  GatewayStatus,
  GatewayError,
  RateLimitHeaders,
} from './types.js';

// ES Module path handling
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

// Default configuration
const DEFAULT_BASE_URL = 'https://raas.agencyos.network';
const DEFAULT_TIMEOUT = 30000;

// Exit codes
const EXIT_SUCCESS = 0;
const EXIT_AUTH_ERROR = 1;
const EXIT_NETWORK_ERROR = 2;
const EXIT_API_ERROR = 3;

// Config storage (env var for now)
const CONFIG_ENV_VAR = 'MK_API_KEY';

interface CliOptions {
  verbose?: boolean;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Get API key from options, env, or config
 */
function getApiKey(cliOptions: CliOptions): string | undefined {
  return cliOptions.apiKey || process.env[CONFIG_ENV_VAR];
}

/**
 * Get base URL from options or default
 */
function getBaseUrl(cliOptions: CliOptions): string {
  return cliOptions.baseUrl || DEFAULT_BASE_URL;
}

/**
 * Build request headers with auth
 * Gateway expects: Authorization: Bearer {apiKey}
 */
function buildHeaders(apiKey: string, contentType = 'application/json'): Record<string, string> {
  return {
    'Content-Type': contentType,
    'Authorization': `Bearer ${apiKey}`,
  };
}

/**
 * Log verbose message if verbose flag is set
 */
function logVerbose(message: string, verbose: boolean): void {
  if (verbose) {
    console.error(`[DEBUG] ${message}`);
  }
}

/**
 * Redact sensitive data from headers for logging
 */
function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted = { ...headers };
  if (redacted['Authorization']) {
    redacted['Authorization'] = 'Bearer [REDACTED]';
  }
  return redacted;
}

/**
 * Pretty print error message
 */
function printError(message: string, details?: string): void {
  console.error(`\n❌ Error: ${message}`);
  if (details) {
    console.error(`   ${details}`);
  }
  console.error('');
}

/**
 * Validate API key format (mk_ prefix)
 */
function validateApiKeyFormat(apiKey: string): boolean {
  return apiKey.startsWith('mk_');
}

/**
 * Make HTTP request to gateway with retry for rate limits
 */
async function gatewayRequest<T>(
  url: string,
  apiKey: string,
  method = 'GET',
  body?: unknown,
  verbose = false
): Promise<{ data: T; headers: RateLimitHeaders | null }> {
  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (retryCount <= MAX_RETRIES) {
    logVerbose(`${method} ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`, verbose);

    const headers = buildHeaders(apiKey, body ? 'application/json' : 'application/json');

    logVerbose(`Headers: ${JSON.stringify(redactHeaders(headers), null, 2)}`, verbose);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });

    // Extract rate limit headers
    let rateLimitHeaders: RateLimitHeaders | null = null;
    const limit = response.headers.get('x-ratelimit-limit');
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (limit && remaining && reset) {
      rateLimitHeaders = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }

    const responseText = await response.text();
    logVerbose(`Response (${response.status}): ${responseText}`, verbose);

    // Handle 429 with retry
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : Math.pow(2, retryCount);

      if (retryCount < MAX_RETRIES) {
        logVerbose(`Rate limited. Retrying after ${waitSeconds}s...`, verbose);
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
        retryCount++;
        continue;
      }

      throw {
        error: 'Rate limit exceeded',
        details: `Too many requests. Retry after ${waitSeconds}s or wait until rate limit resets.`,
        status: 429,
        headers: rateLimitHeaders,
      } as GatewayError;
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorDetails: string | undefined;

      try {
        const errorBody = JSON.parse(responseText) as GatewayError;
        errorMessage = errorBody.error || errorMessage;
        errorDetails = errorBody.details;
      } catch {
        errorDetails = responseText || undefined;
      }

      throw {
        error: errorMessage,
        details: errorDetails,
        status: response.status,
      } as GatewayError;
    }

    const data = responseText ? (JSON.parse(responseText) as T) : ({} as T);
    return { data, headers: rateLimitHeaders };
  }

  // Should never reach here
  throw { error: 'Unexpected error', status: 500 } as GatewayError;
}

/**
 * Command: login <api-key>
 */
async function loginCommand(apiKey: string, options: CliOptions): Promise<number> {
  const verbose = options.verbose || false;
  const baseUrl = getBaseUrl(options);

  console.log('🔐 RaaS Gateway Login\n');

  // Validate API key format
  if (!validateApiKeyFormat(apiKey)) {
    printError(
      'Invalid API key format',
      'API key must start with "mk_" prefix (e.g., mk_abc123)'
    );
    return EXIT_AUTH_ERROR;
  }

  logVerbose(`Validating API key against ${baseUrl}/v1/health`, verbose);

  try {
    // Call /health to verify connection and key
    const { data } = await gatewayRequest<{
      status: string;
      version: string;
      timestamp: number;
    }>(`${baseUrl}/v1/health`, apiKey, 'GET', undefined, verbose);

    console.log('✅ Login successful!\n');
    console.log(`   Gateway Status: ${data.status}`);
    console.log(`   Version: ${data.version}`);
    console.log(`   Timestamp: ${new Date(data.timestamp).toISOString()}`);
    console.log('');

    // Store in env var for now (could be enhanced with config file)
    console.log(`   To persist, set environment variable:`);
    console.log(`   export ${CONFIG_ENV_VAR}=mk_[REDACTED]`);
    console.log('');

    return EXIT_SUCCESS;
  } catch (error) {
    const err = error as GatewayError;
    printError('Authentication failed', err.details || err.error);
    return EXIT_AUTH_ERROR;
  }
}

/**
 * Command: status
 */
async function statusCommand(options: CliOptions): Promise<number> {
  const verbose = options.verbose || false;
  const apiKey = getApiKey(options);
  const baseUrl = getBaseUrl(options);

  console.log('📊 RaaS Gateway Status\n');

  if (!apiKey) {
    printError(
      'Not authenticated',
      `Run 'raas-cli login <api-key>' or set ${CONFIG_ENV_VAR} env var`
    );
    return EXIT_AUTH_ERROR;
  }

  try {
    const { data, headers } = await gatewayRequest<GatewayStatus>(
      `${baseUrl}/v1/status`,
      apiKey,
      'GET',
      undefined,
      verbose
    );

    console.log(`   Tenant: ${data.tenant}`);
    console.log(`   Role: ${data.role}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Version: ${data.version}`);
    console.log('');
    console.log('   Rate Limits:');
    console.log(`   └─ Remaining: ${data.rateLimit.remaining}/${data.rateLimit.limit}`);

    if (headers) {
      console.log(`   └─ Reset: ${new Date(headers.reset * 1000).toLocaleString()}`);
    }
    console.log('');

    return EXIT_SUCCESS;
  } catch (error) {
    if ((error as GatewayError).status === 401) {
      printError('Invalid or expired API key');
      return EXIT_AUTH_ERROR;
    }
    const err = error as GatewayError;
    printError('Failed to fetch status', err.details || err.error);
    return EXIT_NETWORK_ERROR;
  }
}

/**
 * Command: services
 */
async function servicesCommand(options: CliOptions): Promise<number> {
  const verbose = options.verbose || false;
  const apiKey = getApiKey(options);
  const baseUrl = getBaseUrl(options);

  console.log('🔧 Available Services\n');

  if (!apiKey) {
    printError(
      'Not authenticated',
      `Run 'raas-cli login <api-key>' or set ${CONFIG_ENV_VAR} env var`
    );
    return EXIT_AUTH_ERROR;
  }

  try {
    const { data } = await gatewayRequest<{
      services: Array<{
        id: string;
        name: string;
        description: string;
        status: 'available' | 'unavailable';
      }>;
    }>(`${baseUrl}/v1/agents`, apiKey, 'GET', undefined, verbose);

    if (!data.services || data.services.length === 0) {
      console.log('   No services available\n');
      return EXIT_SUCCESS;
    }

    for (const service of data.services) {
      const statusIcon = service.status === 'available' ? '✅' : '❌';
      console.log(`   ${statusIcon} ${service.name} (${service.id})`);
      console.log(`      ${service.description}`);
      console.log(`      Status: ${service.status}`);
      console.log('');
    }

    return EXIT_SUCCESS;
  } catch (error) {
    if ((error as GatewayError).status === 401) {
      printError('Invalid or expired API key');
      return EXIT_AUTH_ERROR;
    }
    const err = error as GatewayError;
    printError('Failed to fetch services', err.details || err.error);
    return EXIT_NETWORK_ERROR;
  }
}

/**
 * Command: invoke <task>
 */
async function invokeCommand(task: string, options: CliOptions): Promise<number> {
  const verbose = options.verbose || false;
  const apiKey = getApiKey(options);
  const baseUrl = getBaseUrl(options);

  console.log('⚡ Invoking Task\n');

  if (!apiKey) {
    printError(
      'Not authenticated',
      `Run 'raas-cli login <api-key>' or set ${CONFIG_ENV_VAR} env var`
    );
    return EXIT_AUTH_ERROR;
  }

  const requestBody = {
    task,
    timestamp: Date.now(),
  };

  logVerbose(`Request body: ${JSON.stringify(requestBody, null, 2)}`, verbose);

  try {
    const { data, headers } = await gatewayRequest<{
      taskId: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      result?: unknown;
      error?: string;
    }>(`${baseUrl}/v1/tasks`, apiKey, 'POST', requestBody, verbose);

    console.log(`   Task ID: ${data.taskId}`);
    console.log(`   Status: ${data.status}`);

    if (headers) {
      console.log(`   Rate Limit: ${headers.remaining}/${headers.limit}`);
    }

    if (data.result) {
      console.log('\n   Result:');
      console.log(`   ${JSON.stringify(data.result, null, 2)}`);
    }

    if (data.error) {
      console.log(`\n   Error: ${data.error}`);
    }

    console.log('');

    if (data.status === 'failed') {
      return EXIT_API_ERROR;
    }

    return EXIT_SUCCESS;
  } catch (error) {
    if ((error as GatewayError).status === 401) {
      printError('Invalid or expired API key');
      return EXIT_AUTH_ERROR;
    }
    const err = error as GatewayError;
    printError('Failed to invoke task', err.details || err.error);
    return EXIT_NETWORK_ERROR;
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('raas-cli')
    .version(packageJson.version)
    .description(packageJson.description)
    .addOption(
      new Option('--verbose', 'Enable verbose logging').default(false).hideHelp()
    )
    .addOption(
      new Option('--api-key <key>', 'Override API key (or use env RAAS_API_KEY)').hideHelp()
    )
    .addOption(
      new Option('--base-url <url>', 'Override base URL').default(DEFAULT_BASE_URL).hideHelp()
    );

  program
    .command('login <api-key>')
    .description('Set and validate API key')
    .action(async (apiKey: string, options: CliOptions) => {
      const exitCode = await loginCommand(apiKey, { ...program.opts(), ...options });
      process.exit(exitCode);
    });

  program
    .command('status')
    .description('Show gateway status')
    .action(async (options: CliOptions) => {
      const exitCode = await statusCommand({ ...program.opts(), ...options });
      process.exit(exitCode);
    });

  program
    .command('services')
    .description('List available services')
    .action(async (options: CliOptions) => {
      const exitCode = await servicesCommand({ ...program.opts(), ...options });
      process.exit(exitCode);
    });

  program
    .command('invoke <task>')
    .description('Invoke a workflow task')
    .action(async (task: string, options: CliOptions) => {
      const exitCode = await invokeCommand(task, { ...program.opts(), ...options });
      process.exit(exitCode);
    });

  await program.parseAsync(process.argv);
}

// Run CLI
main().catch((error: Error) => {
  console.error(`\n❌ Unexpected error: ${error.message}`);
  console.error('   Run with --verbose for details\n');
  process.exit(EXIT_NETWORK_ERROR);
});
