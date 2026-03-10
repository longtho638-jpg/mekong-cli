#!/usr/bin/env node
/**
 * 🏭 VIBE CODING FACTORY — Pipeline Engine
 *
 * Toyota Production System × Binh Pháp × ClaudeKit
 *
 * AGI L4 Enhancement (2026-03-03):
 * - Dynamic stage routing (skip if confidence >90%)
 * - Predictive failure detection
 * - Learning integration with learning-engine
 * - Adaptive maxAttempts based on stage difficulty
 *
 * 5-step pipeline: SPEC → PLAN → BUILD → VERIFY → SHIP
 * Each stage maps to a Binh Pháp chapter and ClaudeKit command.
 *
 * Binh Pháp mapping:
 *   SPEC/PLAN → Ch.1 始計 (Strategic Assessment)
 *   BUILD     → Ch.7 軍爭 (Speed Execution)
 *   VERIFY    → Ch.6 虛實 (Testing/Strengths)
 *   SHIP      → Ch.9 行軍 (Operations)
 *
 * Exports: STAGES, STAGE_CONFIG, createPipeline, getActivePipeline,
 *          getAllActivePipelines, advanceStage, recordFailure,
 *          getCurrentCommand, isPaneLocked, assignToPane, getFactoryStatus,
 *          pausePipeline, resumePipeline,
 *          AGI L4: predictSuccess, getOptimalStages, recordOutcome, getAdaptiveMaxAttempts
 */

const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════

const STAGES = ['SPEC', 'PLAN', 'BUILD', 'VERIFY', 'SHIP'];

const STAGE_CONFIG = {
    SPEC: {
        binh_phap: { chapter: 1, name: '始計', title: 'Kế Hoạch — Strategic Assessment' },
        toyota: 'Poka-yoke — Define constraints before building',
        gate: 'spec_file_exists',
        command: (project) => `/plan:hard "${project} — write spec with acceptance criteria, constraints, edge cases"`,
        description: 'Write clear spec: goal, acceptance criteria, constraints, out-of-scope',
    },
    PLAN: {
        binh_phap: { chapter: 1, name: '始計', title: 'Kế Hoạch — Strategic Assessment' },
        toyota: 'Kanban — Pull system, plan before build',
        gate: 'plan_file_exists',
        command: (project) => `/plan "${project} — create implementation plan from spec, list files to create/modify, dependencies, test plan"`,
        description: 'Agent reads spec + codebase, creates detailed plan. Human review checkpoint.',
    },
    BUILD: {
        binh_phap: { chapter: 7, name: '軍爭', title: 'Quân Tranh — Speed Execution' },
        toyota: 'Heijunka — Balance load across parallel agents',
        gate: 'build_passes',
        command: (project) => `/cook "${project} — implement the approved plan, run type-check after each file" --auto`,
        description: 'Builder agents execute plan with worktree isolation. Jidoka: stop on error.',
    },
    VERIFY: {
        binh_phap: { chapter: 6, name: '虛實', title: 'Hư Thực — Testing/Strengths' },
        toyota: 'Kaizen — Adversarial QA loop, critic review',
        gate: 'all_tests_pass',
        command: (project) => `/cook "${project} — run full test suite, lint, type-check. Fix any failures. Critic review: score must be 8+/10" --auto`,
        description: 'Full verification: tests + lint + type-check + critic agent. Gate: 8+/10 score.',
    },
    SHIP: {
        binh_phap: { chapter: 9, name: '行軍', title: 'Hành Quân — Operations' },
        toyota: 'Just-in-Time — Ship when quality gates pass',
        gate: 'ci_green',
        command: (project) => `/check-and-commit`,
        description: 'Auto commit + push. CI/CD validates. Production GREEN = DONE.',
    },
};

const PIPELINE_STORE = path.join(
    process.env.HOME || '/tmp',
    '.config', 'openclaw', 'factory-pipelines.json'
);

// ══════════════════════════════════════════════════
// PERSISTENCE
// ══════════════════════════════════════════════════

function loadPipelines() {
    try {
        if (fs.existsSync(PIPELINE_STORE)) {
            return JSON.parse(fs.readFileSync(PIPELINE_STORE, 'utf-8'));
        }
    } catch (e) { /* fresh start */ }
    return { pipelines: {}, history: [] };
}

function savePipelines(data) {
    const dir = path.dirname(PIPELINE_STORE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PIPELINE_STORE, JSON.stringify(data, null, 2));
}

// ══════════════════════════════════════════════════
// PIPELINE CRUD
// ══════════════════════════════════════════════════

/**
 * Create a new factory pipeline for a project
 * @param {string} project — project name (e.g. 'mekong-cli')
 * @param {Object} spec — { goal, criteria, constraints }
 * @param {number} [paneIdx] — assigned pane index
 * @returns {Object} pipeline instance
 */
