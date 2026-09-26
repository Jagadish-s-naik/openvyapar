# PRD: OpenVyapar Unified Business Identity — Reimagined DPI for Business Owners

**Hackathon:** Build for Billions
**Track:** Reinvent Digital Public Infrastructure For Billions
**Status:** Draft for 24-hour build — living document, edit in place

> This file is the single source of truth for every workstream. Any developer or AI coding agent working on this repo should read this file first. If your code contradicts this file, either the code is wrong or this file needs a PR — don't silently diverge.

---

## 1. Problem Statement

Business owners in India (especially small/informal ones) interact with a fragmented identity stack: separate, siloed credentials from government (GST, Udyam, licenses), banks, and platforms (marketplaces, aggregators). Each institution re-verifies the same facts from scratch. There is no way to:

- Carry a verified track record from one institution/platform to another.
- Delegate specific tasks (e.g. tax filing) to a CA/agent without handing over full account access.
- Preserve a business's identity and history across ownership succession (death, inheritance, partnership changes).
- Onboard a business with **zero existing digital footprint** into any of this.

**DigiLocker stores document copies tied to a person.** It does not model businesses as portable, verifiable, delegable entities in their own right. That is the gap this project reimagines.

## 2. Solution Summary

A **Business Identity Layer**: each business gets a persistent digital identity (a DID-style `business_id`) that is separate from any one owner. Verified institutions (government, banks, marketplaces) issue signed credentials to this identity over time. The owner can:

- Generate **selective-disclosure proofs** ("prove GST compliance" without exposing all documents) for a specific purpose (loan, platform onboarding).
- Grant **scoped, revocable delegation** to a CA/family member (e.g. "file returns only," not "view bank data").
- Transfer ownership on succession without losing accumulated credential history.
- Onboard from **zero digital footprint** via an agent-assisted flow (CSC agent or conversational voice/text), producing a self-attested/witnessed starter credential.

An **agentic layer** sits on top to make all of this usable by non-technical, low-literacy owners: explaining consent in plain language, proposing minimal delegation scopes from natural-language requests, and extracting structured onboarding data from unstructured conversation — but agents only ever **propose**; humans **confirm** every state-changing action.

## 3. Evaluation Criteria Alignment (keep front-of-mind, not just for judging)

| Criterion             | How this project addresses it                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Problem Relevance     | Fragmented identity + re-verification + password-sharing delegation are well-documented MSME pain points                   |
| Innovation            | Business-as-DID (not person-as-DID), scoped delegation, agent-mediated informed consent                                    |
| Impact & Inclusivity  | Zero-footprint onboarding flow is mandatory in the demo, not an afterthought — this is the differentiator                  |
| Technical Feasibility | Mocked issuers + real data model + real selective disclosure logic; crypto is simplified (HMAC-signed), not full DID/VC/ZK |
| Scalability           | Federation across states/departments via one open credential-issuance API contract (storyboarded, not fully built)         |
| User Experience       | Agent-explained consent, plain-language delegation, multilingual labels on key screens                                     |
| Track Alignment       | Directly hits digital identity, consent/data exchange, interoperability — explicitly framed as _reimagining_ existing DPI  |

## 4. Non-Goals (say this explicitly to judges — don't overclaim)

- No real government API integration (GST/Udyam/bank are mocked services in this repo).
- No production-grade cryptography (DID/VC standards, zero-knowledge proofs) — signing is simplified (HMAC or basic keypair) and flagged as future work.
- No real federation across states — represented as a single open API contract + one slide, not multiple working state integrations.
- Agents never execute state-changing actions autonomously — every credential issuance, delegation grant/revoke, ownership transfer requires explicit human confirmation, logged in `audit_log`.

## 5. Personas

- **Owner** — the business owner, possibly low-literacy, possibly zero digital footprint.
- **Delegate** — a CA, family member, or employee granted scoped access.
- **Successor** — inherits/takes over the business identity.
- **Issuer** — government/bank/marketplace system issuing credentials (mocked).
- **Verifier** — a lender or platform receiving a shared proof.
- **CSC Agent** — a human field agent assisting zero-footprint onboarding.

