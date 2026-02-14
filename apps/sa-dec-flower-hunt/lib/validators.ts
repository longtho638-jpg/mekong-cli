import { z } from 'zod';

// Phone validation (Vietnam format: 0912345678 or 84912345678)
export const PhoneSchema = z.string()
    .regex(/^(0|84)[0-9]{9}$/, 'Invalid Vietnam phone number. Format: 0xxxxxxxxx or 84xxxxxxxxx');

// Email
export const EmailSchema = z.string().email('Invalid email address');

// UUID
export const UUIDSchema = z.string().uuid('Invalid UUID format');

// Name
export const NameSchema = z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters');

// Order status
export const OrderStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']);

// Payment method
export const PaymentMethodSchema = z.enum(['payos', 'vnpay', 'wallet']);

export const LeadSchema = z.object({
    phone: PhoneSchema,
    email: EmailSchema,
    name: NameSchema.optional(),
    flowerId: UUIDSchema.optional(),
});

export const OrderSchema = z.object({
    phone: PhoneSchema,
    email: EmailSchema,
    flowerId: UUIDSchema.optional(), // Made optional as it might be an array of items
    quantity: z.number().int().min(1).max(1000).optional(),
    paymentMethod: PaymentMethodSchema.optional(),
});

export const SubscribeSchema = z.object({
    email: EmailSchema,
});

export const CheckInSchema = z.object({
    qrCode: z.string().min(1, 'QR code required'),
    location: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    }).optional(),
});