function createPipeline(project, spec = {}, paneIdx = null) {
    const data = loadPipelines();
    const id = `${project}-${Date.now()}`;

    const pipeline = {
        id,
        project,
        spec,
        paneIdx,
        currentStage: 'SPEC',
        stageHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active', // active | paused | completed | failed
        attempts: 0,
        maxAttempts: 3,
    };

    data.pipelines[id] = pipeline;
    savePipelines(data);
    return pipeline;
}

/**
 * Get active pipeline for a project/pane
 * @param {string} [project] — filter by project
 * @param {number} [paneIdx] — filter by pane
 * @returns {Object|null} active pipeline or null
 */
function getActivePipeline(project = null, paneIdx = null) {
    const data = loadPipelines();
    const pipelines = Object.values(data.pipelines).filter(p => {
        if (p.status !== 'active') return false;
        if (project && p.project !== project) return false;
        if (paneIdx !== null && p.paneIdx !== null && p.paneIdx !== paneIdx) return false;
        return true;
    });
    return pipelines[0] || null;
}

/**
 * Get all active pipelines
 * @returns {Array} active pipelines
 */
function getAllActivePipelines() {
    const data = loadPipelines();
    return Object.values(data.pipelines).filter(p => p.status === 'active');
}

/**
 * Advance pipeline to next stage
 * @param {string} pipelineId
 * @returns {Object} { advanced, pipeline, nextStage, command }
 */
function advanceStage(pipelineId) {
    const data = loadPipelines();
    const pipeline = data.pipelines[pipelineId];
    if (!pipeline || pipeline.status !== 'active') {
        return { advanced: false, reason: 'Pipeline not found or not active' };
    }

    const currentIdx = STAGES.indexOf(pipeline.currentStage);

    // Record completion of current stage
    pipeline.stageHistory.push({
        stage: pipeline.currentStage,
        completedAt: new Date().toISOString(),
        attempt: pipeline.attempts,
    });

    // Check if pipeline is complete
    if (currentIdx >= STAGES.length - 1) {
        pipeline.status = 'completed';
        pipeline.completedAt = new Date().toISOString();
        pipeline.updatedAt = new Date().toISOString();

        // Move to history
        data.history.push({ ...pipeline });
        delete data.pipelines[pipelineId];
        savePipelines(data);

        return { advanced: false, completed: true, pipeline };
    }

    // Advance to next stage
    const nextStage = STAGES[currentIdx + 1];
    pipeline.currentStage = nextStage;
    pipeline.updatedAt = new Date().toISOString();
    pipeline.attempts = 0; // reset attempts for new stage

    savePipelines(data);

    const config = STAGE_CONFIG[nextStage];
    return {
        advanced: true,
        pipeline,
        nextStage,
        command: config.command(pipeline.project),
        binh_phap: config.binh_phap,
        toyota: config.toyota,
    };
}

/**
 * Record a stage failure (retry or escalate)
 * @param {string} pipelineId
 * @returns {Object} { retry, escalate, pipeline }
 */
function recordFailure(pipelineId) {
    const data = loadPipelines();
    const pipeline = data.pipelines[pipelineId];
    if (!pipeline) return { retry: false, reason: 'Not found' };

    pipeline.attempts++;
    pipeline.updatedAt = new Date().toISOString();

    if (pipeline.attempts >= pipeline.maxAttempts) {
        pipeline.status = 'failed';
        pipeline.failedAt = new Date().toISOString();
        savePipelines(data);
        return { retry: false, escalate: true, pipeline, reason: `Max ${pipeline.maxAttempts} attempts reached at stage ${pipeline.currentStage}` };
    }

    savePipelines(data);
    const config = STAGE_CONFIG[pipeline.currentStage];
    return {
        retry: true,
        pipeline,
        command: config.command(pipeline.project),
        attemptsLeft: pipeline.maxAttempts - pipeline.attempts,
    };
}

/**
 * Get the /cook command for current stage
 * @param {string} pipelineId
 * @returns {Object} { command, stage, binh_phap, toyota }
 */
function getCurrentCommand(pipelineId) {
    const data = loadPipelines();
    const pipeline = data.pipelines[pipelineId];
    if (!pipeline || pipeline.status !== 'active') return null;

    const config = STAGE_CONFIG[pipeline.currentStage];
    return {
        command: config.command(pipeline.project),
        stage: pipeline.currentStage,
        stageIndex: STAGES.indexOf(pipeline.currentStage) + 1,
        totalStages: STAGES.length,
        binh_phap: config.binh_phap,
        toyota: config.toyota,
        description: config.description,
        gate: config.gate,
    };
}

/**
 * Check if a pane has an active factory pipeline (factory lock)
 * @param {number} paneIdx
 * @returns {boolean}
 */
