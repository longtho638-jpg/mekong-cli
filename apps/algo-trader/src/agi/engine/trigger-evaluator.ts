import { TriggerCondition, SignalContext } from './sop.types';

export class TriggerEvaluator {
  /**
   * Evaluate a single trigger condition against signal context
   */
  evaluate(condition: TriggerCondition, context: SignalContext): boolean {
    const value = this.getFieldValue(condition.field, context);

    if (value === undefined) {
      console.warn(`Field not found: ${condition.field}`);
      return false;
    }

    switch (condition.operator) {
      case 'gt':
        return this.compareNumbers(value, condition.value, (a, b) => a > b);
      case 'lt':
        return this.compareNumbers(value, condition.value, (a, b) => a < b);
      case 'gte':
        return this.compareNumbers(value, condition.value, (a, b) => a >= b);
      case 'lte':
        return this.compareNumbers(value, condition.value, (a, b) => a <= b);
      case 'eq':
        return value === condition.value;
      case 'neq':
        return value !== condition.value;
      case 'crosses_above':
        return this.checkCrossesAbove(value, condition.value);
      case 'crosses_below':
        return this.checkCrossesBelow(value, condition.value);
      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Evaluate all conditions (AND logic - all must be true)
   */
  evaluateAll(conditions: TriggerCondition[], context: SignalContext): boolean {
    if (conditions.length === 0) return true;
    return conditions.every(condition => this.evaluate(condition, context));
  }

  /**
   * Get field value from context using dot notation
   */
  private getFieldValue(field: string, context: SignalContext): any {
    const parts = field.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }

    return value;
  }

  /**
   * Compare numbers safely
   */
  private compareNumbers(
    actual: any,
    expected: any,
    comparator: (a: number, b: number) => boolean
  ): boolean {
    const numActual = typeof actual === 'number' ? actual : parseFloat(actual);
    const numExpected = typeof expected === 'number' ? expected : parseFloat(expected as string);

    if (isNaN(numActual) || isNaN(numExpected)) return false;
    return comparator(numActual, numExpected);
  }

  /**
   * Check if value crosses above threshold (simplified - would need previous value)
   */
  private checkCrossesAbove(currentValue: any, threshold: any): boolean {
    // For now, just check if current > threshold
    // In production, would compare with previous value
    return this.compareNumbers(currentValue, threshold, (a, b) => a > b);
  }

  /**
   * Check if value crosses below threshold
   */
  private checkCrossesBelow(currentValue: any, threshold: any): boolean {
    return this.compareNumbers(currentValue, threshold, (a, b) => a < b);
  }
}
