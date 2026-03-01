/**
 * Wellbeing facade — wellness tracking, longevity metrics, health monitoring
 */
export interface WellbeingMetrics {
  userId: string;
  overallScore: number;
  dimensions: WellnessDimension[];
  lastUpdated: string;
}

export interface WellnessDimension {
  name: 'physical' | 'mental' | 'social' | 'financial' | 'occupational';
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export class WellbeingFacade {
  async getMetrics(userId: string): Promise<WellbeingMetrics> {
    throw new Error('Implement with vibe-wellbeing provider');
  }

  async logActivity(userId: string, activity: { type: string; duration: number; notes?: string }): Promise<void> {
    throw new Error('Implement with vibe-wellness provider');
  }
}
