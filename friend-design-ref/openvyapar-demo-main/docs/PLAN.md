# PLAN.md — OpenVyapar Prototype Build Plan

## 0. Context

**OpenVyapar** is a Digital Public Infrastructure (DPI) concept for small businesses: a portable Business ID, reusable verifiable credentials, and a consent layer that lets multiple independent services (banks, marketplaces, government schemes) securely request access to a business's verified data — with an AI agent acting only as a thin interface on top, never as the product itself.

This document plans a **front-end-only React prototype** built in a few hours, submitted alongside (and secondary to) a pitch deck for hackathon selection. The prototype's only job is to demonstrate that the team can execute the architecture — it does not need to carry the pitch on its own, does not need a backend, and does not need to be explored unsupervised by a judge under time pressure. It should look and feel like a real product: a navigable app with persistent state, not a guided slideshow.

**Design mandate for this build:** every screen should contain only what a business owner actually needs at that moment. No decorative cards, no stat that isn't wired to a real interaction elsewhere in the app, no page that exists just to look full. If a page feels sparse, that's correct — DPI is meant to feel like plumbing, not a dashboard trying to prove its own busyness.

---

## 1. Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** for styling
- **Framer Motion** for transitions — used sparingly (see §5)
- **Zustand** for state — one small store
- **React Router** — real independent pages, not a screen index

---

## 2. Information architecture

```
┌───────────────────────────────────────────────────────┐
│  [Business ID badge]                [Lang]   [🔔 2]     │
├───────────────┬─────────────────────────────────────────┤
│  Dashboard     │                                          │
│  Identity      │             Page content                 │
│  Credentials   │                                          │
│  Consent       │                                          │
│  Audit Log     │                                          │
│  Connected     │                                          │
│  Settings      │                                          │
└───────────────┴─────────────────────────────────────────┘
                                        [AI assistant — floating, bottom right]
```

Sidebar items are the only navigation. No breadcrumbs, no secondary tab bars layered on top of the sidebar — one navigation system, used consistently.

---

## 3. Pages, with explicit layout discipline

Each page below lists **what's primary** (the one thing a visitor's eye should land on), **what's secondary** (present but visually quieter), and **what to leave out** (cut, even if it would "fill space").

### 3.1 Dashboard (`/`)

- **Primary:** one identity status line — "Verified · Business ID: OV-4471" with the QR thumbnail. This is the single most important fact on the page; it gets the most visual weight.
- **Secondary:** a short list — not cards — of active consents (max 3, "view all" link if more) and the 2 most recent audit events. Use plain rows, not bordered/shadowed cards; a dashboard with six boxed cards reads as noise, not information.
- **Leave out:** no charts, no fake usage statistics, no "3 new opportunities" style engagement bait. Nothing that wouldn't exist in a real infrastructure dashboard.

### 3.2 Identity (`/identity`)

- **Primary:** business name, Business ID, and QR code — large, centered or left-anchored as the page's visual anchor.
- **Secondary:** verification sources (Udyam ✓, GST ✓) as a short inline list, not a card grid.
- **Leave out:** don't invent extra "identity strength" meters or gamified completeness bars — they don't correspond to anything real in the concept and just add clutter.

### 3.3 Credentials (`/credentials`)

- **Primary:** the credential cards themselves — this is the one page where a card grid is earned, because each card _is_ a discrete, real object (a credential). Keep the grid to 2 columns max on desktop so cards stay legible, not shrunk to fit density.
- **Secondary:** status badge (active/expired/revoked) and a single "Share" action per card. Resist adding more than one action per card — a card with 4 icon buttons is clutter.
- **Leave out:** no credential "scores," no upsell prompts to add more credential types.

### 3.4 Consent Requests (`/consents`)

- **Primary:** the Pending tab, shown by default if anything is pending — a judge or owner should see the thing needing action first, not have to click a tab to find it.
- **Secondary:** Active and History as tabs, collapsed until selected. Each row: requester, purpose, data items, duration — in that reading order, since purpose is the fact that matters most for a consent decision.
- **Leave out:** don't show raw JSON or technical consent IDs in the primary UI — keep the technical shape (from the state model) in the data layer, and show only human-readable purpose/scope/duration on screen.

### 3.5 Audit Log (`/audit`)

- **Primary:** a simple reverse-chronological table — actor, action, purpose, timestamp. Four columns, no more.
- **Secondary:** a filter by service, collapsed into a single dropdown, not a bank of filter chips.
- **Leave out:** no analytics, no "trends over time" chart. The audit log's job is legibility of individual events, not visualization.

### 3.6 Connected Services (`/services`)

