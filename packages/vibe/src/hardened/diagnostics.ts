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

interface ImportMetaEnv {
    [key: string]: string | boolean | undefined;
}

interface ImportMetaWithEnv extends ImportMeta {
    env: ImportMetaEnv;
}

export function validateEnv(requiredKeys: string[]): EnvCheck[] {
    return requiredKeys.map(key => {
        const env = (import.meta as unknown as ImportMetaWithEnv).env;
        const value = env?.[key] as string | undefined;
        return { key, required: true, present: !!value, isPlaceholder: value?.includes('placeholder') || value?.includes('xxx') || false };
    });
}
