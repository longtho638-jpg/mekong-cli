import { EventEmitter } from 'eventemitter3';

/** All events follow pattern "module:action" */
export type MekongEvent =
  | 'engine:started' | 'engine:stopped'
  | 'agent:spawned' | 'agent:completed' | 'agent:failed'
  | 'task:created' | 'task:started' | 'task:completed' | 'task:failed'
  | 'tool:called' | 'tool:result'
  | 'sop:started' | 'sop:step_completed' | 'sop:completed' | 'sop:failed'
  | 'budget:warning' | 'budget:exceeded'
  | 'constraint:violation'
  | 'memory:saved' | 'memory:compacted';

/** Global event bus — all modules communicate through this */
export const eventBus = new EventEmitter();

/** Type-safe emit */
export function emit(event: MekongEvent, data?: unknown): void {
  eventBus.emit(event, data);
}

/** Type-safe listener */
export function on(event: MekongEvent, handler: (data?: unknown) => void): void {
  eventBus.on(event, handler);
}

/** One-time listener */
export function once(event: MekongEvent, handler: (data?: unknown) => void): void {
  eventBus.once(event, handler);
}

/** Remove listener */
export function off(event: MekongEvent, handler: (data?: unknown) => void): void {
  eventBus.off(event, handler);
}

/** Remove all listeners for an event, or all events if none specified */
export function removeAllListeners(event?: MekongEvent): void {
  if (event) {
    eventBus.removeAllListeners(event);
  } else {
    eventBus.removeAllListeners();
  }
}
