const { spawnBrain } = require('./lib/brain-process-manager');
const { execSync } = require('child_process');
(async () => {
    await spawnBrain(1, 'PLAN');
    await spawnBrain(1, 'EXECUTION');
    process.exit(0);
})();
