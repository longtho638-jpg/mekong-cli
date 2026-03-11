import { OllamaClient } from '../clients/ollama-client';
import { SOPDecision, SignalContext, SOPDefinition } from './sop.types';

const DECISION_PROMPT = `Analyze this trading signal and provide a structured decision.

Signal Data:
{signal_data}

SOP Rule: {sop_name}
Description: {sop_description}

Respond with EXACTLY this JSON format (no other text):
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation in 1-2 sentences"
}`;

export class DecisionCaller {
  private ollamaClient: OllamaClient;

  constructor(ollamaClient: OllamaClient) {
    this.ollamaClient = ollamaClient;
  }

  /**
   * Call LLM to make a decision based on signal and SOP
   */
  async call(sop: SOPDefinition, context: SignalContext): Promise<SOPDecision> {
    const startTime = Date.now();

    const prompt = this.buildPrompt(sop, context);

    try {
      const response = await this.ollamaClient.generate({
        prompt,
        options: {
          temperature: 0.3, // Low temperature for consistent decisions
          num_predict: 200,
        },
      });

      const latency = Date.now() - startTime;
      const decision = this.parseResponse(response.response, sop, latency);

      return decision;
    } catch (error) {
      // Return conservative HOLD decision on error
      return {
        sopId: sop.id,
        action: 'HOLD' as const,
        confidence: 0.5,
        reasoning: `LLM error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        triggeredAt: Date.now(),
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Build prompt from SOP and signal context with proper escaping
   */
  private buildPrompt(sop: SOPDefinition, context: SignalContext): string {
    // Escape signal data to prevent prompt injection
    const signalJson = JSON.stringify(context, null, 2)
      .replace(/\\/g, '\\\\')
      .replace(/"""/g, '\\\\"');

    return DECISION_PROMPT
      .replace('{signal_data}', signalJson)
      .replace('{sop_name}', sop.name)
      .replace('{sop_description}', sop.description);
  }

  /**
   * Parse LLM response to structured decision
   */
  private parseResponse(
    response: string,
    sop: SOPDefinition,
    latency: number
  ): SOPDecision {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate response structure
      if (!['BUY', 'SELL', 'HOLD'].includes(parsed.action)) {
        throw new Error(`Invalid action: ${parsed.action}`);
      }

      const confidence = Math.max(
        0,
        Math.min(1, parseFloat(parsed.confidence) || 0.5)
      );

      return {
        sopId: sop.id,
        action: parsed.action as 'BUY' | 'SELL' | 'HOLD',
        confidence,
        reasoning: parsed.reasoning || 'No reasoning provided',
        triggeredAt: Date.now(),
        latency,
        metadata: {
          model: 'llama3.1:8b',
        },
      };
    } catch (parseError) {
      // Fallback: return HOLD with low confidence
      return {
        sopId: sop.id,
        action: 'HOLD' as const,
        confidence: 0.3,
        reasoning: `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`,
        triggeredAt: Date.now(),
        latency,
      };
    }
  }
}