## 6. Five-Beat Demo Narrative

This is what actually gets scored — build to this story, not to a feature list.

1. A shop owner with no digital footprint is onboarded via a CSC agent (conversational, agent-assisted) → gets first ("self-attested") credential.
2. Time-skip: GST, bank, and marketplace mock issuers each issue a credential to the same `business_id`.
3. Owner needs a loan → generates a scoped proof (only GST compliance + order history disclosed) → lender/Verifier View checks it, agent flags any anomaly (e.g. a closure/reopening gap).
4. Owner says "I want my CA to file my taxes" in plain language → Delegation Scoping Agent proposes `file_returns`-only scope → owner confirms → audit log shows the action → owner revokes it.
5. _(Optional, if time allows)_ Owner transfers ownership to their daughter → identity and credential history persist, old owner becomes `former_owner`.

---

## 7. Data Schema

Single source of truth. All services and UIs must conform to these shapes. If a field needs to change, update this file first, then propagate.

### `business`

```json
{
  "business_id": "did:biz:abc123",
  "name": "Sharma General Store",
  "status": "active | frozen | closed",
  "created_at": "timestamp",
  "primary_language": "hi | kn | en | ...",
  "metadata": { "sector": "retail", "location": "string" }
}
```

### `person`

```json
{
  "person_id": "did:person:xyz789",
  "name": "string",
  "contact": { "phone": "string" },
  "auth_ref": "mock_auth_token"
}
```

### `business_role`

Link table — models ownership, partnership, succession, and delegation as one mechanism.

```json
{
  "role_id": "uuid",
  "business_id": "did:biz:abc123",
  "person_id": "did:person:xyz789",
  "role_type": "owner | partner | successor | delegate",
  "status": "active | revoked | former",
  "granted_at": "timestamp",
  "revoked_at": "timestamp | null"
}
```

### `credential`

Issued by GST/bank/marketplace mocks, or `agent_witnessed` for zero-footprint onboarding.

```json
{
  "credential_id": "uuid",
  "business_id": "did:biz:abc123",
  "issuer": "gst_mock | bank_mock | marketplace_mock | agent_witnessed",
  "type": "gst_compliant | filing_history | income_bracket | order_history | self_attested",
  "claim": { "...": "issuer-specific payload" },
  "issued_at": "timestamp",
  "expires_at": "timestamp | null",
  "signature": "hmac_or_keypair_signature",
  "status": "valid | revoked"
}
```

### `delegation_token`

Scoped permission — separate from `business_role` because it carries _action scopes_, not identity roles.

```json
{
  "token_id": "uuid",
  "business_id": "did:biz:abc123",
  "delegate_person_id": "did:person:ca001",
  "scopes": ["file_returns"],
  "granted_by": "did:person:owner001",
  "status": "active | revoked",
  "created_at": "timestamp",
  "expires_at": "timestamp | null"
}
```

### `proof_share`

The selective-disclosure artifact.

```json
{
  "proof_id": "uuid",
  "business_id": "did:biz:abc123",
  "purpose": "loan_application | platform_onboarding",
  "disclosed_credential_ids": ["uuid1", "uuid2"],
  "shared_with": "verifier_name",
  "generated_at": "timestamp",
  "link_or_qr": "url_token",
  "verification_status": "valid | tampered | expired"
}
```

### `audit_log`

Every state-changing action, human or agent-proposed-then-confirmed.

```json
{
  "log_id": "uuid",
  "business_id": "did:biz:abc123",
  "actor_type": "owner | delegate | agent_suggestion | issuer",
  "actor_id": "string",
  "action": "issue_credential | revoke_token | generate_proof | transfer_ownership | ...",
  "confirmed_by_human": true,
  "timestamp": "timestamp"
}
```

### `agent_action`

Agent suggestions, logged separately from executed actions — lets the demo show "proposed vs. confirmed."

```json
{
  "agent_action_id": "uuid",
  "business_id": "did:biz:abc123",
  "agent_type": "onboarding | consent_explainer | delegation_scoping | compliance_nudge | verifier_trust",
  "input_summary": "string",
  "proposed_action": { "...": "e.g. proposed scope list" },
  "human_decision": "confirmed | edited | rejected | pending"
}
```

