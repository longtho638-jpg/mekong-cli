import { describe, expect, test } from '@jest/globals';
import { AppError, BadRequestError, UnauthorizedError } from '../../src/utils/errors';

describe('Error Classes', () => {
    test('AppError should set properties correctly', () => {
        const error = new AppError('Test Error', 418);
        expect(error.message).toBe('Test Error');
        expect(error.statusCode).toBe(418);
        expect(error.status).toBe('fail');
        expect(error.isOperational).toBe(true);
    });

    test('BadRequestError should have 400 status code', () => {
        const error = new BadRequestError('Bad Input');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad Input');
    });

    test('UnauthorizedError should have 401 status code', () => {
        const error = new UnauthorizedError();
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Unauthorized');
    });
});
