const { spawnBrain } = require('./lib/brain-process-manager');
(async () => {
    await spawnBrain(1, 'PLAN');
    await spawnBrain(1, 'EXECUTION');
    process.exit(0);
})();
