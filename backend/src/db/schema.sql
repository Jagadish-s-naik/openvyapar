-- OpenVyapar Relational Schema DDL
-- Single Source of Truth matching PRD §7

CREATE TABLE IF NOT EXISTS businesses (
  business_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TEXT NOT NULL,
  primary_language TEXT NOT NULL DEFAULT 'hi',
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS persons (
  person_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_json TEXT NOT NULL DEFAULT '{}',
  auth_ref TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS business_roles (
  role_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN ('owner', 'partner', 'successor', 'delegate')),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'former')),
  granted_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (business_id) REFERENCES businesses(business_id),
  FOREIGN KEY (person_id) REFERENCES persons(person_id)
);

CREATE TABLE IF NOT EXISTS credentials (
  credential_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  issuer TEXT NOT NULL CHECK (issuer IN ('gst_mock', 'bank_mock', 'marketplace_mock', 'agent_witnessed')),
  type TEXT NOT NULL,
  claim_json TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT,
  signature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('valid', 'revoked')),
  FOREIGN KEY (business_id) REFERENCES businesses(business_id)
);

CREATE TABLE IF NOT EXISTS delegation_tokens (
  token_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  delegate_person_id TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  created_at TEXT NOT NULL,
  expires_at TEXT,
  FOREIGN KEY (business_id) REFERENCES businesses(business_id),
  FOREIGN KEY (delegate_person_id) REFERENCES persons(person_id)
);

CREATE TABLE IF NOT EXISTS proof_shares (
  proof_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  disclosed_credential_ids_json TEXT NOT NULL,
  shared_with TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  link_or_qr TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('valid', 'tampered', 'expired')),
  FOREIGN KEY (business_id) REFERENCES businesses(business_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('owner', 'delegate', 'agent_suggestion', 'issuer', 'admin')),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  confirmed_by_human INTEGER NOT NULL CHECK (confirmed_by_human IN (0, 1)),
  timestamp TEXT NOT NULL,
  ip_address TEXT,
  origin TEXT,
  actor_role TEXT,
  diff_json TEXT,
  metadata_json TEXT,
  FOREIGN KEY (business_id) REFERENCES businesses(business_id)
);

CREATE TABLE IF NOT EXISTS agent_actions (
  agent_action_id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  input_summary TEXT NOT NULL,
  proposed_action_json TEXT NOT NULL,
  human_decision TEXT NOT NULL CHECK (human_decision IN ('confirmed', 'edited', 'rejected', 'pending')),
  created_at TEXT NOT NULL,
  decided_at TEXT,
  target_action_ref TEXT
);
