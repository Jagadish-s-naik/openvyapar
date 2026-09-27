export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'OpenVyapar API Reference',
    version: '1.0.0',
    description: `
# OpenVyapar — Unified Business Identity (DPI for Business Owners)
OpenVyapar is a Digital Public Infrastructure (DPI) platform empowering micro and small business owners in India with portable, cryptographically verifiable, and self-sovereign business identity.

### 🛡️ Core Principles & Guardrails:
1. **Human-in-the-Loop AI**: AI agents only *propose* state changes with an \`agent_action_id\` in \`pending\` status. State mutations require explicit human review & confirmation.
2. **Cryptographic Integrity**: Credentials and selective disclosure proofs carry authentic HMAC-SHA256 signatures for zero-trust instant verification.
3. **Decentralized Identifiers**: Every enterprise is identified by a persistent DID (\`did:biz:<unique_id>\`).
4. **Least-Privilege Delegation**: Tokenized and time-bounded role delegation ensuring granular data access without sharing master credentials.
    `,
    contact: {
      name: 'OpenVyapar DPI Team',
      url: 'https://github.com/Jagadish-s-naik/openvyapar',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    },
  ],
  tags: [
    {
      name: 'Identity & Business',
      description: 'Decentralized business identity (DID) creation, profile resolution, role management, and ownership succession.',
    },
    {
      name: 'Verifiable Credentials',
      description: 'HMAC-SHA256 signed tamper-evident credentials from ecosystem authorities.',
    },
    {
      name: 'Selective Disclosure & Proofs',
      description: 'Zero-knowledge and selective disclosure proofs allowing owners to share only required attributes.',
    },
    {
      name: 'Live Verifier Sessions',
      description: 'Real-time interactive loan underwriting sessions connecting bank officer portals with business wallets.',
    },
    {
      name: 'Delegation & Access Control',
      description: 'Tokenized role delegation with scope restrictions and instant revocation.',
    },
    {
      name: 'AI Agents (Guardrailed)',
      description: 'Onboarding extraction, plain-language consent explainer, scope suggestion, verifier risk scoring, and copilot assist.',
    },
    {
      name: 'Mock Ecosystem Issuers',
      description: 'Simulated IndiaStack issuers (GSTN, Bank Account Aggregator, ONDC reputation, CSC physical witness).',
    },
    {
      name: 'Audit & Governance',
      description: 'Immutable cryptographically referenced audit log and business timeline of all actions.',
    },
    {
      name: 'Authentication & Personas',
      description: 'Actor context resolution and rapid demo persona switching.',
    },
    {
      name: 'Admin & State Snapshots',
      description: 'Instant state backups, snapshot restoration, and demo database resets.',
    },
    {
      name: 'System Health',
      description: 'Liveness, readiness, and diagnostic telemetry probes.',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System Health'],
        summary: 'Comprehensive service diagnostic and telemetry probe',
        description: 'Returns service health, database stats, active issuers, memory footprint, and environment config.',
        responses: {
          '200': {
            description: 'Service telemetry payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    service: { type: 'string', example: 'openvyapar-backend' },
                    version: { type: 'string', example: '1.0.0' },
                    uptime_seconds: { type: 'number', example: 45.2 },
                    database: { type: 'object' },
                    subsystems: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['System Health'],
        summary: 'Readiness probe',
        description: 'Checks if backend and database connections are ready to accept traffic.',
        responses: {
          '200': {
            description: 'Ready status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ready: { type: 'boolean', example: true },
                    status: { type: 'string', example: 'ok' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/live': {
      get: {
        tags: ['System Health'],
        summary: 'Liveness probe',
        description: 'Fast ping endpoint for container and process supervisors.',
        responses: {
          '200': {
            description: 'Process is alive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    live: { type: 'boolean', example: true },
                    status: { type: 'string', example: 'ok' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/personas': {
      get: {
        tags: ['Authentication & Personas'],
        summary: 'List available demo personas',
        description: 'Returns pre-seeded personas (Ramesh Sharma, Priya Sharma, Amit Kumar CA, Neha Patel Bank Officer, etc.) for rapid actor switching.',
        responses: {
          '200': {
            description: 'List of personas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'number', example: 5 },
                    personas: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication & Personas'],
        summary: 'Get active actor context',
        description: 'Resolves caller persona and active permissions from `x-openvyapar-actor-id` header or actor query parameter.',
        responses: {
          '200': {
            description: 'Active actor profile and permissions',
          },
        },
      },
    },
    '/business': {
      post: {
        tags: ['Identity & Business'],
        summary: 'Register a new Business Identity (DID)',
        description: 'Creates a new enterprise with a persistent DID (`did:biz:...`) and assigns initial owner role. Links with `agent_action_id` when triggered via AI onboarding.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'owner_person_id'],
                properties: {
                  name: { type: 'string', example: 'Sharma Kirana Store' },
                  owner_person_id: { type: 'string', example: 'person-ramesh-sharma' },
                  primary_language: { type: 'string', enum: ['hi', 'kn', 'en'], example: 'hi' },
                  agent_action_id: { type: 'string', nullable: true, example: 'act-onboard-7f89b' },
                  metadata: {
                    type: 'object',
                    properties: {
                      sector: { type: 'string', example: 'Retail Grocery' },
                      location: { type: 'string', example: 'Varanasi, UP' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Business successfully registered',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    business: {
                      type: 'object',
                      properties: {
                        business_id: { type: 'string', example: 'did:biz:sharma001' },
                        name: { type: 'string', example: 'Sharma Kirana Store' },
                        status: { type: 'string', example: 'active' },
                        primary_language: { type: 'string', example: 'hi' },
                        created_at: { type: 'string', format: 'date-time' },
                      },
                    },
                    owner_role: { type: 'object' },
                  },
                },
              },
            },
          },
          '400': { description: 'Missing required fields or invalid agent proposal' },
        },
      },
      get: {
        tags: ['Identity & Business'],
        summary: 'List all businesses',
        description: 'Retrieves all registered enterprises in the system.',
        responses: {
          '200': {
            description: 'Array of businesses',
          },
        },
      },
    },
    '/business/{id}': {
      get: {
        tags: ['Identity & Business'],
        summary: 'Get business profile by DID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'did:biz:sharma001' },
            description: 'Decentralized Identifier of the business',
          },
        ],
        responses: {
          '200': { description: 'Business profile and associated roles' },
          '404': { description: 'Business not found' },
        },
      },
    },
    '/business/{id}/roles': {
      get: {
        tags: ['Identity & Business'],
        summary: 'Get all role holders for a business',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'did:biz:sharma001' },
          },
        ],
        responses: {
          '200': { description: 'List of business roles with hydrated person details' },
        },
      },
      post: {
        tags: ['Identity & Business'],
        summary: 'Grant or transfer a business role',
        description: 'Grants an active role (owner, partner, successor, delegate). Requester must be the current owner.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'did:biz:sharma001' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['person_id', 'role_type'],
                properties: {
                  person_id: { type: 'string', example: 'person-priya-sharma' },
                  role_type: { type: 'string', enum: ['owner', 'partner', 'successor', 'delegate'], example: 'successor' },
                  granted_by: { type: 'string', example: 'did:person:ramesh001' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Role granted' },
          '403': { description: 'Forbidden: caller is not the business owner' },
        },
      },
    },
    '/business/transfer-ownership': {
      post: {
        tags: ['Identity & Business'],
        summary: 'Convenience endpoint for Beat 5 Succession Transfer',
        description: 'Atomically transfers primary ownership from Ramesh Sharma to Priya Sharma with full audit logging.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id', 'new_owner_person_id'],
                properties: {
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  new_owner_person_id: { type: 'string', example: 'person-priya-sharma' },
                  granted_by: { type: 'string', example: 'did:person:ramesh001' },
                  transfer_reason: { type: 'string', example: 'Generational business handover' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Ownership transferred' },
        },
      },
    },
    '/credentials/issue': {
      post: {
        tags: ['Verifiable Credentials'],
        summary: 'Issue an HMAC-SHA256 signed credential',
        description: 'Issues a tamper-evident credential with authentic signature. Verifies agent proposal idempotency if `agent_action_id` is supplied.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id', 'issuer', 'type', 'claim'],
                properties: {
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  issuer: { type: 'string', example: 'gst_mock' },
                  type: {
                    type: 'string',
                    enum: ['self_attested', 'gst_compliant', 'bank_statement_summary', 'marketplace_reputation'],
                    example: 'gst_compliant',
                  },
                  claim: {
                    type: 'object',
                    example: {
                      gstin: '09AAACS1429B1ZB',
                      filing_status_regular: true,
                      annual_turnover_bracket: '₹25L - ₹50L',
                      active_since_years: 10,
                    },
                  },
                  expires_at: { type: 'string', format: 'date-time', nullable: true },
                  agent_action_id: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Credential issued with HMAC-SHA256 signature',
          },
        },
      },
    },
    '/credentials/{business_id}': {
      get: {
        tags: ['Verifiable Credentials'],
        summary: 'Retrieve all credentials for a business',
        description: 'Retrieves all credentials for a business DID and performs live HMAC cryptographic validity checks.',
        parameters: [
          {
            name: 'business_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'did:biz:sharma001' },
          },
        ],
        responses: {
          '200': {
            description: 'List of business credentials with `is_cryptographically_valid` flags',
          },
        },
      },
    },
    '/delegation/grant': {
      post: {
        tags: ['Delegation & Access Control'],
        summary: 'Grant role-based delegation token',
        description: 'Issues a scoped, time-bounded delegation token to an accountant, manager, or consultant.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id', 'delegate_person_id', 'scopes'],
                properties: {
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  delegate_person_id: { type: 'string', example: 'did:person:amit001' },
                  scopes: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['file_returns'],
                  },
                  expires_at: { type: 'string', format: 'date-time', nullable: true },
                  agent_action_id: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Delegation token granted' },
          '403': { description: 'Forbidden: caller is not the business owner' },
        },
      },
    },
    '/delegation/revoke': {
      post: {
        tags: ['Delegation & Access Control'],
        summary: 'Instantly revoke active delegation token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id', 'token_id'],
                properties: {
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  token_id: { type: 'string', example: 'tok-4412a' },
                  revoked_by: { type: 'string', example: 'did:person:ramesh001' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Token revoked' },
        },
      },
    },
    '/delegation/{business_id}': {
      get: {
        tags: ['Delegation & Access Control'],
        summary: 'List delegations for a business',
        parameters: [
          {
            name: 'business_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'did:biz:sharma001' },
          },
        ],
        responses: {
          '200': { description: 'List of active and revoked delegation tokens' },
        },
      },
    },
    '/proof/generate': {
      post: {
        tags: ['Selective Disclosure & Proofs'],
        summary: 'Generate selective disclosure cryptographic proof',
        description: 'Generates a selective disclosure proof with disclosed attribute hashes, HMAC signature, and optional expiration/single-use restrictions.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id', 'verifier_id', 'purpose', 'disclosed_fields'],
                properties: {
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  verifier_id: { type: 'string', example: 'hdfc_bank_officer' },
                  purpose: { type: 'string', example: 'Working Capital Loan Underwriting' },
                  disclosed_fields: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['gstin', 'filing_status_regular', 'average_monthly_balance_range', 'positive_rating_percentage'],
                  },
                  expires_in_hours: { type: 'number', example: 24 },
                  single_use: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Proof generated with shareable verification URL and token',
          },
        },
      },
    },
    '/proof/{proof_id}': {
      get: {
        tags: ['Selective Disclosure & Proofs'],
        summary: 'Fetch selective disclosure proof by ID',
        parameters: [
          {
            name: 'proof_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'proof-sharma-loan-001' },
          },
        ],
        responses: {
          '200': { description: 'Proof details, disclosed attributes, and signatures' },
          '404': { description: 'Proof not found or expired' },
        },
      },
    },
    '/proof/verify': {
      post: {
        tags: ['Selective Disclosure & Proofs'],
        summary: 'Cryptographically verify proof integrity',
        description: 'Validates HMAC signatures, credential freshness, expiration, and detects tampering in real-time.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['proof_id'],
                properties: {
                  proof_id: { type: 'string', example: 'proof-sharma-loan-001' },
                  verifier_id: { type: 'string', example: 'hdfc_bank_officer' },
                  simulate_tamper: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Verification result with overall verdict, cryptographic status, and field validations',
          },
        },
      },
    },
    '/proof/verify/{proof_id}': {
      get: {
        tags: ['Selective Disclosure & Proofs'],
        summary: 'Verify proof by URL param (GET convenience)',
        parameters: [
          {
            name: 'proof_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'proof-sharma-loan-001' },
          },
        ],
        responses: {
          '200': { description: 'Verification verdict' },
        },
      },
    },
    '/proof/simulate-tamper/{proof_id}': {
      post: {
        tags: ['Selective Disclosure & Proofs'],
        summary: 'Simulate tampering on proof for demo/judging validation',
        description: 'Artificially alters credential values to demonstrate instant live cryptographic HMAC verification failure.',
        parameters: [
          {
            name: 'proof_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'proof-sharma-loan-001' },
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tampered: { type: 'boolean', example: true },
                  tampered_field: { type: 'string', example: 'annual_turnover_bracket' },
                  tampered_value: { type: 'string', example: '₹1Cr+' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Tamper simulation updated' },
        },
      },
    },
    '/proof/session/active': {
      get: {
        tags: ['Live Verifier Sessions'],
        summary: 'Get or initialize active underwriting session',
        responses: {
          '200': { description: 'Active session details' },
        },
      },
    },
    '/proof/session/create': {
      post: {
        tags: ['Live Verifier Sessions'],
        summary: 'Create a new live loan underwriting session',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bank_name: { type: 'string', example: 'HDFC Micro-Enterprise Finance' },
                  officer_name: { type: 'string', example: 'Neha Patel (Senior Underwriter)' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Session created with 6-digit session code' },
        },
      },
    },
    '/proof/session/dispatch': {
      post: {
        tags: ['Live Verifier Sessions'],
        summary: 'Dispatch generated proof into an active live session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['session_code', 'proof_id'],
                properties: {
                  session_code: { type: 'string', example: 'HDFC-8821' },
                  proof_id: { type: 'string', example: 'proof-sharma-loan-001' },
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Proof linked to live session' },
        },
      },
    },
    '/proof/session/{code}': {
      get: {
        tags: ['Live Verifier Sessions'],
        summary: 'Get session state by 6-digit code',
        parameters: [
          {
            name: 'code',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'HDFC-8821' },
          },
        ],
        responses: {
          '200': { description: 'Live session status and dispatched proof' },
        },
      },
    },
    '/mocks/issue-batch/{business_id}': {
      post: {
        tags: ['Mock Ecosystem Issuers'],
        summary: 'Simulate Beat 2 Time-Skip (Batch Issue GST, Bank, ONDC Credentials)',
        description: 'Issues authentic HMAC-signed credentials from GSTN, Bank, and ONDC based on selected profile template.',
        parameters: [
          {
            name: 'business_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'did:biz:sharma001' },
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  template: {
                    type: 'string',
                    enum: ['standard_healthy', 'thin_file_starter', 'high_growth_ecom', 'distressed_irregular'],
                    example: 'standard_healthy',
                  },
                  overrides: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Batch credentials issued successfully' },
        },
      },
    },
    '/mocks/csc-witness': {
      post: {
        tags: ['Mock Ecosystem Issuers'],
        summary: 'Simulate CSC Field Agent Physical Witness Attestation (Beat 1)',
        description: 'Geo-tags shop premises, generates photo verification hash, and issues HMAC-signed starter credential.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id'],
                properties: {
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  csc_agent_id: { type: 'string', example: 'did:person:csc001' },
                  agent_name: { type: 'string', example: 'Aarav Patel (CSC VLE)' },
                  csc_center_id: { type: 'string', example: 'CSC-UP-VAR-049' },
                  coordinates: {
                    type: 'object',
                    properties: {
                      lat: { type: 'number', example: 25.3176 },
                      lng: { type: 'number', example: 82.9739 },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'CSC Witness credential issued' },
        },
      },
    },
    '/agent/onboard-extract': {
      post: {
        tags: ['AI Agents (Guardrailed)'],
        summary: 'AI Onboarding: Extract structured claims from speech transcript',
        description: 'Parses unstructured Hindi/Kannada/English voice transcript, outputs starter claims, and returns an agent proposal with status `pending`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['transcript'],
                properties: {
                  transcript: {
                    type: 'string',
                    example: 'Mera naam Ramesh Sharma hai. Varanasi me Sharma Kirana Store 10 saal se chala raha hu.',
                  },
                  language: { type: 'string', enum: ['hi', 'kn', 'en'], example: 'hi' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Extraction proposal with `agent_action_id`',
          },
        },
      },
    },
    '/agent/consent-explain': {
      post: {
        tags: ['AI Agents (Guardrailed)'],
        summary: 'AI Consent: Explain selective disclosure in vernacular language',
        description: 'Generates plain-language breakdown showing exactly which fields are shared vs. withheld.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id', 'purpose', 'recipient_name', 'selected_credential_ids'],
                properties: {
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  purpose: { type: 'string', example: 'Working Capital Loan Application' },
                  recipient_name: { type: 'string', example: 'HDFC Bank' },
                  selected_credential_ids: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['cred-gst-sharma001', 'cred-bank-sharma001'],
                  },
                  language: { type: 'string', enum: ['hi', 'kn', 'en'], example: 'hi' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Vernacular consent explanation and shared/withheld breakdown' },
        },
      },
    },
    '/agent/scope-suggest': {
      post: {
        tags: ['AI Agents (Guardrailed)'],
        summary: 'AI Scoping: Suggest least-privilege delegation permissions',
        description: 'Strictly enforces least-privilege scoping rules (e.g. tax duties never grant banking permissions).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id', 'natural_language_prompt', 'target_person_name'],
                properties: {
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  natural_language_prompt: { type: 'string', example: 'I need my accountant Amit to file Q3 GST returns.' },
                  target_person_name: { type: 'string', example: 'Amit Kumar (CA)' },
                  language: { type: 'string', enum: ['hi', 'kn', 'en'], example: 'en' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Scoped permissions and security rationale' },
        },
      },
    },
    '/agent/verifier-flag': {
      post: {
        tags: ['AI Agents (Guardrailed)'],
        summary: 'AI Underwriting: Analyze risk and anomalies on proof',
        description: 'Analyzes financial health, credential age, and flags anomalies for loan officers.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id', 'credentials'],
                properties: {
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  credentials: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Trust verdict and anomaly flags' },
        },
      },
    },
    '/agent/assist': {
      post: {
        tags: ['AI Agents (Guardrailed)'],
        summary: 'Multilingual Business Copilot & Navigation Assistant',
        description: 'Understands vernacular queries and returns intelligent routing recommendations with intent explanation.',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  query: { type: 'string', example: 'Mera GST credential kaise share karu?' },
                  language: { type: 'string', enum: ['hi', 'kn', 'en'], example: 'hi' },
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Intent routing, navigation handoff, and zero-custody verification' },
        },
      },
    },
    '/audit/{business_id}': {
      get: {
        tags: ['Audit & Governance'],
        summary: 'Get raw immutable audit log entries',
        parameters: [
          {
            name: 'business_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'did:biz:sharma001' },
          },
        ],
        responses: {
          '200': { description: 'Audit log entries and agent proposals' },
        },
      },
    },
    '/audit/{business_id}/timeline': {
      get: {
        tags: ['Audit & Governance'],
        summary: 'Get enriched chronological business timeline',
        description: 'Returns human mutations, role grants, credential issuances, and AI agent proposals in unified chronological order.',
        parameters: [
          {
            name: 'business_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'did:biz:sharma001' },
          },
          {
            name: 'sort',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
          {
            name: 'category',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Timeline events array' },
        },
      },
    },
    '/audit/agent-action': {
      post: {
        tags: ['Audit & Governance'],
        summary: 'Record or update an agent proposal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_id', 'agent_type', 'input_summary', 'proposed_action'],
                properties: {
                  agent_action_id: { type: 'string', example: 'agent-act-91bca' },
                  business_id: { type: 'string', example: 'did:biz:sharma001' },
                  agent_type: { type: 'string', enum: ['onboarding', 'consent_explainer', 'delegation_scoping', 'verifier_trust'], example: 'onboarding' },
                  input_summary: { type: 'string', example: 'Zero-footprint onboarding extraction' },
                  proposed_action: { type: 'object' },
                  human_decision: { type: 'string', enum: ['pending', 'confirmed', 'rejected', 'edited'], example: 'pending' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Agent action recorded' },
        },
      },
    },
    '/audit/agent-action/{id}/decision': {
      post: {
        tags: ['Audit & Governance'],
        summary: 'Record human decision on an agent proposal',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'agent-act-91bca' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['human_decision'],
                properties: {
                  human_decision: { type: 'string', enum: ['confirmed', 'rejected', 'edited'], example: 'confirmed' },
                  decided_by: { type: 'string', example: 'did:person:ramesh001' },
                  notes: { type: 'string', example: 'Approved after verifying premises' },
                  edited_payload: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Human decision recorded with audit log entry' },
        },
      },
    },
    '/admin/reset': {
      post: {
        tags: ['Admin & State Snapshots'],
        summary: 'Reset database and seed demo fixtures',
        description: 'Resets database state and re-seeds Sharma Kirana Store demo data (or resets to empty if `?empty=true`).',
        parameters: [
          {
            name: 'empty',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['true', 'false'] },
          },
        ],
        responses: {
          '200': { description: 'Database state reset and seeded' },
        },
      },
    },
    '/admin/snapshot': {
      post: {
        tags: ['Admin & State Snapshots'],
        summary: 'Create instant state snapshot',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Pre-Beat-5-Succession' },
                  description: { type: 'string', example: 'State before transferring ownership to Priya' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Snapshot created' },
        },
      },
    },
    '/admin/snapshots': {
      get: {
        tags: ['Admin & State Snapshots'],
        summary: 'List all state snapshots',
        responses: {
          '200': { description: 'List of snapshots' },
        },
      },
    },
    '/admin/restore': {
      post: {
        tags: ['Admin & State Snapshots'],
        summary: 'Restore state from snapshot',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  snapshot_id: { type: 'string', example: 'snap-1727400000000' },
                  name: { type: 'string', example: 'Pre-Beat-5-Succession' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Database state restored' },
          '404': { description: 'Snapshot not found' },
        },
      },
    },
    '/admin/snapshot/{id}': {
      delete: {
        tags: ['Admin & State Snapshots'],
        summary: 'Delete saved state snapshot',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'snap-1727400000000' },
          },
        ],
        responses: {
          '200': { description: 'Snapshot deleted' },
          '404': { description: 'Snapshot not found' },
        },
      },
    },
  },
};
