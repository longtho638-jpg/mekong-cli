/**
 * CarbonAccountingFacade — emissions tracking, carbon offset procurement, Scope 1/2/3 reporting
 */
export class CarbonAccountingFacade {
  async recordEmission(params: { sourceId: string; scope: 1 | 2 | 3; kgCO2e: number }): Promise<unknown> {
    throw new Error('Implement with vibe-climate provider');
  }

  async procureOffset(params: { kgCO2e: number; projectType?: string }): Promise<unknown> {
    throw new Error('Implement with vibe-climate provider');
  }

  async getEmissionsSummary(entityId: string, year: number): Promise<unknown> {
    throw new Error('Implement with vibe-climate provider');
  }
}
