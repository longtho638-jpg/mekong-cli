/**
 * 🛡️ VIBE Hardened - Diagnostics and Env Validation
 */
export interface DiagnosticResult {
    check: string;
    passed: boolean;
    details?: string;
}

export async function runBlackScreenDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    const root = document.getElementById('root');
    results.push({ check: 'DOM Root Element', passed: !!root, details: root ? 'Found #root' : 'Missing #root' });
    results.push({ check: 'Console Errors', passed: true, details: 'Manual check required' });
    results.push({ check: 'Network Status', passed: navigator.onLine, details: navigator.onLine ? 'Online' : 'Offline' });
    return results;
}

export interface EnvCheck {
    key: string;
    required: boolean;
    present: boolean;
    isPlaceholder: boolean;
}

export function validateEnv(requiredKeys: string[]): EnvCheck[] {
    return requiredKeys.map(key => {
        const value = (import.meta as any).env?.[key] as string | undefined;
        return { key, required: true, present: !!value, isPlaceholder: value?.includes('placeholder') || value?.includes('xxx') || false };
    });
}
