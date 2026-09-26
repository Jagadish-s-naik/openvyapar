/**
 * BusinessRole Data Model
 * Single mechanism for ownership, partnership, succession, and delegation
 * Matching PRD §7
 */

export type RoleType = 'owner' | 'partner' | 'successor' | 'delegate';

export type RoleStatus = 'active' | 'revoked' | 'former';

export interface BusinessRole {
  role_id: string; // UUID
  business_id: string; // e.g. "did:biz:sharma001"
  person_id: string; // e.g. "did:person:ramesh001"
  role_type: RoleType;
  status: RoleStatus;
  granted_at: string; // ISO 8601 string
  revoked_at: string | null;
}
