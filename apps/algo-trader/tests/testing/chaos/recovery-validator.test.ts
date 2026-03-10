import { buildEnvironment, crashContainer } from '../../../src/testing/chaos/environment-builder';
import {
  validateContainerRecovery, validateDataIntegrity,
  validateRecoveryTime, validateRecovery,
} from '../../../src/testing/chaos/recovery-validator';

describe('recovery-validator', () => {
  it('should pass when all containers running', () => {
    const env = buildEnvironment({ useDocker: false, images: { s1: 'a:1', s2: 'b:1' } });
    const check = validateContainerRecovery(env);
    expect(check.passed).toBe(true);
    expect(check.detail).toContain('All containers running');
  });

  it('should fail when a container is crashed', () => {
    const env = buildEnvironment({ useDocker: false, images: { s1: 'a:1' } });
    crashContainer(env, 's1');
    const check = validateContainerRecovery(env);
    expect(check.passed).toBe(false);
    expect(check.detail).toContain('s1');
  });

  it('should validate data integrity (no loss)', () => {
    const check = validateDataIntegrity(false);
    expect(check.passed).toBe(true);
  });

  it('should pass recovery time when within limit', () => {
    const check = validateRecoveryTime(2.5, 10);
    expect(check.passed).toBe(true);
    expect(check.detail).toContain('2.500');
  });

  it('should fail recovery time when exceeding limit', () => {
    const check = validateRecoveryTime(15, 10);
    expect(check.passed).toBe(false);
  });

  it('should run full validation suite and pass', () => {
    const env = buildEnvironment({ useDocker: false, images: { s1: 'a:1' } });
    const report = validateRecovery(env, 1.0, 5, false);
    expect(report.allPassed).toBe(true);
    expect(report.checks).toHaveLength(3);
  });

  it('should run full validation suite and fail on time', () => {
    const env = buildEnvironment({ useDocker: false, images: { s1: 'a:1' } });
    const report = validateRecovery(env, 20, 5, false);
    expect(report.allPassed).toBe(false);
  });
});
