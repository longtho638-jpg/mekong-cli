/**
 * Recipe Verifier — validates execution results.
 * Mirrors Python: src/core/verifier.py
 *
 * VERIFY phase of Plan-Execute-Verify pattern.
 */

import type { ExecutionResult, VerificationCheck, VerificationReport } from '../types/execution'
import type { LLMClient } from './llm-client'

export class RecipeVerifier {
  constructor(
    private strictMode = true,
    private llm?: LLMClient,
  ) {}

  verifyExitCode(result: ExecutionResult, expected = 0): VerificationCheck {
    const passed = result.exit_code === expected
    return {
      name: 'exit_code',
      passed,
      message: passed
        ? `Exit code ${result.exit_code} matches expected ${expected}`
        : `Exit code ${result.exit_code} != expected ${expected}`,
    }
  }

  verifyOutputContains(result: ExecutionResult, pattern: string): VerificationCheck {
    const found = result.stdout.includes(pattern) || result.stderr.includes(pattern)
    return {
      name: 'output_contains',
      passed: found,
      message: found ? `Found "${pattern}" in output` : `Pattern "${pattern}" not found`,
    }
  }

  verifyOutputRegex(result: ExecutionResult, regex: string): VerificationCheck {
    const re = new RegExp(regex)
    const found = re.test(result.stdout) || re.test(result.stderr)
    return {
      name: 'output_regex',
      passed: found,
      message: found ? `Regex /${regex}/ matched` : `Regex /${regex}/ not matched`,
    }
  }

  async verifyWithLlm(result: ExecutionResult, criteria: string): Promise<VerificationCheck> {
    if (!this.llm?.isAvailable) {
      return { name: 'llm_check', passed: true, message: '[SKIPPED] LLM offline' }
    }

    const prompt = `Verify this execution result against criteria.
Criteria: ${criteria}
Exit code: ${result.exit_code}
Stdout (first 500 chars): ${result.stdout.slice(0, 500)}
Stderr (first 200 chars): ${result.stderr.slice(0, 200)}

Respond with JSON: {"passed": true/false, "reason": "explanation"}`

    const resp = await this.llm.generateJson(prompt)
    const passed = resp.passed === true
    return {
      name: 'llm_check',
      passed,
      message: (resp.reason as string) ?? (passed ? 'LLM approved' : 'LLM rejected'),
    }
  }

  verify(
    result: ExecutionResult,
    criteria?: Record<string, unknown>,
  ): VerificationReport {
    const checks: VerificationCheck[] = []

    // Always check exit code
    checks.push(this.verifyExitCode(result))

    // Check for errors in stderr
    if (result.stderr && result.exit_code !== 0) {
      checks.push({
        name: 'no_errors',
        passed: false,
        message: `Stderr: ${result.stderr.slice(0, 200)}`,
      })
    }

    // Custom criteria checks
    if (criteria) {
      if (typeof criteria.expected_output === 'string') {
        checks.push(this.verifyOutputContains(result, criteria.expected_output))
      }
      if (typeof criteria.output_regex === 'string') {
        checks.push(this.verifyOutputRegex(result, criteria.output_regex))
      }
    }

    const allPassed = this.strictMode
      ? checks.every((c) => c.passed)
      : checks.filter((c) => c.name !== 'no_errors').every((c) => c.passed)

    const total = checks.length
    const passedCount = checks.filter((c) => c.passed).length
    const failedCount = total - passedCount

    return {
      passed: allPassed,
      checks,
      summary: `${passedCount}/${total} checks passed, ${failedCount} failed`,
    }
  }
}
