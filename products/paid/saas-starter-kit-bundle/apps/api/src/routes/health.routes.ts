import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import prisma from '../config/database';
import redisClient from '../config/redis';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
  };

  try {
    // Check Database Connection
    await prisma.$queryRaw`SELECT 1`;
    // Check Redis Connection
    await redisClient.ping();

    sendSuccess(res, healthCheck, 'System Healthy');
  } catch (error) {
    healthCheck.message = error as any;
    res.status(503).send();
  }
});

export default router;
