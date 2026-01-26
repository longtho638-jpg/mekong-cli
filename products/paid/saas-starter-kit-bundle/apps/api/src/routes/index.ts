import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './users.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);

export default router;
