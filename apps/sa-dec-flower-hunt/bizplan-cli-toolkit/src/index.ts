#!/usr/bin/env node

/**
 * BizPlan CLI - Main Entry Point
 */

import { Command } from 'commander';
import { MasterAgent } from './orchestrator/master-agent';
import { MasterInput } from './types/master.types';
import { OutputManager } from './utils/output-manager';
import { logger } from './utils/logger';

const program = new Command();

program
    .name('bizplan')
    .description('Business Plan 2026 CLI Toolkit - Master Orchestrator + 24 AI Agents')
    .version('1.0.0');

program
    .command('orchestrate')
    .description('Run full orchestration (Master + 24 agents)')
    .option('-r, --research <file>', 'Industry research file')
    .option('--refactor <file>', 'Old business plan to refactor')
    .option('-w, --workflow <preset>', 'Workflow preset (fundraising, gtm, ipo)')
    .option('--output-dir <dir>', 'Output directory', 'outputs')
    .option('--format <format>', 'Output format (json, md, pdf)', 'json')
    .action(async (options) => {
        try {
            logger.info('🚀 Starting BizPlan CLI Orchestration...');

            const master = new MasterAgent();

            // Determine workflow type
            let masterInput: MasterInput;

            if (options.workflow) {
                // Workflow preset explicitly specified
                masterInput = {
                    type: 'workflow_preset',
                    workflowPreset: options.workflow
                };
            } else if (options.refactor) {
                // Refactor mode
                masterInput = {
                    type: 'refactor_old_plan',
                    planText: options.refactor
                };
            } else if (options.research) {
                // Full plan from research
                masterInput = {
                    type: 'full_plan',
                    researchFile: options.research
                };
            } else {
                // Default: full workflow
                masterInput = {
                    type: 'full_plan'
                };
            }

            // Add common options
            masterInput.outputDir = options.outputDir;
            masterInput.outputFormat = options.format as any;

            const result = await master.orchestrate(masterInput);

            const filepath = OutputManager.saveOutput(result, options.format, 'business-plan');

            logger.info(`✅ Business Plan generated successfully!`);
            logger.info(`📄 Saved to: ${filepath}`);

            OutputManager.printSummary(result);

        } catch (error) {
            logger.error('❌ Orchestration failed:', error as Error);
            process.exit(1);
        }
    });

// Import Agents
import { StorytellingAgent } from './agents/11-agent';
import { SalesProcessAgent } from './agents/13-agent';
// ... other imports

program
    .command('run-skill')
    .description('Run a specific skill agent')
    .requiredOption('--skill <id>', 'Skill ID (e.g. 11, 13)')
    .requiredOption('--input <file>', 'Input JSON file')
    .option('--output-dir <dir>', 'Output directory', 'outputs')
    .action(async (options) => {
        try {
            logger.info(`🚀 Starting Single Skill Execution: Skill ${options.skill}`);

            // 1. Load Input
            const fs = require('fs');
            if (!fs.existsSync(options.input)) {
                throw new Error(`Input file not found: ${options.input}`);
            }
            const inputData = JSON.parse(fs.readFileSync(options.input, 'utf-8'));

            // 2. Select Agent
            let agent: any = null;
            switch (options.skill) {
                case '11':
                    agent = new StorytellingAgent();
                    break;
                case '13':
                    agent = new SalesProcessAgent();
                    break;
                default:
                    throw new Error(`Skill ${options.skill} not yet registered in CLI runner.`);
            }

            // 3. Execute
            const result = await agent.execute({
                data: inputData,
                context: { previousOutputs: new Map() } // Empty context for standalone run
            });

            // 4. Save
            const filepath = OutputManager.saveOutput(result, 'json', `skill-${options.skill}-output`);

            logger.info(`✅ Skill ${options.skill} completed successfully!`);
            logger.info(`📄 Saved to: ${filepath}`);

            // Print brief summary
            if (result.status === 'success') {
                console.log('\n📊 Output Summary:');
                console.log(JSON.stringify(result.data, null, 2).substring(0, 500) + '...');
            }

        } catch (error) {
            logger.error('❌ Skill execution failed:', error as Error);
            process.exit(1);
        }
    });

program
    .command('deploy-autonomous')
    .description('Deploy and test the autonomous execution system')
    .option('--test-only', 'Only test, skip deployment')
    .action(async (options) => {
        try {
            logger.info('🚀 Autonomous System Deployment Started');

            if (!options.testOnly) {
                logger.info('📊 Step 1: Database Schema Deployment');
                logger.info('   SQL file: supabase/autonomous_schema.sql');
                logger.info('   ⚠️  Manual Step: Run this SQL in your Supabase SQL Editor');
                logger.info('   Dashboard: https://app.supabase.com');
            }

            logger.info('\n🤖 Step 2: Testing Autonomous CEO Cycle');

            const { AutonomousMasterAgent } = require('./orchestrator/autonomous-master');
            const autonomousCEO = new AutonomousMasterAgent();

            const result = await autonomousCEO.runDailyAutonomousCycle();

            if (result.status === 'success') {
                logger.info('✅ Autonomous cycle completed successfully!');
                logger.info('\n📋 CEO Report Summary:');
                console.log(JSON.stringify(result.data, null, 2));

                logger.info('\n🎯 Next Steps:');
                logger.info('1. Deploy SQL schema to Supabase (if not done)');
                logger.info('2. Set CRON_SECRET in Vercel environment variables');
                logger.info('3. Deploy to production: npx vercel deploy --prod');
                logger.info('4. System will auto-execute daily at 2am Vietnam time');
            } else {
                logger.error('❌ Autonomous cycle failed:', result.data.error);
            }

        } catch (error) {
            logger.error('❌ Deployment failed:', error as Error);
            process.exit(1);
        }
    });

program.parse(process.argv);
