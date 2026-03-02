/**
 * Zod schemas for auth request/response payloads.
 * Used for input validation in auth-related API routes.
 */
import { z } from 'zod';
import { ALL_SCOPES } from './scopes';

export const ScopeSchema = z.enum(ALL_SCOPES as [string, ...string[]]);

export const IssueTokenRequestSchema = z.object({
  tenantId: z.string().min(1).max(128),
  scopes: z.array(ScopeSchema).min(1),
  expirySeconds: z.number().int().positive().max(86400).optional(),
});

export const RefreshTokenRequestSchema = z.object({
  token: z.string().min(1),
});

export const CreateApiKeyRequestSchema = z.object({
  tenantId: z.string().min(1).max(128),
  scopes: z.array(ScopeSchema).min(1),
  label: z.string().max(64).optional(),
});

export const ApiKeyResponseSchema = z.object({
  keyId: z.string(),
  raw: z.string(),
  tenantId: z.string(),
  scopes: z.array(ScopeSchema),
  createdAt: z.number(),
  label: z.string().optional(),
});

export const AuthContextSchema = z.object({
  tenantId: z.string(),
  scopes: z.array(z.string()),
  keyId: z.string(),
});

export const TokenResponseSchema = z.object({
  token: z.string(),
  expiresIn: z.number(),
});

export type IssueTokenRequest = z.infer<typeof IssueTokenRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
