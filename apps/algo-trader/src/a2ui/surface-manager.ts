/**
 * A2UI Surface Manager — Manages declarative UI surfaces for trading dashboard.
 * Handles surface lifecycle: begin → update → data → delete.
 */

import {
  A2UIMessage,
  A2UIComponent,
  BeginRenderingMessage,
  SurfaceUpdateMessage,
  DataModelUpdateMessage,
  DeleteSurfaceMessage,
} from './types';

export interface Surface {
  id: string;
  title: string;
  components: A2UIComponent[];
  dataModel: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

type MessageHandler = (message: A2UIMessage) => void;

export class SurfaceManager {
  private surfaces = new Map<string, Surface>();
  private messageHandlers: MessageHandler[] = [];

  /** Subscribe to outgoing A2UI messages */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  private broadcast(message: A2UIMessage): void {
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch {
        // Silently handle subscriber errors
      }
    }
  }

  /** Create a new surface */
  beginRendering(surfaceId: string, title: string): Surface {
    const now = Date.now();
    const surface: Surface = {
      id: surfaceId,
      title,
      components: [],
      dataModel: {},
      createdAt: now,
      updatedAt: now,
    };
    this.surfaces.set(surfaceId, surface);

    const message: BeginRenderingMessage = {
      type: 'beginRendering',
      surfaceId,
      title,
      timestamp: now,
    };
    this.broadcast(message);
    return surface;
  }

  /** Update components on a surface */
  updateSurface(surfaceId: string, components: A2UIComponent[]): void {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) return;

    surface.components = components;
    surface.updatedAt = Date.now();

    const message: SurfaceUpdateMessage = {
      type: 'surfaceUpdate',
      surfaceId,
      components,
      timestamp: surface.updatedAt,
    };
    this.broadcast(message);
  }

  /** Update a data binding on a surface */
  updateDataModel(surfaceId: string, path: string, value: unknown): void {
    const surface = this.surfaces.get(surfaceId);
    if (!surface) return;

    surface.dataModel[path] = value;
    surface.updatedAt = Date.now();

    const message: DataModelUpdateMessage = {
      type: 'dataModelUpdate',
      surfaceId,
      path,
      value,
      timestamp: surface.updatedAt,
    };
    this.broadcast(message);
  }

  /** Remove a surface */
  deleteSurface(surfaceId: string): void {
    this.surfaces.delete(surfaceId);

    const message: DeleteSurfaceMessage = {
      type: 'deleteSurface',
      surfaceId,
      timestamp: Date.now(),
    };
    this.broadcast(message);
  }

  /** Get a surface by ID */
  getSurface(surfaceId: string): Surface | undefined {
    return this.surfaces.get(surfaceId);
  }

  /** List all active surfaces */
  listSurfaces(): Surface[] {
    return Array.from(this.surfaces.values());
  }

  /** Check if a surface exists */
  hasSurface(surfaceId: string): boolean {
    return this.surfaces.has(surfaceId);
  }

  /** Clear all surfaces */
  reset(): void {
    for (const id of this.surfaces.keys()) {
      this.deleteSurface(id);
    }
    this.messageHandlers = [];
  }
}
