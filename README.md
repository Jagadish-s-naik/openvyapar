# 🇮🇳 OpenVyapar: Unified Business Identity

> **Reimagining Digital Public Infrastructure for India's Business Owners**  
> *Track: Reinvent Digital Public Infrastructure For Billions — Build for Billions Hackathon*

---

## 📖 Architecture & Single Source of Truth
Please refer to [PRD.md](file:///home/shamblonaut/dev/openvyapar/PRD.md) as the single source of truth for all schemas, API contracts, and design rules.

---

## 🚀 Quickstart & Setup

### 1. Install & Build All Workspaces
```bash
# Install root and workspace dependencies
npm install

# Build shared types, backend, and agent service
npm run build

# Run all automated test suites
npm run test
```

### 2. Launch Services
| Service | Port | Command | Purpose |
|---|---|---|---|
| **Backend API & AI Agents** | `3001` | `npm run start:backend` | Core state, SQLite DB, HMAC signing, Mock issuers, and AI Agents (`/agent/*`) |
| **Owner Wallet UI** | `5173` | `npm run start:wallet` | Owner credential dashboard, selective proof generator, delegation panel |
| **Verifier Portal UI** | `5174` | `npm run start:verifier` | Lender/verifier proof inspection, cryptographic verification, tamper simulator |
| **CSC Onboarding UI**| `5175` | `npm run start:onboarding`| Zero-footprint conversational onboarding flow |

---

## 🎬 5-Beat Demo Walkthrough
See [`demo/script.md`](file:///home/shamblonaut/dev/openvyapar/demo/script.md) for the complete presentation narrative.

1. **Beat 1 (Zero-Footprint Onboarding)**: Open `http://localhost:5175` → Extract informal shop conversation into structured identity and self-attested starter credential.
2. **Beat 2 (Institutional Credential History)**: Open `http://localhost:5173` → Click *Time-Skip* to trigger Mock GSTN, State Bank of India, and BharatMart ONDC issuers.
3. **Beat 3 (Selective Disclosure Loan Proof)**: Generate selective proof with Consent Explainer AI → Inspect in Verifier Portal (`http://localhost:5174`) with live HMAC tamper detection.
4. **Beat 4 (Scoped CA Delegation)**: Request delegation in natural language → AI proposes minimal `file_returns` scope → Confirm & review immutable audit trail.
5. **Beat 5 (Multilingual & Succession)**: Toggle between **हिन्दी**, **ಕನ್ನಡ**, and **English** with seamless ownership continuity.

---

## 📁 Repository Structure
```
openvyapar/
├── shared/            # Single source of truth TypeScript types, constants & mock fixtures
├── backend/           # Express API, SQLite persistence, HMAC crypto engine, Mock Issuers & AI Agents (Port 3001)
├── frontend-wallet/   # Owner identity wallet & delegation management (Port 5173)
├── frontend-verifier/ # Verifier & underwriting portal (Port 5174)
├── frontend-onboarding/# Zero-footprint conversational onboarding UI (Port 5175)
├── demo/              # 5-Beat demo rehearsal script & database seeders
└── PRD.md             # Core product requirements & schema specification
```
