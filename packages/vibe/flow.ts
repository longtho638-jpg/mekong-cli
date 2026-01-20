/**
 * 🎨 VIBE Flow - Visual Workflow Builder (Proxy)
 */
export * from './src/flow/types';
export * from './src/flow/nodes';
export { VibeFlow } from './src/flow/builder';
export { FlowCopilot } from './src/flow/copilot';

import flow from './src/flow/builder';

/** @deprecated Use src/flow modules directly */
export const vibeFlow = flow.vibeFlow;

export default flow;
