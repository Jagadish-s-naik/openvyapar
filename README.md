# 🇮🇳 OpenVyapar: Unified Business Identity

> **Reimagining Digital Public Infrastructure for India's Business Owners**  
> _Track: Reinvent Digital Public Infrastructure For Billions — Build for Billions Hackathon_

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

| Service                     | Port   | Command                  | Purpose                                                                                 |
| --------------------------- | ------ | ------------------------ | --------------------------------------------------------------------------------------- |
| **Backend API & AI Agents** | `3000` | `npm run start:backend`  | Core state, MongoDB persistence, HMAC signing, Mock issuers, and AI Agents (`/agent/*`) |
| **Unified Frontend App**    | `5173` | `npm run start:frontend` | Owner Wallet (`/`), Verifier Portal (`/verifier`), and CSC Onboarding (`/onboarding`)   |

---

### 🐳 Docker Compose (Full Stack: Frontend + Backend + MongoDB)

You can launch the complete containerized stack with a single command:

```bash
# Start Frontend (5173), Backend (3000), and Internal MongoDB
npm run docker:up

# View real-time container logs
npm run docker:logs

# Seed default baseline demo fixtures into containerized MongoDB
npm run docker:seed

# Stop services
npm run docker:down
```

| Container | Host Port | Internal Network Address | Description |
|---|---|---|---|
| **`openvyapar-frontend`** | `5173` | `http://localhost:5173` | Unified React SPA (Nginx) |
| **`openvyapar-backend`** | `3000` | `http://localhost:3000/health` | Express API & AI Agents |
| **`openvyapar-mongodb`** | _(Internal only)_ | `mongodb://mongodb:27017/openvyapar` | Isolated database instance |

#### Database Management via HTTP API:

- **Reset to Baseline**: `curl -X POST http://localhost:3000/admin/reset`
- **Reset to Empty**: `curl -X POST "http://localhost:3000/admin/reset?empty=true"`
- **Save State Snapshot**: `curl -X POST http://localhost:3000/admin/snapshot -H "Content-Type: application/json" -d '{"name": "demo-checkpoint"}'`
- **Restore Snapshot**: `curl -X POST http://localhost:3000/admin/restore -H "Content-Type: application/json" -d '{"name": "demo-checkpoint"}'`

---

## 🎬 5-Beat Demo Walkthrough

See [`demo/script.md`](file:///home/shamblonaut/dev/openvyapar/demo/script.md) for the complete presentation narrative.

1. **Beat 1 (Zero-Footprint Onboarding)**: Open `http://localhost:5173/onboarding` → Extract informal shop conversation into structured identity and self-attested starter credential.
2. **Beat 2 (Institutional Credential History)**: Open `http://localhost:5173/` → Click _Time-Skip_ to trigger Mock GSTN, State Bank of India, and BharatMart ONDC issuers.
3. **Beat 3 (Selective Disclosure Loan Proof)**: Generate selective proof with Consent Explainer AI → Inspect in Verifier Portal (`http://localhost:5173/verifier`) with live HMAC tamper detection.
4. **Beat 4 (Scoped CA Delegation)**: Request delegation in natural language → AI proposes minimal `file_returns` scope → Confirm & review immutable audit trail.
5. **Beat 5 (Multilingual & Succession)**: Toggle between **हिन्दी**, **ಕನ್ನಡ**, and **English** with seamless ownership continuity.

---

## 📁 Repository Structure

```
openvyapar/
├── shared/            # Single source of truth TypeScript types, constants & mock fixtures
├── backend/           # Express API, MongoDB persistence, HMAC crypto engine, Mock Issuers & AI Agents (Port 3000)
├── frontend/          # Unified React SPA: Wallet, Verifier & Onboarding (Port 5173)
├── demo/              # 5-Beat demo rehearsal script & database seeders
└── PRD.md             # Core product requirements & schema specification
```
