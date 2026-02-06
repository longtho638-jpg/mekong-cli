import 'dotenv/config';
import Fastify from 'fastify';
import routes from './routes.js';

const fastify = Fastify({
  logger: true
});

// Register routes
fastify.register(routes);

const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Engine API listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