- **Primary:** 2–3 service cards (Loan App, Marketplace, Govt Scheme Portal), each showing what it currently has access to, in plain language ("Can view: GST Compliance credential, since Sep 20").
- **Secondary:** a "Connect a new service" action, visually quieter than the existing connections — the point of this page is what's already interoperating, not a directory to browse.
- **Leave out:** no fake ratings, install counts, or marketplace-style merchandising — that framing undercuts the "infrastructure, not app store" pitch.

### 3.7 Settings (`/settings`)

- **Primary:** language selector (EN/HI/KN) — the one setting that's actually thematically relevant.
- **Leave out:** don't build out unrelated settings (notifications, theme, account deletion) just to make the page feel complete. A short settings page is correct; a padded one is worse than no page at all — consider cutting this page entirely and moving the language toggle into the top bar if time is short.

### 3.8 AI Assistant (global floating panel)

- **Primary:** a single input + 2–3 suggested prompts. Opens a slide-in panel, not a new page — it should feel like a layer over the app, not a destination.
- **Behavior:** typing/tapping a prompt should navigate the user _into_ the relevant existing page (e.g., Consent Requests, pre-filled) rather than resolving everything inside the chat panel itself. This is the clearest possible way to show "AI is the interface, not the product" — the assistant visibly hands off to the same UI a human would use.
- **Leave out:** no persistent chat history sidebar, no avatar, no "typing..." simulated delay — keep it functional, not chatbot-flavored.

---

## 4. State model

```ts
type Credential = {
  id: string;
  type: string;
  issuer: string;
  issuedOn: string;
  expiresOn: string;
  status: "active" | "revoked" | "expired";
};

type Consent = {
  id: string;
  requestedBy: string;
  purpose: string;
  dataItems: string[];
  status: "pending" | "approved" | "denied" | "revoked";
  grantedAt?: string;
  expiresAt?: string;
};

type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  consentId: string;
  timestamp: string;
};

type ConnectedService = {
  id: string;
  name: string;
  accentColor: string;
  connectedSince?: string;
  accessScope: string[];
};

type AppState = {
  businessId: string;
  businessName: string;
  credentials: Credential[];
  consents: Consent[];
  auditLog: AuditEvent[];
  connectedServices: ConnectedService[];
  approveConsent: (id: string) => void;
  denyConsent: (id: string) => void;
  revokeConsent: (id: string) => void; // must push a new auditLog entry
  connectService: (id: string) => void; // opens consent modal, updates connectedServices on approval
};
```

Seed: 2 credentials, 1 approved consent, 1 pending consent, 3–4 audit events, 2 pre-connected services. Enough to make every page non-empty on first load, not so much that any list needs scrolling to prove its point.

---

## 5. Visual design

- **Palette/type:** carry over the pitch deck's system — navy/rail-blue base, gold accent, serif display + sans body — so the submission reads as one piece of work.
- **Spacing over borders:** prefer generous whitespace and alignment to separate content, rather than boxing everything in bordered cards. Reserve borders/shadows for genuinely card-like objects (credentials, service tiles) — not for grouping text that could just be spaced apart.
- **One accent per context:** the base app uses the primary palette throughout; only the Connected Services page introduces a second accent per service card, and only there — that contrast is meaningful because it's rare.
- **Motion budget:** page transitions (fade/slide), one micro-interaction on consent approve/revoke, one on a new audit row appearing. Nothing else animates. Sidebar navigation itself is instant, no transition delay.

---

## 6. Build order (few-hour sprint)

- [x] 1. Scaffold Vite + Tailwind + Zustand + React Router; shell with sidebar + top bar (45 min)
- [x] 2. Seed data + store; Dashboard page (30 min)
- [x] 3. Identity + Credentials pages (45 min)
- [x] 4. Consent modal (shared component) + Consent Requests page (60 min)
- [x] 5. Audit Log page, wired to live-update on revoke (30 min)
- [x] 6. Connected Services page, 2–3 distinct-themed cards (45 min)
- [x] 7. AI assistant floating panel, wired to hand off into Consent Requests (30 min)
- [x] 8. Responsive + polish pass (30 min)

**Cut order if time runs short:** Settings page first, then the AI assistant panel. Never cut Consent Requests, Audit Log, or Connected Services — together they are the entire DPI argument this prototype exists to prove.

---

## 7. What not to build

- No real auth, login wall, or routing guards.
- No real AI model call — a keyword-matched suggested-prompt list is sufficient.
- No persistence beyond session state — a refresh resetting to seed data is acceptable.
- No content or component added purely to make a page look fuller. Every element must be wired to a real interaction or a real fact from the state model.
