/**
 * Persona & Auth Context Types
 * For multi-persona simulation and role-based permissions
 */

import type { Person } from './business.js';
import type { BusinessRole, RoleType } from './role.js';

export interface AuthContextPayload {
  actor_id: string;
  person?: Person;
  roles: BusinessRole[];
  is_owner: boolean;
  effective_role?: RoleType | string;
}

export interface PersonaSession {
  person_id: string;
  name: string;
  role: string;
  business_id?: string;
  token?: string;
}