---

## 8. API Contract

Everyone builds against this table from Hour 0. Frontend/agent devs use hardcoded mocks matching these shapes until the real backend is ready — nobody blocks on anybody.

| Endpoint                    | Method     | Owned by                              | Consumed by              |
| --------------------------- | ---------- | ------------------------------------- | ------------------------ |
| `/business`                 | POST / GET | Backend Lead                          | everyone                 |
| `/business/:id/roles`       | POST / GET | Backend Lead                          | Wallet UI, Onboarding UI |
| `/credentials/issue`        | POST       | Backend Lead (mock issuers call this) | Wallet UI                |
| `/credentials/:business_id` | GET        | Backend Lead                          | Wallet UI, Verifier UI   |
| `/delegation/grant`         | POST       | Backend Lead                          | Wallet UI, Agent service |
| `/delegation/revoke`        | POST       | Backend Lead                          | Wallet UI                |
| `/proof/generate`           | POST       | Backend Lead                          | Wallet UI, Agent service |
| `/proof/verify/:proof_id`   | GET        | Backend Lead                          | Verifier UI              |
| `/agent/consent-explain`    | POST       | Agent Lead                            | Wallet UI                |
| `/agent/scope-suggest`      | POST       | Agent Lead                            | Wallet UI                |
| `/agent/onboard-extract`    | POST       | Agent Lead                            | Onboarding UI            |
| `/agent/verifier-flag`      | POST       | Agent Lead                            | Verifier UI              |

**Guardrail baked into the contract:** none of the `/agent/*` endpoints write to `business`, `credential`, `business_role`, or `delegation_token` tables directly. They only write to `agent_action` with `human_decision: "pending"`. A separate confirmed action from the owner (via the normal endpoints above) is what actually mutates state, and that confirmed action references the `agent_action_id` it originated from.

---

## 9. Repo Structure

```
/backend
  /routes         business.js, credentials.js, delegation.js, proof.js
  /db             schema.sql, seed.js
  /mocks          gst_issuer.js, bank_issuer.js, marketplace_issuer.js
/agent-service
  /prompts        consent_explainer.md, scope_suggester.md, onboarding_extractor.md, verifier_flagger.md
  /routes         agent endpoints, LLM calls
/frontend-wallet        owner dashboard: credentials, generate proof, delegation panel
/frontend-verifier       verifier view: receive proof, see agent flag
/frontend-onboarding     zero-footprint conversational onboarding + agent/CSC flow
/shared
  /types          this schema, as shared TS interfaces or JSON Schema — single source of truth
  /mock-data      sample businesses/credentials/tokens everyone tests against
/demo
  /script.md      the five-beat narrative, rehearsed
  /seed-demo.js   pre-populates a demo business with a nice history for beat 2
PRD.md            this file
```

**Rule:** everyone imports types from `/shared/types`, never redefines them locally. If the schema changes mid-hackathon, it changes in this file and in `/shared/types` together, in the same PR.

---

## 10. Roles & Ownership

| Role                              | Owns                                                                              | Builds against                                              | Starts by                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Backend / Identity Lead**       | `/backend` — schema, business/credential/delegation/proof endpoints, mock issuers | Nothing (others depend on them)                             | Hour 0 — ship stub endpoints (static JSON) within the first hour so nobody is blocked |
| **Wallet UI Lead**                | `/frontend-wallet`                                                                | Mocked backend + mocked agent responses                     | Hour 1                                                                                |
| **Verifier + Onboarding UI Lead** | `/frontend-verifier`, `/frontend-onboarding`                                      | Mocked backend + mocked agent responses                     | Hour 1                                                                                |
| **Agent / AI Lead**               | `/agent-service` — all 4 LLM endpoints, prompt design                             | `/shared/types` + `/shared/mock-data`, not the real backend | Hour 1                                                                                |
| **Integration / Demo Lead**       | `/demo`, seed data, final integration, narrative rehearsal                        | Everyone's output                                           | Ramps up hour 14+, drives hours 18–24                                                 |

