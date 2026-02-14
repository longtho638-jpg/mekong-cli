# Self-Correction and Error Detection Mechanisms

**Domain:** AGI Robustness, Autonomous Systems, RLAIF
**Created:** 2026-02-15
**Status:** Active

---

## Overview

Self-correction and error detection are critical capabilities for AGI systems to maintain reliability without constant human supervision. These mechanisms enable models to identify their own logical fallacies, factual errors, or alignment drifts and autonomously apply corrective measures through internal feedback loops.

---

## Key Techniques & Models

### 1. Self-Refine and Recursive Criticism
- **Concept:** An iterative process where the model generates an initial output, critiques it against specific criteria, and regenerates a refined version.
- **Process:** `Generate` -> `Critique` -> `Refine`.
- **Strengths:** Improves code quality and mathematical reasoning.

### 2. Multi-Agent Debate
- **Concept:** Multiple instances of the model (or different models) take opposing views on a topic and debate to surface inconsistencies.
- **Application:** Fact-checking and identifying subtle biases.
- **Benefit:** Reduces individual model hallucinations by leveraging "wisdom of the crowd" logic.

### 3. Sentinel Models (Reward Models)
- **Concept:** Specialized, smaller models trained specifically to detect errors or toxic content in the outputs of a larger primary model.
- **AI Feedback (RLAIF):** Using AI-generated critiques to train reward models, reducing reliance on human labeling.

### 4. Verification-Guided Search
- **Concept:** Integrating external verifiers (e.g., compilers for code, formal logic provers) to provide ground-truth feedback.
- **Outcome:** Ensures outputs meet formal correctness requirements before final delivery.

---

## Current Challenges

- **Correction Hallucination:** The model identifies a "bug" that doesn't exist or introduces new errors during the "fix" phase.
- **Over-Correction:** Excessive self-censorship or loss of creativity due to overly rigid error detection parameters.
- **Recursive Collapse:** Without external grounding, a self-correcting system might converge on a coherent but incorrect internal logic.

---

## Key Resources

- **Anthropic:** *Constitutional AI: Harmlessness from AI Feedback* (2022)
- **OpenAI:** *Training Verifiers to Solve Math Word Problems* (2021)
- **Research Paper:** *Self-Refine: Iterative Refinement with Self-Feedback* (Madaan et al., 2023)

---

## Related Knowledge Items

- `ethics_moral_reasoning.md` — Ethical constraints as error triggers.
- `robustness_adversarial_resistance.md` — Detecting adversarial inputs as errors.
- `interpretability_explainable_ai.md` — Understanding *why* an error occurred.

---

## Query Keywords

self-correction, error detection, RLAIF, self-refine, multi-agent debate, sentinel models, verification, feedback loops, alignment, autonomous debugging.
