import { NextFunction, Request, Response } from 'express';
import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { updateUserSchema } from '../utils/validators';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          apiKey: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
      try {
          const page = parseInt(req.query.page as string) || 1;
          const limit = parseInt(req.query.limit as string) || 10;
          const skip = (page - 1) * limit;

          const [users, total] = await Promise.all([
              prisma.user.findMany({
                  skip,
                  take: limit,
                  select: {
                      id: true,
                      email: true,
                      name: true,
                      role: true,
                      createdAt: true
                  },
                  orderBy: { createdAt: 'desc' }
              }),
              prisma.user.count()
          ]);

          sendSuccess(res, {
              users,
              pagination: {
                  page,
                  limit,
                  total,
                  pages: Math.ceil(total / limit)
              }
          });
      } catch (error) {
          next(error);
      }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
      try {
          const userId = req.user?.id;
          const validation = updateUserSchema.safeParse(req.body);

          if (!validation.success) {
              throw new BadRequestError(validation.error.errors[0].message);
          }

          const user = await prisma.user.update({
              where: { id: userId },
              data: validation.data,
              select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true
              }
          });

          sendSuccess(res, user, 'Profile updated successfully');
      } catch (error) {
          next(error);
      }
  }
}

export default new UserController();