If the team is 4 people, fold Integration/Demo duties into whoever finishes their piece first.

---

## 11. Build Timeline (24 hours)

| Hours | Focus                                                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0–1   | **Hard sync point.** Whole team agrees on this schema + API contract together. Lock `/shared/types`.                                |
| 1–14  | Fully parallel build against mocks. Backend ships real endpoints progressively; everyone else stays on mocks matching the contract. |
| 14–18 | Swap mocks for real endpoints one at a time — Wallet UI first (it's the demo's spine). Fix contract mismatches as found.            |
| 18–21 | Full integration pass. One driver, others fix bugs live.                                                                            |
| 21–24 | Rehearse the five-beat demo script. No new features after hour 21.                                                                  |

---

## 12. Agentic Layer — Design Rules

**Core rule: agents read, draft, explain, and recommend. They never unilaterally execute a state-changing action.** Every credential issuance, delegation grant/revoke, and ownership transfer requires explicit human confirmation, recorded in `audit_log` with `confirmed_by_human: true`.

| Agent                    | Trigger                                             | Sees                                                 | Proposes                                                              | Human confirms                                               |
| ------------------------ | --------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| Onboarding Agent         | Zero-footprint business signup                      | Owner's free-text/voice description                  | Structured `business` + starter `credential` (`self_attested`) fields | Owner/CSC agent confirms before `business` record is created |
| Consent Explainer Agent  | Owner about to generate a proof                     | The `credential` set being considered for disclosure | Plain-language explanation of what will/won't be shared               | Owner confirms before `/proof/generate` is called            |
| Delegation Scoping Agent | Owner describes a delegate's task in plain language | Owner's natural-language request                     | Minimal `scopes` array (least privilege)                              | Owner confirms/edits before `/delegation/grant` is called    |
| Compliance Nudge Agent   | Scheduled/simulated check against credential state  | `credential` expiry/filing-due metadata              | A nudge message (e.g. "GST return due in 5 days")                     | No state change — informational only                         |
| Verifier Trust Agent     | Verifier opens a shared proof                       | `credential` timestamps + `business.status` history  | A plain-language anomaly flag (e.g. reopening gap)                    | No state change — informational only                         |

All agent outputs are written to `agent_action` with `human_decision: "pending"` first; only after human confirmation does the corresponding real endpoint get called and `human_decision` update to `confirmed` (or `edited` / `rejected`).

Every agent should default to the business's `primary_language`.

---

## 13. Known Edge Cases (acknowledge, don't hide)

- **Multi-owner disagreement** — no quorum/multi-sig logic built; out of scope, mention as future work.
- **Death with no nominated successor** — falls back to `status: frozen` until resolved outside the system; not automated here.
- **Business closes and reopens** — Verifier Trust Agent flags the gap rather than silently trusting continuous history.
- **Identity theft at root issuance** — explicitly named as the hardest unsolved problem; the mocked issuers assume trustworthy first-credential issuance.
- **Compromised/malicious delegate** — scoping limits blast radius, doesn't guarantee correctness; audit log is the mitigation, not prevention.
- **Revocation lag** — revocation prevents _future_ use of a token; it does not roll back already-submitted actions.
- **Selective disclosure re-identification** — real ZK-proofs would solve this; flagged as future work, not solved in this build.
- **Fully informal, zero-record business** — this is exactly what the Onboarding Agent + `self_attested`/`agent_witnessed` credential type is for; do not skip this in the demo.
- **No smartphone / feature phone** — IVR/SMS is storyboarded as a future access channel, not fully built in 24 hours; say so plainly.

---

## 14. Open Questions / TODO

- [ ] Finalize signature mechanism: shared-secret HMAC per issuer vs. simple keypair.
- [ ] Decide how far to build the zero-footprint onboarding conversational UI vs. storyboard it.
- [ ] Confirm which 1–2 screens get multilingual toggles for the demo.
- [ ] Decide if succession/transfer demo (beat 5) is in scope given time remaining at hour 14 checkpoint.
