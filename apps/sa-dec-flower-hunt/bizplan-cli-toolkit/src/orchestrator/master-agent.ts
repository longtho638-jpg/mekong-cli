import { MasterInput } from '../types/master.types';
import { StorytellingAgent } from '../agents/11-agent';
import { SalesProcessAgent } from '../agents/13-agent';
import { logger } from '../utils/logger';

/**
 * CEO (Agent 21) - Master Orchestrator
 * Receives strategic directives from Chairman's Assistant
 * Delegates to department heads and consolidates reports
 */
export class MasterAgent {

  async orchestrate(input: MasterInput) {
    logger.info('🎯 CEO (Agent 21): Received strategic directive from Chairman');

    const departmentReports: any[] = [];
    const executionLog: string[] = [];

    try {
      // Strategic planning phase
      executionLog.push('=== CEO STRATEGIC PLANNING ===');
      executionLog.push(`Directive Type: ${input.type}`);
      executionLog.push(`Workflow: ${input.workflowPreset || 'custom'}`);

      // Determine which departments to activate based on directive
      const activeDepartments = this.determineDepartments(input);
      executionLog.push(`\nActivating Departments: ${activeDepartments.join(', ')}`);

      // Delegate to each department
      for (const dept of activeDepartments) {
        executionLog.push(`\n--- Delegating to ${dept} Department ---`);
        const report = await this.delegateToDepartment(dept, input);
        departmentReports.push({
          department: dept,
          timestamp: new Date().toISOString(),
          report: report
        });
        executionLog.push(`✅ ${dept} completed`);
      }

      // Consolidate CEO report
      const ceoReport = {
        executiveMessage: 'CEO Report: All departments have executed their assignments.',
        strategicDirective: input,
        departmentsActivated: activeDepartments,
        departmentReports: departmentReports,
        executionLog: executionLog.join('\n'),
        ceoSignature: 'Agent 21 (MasterAgent)',
        timestamp: new Date().toISOString()
      };

      logger.info('✅ CEO: Consolidated report ready for Chairman');

      return {
        status: 'success',
        data: ceoReport
      };

    } catch (error) {
      logger.error('❌ CEO: Orchestration failed', error as Error);
      return {
        status: 'error',
        data: {
          error: (error as Error).message,
          executionLog: executionLog.join('\n')
        }
      };
    }
  }

  /**
   * Determine which departments to activate based on strategic directive
   */
  private determineDepartments(input: MasterInput): string[] {
    const workflow = input.workflowPreset?.toLowerCase();

    if (workflow === 'marketing') {
      return ['Marketing'];
    } else if (workflow === 'sales') {
      return ['Sales'];
    } else if (workflow === 'gtm') {
      return ['Marketing', 'Sales'];
    } else if (workflow === 'fundraising') {
      return ['Finance'];
    } else {
      // Default: activate core departments
      return ['Marketing', 'Sales'];
    }
  }

  /**
   * Delegate to specific department and collect report
   */
  private async delegateToDepartment(dept: string, directive: MasterInput): Promise<any> {
    logger.info(`📋 CEO → ${dept} Dept: Assigning task`);

    switch (dept) {
      case 'Marketing':
        return await this.executeMarketingDept(directive);
      case 'Sales':
        return await this.executeSalesDept(directive);
      case 'Finance':
        return { note: 'Finance dept pending implementation' };
      default:
        return { note: `${dept} dept not yet implemented` };
    }
  }

  /**
   * Execute Marketing Department workflow
   */
  private async executeMarketingDept(directive: MasterInput): Promise<any> {
    const storytellingAgent = new StorytellingAgent();

    const missionInput = {
      data: {
        idea_or_offer: 'Sa Dec Flower Hunt Platform',
        target_persona_hint: 'Gen Z & Millennials, eco-tourism enthusiasts',
        primary_goal: 'brand_awareness',
        context: {
          background: 'Historic flower village digitization',
          founder_vision: 'Reviving tradition with gamification'
        }
      },
      context: {
        previousOutputs: new Map(),
        businessPlanDraft: {},
        executionState: { phase: 'marketing', delegatedBy: 'CEO' }
      }
    };

    const result = await storytellingAgent.execute(missionInput);

    return {
      department_head: 'Agent 11 (Storytelling)',
      output: result.data,
      metadata: result.metadata
    };
  }

  /**
   * Execute Sales Department workflow
   */
  private async executeSalesDept(directive: MasterInput): Promise<any> {
    const salesAgent = new SalesProcessAgent();

    const missionInput = {
      data: {
        idea_or_offer: 'Sa Dec Flower Hunt Platform',
        go_to_market_type: 'B2C_direct_and_B2B_wholesale',
        sales_team_stage: 'founder_led',
        average_price_point_or_plan: 'Tickets: $10-20 (B2C) | Bulk: $500-5000 (B2B)',
        target_regions: 'Mekong Delta & Ho Chi Minh City',
        context: {
          challenges: 'Farmers not tech-savvy, tourists need easy booking',
          goals: 'Automate B2C, keep B2B high-touch'
        }
      },
      context: {
        previousOutputs: new Map(),
        businessPlanDraft: {},
        executionState: { phase: 'sales', delegatedBy: 'CEO' }
      }
    };

    const result = await salesAgent.execute(missionInput);

    return {
      department_head: 'Agent 13 (Sales Process)',
      output: result.data,
      metadata: result.metadata
    };
  }

  execute(input: any) {
    return this.orchestrate(input);
  }
}
