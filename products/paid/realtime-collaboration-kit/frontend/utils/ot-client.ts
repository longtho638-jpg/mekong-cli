export enum OpType {
  INSERT = "insert",
  DELETE = "delete",
  RETAIN = "retain"
}

export interface Operation {
  type: OpType;
  position: number;
  value?: string;
  length: number;
}

export class OTClient {
  /**
   * Applies an operation to the current document content.
   */
  static apply(document: string, operation: Operation): string {
    if (operation.type === OpType.INSERT && operation.value) {
      return (
        document.slice(0, operation.position) +
        operation.value +
        document.slice(operation.position)
      );
    } else if (operation.type === OpType.DELETE) {
      return (
        document.slice(0, operation.position) +
        document.slice(operation.position + operation.length)
      );
    }
    return document;
  }

  /**
   * Transforms op_a against op_b.
   * Returns [op_a', op_b']
   * See backend implementation for logic.
   */
  static transform(opA: Operation, opB: Operation): [Operation, Operation] {
    const a = { ...opA };
    const b = { ...opB };
    const aPrime = { ...a };
    const bPrime = { ...b };

    if (a.type === OpType.INSERT && b.type === OpType.INSERT) {
      if (a.position < b.position) {
        bPrime.position += a.length;
      } else if (a.position > b.position) {
        aPrime.position += b.length;
      } else {
        // Tie breaker: assumption server/A wins or just shift B
        bPrime.position += a.length;
      }
    } else if (a.type === OpType.INSERT && b.type === OpType.DELETE) {
      if (a.position <= b.position) {
        bPrime.position += a.length;
      } else if (a.position > b.position + b.length) {
        aPrime.position -= b.length;
      } else {
         // Insert inside delete?
         // As per backend logic simplified
         aPrime.position = b.position;
      }
    } else if (a.type === OpType.DELETE && b.type === OpType.INSERT) {
      if (b.position <= a.position) {
        aPrime.position += b.length;
      } else if (b.position > a.position + a.length) {
        bPrime.position -= a.length;
      } else {
        bPrime.position = a.position;
      }
    }
    // Handle DELETE/DELETE and RETAIN cases if needed

    return [aPrime, bPrime];
  }
}
