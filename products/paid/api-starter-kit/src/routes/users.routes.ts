import { Router } from 'express';
import userController from '../controllers/users.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { cache } from '../middlewares/cache.middleware';

const router = Router();

// Get current user profile
router.get('/me', authenticate, cache(300), userController.getProfile);

// Update current user profile
router.patch('/me', authenticate, userController.updateProfile);

// Get all users (Admin only)
router.get('/', authenticate, authorize('ADMIN'), cache(60), userController.getAllUsers);

export default router;
