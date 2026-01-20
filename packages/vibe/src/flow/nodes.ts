/**
 * 🎨 VIBE Flow - Constants and Mappings
 */
import { NodeType } from './types';

export const PLANET_NODES: Record<string, NodeType[]> = {
  saturn: ["agent"],
  jupiter: ["trigger", "output"],
  mars: ["tool"],
  earth: ["transform"],
  mercury: ["trigger"],
  neptune: ["output"],
  venus: ["human"],
  uranus: ["condition"],
};
