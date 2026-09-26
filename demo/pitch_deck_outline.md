# 🎯 OpenVyapar Pitch Deck Outline — Build for Billions

**Track:** Reinvent Digital Public Infrastructure For Billions  
**Team:** OpenVyapar  

---

### **Slide 1: The Problem — The Missing "Business Identity" DPI**
- **The Gap**: In India, DigiLocker stores document copies tied to individual citizens. But businesses interact with a fragmented identity stack: separate GST, Udyam, trade licenses, bank accounts, and e-commerce seller profiles.
- **The Pain**:
  1. *Repetitive Verification*: Every lender and platform re-verifies the same facts from scratch.
  2. *Insecure Delegation*: Owners share passwords and master credentials with CAs and employees.
  3. *Lost Track Record on Succession*: When a patriarch retires, decades of credit and business trust vanish.
  4. *Zero-Footprint Exclusion*: Millions of informal micro-enterprises cannot enter the formal DPI fold.

---

### **Slide 2: The Solution — Unified Business Identity Layer**
- **Business-as-DID (`did:biz:...`)**: Decouples business identity from any single proprietor.
- **Verifiable Institutional History**: GSTN, Banks, and Open Marketplaces (ONDC) issue tamper-evident credentials to the persistent business DID.
- **Selective Disclosure Proofs**: Prove creditworthiness without exposing full bank telemetry or supplier lists.
- **Scoped, Revocable Delegation**: Give CAs `file_returns` authority without handing over bank keys.
- **Reputation Continuity**: Ownership transfers across generations while preserving accumulated ratings and history.

---

### **Slide 3: The 5-Beat Live Demo**
| Beat | Action Shown | DPI Innovation |
|---|---|---|
| **Beat 1** | Zero-Footprint Onboarding via CSC Agent | Conversational AI generates self-attested starter credential for informal shop |
| **Beat 2** | Multi-Issuer Time-Skip | GST, Bank, and BharatMart ONDC credentials attached to single `business_id` |
| **Beat 3** | Selective Disclosure for MSME Loan | Plain-language Consent AI + Live HMAC tamper-detection test |
| **Beat 4** | Scoped CA Delegation | Natural language request $\rightarrow$ AI proposes minimal `file_returns` scope $\rightarrow$ Confirm & Revoke |
| **Beat 5** | Ownership Succession | Transfer to daughter Priya $\rightarrow$ Identity & 4 accumulated credentials persist unbroken |

---

### **Slide 4: The Agentic Layer — Safety & Informed Consent**
- **Agents Only Propose; Humans Confirm**:
  - None of our AI agent endpoints directly alter database state.
  - Every action is logged in `agent_action` (`human_decision: "pending"`) and requires explicit owner confirmation logged in an immutable `audit_log`.
- **Multilingual By Default**: Complete voice and text assistance in **हिन्दी (Hindi)**, **ಕನ್ನಡ (Kannada)**, and **English**.

---

### **Slide 5: Architectural Feasibility & Future Roadmap**
- **Built Today**:
  - Working Express + SQLite relational identity layer on Port 3001.
  - HMAC-SHA256 cryptographic verification & tamper detection.
  - Unified responsive React SPA (Owner Wallet, Verifier Portal, CSC Onboarding) on Port 5173.
  - 4 AI agent engines for extraction, consent, least-privilege scoping, and anomaly flags.
- **Future Roadmap**:
  - Full W3C DID/VC and Zero-Knowledge Proof (ZKP) selective disclosure standard.
  - Federation across state tax portals & national Udyam registries via the OpenVyapar API contract.