function isPaneLocked(paneIdx) {
    const data = loadPipelines();
    return Object.values(data.pipelines).some(p =>
        p.status === 'active' && p.paneIdx === paneIdx
    );
}

/**
 * Assign a pipeline to a pane
 * @param {string} pipelineId
 * @param {number} paneIdx
 */
function assignToPane(pipelineId, paneIdx) {
    const data = loadPipelines();
    const pipeline = data.pipelines[pipelineId];
    if (pipeline) {
        pipeline.paneIdx = paneIdx;
        pipeline.updatedAt = new Date().toISOString();
        savePipelines(data);
    }
}

/**
 * Get factory status summary for dashboard
 * @returns {Object} dashboard data
 */
function getFactoryStatus() {
    const data = loadPipelines();
    const active = Object.values(data.pipelines).filter(p => p.status === 'active');
    const completed = data.history.filter(p => p.status === 'completed');
    const failed = Object.values(data.pipelines).filter(p => p.status === 'failed');

    return {
        activePipelines: active.map(p => ({
            id: p.id,
            project: p.project,
            stage: p.currentStage,
            stageIndex: STAGES.indexOf(p.currentStage) + 1,
            totalStages: STAGES.length,
            paneIdx: p.paneIdx,
            attempts: p.attempts,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            binh_phap: STAGE_CONFIG[p.currentStage].binh_phap,
            progress: `${STAGES.indexOf(p.currentStage) + 1}/${STAGES.length}`,
        })),
        stats: {
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            throughput: completed.length > 0 ? completed.length : 0,
        },
        stages: STAGES.map(s => ({
            name: s,
            config: STAGE_CONFIG[s],
        })),
    };
}

/**
 * Pause/resume a pipeline
 */
function pausePipeline(pipelineId) {
    const data = loadPipelines();
    if (data.pipelines[pipelineId]) {
        data.pipelines[pipelineId].status = 'paused';
        data.pipelines[pipelineId].updatedAt = new Date().toISOString();
        savePipelines(data);
    }
}

function resumePipeline(pipelineId) {
    const data = loadPipelines();
    if (data.pipelines[pipelineId]) {
        data.pipelines[pipelineId].status = 'active';
        data.pipelines[pipelineId].updatedAt = new Date().toISOString();
        savePipelines(data);
    }
}

// ══════════════════════════════════════════════════
// AGI L4: Adaptive Learning Functions
// ══════════════════════════════════════════════════

const LEARNING_STORE = path.join(
    process.env.HOME || '/tmp',
    '.config', 'openclaw', 'factory-learning.json'
);

// Stage difficulty weights (learned from historical data)
const STAGE_DIFFICULTY = {
    SPEC: { base: 0.3, learned: 0.3 },     // Low difficulty
    PLAN: { base: 0.5, learned: 0.5 },     // Medium
    BUILD: { base: 0.8, learned: 0.8 },    // High
    VERIFY: { base: 0.6, learned: 0.6 },   // Medium-High
    SHIP: { base: 0.2, learned: 0.2 },     // Low
};

/**
 * Predict success probability for a pipeline
 * Returns: { confidence: number, risk_factors: string[] }
 */
