/**
 * Business & Person Identity Data Models
 * Single Source of Truth matching PRD §7
 */

export type BusinessStatus = 'active' | 'frozen' | 'closed';

export interface BusinessMetadata {
  sector: string;
  location: string;
  gstin?: string;
  udyam_reg_no?: string;
  pan?: string;
  onboarding_source?: 'self' | 'csc_agent' | 'migrated';
  csc_agent_id?: string;
  [key: string]: unknown;
}

export interface Business {
  business_id: string; // e.g. "did:biz:sharma001"
  name: string;
  status: BusinessStatus;
  created_at: string; // ISO 8601 string
  primary_language: 'hi' | 'kn' | 'en' | string;
  metadata: BusinessMetadata;
}

export interface PersonContact {
  phone: string;
  email?: string;
}

export interface Person {
  person_id: string; // e.g. "did:person:ramesh001"
  name: string;
  contact: PersonContact;
  auth_ref: string; // mock_auth_token or auth identifier
}
