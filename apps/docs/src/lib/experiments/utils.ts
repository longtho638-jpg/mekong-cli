import experimentsConfig from './experiments.json';
import UAParser from 'ua-parser-js';

export interface Variant {
  id: string;
  weight: number;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  active: boolean;
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
}

export function getAllExperiments(): Experiment[] {
  return experimentsConfig.experiments as Experiment[];
}

export function getActiveExperiments(): Experiment[] {
  return getAllExperiments().filter(exp => exp.active);
}

export function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = new UAParser(userAgent);
  const deviceType = ua.getDevice().type;
  // Basic bot detection logic
  return deviceType === 'bot' || /bot|crawler|spider|crawling/i.test(userAgent);
}

export function assignVariant(experiment: Experiment): string {
  const totalWeight = experiment.variants.reduce((acc, v) => acc + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of experiment.variants) {
    if (random < variant.weight) {
      return variant.id;
    }
    random -= variant.weight;
  }

  return experiment.variants[0].id; // Fallback to first variant (control)
}

export function getExperimentAssignments(cookies: Record<string, string>, userAgent: string): ExperimentAssignment[] {
  // If bot, always return control for all experiments to avoid skewing data
  const bot = isBot(userAgent);
  const activeExperiments = getActiveExperiments();
  const assignments: ExperimentAssignment[] = [];

  for (const exp of activeExperiments) {
    if (bot) {
        assignments.push({ experimentId: exp.id, variantId: exp.variants[0].id });
        continue;
    }

    const cookieName = `exp_${exp.id}`;
    let variantId = cookies[cookieName];

    // If no existing assignment or invalid variant, assign new
    if (!variantId || !exp.variants.find(v => v.id === variantId)) {
      variantId = assignVariant(exp);
    }

    assignments.push({ experimentId: exp.id, variantId });
  }

  return assignments;
}