function predictSuccess(pipeline) {
    const riskFactors = [];
    let confidence = 0.85; // Base confidence

    // Factor 1: Stage history
    if (pipeline.stageHistory && pipeline.stageHistory.length > 0) {
        const failedStages = pipeline.stageHistory.filter(s => !s.success).length;
        if (failedStages > 0) {
            confidence -= failedStages * 0.1;
            riskFactors.push(`previous_failures:${failedStages}`);
        }
    }

    // Factor 2: Current stage difficulty
    const currentStage = pipeline.currentStage;
    const difficulty = STAGE_DIFFICULTY[currentStage]?.learned || 0.5;
    if (difficulty > 0.7) {
        confidence -= 0.1;
        riskFactors.push(`high_difficulty_stage:${currentStage}`);
    }

    // Factor 3: Attempt count
    if (pipeline.attempts > 0) {
        confidence -= pipeline.attempts * 0.05;
        riskFactors.push(`retry_count:${pipeline.attempts}`);
    }

    // Factor 4: Project complexity (if available)
    if (pipeline.spec?.complexity === 'complex') {
        confidence -= 0.1;
        riskFactors.push('complex_project');
    }

    // Factor 5: Time since creation (stale pipelines less likely to succeed)
    const ageHours = (Date.now() - new Date(pipeline.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours > 24) {
        confidence -= 0.1;
        riskFactors.push('stale_pipeline');
    }

    return {
        confidence: Math.max(0.1, Math.min(0.99, confidence)),
        risk_factors: riskFactors,
        recommendation: confidence >= 0.8 ? 'proceed' : confidence >= 0.5 ? 'caution' : 'review',
    };
}

/**
 * Get optimal stages for a project (skip stages if confidence high)
 * Returns: string[] of stages to execute
 */
function getOptimalStages(project, complexity = 'standard', specConfidence = 0) {
    const stages = [...STAGES];

    // Skip SPEC if specConfidence > 90% (user provided clear spec)
    if (specConfidence > 0.9) {
        const specIdx = stages.indexOf('SPEC');
        if (specIdx >= 0) stages.splice(specIdx, 1);
    }

    // Skip PLAN for simple projects with high confidence
    if (complexity === 'simple' && specConfidence > 0.8) {
        const planIdx = stages.indexOf('PLAN');
        if (planIdx >= 0) stages.splice(planIdx, 1);
    }

    // Add extra VERIFY for complex projects
    if (complexity === 'complex') {
        // Insert additional verification after BUILD
        const buildIdx = stages.indexOf('BUILD');
        if (buildIdx >= 0) {
            // Could add a 'REVIEW' stage here in future
        }
    }

    return stages;
}

/**
 * Record outcome for learning
 * Updates stage difficulty weights based on actual performance
 */
function recordOutcome(pipelineId, success, metrics = {}) {
    const data = loadPipelines();
    const pipeline = data.pipelines[pipelineId];
    if (!pipeline) return { recorded: false, reason: 'pipeline_not_found' };

    // Load learning history
    let learningData = { history: [], stageStats: {} };
    try {
        if (fs.existsSync(LEARNING_STORE)) {
            learningData = JSON.parse(fs.readFileSync(LEARNING_STORE, 'utf-8'));
        }
    } catch (e) { /* fresh start */ }

    // Record this outcome
    learningData.history.push({
        timestamp: Date.now(),
        pipelineId,
        project: pipeline.project,
        stage: pipeline.currentStage,
        success,
        attempts: pipeline.attempts,
        duration_ms: metrics.duration_ms,
        complexity: pipeline.spec?.complexity || 'standard',
    });

    // Trim history
    if (learningData.history.length > 1000) {
        learningData.history = learningData.history.slice(-1000);
    }

    // Update stage statistics
    const stage = pipeline.currentStage;
    if (!learningData.stageStats[stage]) {
        learningData.stageStats[stage] = {
            total: 0,
            success: 0,
            avgAttempts: 0,
            avgDuration_ms: 0,
        };
    }

    const stats = learningData.stageStats[stage];
    const oldAvg = stats.avgAttempts;
    stats.total++;
    if (success) stats.success++;
    stats.avgAttempts = oldAvg + (pipeline.attempts - oldAvg) / stats.total;
    stats.avgDuration_ms = metrics.duration_ms
        ? stats.avgDuration_ms + (metrics.duration_ms - stats.avgDuration_ms) / stats.total
        : stats.avgDuration_ms;

    // Update learned difficulty based on success rate
    const successRate = stats.success / stats.total;
    STAGE_DIFFICULTY[stage].learned = 1 - successRate; // Higher failure = higher difficulty

    // Save learning data
    try {
        const dir = path.dirname(LEARNING_STORE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(LEARNING_STORE, JSON.stringify(learningData, null, 2));
    } catch (e) {
        return { recorded: false, error: e.message };
    }

    return { recorded: true, stageStats: stats };
}

/**
 * Get adaptive maxAttempts based on stage difficulty
 * Higher difficulty = more retry attempts allowed
 */
function getAdaptiveMaxAttempts(stage) {
    const difficulty = STAGE_DIFFICULTY[stage]?.learned || 0.5;

    // Map difficulty to maxAttempts (1-5 range)
    if (difficulty < 0.3) return 2;      // Low difficulty: 2 attempts
    if (difficulty < 0.5) return 3;      // Medium: 3 attempts
    if (difficulty < 0.7) return 4;      // High: 4 attempts
    return 5;                            // Very high: 5 attempts
}

/**
 * Get stage difficulty stats for dashboard
 */
function getStageDifficultyStats() {
    return {
        stages: STAGES.map(stage => ({
            stage,
            difficulty: STAGE_DIFFICULTY[stage].learned,
            maxAttempts: getAdaptiveMaxAttempts(stage),
        })),
    };
}

// ══════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════

module.exports = {
    STAGES,
    STAGE_CONFIG,
    createPipeline,
    getActivePipeline,
    getAllActivePipelines,
    advanceStage,
    recordFailure,
    getCurrentCommand,
    isPaneLocked,
    assignToPane,
    getFactoryStatus,
    pausePipeline,
    resumePipeline,
    // AGI L4: Adaptive Factory Pipeline
    predictSuccess,
    getOptimalStages,
    recordOutcome,
    getAdaptiveMaxAttempts,
    getStageDifficultyStats,
};
