import { SurfaceManager } from './surface-manager';
import { A2UIMessage, A2UIComponent } from './types';

describe('SurfaceManager', () => {
  let manager: SurfaceManager;

  beforeEach(() => {
    manager = new SurfaceManager();
  });

  it('should create a surface via beginRendering', () => {
    const surface = manager.beginRendering('dashboard', 'Trading Dashboard');
    expect(surface.id).toBe('dashboard');
    expect(surface.title).toBe('Trading Dashboard');
    expect(surface.components).toHaveLength(0);
    expect(manager.hasSurface('dashboard')).toBe(true);
  });

  it('should broadcast beginRendering message', () => {
    const messages: A2UIMessage[] = [];
    manager.onMessage((m) => messages.push(m));
    manager.beginRendering('s1', 'Test');

    expect(messages).toHaveLength(1);
    expect(messages[0].type).toBe('beginRendering');
  });

  it('should update surface components', () => {
    manager.beginRendering('s1', 'Test');
    const components: A2UIComponent[] = [
      { id: 'c1', type: 'Card', props: { title: 'Portfolio' } },
      { id: 'c2', type: 'Badge', props: { text: 'LIVE' } },
    ];
    manager.updateSurface('s1', components);

    const surface = manager.getSurface('s1');
    expect(surface?.components).toHaveLength(2);
    expect(surface?.components[0].type).toBe('Card');
  });

  it('should update data model bindings', () => {
    manager.beginRendering('s1', 'Test');
    manager.updateDataModel('s1', '/portfolio/pnl', 1250.50);
    manager.updateDataModel('s1', '/portfolio/drawdown', -2.3);

    const surface = manager.getSurface('s1');
    expect(surface?.dataModel['/portfolio/pnl']).toBe(1250.50);
    expect(surface?.dataModel['/portfolio/drawdown']).toBe(-2.3);
  });

  it('should delete a surface', () => {
    manager.beginRendering('s1', 'Test');
    expect(manager.hasSurface('s1')).toBe(true);

    manager.deleteSurface('s1');
    expect(manager.hasSurface('s1')).toBe(false);
  });

  it('should list all active surfaces', () => {
    manager.beginRendering('s1', 'Dashboard');
    manager.beginRendering('s2', 'Signals');
    expect(manager.listSurfaces()).toHaveLength(2);

    manager.deleteSurface('s1');
    expect(manager.listSurfaces()).toHaveLength(1);
  });

  it('should ignore operations on non-existent surfaces', () => {
    // Should not throw
    manager.updateSurface('nonexistent', []);
    manager.updateDataModel('nonexistent', '/test', 42);
    manager.deleteSurface('nonexistent');
  });

  it('should broadcast surfaceUpdate and dataModelUpdate messages', () => {
    const messages: A2UIMessage[] = [];
    manager.onMessage((m) => messages.push(m));

    manager.beginRendering('s1', 'Test');
    manager.updateSurface('s1', [{ id: 'c1', type: 'Alert', props: {} }]);
    manager.updateDataModel('s1', '/price', 50000);

    expect(messages).toHaveLength(3);
    expect(messages[0].type).toBe('beginRendering');
    expect(messages[1].type).toBe('surfaceUpdate');
    expect(messages[2].type).toBe('dataModelUpdate');
  });

  it('should return unsubscribe from onMessage', () => {
    const messages: A2UIMessage[] = [];
    const unsub = manager.onMessage((m) => messages.push(m));
    manager.beginRendering('s1', 'Test');
    expect(messages).toHaveLength(1);

    unsub();
    manager.beginRendering('s2', 'Test2');
    expect(messages).toHaveLength(1); // No new messages
  });
});
