/**
 * Vibe Supabase SDK — Org-Scoped Query Helpers
 *
 * Centralized queries for multi-org CRUD operations.
 * Uses generic SupabaseLike — no hard @supabase/supabase-js dependency.
 *
 * Usage:
 *   import { orgQueries } from '@agencyos/vibe-supabase';
 *   const orgs = await orgQueries.getUserOrgs(supabase, userId);
 */

import type { SupabaseLike } from './typed-query-helpers';
import type {
  Organization,
  OrgMember,
  ActivePlanInfo,
  UserSubscription,
} from '@agencyos/vibe-subscription';

// ─── Org Read Operations ────────────────────────────────────────

/** Fetch all organizations a user belongs to (via org_members join) */
export async function getUserOrgs(
  supabase: SupabaseLike,
  userId: string,
): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(*)')
    .eq('user_id', userId) as unknown as { data: Array<{ organizations: unknown }>; error: { message: string } | null };

  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((m) => m.organizations as Organization)
    .filter(Boolean);
}

/** Fetch org by ID */
export async function getOrgById(
  supabase: SupabaseLike,
  orgId: string,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (error) return null;
  return data as Organization;
}

/** Fetch all members of an organization */
export async function getOrgMembers(
  supabase: SupabaseLike,
  orgId: string,
): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from('org_members')
    .select('*')
    .eq('org_id', orgId) as unknown as { data: OrgMember[]; error: { message: string } | null };

  if (error) throw new Error(error.message);
  return (data ?? []) as OrgMember[];
}

// ─── Org Subscription Queries ───────────────────────────────────

/** Get the active plan for an org (via Postgres RPC) */
export async function getOrgActivePlan(
  supabase: SupabaseLike,
  orgId: string,
): Promise<ActivePlanInfo | null> {
  const { data, error } = await supabase
    .rpc('get_org_active_plan', { p_org_id: orgId });

  if (error) throw new Error(error.message);
  return (data as ActivePlanInfo[])?.[0] ?? null;
}

/** Get the current active subscription for an org */
export async function getOrgSubscription(
  supabase: SupabaseLike,
  orgId: string,
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .limit(1)
    .single();

  if (error) return null;
  return data as UserSubscription | null;
}

// ─── Org Write Operations ───────────────────────────────────────

/** Create an organization and auto-add owner as member */
export async function createOrg(
  supabase: SupabaseLike,
  params: { name: string; slug: string; ownerId: string },
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: params.name,
      slug: params.slug,
      owner_id: params.ownerId,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  // Auto-add owner as org member
  await supabase.from('org_members').insert({
    org_id: (data as { id: string }).id,
    user_id: params.ownerId,
    role: 'owner',
  });

  return data as Organization;
}

// ─── Convenience Namespace ──────────────────────────────────────

/** Grouped org queries for clean imports */
export const orgQueries = {
  getUserOrgs,
  getOrgById,
  getOrgMembers,
  getOrgActivePlan,
  getOrgSubscription,
  createOrg,
} as const;
