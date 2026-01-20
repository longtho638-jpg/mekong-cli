/**
 * 📋 VIBE Project - Facade
 */
import { VibeProject } from './engine';

export * from './types';
export { VibeProject };

export const vibeProject = new VibeProject();

export default {
    VibeProject,
    vibeProject,
};
