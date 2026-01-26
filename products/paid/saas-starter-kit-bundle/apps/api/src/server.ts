import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import prisma from './config/database';
import redisClient from './config/redis';
import routes from './routes';
import { errorHandler } from './middlewares/error-handler.middleware';
import { loggingMiddleware, requestLogger } from './middlewares/logging.middleware';
import { defaultLimiter } from './middlewares/rate-limit.middleware';
import { swaggerDocs } from './config/swagger';
import Logger from './utils/logger';
import { NotFoundError } from './utils/errors';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || '3000');

// Initialize services
const init = async () => {
    try {
        // Connect to Database
        await prisma.$connect();
        Logger.info('Database connected');

        // Connect to Redis
        await redisClient.connect();
        Logger.info('Redis connected');

        // Security Middlewares
        app.use(helmet());
        app.use(cors());
        app.use(compression());

        // Body parsing
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Logging
        app.use(loggingMiddleware);
        app.use(requestLogger);

        // Rate Limiting
        app.use(defaultLimiter);

        // Routes
        const apiPrefix = process.env.API_PREFIX || '/api/v1';
        app.use(apiPrefix, routes);

        // Swagger Docs
        swaggerDocs(app, port);

        // 404 Handler
        app.all('*', (req: Request, res: Response, next) => {
            next(new NotFoundError(`Route ${req.originalUrl} not found`));
        });

        // Global Error Handler
        app.use(errorHandler);

        // Start Server
        app.listen(port, () => {
            Logger.info(`⚡️ Server is running at http://localhost:${port}`);
            Logger.info(`📚 Documentation at http://localhost:${port}/api-docs`);
        });

    } catch (error) {
        Logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    Logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    Logger.error(err.name, err.message);
    process.exit(1);
});

init();
