import 'dotenv/config';
import './worker.js';

console.log('🚀 Agency Worker Service Started');
console.log('👀 Listening for jobs in queue: agency-queue');

// Keep process alive
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});
