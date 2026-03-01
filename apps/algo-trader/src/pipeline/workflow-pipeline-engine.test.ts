import {
  WorkflowPipelineEngine,
  PipelineNode,
  createTradingPipeline,
} from './workflow-pipeline-engine';

describe('WorkflowPipelineEngine', () => {
  it('should execute a linear pipeline', async () => {
    const nodes: PipelineNode[] = [
      {
        id: 'a', name: 'Step A', type: 'trigger',
        execute: async () => ({ value: 1 }),
        next: ['b'],
      },
      {
        id: 'b', name: 'Step B', type: 'action',
        execute: async (input) => ({ value: (input.value as number) + 1 }),
      },
    ];

    const engine = new WorkflowPipelineEngine({
      id: 'test', name: 'Test', nodes, entryNodeId: 'a',
    });

    const results = await engine.execute();
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('success');
    expect(results[1].data.value).toBe(2);
    expect(engine.isSuccess()).toBe(true);
  });

  it('should handle conditional branching', async () => {
    const executedNodes: string[] = [];
    const nodes: PipelineNode[] = [
      {
        id: 'check', name: 'Check', type: 'condition',
        execute: async () => ({ approved: true }),
        condition: (data) => data.approved ? 'yes' : 'no',
        branches: { yes: 'approve', no: 'reject' },
      },
      {
        id: 'approve', name: 'Approve', type: 'action',
        execute: async () => { executedNodes.push('approve'); return { done: true }; },
      },
      {
        id: 'reject', name: 'Reject', type: 'action',
        execute: async () => { executedNodes.push('reject'); return { done: false }; },
      },
    ];

    const engine = new WorkflowPipelineEngine({
      id: 'cond', name: 'Cond', nodes, entryNodeId: 'check',
    });
    await engine.execute();

    expect(executedNodes).toEqual(['approve']);
  });

  it('should retry failed nodes', async () => {
    let attempts = 0;
    const nodes: PipelineNode[] = [
      {
        id: 'retry-node', name: 'Retry', type: 'action',
        maxRetries: 2, retryDelay: 10,
        execute: async () => {
          attempts++;
          if (attempts < 3) throw new Error('Temporary failure');
          return { ok: true };
        },
      },
    ];

    const engine = new WorkflowPipelineEngine({
      id: 'retry', name: 'Retry', nodes, entryNodeId: 'retry-node',
    });
    const results = await engine.execute();

    expect(attempts).toBe(3);
    expect(results[0].status).toBe('success');
    expect(results[0].retries).toBe(2);
  });

  it('should call error handler on fatal failure', async () => {
    let errorHandled = false;
    const nodes: PipelineNode[] = [
      {
        id: 'fail', name: 'Fail', type: 'action',
        execute: async () => { throw new Error('Fatal'); },
      },
      {
        id: 'err', name: 'Error Handler', type: 'report',
        execute: async () => { errorHandled = true; return {}; },
      },
    ];

    const engine = new WorkflowPipelineEngine({
      id: 'err-test', name: 'ErrTest', nodes,
      entryNodeId: 'fail', errorHandlerNodeId: 'err',
    });
    await engine.execute();

    expect(errorHandled).toBe(true);
    expect(engine.getFailedNodes()).toHaveLength(1);
  });

  it('should report failed nodes', async () => {
    const nodes: PipelineNode[] = [
      {
        id: 'bad', name: 'Bad', type: 'action',
        execute: async () => { throw new Error('Boom'); },
      },
    ];

    const engine = new WorkflowPipelineEngine({
      id: 'fail', name: 'Fail', nodes, entryNodeId: 'bad',
    });
    await engine.execute();

    expect(engine.isSuccess()).toBe(false);
    expect(engine.getFailedNodes()[0].error).toBe('Boom');
  });
});

describe('createTradingPipeline', () => {
  it('should execute standard trading flow when risk approved', async () => {
    const steps: string[] = [];
    const pipeline = createTradingPipeline({
      onTrigger: async () => { steps.push('trigger'); return { price: 50000 }; },
      onSignalDetect: async () => { steps.push('signal'); return { signal: 'BUY' }; },
      onRiskCheck: async () => { steps.push('risk'); return { approved: true }; },
      onOrderExecute: async () => { steps.push('order'); return { orderId: '123' }; },
      onReport: async () => { steps.push('report'); return {}; },
    });

    await pipeline.execute({ symbol: 'BTC/USDT' });
    expect(steps).toEqual(['trigger', 'signal', 'risk', 'order', 'report']);
    expect(pipeline.isSuccess()).toBe(true);
  });

  it('should skip order when risk rejected', async () => {
    const steps: string[] = [];
    const pipeline = createTradingPipeline({
      onTrigger: async () => { steps.push('trigger'); return {}; },
      onSignalDetect: async () => { steps.push('signal'); return {}; },
      onRiskCheck: async () => { steps.push('risk'); return { approved: false }; },
      onOrderExecute: async () => { steps.push('order'); return {}; },
      onReport: async () => { steps.push('report'); return {}; },
    });

    await pipeline.execute();
    expect(steps).toEqual(['trigger', 'signal', 'risk', 'report']);
    expect(steps).not.toContain('order');
  });
});
