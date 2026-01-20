/**
 * 🛡️ VIBE Hardened - Deployment Logic
 */
export interface DeployConfig {
    project: string;
    environment: 'development' | 'staging' | 'production';
    vercelFlags: string[];
}

export const DEPLOY_COMMANDS = {
    link: 'vercel link --yes',
    pull: 'vercel pull',
    build: 'vercel build',
    deploy: 'vercel --prod --yes',
    logs: 'vercel logs',
};

export function getDeployCommand(env: DeployConfig['environment']): string {
    if (env === 'production') return DEPLOY_COMMANDS.deploy;
    return 'vercel --yes';
}
