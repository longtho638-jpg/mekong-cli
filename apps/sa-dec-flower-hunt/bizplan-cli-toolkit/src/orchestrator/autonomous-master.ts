/**
 * Autonomous CEO Agent
 * Runs daily to check goals, make decisions, and delegate to departments
 */

import { MasterInput } from '../types/master.types';
import { StorytellingAgent } from '../agents/11-agent';
import { SalesProcessAgent } from '../agents/13-agent';
import { logger } from '../utils/logger';

// Import goal service (will be available when running in Next.js context)
let GoalService: any = null;
try {
    GoalService = require('../../../lib/goal-service').GoalService;
} catch (e) {
    // Running in CLI context, goal service not available
}

export class AutonomousMasterAgent {

    /**
     * Daily autonomous execution
     * Called by Vercel cron job every day at 2am Vietnam time
     */
    async runDailyAutonomousCycle(): Promise<any> {
        logger.info('🤖 CEO Autonomous Mode: Starting daily cycle');

        const executionLog: string[] = [];

        try {
            // Step 1: Check goals
            executionLog.push('=== STEP 1: GOAL CHECK ===');
            const goals = GoalService ? await GoalService.getActiveGoals() : [];
            const metrics = GoalService ? await GoalService.getCurrentMetrics() : {};

            executionLog.push(`Active Goals: ${goals.length}`);
            executionLog.push(`Current Metrics: ${JSON.stringify(metrics)}`);

            // Step 2: Decide which departments to activate
            executionLog.push('\n=== STEP 2: STRATEGIC DECISION ===');
            const decision = await this.makeStrategicDecision(goals, metrics);
            executionLog.push(`Decision: ${decision.directive}`);
            executionLog.push(`Departments: ${decision.departments.join(', ')}`);

            // Step 3: Execute departments
            executionLog.push('\n=== STEP 3: EXECUTION ===');
            const departmentReports = [];

            for (const dept of decision.departments) {
                executionLog.push(`\n--- ${dept} Department ---`);
                const report = await this.executeDepartment(dept, decision);
                departmentReports.push(report);
                executionLog.push(`✅ ${dept} completed`);
            }

            // Step 4: Update metrics (simulated for now)
            executionLog.push('\n=== STEP 4: METRICS UPDATE ===');
            // In production, this would pull real data from Supabase/Analytics

            // Step 5: Log execution
            const ceoReport = {
                executiveMessage: `CEO Autonomous Report: Executed ${decision.departments.length} departments`,
                directive: decision.directive,
                departmentsActivated: decision.departments,
                departmentReports: departmentReports,
                metricsSnapshot: metrics,
                executionLog: executionLog.join('\n'),
                ceoSignature: 'Agent 21 (Autonomous CEO)',
                timestamp: new Date().toISOString()
            };

            if (GoalService) {
                await GoalService.logExecution({
                    ceo_directive: decision.directive,
                    departments_activated: decision.departments,
                    tasks_completed: departmentReports,
                    metrics_snapshot: metrics,
                    ceo_report: JSON.stringify(ceoReport)
                });
            }

            logger.info('✅ CEO Autonomous Mode: Cycle completed');
            return {
                status: 'success',
                data: ceoReport
            };

        } catch (error) {
            logger.error('❌ CEO Autonomous Mode: Cycle failed', error as Error);
            executionLog.push(`ERROR: ${(error as Error).message}`);

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
     * Make strategic decision based on goals and metrics
     */
    private async makeStrategicDecision(goals: any[], metrics: any): Promise<{
        directive: string;
        departments: string[];
        reasoning: string;
    }> {
        // Simple decision engine (will become more sophisticated)

        // Check if we have customer acquisition goal
        const customerGoal = goals.find(g => g.goal_type === 'customers');
        const currentCustomers = metrics.customers || 0;

        if (customerGoal && currentCustomers < customerGoal.target_value) {
            // Need customers: activate Marketing + Sales
            return {
                directive: `Acquire ${customerGoal.target_value - currentCustomers} more customers`,
                departments: ['Marketing', 'Sales'],
                reasoning: 'Customer goal not met, need aggressive acquisition'
            };
        }

        // Check revenue goal
        const revenueGoal = goals.find(g => g.goal_type === 'revenue');
        const currentRevenue = metrics.revenue || 0;

        if (revenueGoal && currentRevenue < revenueGoal.target_value * 0.5) {
            // Revenue severely behind: all hands on deck
            return {
                directive: 'Revenue recovery mode - increase sales velocity',
                departments: ['Marketing', 'Sales'],
                reasoning: 'Revenue goal at risk, need immediate action'
            };
        }

        // Default: maintain steady growth
        return {
            directive: 'Maintain growth momentum - content + outreach',
            departments: ['Marketing'],
            reasoning: 'Goals on track, continue steady execution'
        };
    }

    /**
     * Execute specific department based on decision
     */
    private async executeDepartment(dept: string, decision: any): Promise<any> {
        logger.info(`📋 CEO → ${dept} Dept: Executing autonomous task`);

        switch (dept) {
            case 'Marketing':
                return await this.executeMarketingAutonomous(decision);
            case 'Sales':
                return await this.executeSalesAutonomous(decision);
            default:
                return { note: `${dept} autonomous mode not implemented` };
        }
    }

    /**
     * Marketing department autonomous execution
     */
    private async executeMarketingAutonomous(decision: any): Promise<any> {
        const storytellingAgent = new StorytellingAgent();

        const missionInput = {
            data: {
                idea_or_offer: 'Sa Dec Flower Hunt - Daily Content Generation',
                target_persona_hint: 'Gen Z & Millennials, eco-tourism enthusiasts',
                primary_goal: 'brand_awareness',
                context: {
                    background: 'Daily autonomous content for social media',
                    founder_vision: 'Keep brand top-of-mind with daily flower stories'
                }
            },
            context: {
                previousOutputs: new Map(),
                businessPlanDraft: {},
                executionState: {
                    phase: 'autonomous_marketing',
                    delegatedBy: 'CEO',
                    directive: decision.directive
                }
            }
        };

        const result = await storytellingAgent.execute(missionInput);

        return {
            department_head: 'Agent 11 (Storytelling)',
            task: 'Generate daily content ideas',
            output: result.data,
            metadata: result.metadata
        };
    }

    /**
     * Sales department autonomous execution
     */
    private async executeSalesAutonomous(decision: any): Promise<any> {
        const salesAgent = new SalesProcessAgent();

        const missionInput = {
            data: {
                idea_or_offer: 'Sa Dec Flower Hunt - Sales Outreach',
                go_to_market_type: 'B2C_direct',
                sales_team_stage: 'founder_led',
                average_price_point_or_plan: 'Tickets: $10-20',
                target_regions: 'Mekong Delta & Ho Chi Minh City',
                context: {
                    challenges: 'Need to reach more potential customers',
                    goals: 'Generate qualified leads'
                }
            },
            context: {
                previousOutputs: new Map(),
                businessPlanDraft: {},
                executionState: {
                    phase: 'autonomous_sales',
                    delegatedBy: 'CEO',
                    directive: decision.directive
                }
            }
        };

        const result = await salesAgent.execute(missionInput);

        return {
            department_head: 'Agent 13 (Sales Process)',
            task: 'Generate outreach strategy',
            output: result.data,
            metadata: result.metadata
        };
    }
}
