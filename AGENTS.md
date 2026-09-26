# 🤖 OpenVyapar: Agent Guidelines & Repository Rulebook (AGENTS.md)

> **Repository:** `OpenVyapar — Unified Business Identity (DPI for Business Owners)`  
> **Track:** Reinvent Digital Public Infrastructure For Billions — Build for Billions Hackathon  
> **Single Source of Truth:** Read [`PRD.md`](file:///home/shamblonaut/dev/openvyapar/PRD.md) and this file before writing code.

---

## 1. Architectural Map & Responsibilities

| Workspace | Directory | Port | Primary Purpose & Tech |
|---|---|---|---|
| `@openvyapar/shared` | [`shared/`](file:///home/shamblonaut/dev/openvyapar/shared/) | — | **Single Source of Truth**: TypeScript schemas, DTOs, constants, and demo fixtures. |
| `@openvyapar/backend` | [`backend/`](file:///home/shamblonaut/dev/openvyapar/backend/) | `3001` | Express API, SQLite persistence, HMAC crypto signing, Mock Issuers (GSTN, Bank, ONDC), and AI Agents (`/agent/*`). |
| `@openvyapar/frontend` | [`frontend/`](file:///home/shamblonaut/dev/openvyapar/frontend/) | `5173` | Unified React SPA: Owner Wallet (`/`), Verifier Portal (`/verifier`), and CSC AI Onboarding (`/onboarding`). |
| `demo` | [`demo/`](file:///home/shamblonaut/dev/openvyapar/demo/) | — | 5-Beat demo rehearsal script, state seeders, and automated narrative CLI runner. |

---

## 2. Non-Negotiable Core Invariants & Guardrails

### 🛡️ Guardrail 1: Agents Only Propose; Humans Confirm (PRD §8 & §12)
- **Rule**: No endpoint in `/agent/*` may ever directly create, update, or delete records in `business`, `credential`, `business_role`, or `delegation_token`.
- **Mechanism**: Agent endpoints write proposals to `agent_action` with `human_decision: "pending"` and return an `agent_action_id`.
- **State Mutation**: The user reviews the proposal and explicitly clicks "Confirm & Sign", which triggers the real mutation endpoint referencing the `agent_action_id` and records `confirmed_by_human: true` in `audit_log`.

### 📦 Guardrail 2: Single Source of Truth for Types
- **Rule**: NEVER redefine interfaces (`Business`, `Credential`, `DelegationToken`, `ProofShare`, etc.) locally inside sub-packages.
- **Mechanism**: Always import from `@openvyapar/shared`. If a schema change is required, update [`PRD.md`](file:///home/shamblonaut/dev/openvyapar/PRD.md) §7, update `shared/src/types/`, and run `npm run build` in the shared workspace first.

### 🔒 Guardrail 3: Cryptographic Integrity & HMAC Signing
- **Rule**: All credentials must carry an authentic HMAC-SHA256 signature generated via `signCredential()` in [`backend/src/utils/crypto.ts`](file:///home/shamblonaut/dev/openvyapar/backend/src/utils/crypto.ts).
- **Verification**: Verifiers must canonicalize the payload and verify the HMAC signature before accepting any proof. Tampered payloads must be rejected immediately.

---

## 3. Workstream Playbooks for Subagents

### 👨‍💻 Workstream A: Backend & AI Agents Lead (`/backend`)
- **Key Responsibilities**:
  - Implement endpoints strictly matching [PRD.md](file:///home/shamblonaut/dev/openvyapar/PRD.md) §8.
  - Maintain SQLite schema (`backend/src/db/schema.sql`) and ensure ACID state persistence in `backend/data/`.
  - Ensure mock issuers (`gst_issuer.ts`, `bank_issuer.ts`, `marketplace_issuer.ts`) generate authentic signed credentials.
  - Maintain system prompts in `backend/prompts/` and engine in `backend/src/agents/engine/`.
  - Ensure Onboarding Agent (`/agent/onboard-extract`) parses unstructured Hindi, Kannada, and English transcripts into valid starter claims.
  - Ensure Consent Explainer (`/agent/consent-explain`) explicitly contrasts shared vs. withheld data.
  - Enforce least-privilege scoping in Scoping Agent (`/agent/scope-suggest`) so that tax requests never leak banking or loan permissions.
- **Verification**: Run `npm --workspace=backend run test`.

### 🎨 Workstream C: Frontend & Full UI Experience Lead (`/frontend`)
- **Key Responsibilities**:
  - **Owner Wallet Dashboard (`/frontend` - Port 5173 - `/`)**:
    - Credential viewer with issuer badges and HMAC verification status for `did:biz:sharma001`.
    - Selective-disclosure modal connecting to `/agent/consent-explain` and `/proof/generate`.
    - Delegation panel connecting to `/agent/scope-suggest` and `/delegation/grant` / `/delegation/revoke`.
    - Ownership succession panel for Beat 5 (Ramesh $\rightarrow$ Priya Sharma).
    - Multilingual language toggle (Hindi `hi`, Kannada `kn`, English `en`).
  - **Verifier & Underwriting Portal (`/frontend` - Port 5173 - `/verifier`)**:
    - Proof resolver by URL param (`?proof_id=...`).
    - Cryptographic HMAC status banner (`VALID` vs `TAMPERED`).
    - Interactive "Simulate Tampering" toggle to demonstrate live signature failure for judges.
    - AI trust & anomaly flags panel connected to `/agent/verifier-flag`.
  - **Zero-Footprint Onboarding UI (`/frontend` - Port 5173 - `/onboarding`)**:
    - Conversational chat/voice interface with sample transcript chips (Hindi Kirana, Hindi Chai Stall, English Handloom).
    - Side-by-side structured business metadata preview & starter `self_attested` credential.
    - Explicit human confirmation guardrail before `/business` record creation.
  - **Unified Navigation**: Top portal bar for 1-click switching across all 3 views.

### 🎬 Workstream D: Demo & Integration Lead (`/demo`)
- **Key Responsibilities**:
  - Rehearse and align with the 5-Beat narrative in [`demo/script.md`](file:///home/shamblonaut/dev/openvyapar/demo/script.md).
  - Ensure `npm run seed` instantly restores the demo state.
  - Validate the full narrative using `npm run test:demo`.

---

## 4. Developer & Agent Commands Reference

```bash
# 1. Install & Build
npm install
npm run build

# 2. Run All Automated Test Suites
npm run test

# 3. Run Automated 5-Beat Demo Simulation
npm run test:demo

# 4. Reset & Seed Database State
npm run seed

# 5. Start 2-Tier Stack Concurrently
npm run dev

# 6. Start Individual Tiers
npm run start:backend      # Port 3001 (Backend API + AI Agents)
npm run start:frontend     # Port 5173 (Unified React Frontend)
```

---

## 5. Coding Standards & Conventions

- **Language & Runtime**: TypeScript 5.8+ targeting ES2022 on Node.js 24 with native ESM.
- **Imports**: Use explicit relative file extensions in TypeScript ESM imports (e.g. `import { db } from './connection.js';`).
- **Style**: Format responses in GitHub-flavored markdown with clickable file links (e.g., `[filename](file:///path/to/file)`).
- **Error Handling**: Standardize API error responses with `{ success: false, error: { code, message, details } }`.
- **Multilingual Support**: Default primary language is Hindi (`hi`), with full UI and AI support for Kannada (`kn`) and English (`en`).
