import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../src/middlewares/error-handler.middleware';
import { AppError } from '../../src/utils/errors';

const app = express();

app.get('/error', (req, res, next) => {
    next(new AppError('Test Error', 400));
});

app.get('/unknown', (req, res, next) => {
    next(new Error('Something broke'));
});

app.use(errorHandler);

describe('Error Handler Middleware', () => {
    test('should handle AppError correctly', async () => {
        const res = await request(app).get('/error');
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: 'Test Error',
            data: null
        });
    });

    test('should handle unknown errors as 500', async () => {
        const res = await request(app).get('/unknown');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({
            success: false,
            message: 'Internal Server Error',
            data: null
        });
    });
});
