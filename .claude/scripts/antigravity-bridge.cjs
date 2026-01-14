#!/usr/bin/env node
/**
 * AntigravityKit Bridge
 * 
 * Bridges ClaudeKit agents to AntigravityKit Python modules.
 * 
 * Usage:
 *   node antigravity-bridge.cjs <command> [args...]
 * 
 * Commands:
 *   start             - Bootstrap agency
 *   client:add <name> - Add client
 *   content:generate  - Generate content ideas
 *   stats             - Show dashboard
 *   dna               - Get agency DNA
 *   
 * 🏯 "Dễ như ăn kẹo" - Easy as candy
 */

const { execSync } = require('child_process');
const path = require('path');

const ANTIGRAVITY_DIR = path.resolve(__dirname, '../../antigravity');

/**
 * Execute Python command and return JSON result
 */
function runPython(code) {
    try {
        const result = execSync(`python3 -c "${code}"`, {
            cwd: path.resolve(__dirname, '../..'),
            encoding: 'utf-8',
            env: {
                ...process.env,
                PYTHONPATH: path.resolve(__dirname, '../..'),
            },
        });
        return { success: true, output: result.trim() };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get agency DNA
 */
function getDNA() {
    return runPython(`
from antigravity.core.agency_dna import AgencyDNA, Tone, PricingTier
import json

dna = AgencyDNA(name="My Agency", niche="Digital Marketing")
print(json.dumps(dna.to_dict(), ensure_ascii=False))
`);
}

/**
 * Generate content ideas
 */
function generateContent(count = 10) {
    return runPython(`
from antigravity.core.content_factory import ContentFactory
import json

factory = ContentFactory(niche="Digital Marketing")
ideas = factory.generate_ideas(count=${count})
result = [{"title": i.title, "type": i.content_type.value, "score": i.score} for i in ideas]
print(json.dumps(result, ensure_ascii=False))
`);
}

/**
 * Main entry point
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    switch (command) {
        case 'dna':
            console.log(JSON.stringify(getDNA(), null, 2));
            break;

        case 'content':
            const count = parseInt(args[1]) || 10;
            console.log(JSON.stringify(generateContent(count), null, 2));
            break;

        case 'help':
        default:
            console.log(`
AntigravityKit Bridge

Commands:
  dna              Get agency DNA
  content [count]  Generate content ideas
  help             Show this help

🏯 "Không đánh mà thắng" - Win Without Fighting
      `);
    }
}

main();
