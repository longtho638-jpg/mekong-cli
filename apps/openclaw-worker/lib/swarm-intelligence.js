/**
 * Swarm Intelligence — Multi-project orchestration coordinator
 *
 * TASK 22/22: CTO Brain Upgrade
 *
 * Coordinates cross-project awareness using project-profiler,
 * dynamic-syllabus, and evolution-engine data to make smart
 * dispatch decisions.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

function log(msg) {
	const ts = new Date().toISOString().slice(11, 19);
	const line = `[${ts}] [swarm] ${msg}\n`;
	try {
		fs.appendFileSync(config.LOG_FILE, line);
	} catch (_) {}
}

// Safe imports
let analyzeAllProjects, saveProfiles;
try {
	const pp = require('./project-profiler');
	analyzeAllProjects = pp.analyzeAllProjects;
	saveProfiles = pp.saveProfiles;
} catch (e) {
	log(`WARN: project-profiler not found`);
}

let generateSyllabus, writeSyllabusToTasks;
try {
	const ds = require('./dynamic-syllabus');
	generateSyllabus = ds.generateSyllabus;
	writeSyllabusToTasks = ds.writeSyllabusToTasks;
} catch (e) {
	log(`WARN: dynamic-syllabus not found`);
}

let generateEvolutionTasks;
try {
	const ee = require('./evolution-engine');
	generateEvolutionTasks = ee.generateEvolutionTasks;
} catch (e) {
	log(`WARN: evolution-engine not found`);
}

let perceive;
try {
	const pe = require('./perception-engine');
	perceive = pe.perceive;
} catch (e) {
	log(`WARN: perception-engine not found`);
}

/**
 * Run full swarm intelligence cycle:
 * 1. Perceive environment
 * 2. Profile all projects
 * 3. Generate syllabus tasks
 * 4. Generate self-evolution tasks
 * 5. Prioritize and dispatch top N tasks
 *
 * @param {number} [maxTasks=3] - Max tasks to generate
 * @returns {{ perception: object, profiles: Array, tasks: Array, dispatched: Array }}
 */
async function runSwarmCycle(maxTasks = 3) {
	log('🐝 Swarm Cycle starting...');

	// Step 1: Environmental perception
	let perception = { healthy: true, alerts: [] };
	if (perceive) {
		try {
			perception = perceive();
		} catch (e) {
			/* skip */
		}
	}

	// If environment is unhealthy, reduce task generation
	if (!perception.healthy) {
		log(`⚠️ Swarm: Environment unhealthy — reducing task generation`);
		maxTasks = 1;
	}

	// Step 2: Profile projects
	let profiles = [];
	if (analyzeAllProjects) {
		try {
			profiles = analyzeAllProjects();
			if (saveProfiles) saveProfiles(profiles);
			log(`Profiled ${profiles.length} projects`);
		} catch (e) {
			log(`Profile error: ${e.message}`);
		}
	}

	// Step 3: Generate syllabus tasks
	let syllabusTasks = [];
	if (generateSyllabus && profiles.length > 0) {
		try {
			syllabusTasks = generateSyllabus(profiles);
			log(`Syllabus generated ${syllabusTasks.length} tasks`);
		} catch (e) {
			log(`Syllabus error: ${e.message}`);
		}
	}

	// Step 4: Generate evolution tasks
	let evolutionTasks = [];
	if (generateEvolutionTasks) {
		try {
			evolutionTasks = generateEvolutionTasks();
			log(`Evolution generated ${evolutionTasks.length} self-improvement tasks`);
		} catch (e) {
			log(`Evolution error: ${e.message}`);
		}
	}

	// Step 5: Merge and prioritize
	const allTasks = [
		...evolutionTasks.map((t) => ({ ...t, source: 'evolution' })),
		...syllabusTasks.map((t) => ({ ...t, source: 'syllabus' })),
	];

	// Prioritize: evolution tasks first (self-improvement), then syllabus
	const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
	allTasks.sort((a, b) => {
		const pa = priorityOrder[a.priority] ?? 4;
		const pb = priorityOrder[b.priority] ?? 4;
		return pa - pb;
	});

	// Step 6: Write top tasks to watch dir
	let dispatched = [];
	if (writeSyllabusToTasks && allTasks.length > 0) {
		try {
			dispatched = writeSyllabusToTasks(allTasks, maxTasks);
			log(`🐝 Swarm dispatched ${dispatched.length} tasks`);
		} catch (e) {
			log(`Dispatch error: ${e.message}`);
		}
	}

	const result = {
		perception,
		profiles: profiles.map((p) => ({ project: p.project, healthScore: p.healthScore })),
		totalTasksGenerated: allTasks.length,
		dispatched,
		timestamp: new Date().toISOString(),
	};

	log(`🐝 Swarm Cycle complete: ${allTasks.length} tasks generated, ${dispatched.length} dispatched`);

	return result;
}

/**
 * Get swarm status summary
 * @returns {{ profiles: Array, pendingTasks: number, lastCycle: string }}
 */
function getSwarmStatus() {
	try {
		const stateFile = path.join(config.MEKONG_DIR || '.', '.tom_hum_state.json');
		if (!fs.existsSync(stateFile)) return { profiles: [], pendingTasks: 0 };
		const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
		return {
			profiles: state.projectProfiles?.profiles || [],
			perception: state.perception || {},
		};
	} catch (e) {
		return { profiles: [], pendingTasks: 0 };
	}
}

module.exports = { runSwarmCycle, getSwarmStatus };
