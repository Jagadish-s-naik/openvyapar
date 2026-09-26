# 🎬 OpenVyapar: 5-Beat Demo Narrative Script

This script walks through the **5-Beat Demo Narrative** defined in **PRD §6**. Build and present to this exact storyline.

---

### **Beat 1: Zero-Footprint Onboarding (The Differentiator)**
- **Persona**: Ramesh Sharma (Proprietor) assisted by Aarav Patel (CSC Field VLE Agent).
- **Action**:
  1. Open `http://localhost:5173/onboarding` (CSC Onboarding Portal).
  2. Click the sample transcript: *"नमस्ते, मेरा नाम रमेश शर्मा है। गोदौलिया वाराणसी में 'शर्मा जनरल स्टोर' नाम से 2018 से किराना की दुकान है..."*
  3. Click **Extract Structured Business & Starter Credential**.
  4. Notice the AI Onboarding Agent extracts shop name, sector, location, and generates a `self_attested` credential claim witnessed by CSC Agent `did:person:csc001`.
  5. Click **Owner & Agent Confirm → Register Business**.
  6. Explain to judges: *“DigiLocker requires existing documents tied to a person. OpenVyapar lets an informal shop with ZERO digital trail bootstrap a verifiable business identity.”*

---

### **Beat 2: Time-Skip — Verified Institutional History Accumulates**
- **Persona**: Ramesh Sharma (Owner).
- **Action**:
  1. Open `http://localhost:5173` (Owner Wallet).
  2. Click **Time-Skip (Issue Batch)**.
  3. Refresh credentials to show:
     - **Mock GSTN**: 98/100 compliance score and on-time filing history.
     - **State Bank of India**: Turnover bracket INR 25L–50L and current account standing.
     - **BharatMart (ONDC)**: 1,420 completed orders and 4.8 customer satisfaction rating.
  4. Explain to judges: *“Over time, government, banks, and open e-commerce networks issue signed HMAC credentials to the persistent `business_id`, building portable business reputation.”*

---

### **Beat 3: Loan Application via Selective Disclosure Proof**
- **Persona**: Ramesh Sharma (Owner) applying for working capital loan with Viksit Capital.
- **Action**:
  1. In Owner Wallet, click **Generate Selective Proof**.
  2. Select **GST Compliance** and **Marketplace Order History**, leaving Bank statement unchecked.
  3. Click **Explain Consent in Plain Language**.
  4. The AI Consent Explainer clearly contrasts in Hindi/English:
     - *Shared*: GST compliance score and 1,420 orders track record.
     - *Protected/Withheld*: Full bank statements, line-item margins, customer names.
  5. Click **Confirm & Generate QR Proof**.
  6. Click **Open in Verifier Portal** (`http://localhost:5173/verifier?proof_id=...`).
  7. Show the **Valid HMAC** verification chip and AI Trust narrative.
  8. Click **Simulate Tampering** to demonstrate live cryptographic signature rejection if turnover is altered!

---

### **Beat 4: Scoped, Revocable Delegation to Chartered Accountant**
- **Persona**: Ramesh Sharma delegating to CA Vikas Mehta.
- **Action**:
  1. In Owner Wallet, enter natural language instruction: *"I want my CA Vikas Mehta to file my taxes and check returns"*.
  2. Click **AI: Propose Minimal Scopes**.
  3. The Delegation Scoping Agent proposes `['file_returns', 'view_compliance']` and explicitly states: *“Least privilege protection: Bank account and loan permissions are withheld.”*
  4. Click **Confirm & Grant**.
  5. Scroll to the **Immutable Audit Trail** to show the recorded human-confirmed action.
  6. Click **Revoke Access** to demonstrate instant permission cutoff without password sharing.

---

### **Beat 5: Ownership Succession & Multi-Language Inclusivity**
- **Persona**: Transferring shop management to daughter Priya Sharma (`did:person:priya001`).
- **Action**:
  1. Demonstrate the live language toggle across **हिन्दी (Hindi)**, **ಕನ್ನಡ (Kannada)**, and **English**.
  2. Explain: *“When succession occurs, the `business_id` and all accumulated credentials persist unbroken, preserving the business reputation across generations.”*
