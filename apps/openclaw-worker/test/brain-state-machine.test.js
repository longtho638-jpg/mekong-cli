/**
 * Brain State Machine Tests — 行軍 Ch.9 (On the March)
 * Tests pattern-based CC CLI state detection.
 */
import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock dependencies
vi.mock('../lib/brain-logger', () => ({ log: vi.fn() }));
vi.mock('../lib/brain-tmux-controller', () => ({
    getCleanTail: (output, n) => {
        const lines = (output || '').split('\n');
        return lines.slice(-n);
    },
}));

const {
    isBusy,
    hasCompletionPattern,
    hasPrompt,
    hasApproveQuestion,
    hasContextLimit,
    isShellPrompt,
    detectState,
    BUSY_PATTERNS,
    COMPLETION_PATTERNS,
} = require('../lib/brain-state-machine');

describe('Brain State Machine', () => {
    describe('isBusy', () => {
        it('should detect "Photosynthesizing" as busy', () => {
            expect(isBusy('❯\nPhotosynthesizing...').isBusy).toBe(true);
        });

        it('should detect "Crunching" as busy', () => {
            expect(isBusy('❯\nCrunching...').isBusy).toBe(true);
        });

        it('should detect "Sautéing" as busy', () => {
            expect(isBusy('❯\nSautéing...').isBusy).toBe(true);
        });

        it('should detect spinner characters as busy', () => {
            expect(isBusy('❯\n⠋ Processing...').isBusy).toBe(true);
        });

        it('should detect "Running command" as busy', () => {
            expect(isBusy('❯\nRunning command...').isBusy).toBe(true);
        });

        it('should NOT detect empty output as busy', () => {
            expect(isBusy('').isBusy).toBe(false);
        });

        it('should NOT detect bare prompt as busy', () => {
            expect(isBusy('❯ ').isBusy).toBe(false);
        });

        it('should detect "Cooking" as busy', () => {
            expect(isBusy('❯\nCooking stuff...').isBusy).toBe(true);
        });

        it('should detect subagent activity', () => {
            expect(isBusy('❯\n3 local agents running').isBusy).toBe(true);
        });
    });

    describe('hasCompletionPattern', () => {
        it('should detect "Cooked for 2m 30s"', () => {
            expect(hasCompletionPattern('Cooked for 2m 30s')).toBe(true);
        });

        it('should detect "Sautéed for 1m 15s"', () => {
            expect(hasCompletionPattern('Sautéed for 1m 15s')).toBe(true);
        });

        it('should detect "Task completed in 30s"', () => {
            expect(hasCompletionPattern('Task completed in 30s')).toBe(true);
        });

        it('should NOT detect ongoing cooking as complete', () => {
            expect(hasCompletionPattern('Cooking...')).toBe(false);
        });

        it('should detect "Finished in 5 seconds"', () => {
            expect(hasCompletionPattern('Finished in 5 seconds')).toBe(true);
        });
    });

    describe('hasApproveQuestion', () => {
        it('should detect "(y/n)" question', () => {
            expect(hasApproveQuestion('Do you want to proceed? (y/n)')).toBe(true);
        });

        it('should detect "Do you want to run this command?"', () => {
            expect(hasApproveQuestion('Do you want to run this command?')).toBe(true);
        });

        it('should detect "accept edits on"', () => {
            expect(hasApproveQuestion('accept edits on (shell)')).toBe(true);
        });

        it('should NOT detect normal output as question', () => {
            expect(hasApproveQuestion('Building project...')).toBe(false);
        });

        it('should detect "What would you like" question', () => {
            expect(hasApproveQuestion('What would you like to do?')).toBe(true);
        });
    });

    describe('hasContextLimit', () => {
        it('should always return false (proxy handles infinite context)', () => {
            expect(hasContextLimit('Context limit reached')).toBe(false);
            expect(hasContextLimit('/compact or /clear')).toBe(false);
            expect(hasContextLimit('')).toBe(false);
        });
    });

    describe('isShellPrompt', () => {
        it('should detect zsh prompt (% suffix)', () => {
            expect(isShellPrompt('user@mac ~ % ')).toBe(true);
        });

        it('should detect bash prompt ($ suffix)', () => {
            expect(isShellPrompt('user@mac:~$ ')).toBe(true);
        });

        it('should detect root prompt (# suffix)', () => {
            expect(isShellPrompt('root@server:~# ')).toBe(true);
        });

        it('should NOT detect Claude prompt as shell', () => {
            expect(isShellPrompt('❯ ')).toBe(false);
        });
    });

    describe('detectState', () => {
        it('should return "busy" when processing', () => {
            expect(detectState('❯\nPhotosynthesizing...')).toBe('busy');
        });

        it('should return "complete" when done cooking', () => {
            expect(detectState('Cooked for 2m 30s\n❯ ')).toBe('complete');
        });

        it('should return "question" when approval needed', () => {
            expect(detectState('Do you want to run this command? (y/n)')).toBe('question');
        });

        it('should return "idle" when showing prompt without activity', () => {
            expect(detectState('❯ ')).toBe('idle');
        });

        it('should prioritize question over busy', () => {
            const output = '❯\nCooking...\nDo you want to proceed? (y/n)';
            expect(detectState(output)).toBe('question');
        });

        it('should return "unknown" for ambiguous output', () => {
            expect(detectState('some random text with no patterns')).toBe('unknown');
        });
    });

    describe('Pattern arrays', () => {
        it('BUSY_PATTERNS should be non-empty array of RegExp', () => {
            expect(BUSY_PATTERNS.length).toBeGreaterThan(10);
            BUSY_PATTERNS.forEach(p => expect(p).toBeInstanceOf(RegExp));
        });

        it('COMPLETION_PATTERNS should be non-empty array of RegExp', () => {
            expect(COMPLETION_PATTERNS.length).toBeGreaterThan(2);
            COMPLETION_PATTERNS.forEach(p => expect(p).toBeInstanceOf(RegExp));
        });
    });
});
