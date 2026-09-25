# LawPilot

> **Understand. Verify. Act.**

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6) ![Tests](https://img.shields.io/badge/tests-268%20passing-brightgreen) ![Zero Auth](https://img.shields.io/badge/auth-none%20required-lightgrey)

**Live Demo:** [lawpilot-sepia.vercel.app](https://lawpilot-sepia.vercel.app/)

LawPilot turns dense legal documents and real-world legal situations into plain-English findings, evidence-backed legal context, and practical next steps — without requiring a law degree, an account, or a database.

---

## The Problem

Most people who need to understand a contract, lease, or workplace dispute face three real obstacles:

1. **Information asymmetry** — agreements are written in dense legal language that hides one-sided liabilities: broad non-competes, punitive liquidated-damages clauses, unilateral notice terms.
2. **Black-box AI risk** — generic chatbots produce fluent, confident-sounding answers that can fabricate statutes, misapply foreign law, or invent case citations with no way to check them.
3. **Inaction** — even after spotting a risky clause, most people don't know what to actually do next: what to ask HR, what to send a landlord, or how to prepare for a lawyer consultation efficiently.

## The Solution

LawPilot is a document-intelligence and legal-navigation tool built around three layers:

```
UNDERSTAND  →  Deconstructs a document into clauses, key dates, financial terms,
                and plain-English risk findings.

VERIFY      →  Connects every finding to a document quote, a legal source (where
                available), an explicit verification status, and named uncertainty.

ACT         →  Produces a reversible action checklist, negotiation questions, and
                a structured brief to make a lawyer consultation efficient.
                The Negotiation Copilot turns a material finding into a
                grounded, draft-for-review clause revision and message.
```

It is **not** a general-purpose legal chatbot and does not provide legal representation — see [Disclaimer](#disclaimer).

---

## What Makes LawPilot Different: The Evidence Chain

The core product primitive is the **Evidence Chain**, a visible, auditable trail behind every finding:

```
Finding → Document Evidence → Legal Source → Verification → Uncertainty → Practical Next Step
```

- **Document Evidence** — the exact clause text the finding is drawn from, with section and page reference. Findings are never allowed to quote text that isn't in the uploaded document.
- **Legal Source** — a curated statute, act section, or court precedent relevant to the finding's category (see [AI & Legal Grounding](#ai--legal-grounding) for how this is sourced and its limits).
- **Verification** — an explicit status (`verified`, `partially_verified`, `insufficient_context`, `conflicting`, `unsupported`) produced by a rule-based verification gate (`lib/ai/agents/verificationAgent.ts`), not just an LLM's self-reported confidence. A finding with no adequately-matched source is labeled `insufficient_context` rather than defaulting to "verified."
- **Uncertainty** — factual dependencies and unverified assumptions are stated explicitly (e.g. "assumes the stated governing law applies," "depends on documented actual training expenditure").
- **Practical Next Step** — a concrete, reversible action tied to that specific finding.

This chain is rendered in the UI (`components/evidence/`) as an inspectable, step-by-step artifact — not a paragraph of prose asserting a conclusion.

### How the Chain Is Enforced in Code

The Evidence Chain is a typed data structure (`EvidenceChain` in `types/index.ts`), not a display convention. Each chain carries the `finding`, its `documentEvidence` (quoted text, section, page), `legalClaims[]`, `legalSources[]`, a `verification` block, `uncertainties[]`, and `nextSteps[]`.

- **Claim-level support grading** — every `LegalClaim` links to specific `sourceIds` and carries a `supportLevel` (`direct` / `strong` / `partial` / `context_dependent` / `unsupported`). The verification gate (`lib/ai/agents/verificationAgent.ts`) downgrades a claim's support level when its source validation is downgraded, filters `unsupported` claims out of what the user sees, and flags conflicting indicators across cited sources (e.g. a strict prohibition vs. a reasonableness test) as `conflicting`.
- **Source validation** — `validateLegalSource` (`lib/safety/legalSourceValidator.ts`) rejects a source with a missing title, jurisdiction, or citation, an unknown source type, or a source type of `unverified` ("model internal knowledge alone cannot be treated as a verified legal authority").
- **Chain-level summary** — the gate counts unverified claims and conflicting-authority flags across all chains and reports them in the analysis's verification summary, rather than hiding them.
- **Document Passage sync** — on the Analysis Overview, each finding row has two sibling buttons: one syncs the Document Passage panel to that finding's exact clause text, the other opens the full finding detail. This makes it quick to check a finding against the source text.
- **Downstream reuse, never re-generation** — later features consume the chain rather than inventing their own authority. Ask LawPilot answers from the chains. The Lawyer Brief lists linked sources with their verification status. The [Negotiation Copilot](#negotiation-copilot) may only mention legal sources already present, and verified or partially verified, in the finding's chain (see below).

---

## Core Features

| Feature | Where | What it does |
|---|---|---|
| **Document Analysis** | `/review` → `/analysis/[id]` | Upload a PDF/DOCX/TXT agreement; extracts clauses, parties, key dates, and financial terms. |
| **Risk & Clause Findings** | Analysis → Overview tab | Prioritized findings (`critical_attention` / `high_attention` / `review` / `informational`) for one-sided or high-risk clauses. |
| **Evidence Chain** | Analysis → Finding detail / `SplitEvidenceView` | The finding → evidence → source → verification → uncertainty → next-step chain described above, per finding. |
| **Ask LawPilot** | Analysis → Ask tab | Grounded Q&A scoped strictly to the uploaded document and its evidence chains, with citations, an explicit "what would change this answer" field, and follow-up questions. |
| **Compare Documents** | `/compare` | Semantic diff between two contract drafts — added / removed / modified / moved / unchanged clauses, with materiality scoring and a jurisdiction-aware legal-context pass. |
| **Action Plan** | Analysis → Next Steps tab, `/compare` → Add to Action Plan | A checklist of reversible preparation steps (never "sue," "breach," or "refuse to pay") with `localStorage` persistence, completion tracking, and de-duplication across sessions. |
| **Lawyer Brief** | Analysis → Next Steps → "Prepare for a Lawyer" | A structured, printable/copyable intake document: matter summary, key clauses, verified legal context, open uncertainties, and targeted questions for counsel. |
| **Situation Navigator** | `/situation` | For users with no document to upload — describe a dispute in plain English and get a structured assessment: likely legal category, missing facts, relevant legal concepts, and next steps. |
| **Negotiation Copilot** | Analysis → Overview → "Negotiate" on a material finding, or "Negotiate this" in the finding detail | Drafts a proposed clause revision, a fallback position, and a polite message to the counterparty for one finding. Legal references come only from that finding's Evidence Chain. Saved drafts appear in the Action Plan and the Lawyer Brief. See [Negotiation Copilot](#negotiation-copilot). |

All AI-powered flows have a deterministic, non-AI fallback (see [Reliability](#reliability--fallback-behavior)), so the app remains fully functional without a configured API key.

---

## Negotiation Copilot

Spotting a one-sided clause is only half the job. The user still has to ask for a change, and that is where most people get stuck. The Negotiation Copilot turns a single material finding into a **draft for review**: something the user can take to the other party or to a lawyer. It does not replace either of them.

### What a draft contains

Each `NegotiationDraft` (`types/negotiation.ts`) is generated for one finding and includes:

| Part | Purpose |
|---|---|
| **Issue explanation** | Plain-language summary of the clause (with section and page), why it matters, and the negotiation goal. |
| **Proposed clause** | Suggested replacement wording, plus a short rationale. Numbers the user must choose (caps, shorter periods, percentages) are `[bracketed placeholders]` so they can't be mistaken for something the contract or the law says. Values quoted from the clause itself are reused where they can be extracted, e.g. the bond amount or a duration like "eighteen (18) months". |
| **Fallback position** | A compromise to offer if the primary ask is refused. |
| **Message draft** | Recipient, subject, and a short, courteous, non-threatening body. For employment agreements it is addressed to HR / the hiring manager of the counterparty. |
| **Verify before accepting** | A checklist of up to 8 items: the finding's open uncertainties, topic-specific checks, an authority check, and a reminder to have the wording reviewed by a qualified lawyer and to get any agreed change into the signed agreement. |
| **Grounding** | The exact document quote, section, page, the Evidence Chain ID, and the legal basis carried over from that chain. |
| **Disclaimer** | A fixed "Draft for review — not legal advice" notice set by code on every draft. |

Topic-specific playbooks (`lib/negotiation/negotiationEngine.ts`) cover training bonds, notice periods, intellectual property, non-competes, dispute resolution, confidentiality, liability, and termination, with a general fallback for anything else. The topic is detected from the finding's title and category first, and the clause text is used only as a tiebreaker.

### Grounding rules

- **No new legal authority.** A draft's `legalBasis` is built only from the finding's own Evidence Chain, and only from sources that pass `validateLegalSource` and are `verified` or `partially_verified`. The playbook templates never name a statute, case, or regulation.
- **Honest when authority is missing.** If no verified source is linked, `hasVerifiedAuthority` is `false`. The checklist then says so explicitly, and the Lawyer Brief shows "None verified — based on contract text only."
- **Citation guard on AI output.** `findUngroundedCitations` scans generated text for statute-style references ("… Act, 1872"), case names ("X v. Y"), law-report citations (SCC, AIR, All ER, etc.), and `§` sections. Anything that isn't in the allowed Evidence Chain sources counts as a violation.
- **Material findings only — UI and API gates differ slightly:**
  - **UI:** the "Negotiate" and "Negotiate this" buttons appear only on findings displayed as **HIGH** or **MEDIUM**. `humanizeSeverity` in `lib/analysis/presentationTransformer.ts` maps `critical_attention` / `high_attention` to HIGH and `review` to MEDIUM.
  - **API:** `POST /api/analysis/negotiate` runs its own check with `isNegotiableSeverity`, which accepts any non-informational severity: `critical_attention`, `high_attention`, and `review` (`NEGOTIABLE_SEVERITIES` in `lib/negotiation/negotiationEngine.ts`). An `informational` finding is rejected with `422`, whatever the request contains.
  - In practice both gates cover the same material findings. The server-side check means that a direct API call can't produce a draft for an informational finding.

### Deterministic first, AI-assisted second

1. **Grounded template draft.** `generateNegotiationDraft` is client-safe and synchronous, so the modal renders a complete draft immediately, before any network call returns.
2. **Optional AI refinement.** When `GEMINI_API_KEY` is set, `POST /api/analysis/negotiate` (`lib/ai/agents/negotiationAgent.ts`) asks Gemini to rewrite only the narrative fields, using temperature `0.2` and JSON output. The prompt lists the allowed legal sources explicitly and wraps the finding and clause text in `<untrusted_document_context>`. Any attempt in the input to close that tag early is neutralized.
3. **Strict merge.** The rewrite is discarded, and the grounded draft kept, if it fails Zod schema validation, contains an ungrounded citation, fails `validateSafetyCompliance`, or claims the wording is "legally valid/binding/enforceable", "guaranteed", or "fully compliant". Grounding, the disclaimer, and the core verification items are always set by code, never by the model.
4. **Visible provenance.** Each draft is labeled `grounded_template` or `ai_assisted`. An AI-refined version replaces the on-screen draft only if the user hasn't already saved the grounded one, so what they saved always matches what they saw.

### Where drafts go

- **Action Plan** — saved drafts appear as a "Negotiation Copilot draft" step with the suggested clause, the fallback, a "Copy message" button, and a not-legal-advice note. They can be removed individually.
- **Lawyer Brief** — section **8a, "Proposed Negotiation Positions — Drafts for Counsel Review"**, lists each draft's issue, proposed revision, fallback, linked sources with verification status, and the "please confirm" checklist. The section is included in the copyable/printable brief.
- **Storage** — drafts are stored in the browser's `localStorage` only, with one draft per finding, scoped per document (`lib/negotiation/negotiationStore.ts`). A React `useSyncExternalStore` binding keeps the Action Plan and Lawyer Brief in sync. No draft is persisted server-side.

### API hardening (`app/api/analysis/negotiate/route.ts`)

- Rate-limited to 20 requests per minute per client, with a 512 KB request-body cap and length-bounded `reportId` / `findingId`.
- **Tamper resistance:** when the server has its own copy of the report (the demo report or a cached/stored analysis), it builds the draft from that copy and ignores any client-supplied finding or Evidence Chain. The client's local-first context is used only for reports that exist only in the browser.
- Error messages are truncated before they are returned.

---

## India-First, Maharashtra-Aware

LawPilot's flagship legal grounding targets **India**, with Maharashtra-specific statutory awareness where relevant (e.g. the Maharashtra Shops and Establishments Act's notice-period provisions). Jurisdiction is detected from the document text itself (`lib/jurisdiction/jurisdictionDetector.ts`), with explicit ambiguity warnings rather than silent guessing.

Outside India, LawPilot still functions — clause detection, findings, and the Evidence Chain all still run — but jurisdiction-specific legal narratives (e.g. citing a specific Indian statute) are only shown when the document is actually detected as India-governed. For other or undetected jurisdictions, LawPilot uses jurisdiction-neutral language instead of asserting an inapplicable legal conclusion.

---

## Supported Document Formats

| Format | Extraction | Notes |
|---|---|---|
| PDF (`.pdf`) | `unpdf`, page-aware | Magic-byte (`%PDF-`) verified before parsing |
| Word (`.docx`) | `mammoth` | Magic-byte (ZIP/`PK..`) verified before parsing |
| Plain text (`.txt`) | Native | Requires a high ratio of printable/UTF-8 content, rejecting binary files mislabeled as text |

- Maximum upload size: **15 MB** per file.
- Fully scanned documents with no extractable text layer are rejected with a clear error rather than silently producing an empty or fabricated analysis.

---

## AI & Legal Grounding

LawPilot uses **Google Gemini** (`@google/genai`) server-side only, via a single configured model (`lib/ai/gemini.ts`).

**Where Gemini is called:**
- Document fact extraction (clauses, parties, dates, financial terms) — with Zod schema validation and one retry on malformed output, falling back to a deterministic regex/heuristic extractor.
- Action Plan and Lawyer Brief generation — run in parallel (`Promise.allSettled`), each independently falling back to a deterministic synthesizer.
- Ask LawPilot — answers are constrained to a token-bounded, explicitly-delimited document context; live output is Zod-validated before use.
- Situation Navigator — schema-validated live assessment when no document is uploaded, with a deterministic fallback engine.
- Negotiation Copilot — optional rewrite of a grounded template draft's narrative fields. The rewrite is accepted only if it passes schema validation, the citation guard (no authority outside the finding's Evidence Chain), and the safety check. Otherwise the grounded draft stands.

**Where legal citations come from:** a curated set of verified statutes and precedents (Indian Contract Act §27/§74, Copyright Act §17(c), Arbitration and Conciliation Act §12(5), Maharashtra Shops and Establishments Act, plus a general/Delaware baseline for non-India documents) — never freely generated by the model. A finding is only linked to a source when its category and clause content plausibly match; when nothing matches, the finding is left unlinked and marked `insufficient_context` rather than attached to an unrelated citation.

### Reliability & Fallback Behavior

Every Gemini call path has a non-AI fallback:
- Missing/invalid `GEMINI_API_KEY` → deterministic mode across the whole app (no crash, no degraded UX messaging beyond what's genuinely fallback-driven).
- Malformed JSON, schema-validation failure, or a provider error (429/5xx/timeout) → caught and routed to the matching deterministic synthesizer, logged server-side only.
- The evidence-verification step is a plain TypeScript rule engine, not an LLM call, so verification status is not something the model can talk itself into.
- Negotiation Copilot: the grounded template draft is generated first, both on the client and on the server. A missing key, provider error, malformed JSON, or rejected rewrite simply returns that draft. The modal shows a draft even if the API request fails.

---

## Architecture & Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript 5 (strict mode) |
| AI | Google Gemini via `@google/genai` (server-side only) |
| Validation | Zod (AI output schemas, request validation) |
| Document parsing | `unpdf` (PDF), `mammoth` (DOCX) |
| Landing page effects | `three` (WebGL), dynamically imported/tree-shaken to keep it out of the initial page bundle |
| Testing | Vitest |
| Persistence | Browser `localStorage` only (Action Plan state, chat history, recent-documents list, saved Negotiation Copilot drafts) — see [Security & Privacy](#security--privacy) |
| Deployment | Vercel (Node.js serverless runtime) |

No database, no authentication, no server-side session storage. `getCurrentUser()` (`lib/auth/user.ts`) is an intentional open-access stub — there is no protected data model behind it.

---

## Efficiency

- **Selective AI invocation** — deterministic parsers handle clause segmentation, page mapping, and regex-based date/amount extraction *before* any Gemini call; the model is only asked to fill in what pattern-matching genuinely can't (`lib/ai/agents/extractionAgent.ts`).
- **Parallelized, independent AI calls** — Action Plan and Lawyer Brief generation run concurrently via `Promise.allSettled` (`lib/analysis/analysisOrchestrator.ts`), not sequentially.
- **Clause-level, not whole-document, prompts** — Ask LawPilot and legal research build a token-bounded context from only the matched clauses/findings/evidence chains relevant to the question (`lib/ai/ask/contextBuilder.ts`), instead of resubmitting the full report on every turn.
- **Deterministic fallback path** — every AI-backed feature (extraction, Action Plan, Lawyer Brief, Ask, Situation Navigator) has a non-AI synthesizer that runs in milliseconds, used automatically on a missing key, malformed output, or provider failure — so the app is never blocked waiting on a retry loop.
- **Client bundle size** — `components/effects/ColorBends.tsx` (the landing-page WebGL background) uses named imports from `three` instead of `import * as THREE`, enabling tree-shaking, and is loaded through `next/dynamic(..., { ssr: false })` via `ColorBendsLoader.tsx`. Verified in the production build output: the `three` chunk is excluded from the page's root/initial JS and is fetched as a separate, on-demand chunk.
- **Idle animation cost control** — `ColorBends` pauses its render loop via `IntersectionObserver` (off-screen) and the `visibilitychange` event (backgrounded tab), and respects `prefers-reduced-motion` by rendering a single static frame instead of animating.
- **Bounded request cost** — a per-route, per-client sliding-window rate limiter (`lib/safety/rateLimiter.ts`) and `Content-Length` pre-checks (`isDeclaredContentLengthTooLarge`, `lib/documents/fileValidator.ts`) reject oversized or abusive requests before they reach document parsing or Gemini, avoiding wasted compute and AI-token spend.
- **Server-side-only parsing** — PDF/DOCX extraction (`unpdf`, `mammoth`) runs entirely in server code, keeping those libraries out of the client bundle entirely.
- **Instant negotiation drafts** — the Negotiation Copilot renders its grounded template draft synchronously on the client. The optional AI refinement runs in the background with an `AbortController`, so closing the modal cancels the in-flight request.
- **Route-level loading skeletons** — `/review`, `/compare`, and `/situation` ship `loading.tsx` Suspense skeletons, so navigation shows layout immediately instead of a blank page.
- **Cached demo responses** — the demo analysis and demo compare responses are sent with `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`, so repeated demo runs can be served from the edge cache.
- **Smaller Ask LawPilot requests** — the client sends its local copy of the report only when the server returns `404` for that report (local-first recovery), not on every question.
- **Optimized hero image** — the landing-page background photo is served through `next/image` (responsive `srcset`, modern formats) and preloaded as the LCP candidate.

---

## Accessibility

- **Semantic HTML** — heading hierarchies (`h1`–`h4`) and standard interactive elements (native `<button>`, `<a>`, `<input>`) are used throughout the analysis, compare, action-plan, and situation views rather than generic clickable `<div>`s.
- **Modal dialog semantics** — every modal (`ClauseQAModal`, `FindingDetailModal`, `CompareAskModal`, `EvidenceChainDetailModal`, `SourceDetailModal`, `JurisdictionIndicator`, `NegotiationCopilotModal`) implements `role="dialog"` / `aria-modal="true"` and closes on `Escape`.
- **Descriptive control labeling** — Action Plan checkboxes and remove buttons carry state-specific `aria-label`s (e.g. `Mark "..." as completed`, `Remove "..." from Action Plan`) rather than a generic label, so the accessible name reflects the current state.
- **No color-only signaling** — severity and status indicators (`SeverityBadge`, verification-status pills) always pair an icon and a text label with their color, so information isn't conveyed by color alone.
- **Reduced motion respected** — the landing page's scroll-driven scenes and the `ColorBends` background both check `prefers-reduced-motion` and fall back to a static, non-animated presentation.
- **ARIA tab pattern** — the Analysis view's main sections and the Next Steps sub-tabs use `role="tablist"` / `role="tab"` / `role="tabpanel"`, with `aria-selected` and `aria-controls` linking each tab to its panel.
- **No nested interactive elements** — clickable finding rows are real `<button>`s (with `aria-pressed` for the active row), laid out as two sibling buttons: one syncs the Document Passage, one opens the detail modal. This replaces an earlier button-inside-button pattern, which was invalid HTML.
- **Focus management** — `FindingDetailModal` and `NegotiationCopilotModal` move focus into the dialog when it opens (`tabIndex={-1}` container + programmatic focus).
- **Live regions for async content** — the Negotiation Copilot announces its AI-refinement status and draft content through `aria-live="polite"` regions, and its draft-for-review notice is marked `role="note"`.
- **Accessible forms and controls** — the Ask LawPilot input has a visually hidden `<label>`. "Clear conversation" uses an inline confirm step instead of a blocking `window.confirm()`. The Compare uploader's upload, remove, and swap controls have descriptive `aria-label`s. The Negotiate buttons are labeled per finding (`Negotiate: <finding title>`).
- **Landmarks and heading order** — footer links are wrapped in `<nav aria-label="Footer navigation">`. Finding rows use a paragraph instead of a heading that skipped levels, keeping the heading order valid.
- **Contrast fixes** — secondary text across the analysis tabs, Ask LawPilot labels, clause-reference labels, and the footer was darkened (e.g. `slate-400` → `slate-500`/`slate-600` in light mode) to meet a 4.5:1 contrast ratio. These fixes targeted failures reported by a developer-run Lighthouse accessibility audit. The verified current Lighthouse accessibility score is **96/100**; this README does not claim a perfect score.

This reflects the accessibility patterns implemented in the code above; it is not a claim of formal WCAG conformance testing or a third-party audit.

---

## Security & Privacy

- **Server-side API key only** — `GEMINI_API_KEY` is read exclusively in server code (`lib/ai/gemini.ts`); it is never bundled into client JavaScript.
- **Untrusted-content isolation** — uploaded document text is wrapped in explicit `<untrusted_document_context>` boundaries in every prompt that includes it, with matching system-prompt instructions telling the model to treat it as passive data, never as instructions (defense against prompt injection embedded in a PDF/DOCX).
- **File validation** — magic-byte signature checks (not just file extension), a printable-content ratio check for `.txt` uploads, a 15 MB size cap enforced on the declared `Content-Length` before the body is buffered, and filename sanitization against path traversal.
- **Rate limiting** — a per-route, per-client sliding-window limiter on every API route, protecting against scripted abuse and unbounded AI-cost generation.
- **HTTP security headers** — `Content-Security-Policy` (production), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, and a restrictive `Permissions-Policy`, set globally in `next.config.ts`.
- **Additional hardening headers** — `Strict-Transport-Security` (2 years, `includeSubDomains; preload`), `X-DNS-Prefetch-Control: off`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and `X-Permitted-Cross-Domain-Policies: none`. The production CSP restricts scripts, styles, fonts, and connections to `'self'`, and sets `frame-ancestors 'none'`, `base-uri 'self'`, and `form-action 'self'`.
- **Negotiation Copilot safeguards** — the server prefers its own copy of a report over client-supplied context, so the draft's grounding can't be altered by editing the request. AI output that names authority outside the finding's Evidence Chain, fails the safety check, or claims legal validity is discarded. Text that tries to close the `<untrusted_document_context>` boundary is neutralized before it reaches the prompt.
- **Input bounds** — question length caps, conversation-history truncation, and request-body size limits on every JSON API route.
- **Sanitized error responses** — API routes never return raw stack traces or internal exception details; known input-validation failures return 400, genuine server-side failures return 500, oversized/invalid requests return 413/429.
- **No document persistence** — uploaded documents are processed in-memory for the request only. Session state (Action Plan, chat history, recent documents, saved negotiation drafts) lives solely in the browser's `localStorage`, is validated defensively on read, and never reaches a LawPilot-controlled server-side store.

---

## Testing & Verification

```bash
npm test          # Vitest — 20 test files, 268 tests, all passing
npx tsc --noEmit   # TypeScript strict mode — 0 errors
npm run lint       # ESLint — 0 errors, 0 warnings
npm run build      # Production build (Next.js/Turbopack) — succeeds
```

### Automated Suite (20 files · 268 tests)

| Test file | Tests | Covers |
|---|---|---|
| `compare-documents.test.ts` | 29 | Clause matching, added/removed/modified/moved detection, materiality scoring |
| `negotiation-copilot.test.ts` | 24 | Grounded draft engine (all parts present for every material demo finding, topic detection, clause-value extraction), Evidence-Chain-only citations, citation guard, AI-output merge rejection (invented authority, legal-validity claims, malformed output), no-key fallback, API route (tamper-resistance, input validation, informational refusal), per-document draft store, UI entry points and draft-for-review notice |
| `security-and-edge-cases.test.ts` | 23 | Magic-byte validation, file-size limits, prompt-injection boundary isolation |
| `action-plan-lawyer-brief.test.ts` | 21 | Action Plan safety filters, reversible next steps, Lawyer Brief sections |
| `ask-lawpilot-grounded-qa.test.ts` | 18 | Grounded Q&A, citation boundaries, missing-fact isolation |
| `legal-research-verification.test.ts` | 18 | Statutory verification gate, source-priority hierarchy, jurisdiction grounding |
| `document-intelligence.test.ts` | 17 | Extraction, clause mapping, entity recognition |
| `situation-navigator.test.ts` | 16 | Fact extraction, legal-category routing, vague/health-input handling |
| `frictionless-intake-and-demo.test.ts` | 12 | Zero-auth demo intake, sample report integrity, no secret exposure |
| `jurisdiction-aware-intelligence.test.ts` | 12 | India/Maharashtra jurisdiction routing and statutory rules |
| `e2e-critical-flows.test.ts` | 11 | Full pipeline on a real PDF, cross-feature data-consistency invariants |
| `theme-toggle.test.ts` | 11 | Dark/light theme state, persistence |
| `action-plan-unique-ids.test.ts` | 8 | Deterministic ID generation, duplicate-key regression prevention |
| `compare-action-plan-integration.test.ts` | 8 | Compare → Action Plan save/complete/remove persistence and de-duplication |
| `colorbends-lifecycle-and-mobile.test.ts` | 7 | Canvas lifecycle, WebGL-failure fallback, mobile resize handling |
| `hydration-scene-scroll.test.ts` | 7 | SSR hydration safety, scroll-listener cleanup |
| `presentation-simplification.test.ts` | 7 | Progressive-disclosure findings presentation |
| `document-segmentation-robustness.test.ts` | 5 | Real multi-page PDF extraction and heading-pattern segmentation |
| `brand-and-product-copy.test.ts` | 5 | Product-copy/naming consistency |
| `rate-limiter.test.ts` | 9 | Sliding-window rate limiter correctness, IP isolation, window expiry, graceful degradation |

Per-file counts above were checked against `npx vitest run --reporter=verbose` on the current codebase. TypeScript (`npx tsc --noEmit`) and ESLint (`npm run lint`) were also re-run and both passed cleanly.

### Manual Verification

Beyond the automated suite, the core flows (Landing → Review → Analysis → Evidence Chain → Ask LawPilot → Compare → Action Plan, and Situation Navigator) were exercised in a real Chromium browser session against a running instance — including a live Gemini round trip — checking for console/hydration errors, correct persistence across navigation, and correct behavior under a simulated provider failure (503) and a live schema-validation rejection. This was manual, developer-run verification during this build, not an automated CI gate.

---

## Problem Statement Alignment: AI for Legal Assistance & Access

Every requirement below maps to one of LawPilot's three layers. **Understand** covers simplification, highlighting, comparison, and Q&A. **Verify** covers evidence, sources, and uncertainty. **Act** covers next steps, checklists, negotiation, and lawyer preparation. Each capability is backed by a specific module and covered by the automated suite described in [Testing & Verification](#testing--verification).

| Requirement | LawPilot Capability | Implementation |
|---|---|---|
| Simplify legal documents | Plain-English clause summaries, progressive disclosure | `lib/analysis/presentationTransformer.ts`, `/analysis/[id]` |
| Highlight important clauses | Severity-scored findings (`critical_attention` / `high_attention` / `review` / `informational`) | `lib/ai/agents/riskAnalysisAgent.ts`, `SeverityBadge.tsx` |
| Identify risks / inconsistencies | Findings surface one-sided obligations, financial exposure, restrictive covenants | Finding cards, `FindingDetailModal.tsx` |
| Compare legal documents | Semantic clause diff with added/removed/modified/moved classification | `/compare`, `lib/comparison/documentComparator.ts`, `clauseMatcher.ts` |
| Detect meaningful changes | Materiality scoring (HIGH/MEDIUM/LOW/INFORMATIONAL) with jurisdiction-aware explanations | `lib/comparison/semanticChangeDetector.ts` |
| Answer questions from documents | Grounded Q&A scoped to the uploaded document's own evidence chains | `lib/ai/ask/askEngine.ts`, `AskLawPilotView.tsx` |
| Show evidence for findings | The Evidence Chain (document quote → source → verification → uncertainty) | `lib/ai/agents/verificationAgent.ts`, `components/evidence/` |
| Connect findings to legal sources | Curated statute/precedent linking with an explicit no-match state | `lib/ai/agents/legalResearchAgent.ts` |
| Communicate uncertainty clearly | Explicit `uncertainties[]` and non-`verified` statuses shown in the UI, not hidden | `EvidenceChain.verification`, `EvidenceChain.uncertainties` |
| Suggest practical next steps | Reversible-only action items tied to each finding | `lib/ai/agents/actionPlanningAgent.ts` |
| Produce actionable checklists | Categorized, persisted Action Plan with completion tracking | `components/action-plan/ActionPlan.tsx` |
| Prepare questions for a lawyer | Structured Lawyer Brief with targeted counsel questions | `lib/ai/agents/lawyerBriefAgent.ts`, `LawyerBrief.tsx` |
| Situation-based navigation (no document) | Structured assessment from a plain-English description alone | `/situation`, `lib/ai/situation/situationEngine.ts` |
| Maintain professional boundaries | Global and per-view legal disclaimers; no definitive-legality language | `GlobalDisclaimer.tsx`, `lib/safety/safetyRules.ts`, `lib/safety/disclaimer.ts` |
| Track recent document history | Workspace view showing recently analyzed documents with quick re-access | `/workspace`, `lib/storage/recentDocumentsStore.ts`, `components/workspace/` |
| Protect against API abuse | Per-route, per-client sliding-window rate limiter; content-length pre-checks before parsing | `lib/safety/rateLimiter.ts`, `isDeclaredContentLengthTooLarge` in all API routes |
| Help users negotiate unfavorable terms | Negotiation Copilot: proposed clause revision, fallback position, and a courteous counterparty message for a material finding, labeled a draft for review | `lib/negotiation/negotiationEngine.ts`, `lib/ai/agents/negotiationAgent.ts`, `NegotiationCopilotModal.tsx` |
| Prevent fabricated legal citations | Negotiation drafts may cite only verified/partially verified sources already in the finding's Evidence Chain; a citation guard rejects AI text naming any other statute, case, or section | `buildNegotiationGrounding`, `findUngroundedCitations`, `mergeAiOutput` |
| Carry negotiation into lawyer preparation | Saved drafts flow into the Action Plan and a dedicated "Proposed Negotiation Positions — Drafts for Counsel Review" section of the Lawyer Brief | `lib/negotiation/negotiationStore.ts`, `ActionPlan.tsx`, `LawyerBrief.tsx` |
| Accessible to non-expert users | ARIA tab pattern, labeled controls, dialog focus management, no color-only signaling, reduced-motion support, and contrast fixes from a developer-run Lighthouse audit | `AnalysisClientView.tsx`, `components/evidence/SeverityBadge.tsx`, `components/effects/ColorBends.tsx` |
| Secure handling of sensitive documents | No server-side document persistence, untrusted-content prompt isolation, magic-byte file validation, and hardened HTTP headers (CSP, HSTS, COOP/CORP) | `lib/documents/fileValidator.ts`, `lib/safety/documentSanitizer.ts`, `next.config.ts` |

---

## Local Setup

**Prerequisites:** Node.js 18.17+, npm 9+

```bash
git clone https://github.com/YashWagh23/LawPilot.git
cd LawPilot
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
# .env.local
# Server-side only — never exposed to the client. If omitted, LawPilot runs
# entirely in deterministic mode: no live AI calls, no degraded functionality.
GEMINI_API_KEY=your_gemini_api_key_here
```

No other environment variables, databases, or external services are required.

---

## Disclaimer

LawPilot provides **informational legal assistance and document preparation support**. It does **not** provide formal legal representation, does not execute irreversible legal acts on a user's behalf, and does not replace the advice of a licensed legal practitioner. Every generated finding, evidence chain, and action item is intended to help a user prepare for — not substitute — professional legal consultation.
