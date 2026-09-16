# LawPilot

> **Understand. Verify. Act.**

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6) ![Tests](https://img.shields.io/badge/tests-235%20passing-brightgreen) ![Zero Auth](https://img.shields.io/badge/auth-none%20required-lightgrey)

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

All AI-powered flows have a deterministic, non-AI fallback (see [Reliability](#reliability--fallback-behavior)), so the app remains fully functional without a configured API key.

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

**Where legal citations come from:** a curated set of verified statutes and precedents (Indian Contract Act §27/§74, Copyright Act §17(c), Arbitration and Conciliation Act §12(5), Maharashtra Shops and Establishments Act, plus a general/Delaware baseline for non-India documents) — never freely generated by the model. A finding is only linked to a source when its category and clause content plausibly match; when nothing matches, the finding is left unlinked and marked `insufficient_context` rather than attached to an unrelated citation.

### Reliability & Fallback Behavior

Every Gemini call path has a non-AI fallback:
- Missing/invalid `GEMINI_API_KEY` → deterministic mode across the whole app (no crash, no degraded UX messaging beyond what's genuinely fallback-driven).
- Malformed JSON, schema-validation failure, or a provider error (429/5xx/timeout) → caught and routed to the matching deterministic synthesizer, logged server-side only.
- The evidence-verification step is a plain TypeScript rule engine, not an LLM call, so verification status is not something the model can talk itself into.

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
| Persistence | Browser `localStorage` only (Action Plan state, chat history, recent-documents list) — see [Security & Privacy](#security--privacy) |
| Deployment | Vercel (Node.js serverless runtime) |

No database, no authentication, no server-side session storage. `getCurrentUser()` (`lib/auth/user.ts`) is an intentional open-access stub — there is no protected data model behind it.

---

## Security & Privacy

- **Server-side API key only** — `GEMINI_API_KEY` is read exclusively in server code (`lib/ai/gemini.ts`); it is never bundled into client JavaScript.
- **Untrusted-content isolation** — uploaded document text is wrapped in explicit `<untrusted_document_context>` boundaries in every prompt that includes it, with matching system-prompt instructions telling the model to treat it as passive data, never as instructions (defense against prompt injection embedded in a PDF/DOCX).
- **File validation** — magic-byte signature checks (not just file extension), a printable-content ratio check for `.txt` uploads, a 15 MB size cap enforced on the declared `Content-Length` before the body is buffered, and filename sanitization against path traversal.
- **Rate limiting** — a per-route, per-client sliding-window limiter on every API route, protecting against scripted abuse and unbounded AI-cost generation.
- **HTTP security headers** — `Content-Security-Policy` (production), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, and a restrictive `Permissions-Policy`, set globally in `next.config.ts`.
- **Input bounds** — question length caps, conversation-history truncation, and request-body size limits on every JSON API route.
- **Sanitized error responses** — API routes never return raw stack traces or internal exception details; known input-validation failures return 400, genuine server-side failures return 500, oversized/invalid requests return 413/429.
- **No document persistence** — uploaded documents are processed in-memory for the request only. Session state (Action Plan, chat history, recent documents) lives solely in the browser's `localStorage`, is validated defensively on read, and never reaches a LawPilot-controlled server-side store.

---

## Testing & Verification

```bash
npm test          # Vitest — 18 test files, 235 tests
npx tsc --noEmit   # TypeScript strict mode — 0 errors
npm run lint       # ESLint — 0 errors, 0 warnings
npm run build      # Production build (Next.js/Turbopack) — verified to succeed
```

Test coverage spans document extraction and clause segmentation, file-validation edge cases (corrupt/empty/oversized/misidentified files), the Evidence Chain verification gate, Compare's clause-matching and materiality scoring, Compare → Action Plan persistence and de-duplication, Ask LawPilot's grounding/citation behavior, jurisdiction detection, and Situation Navigator's fact-extraction and safety-language calibration.

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
