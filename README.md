# LawPilot

> **Understand. Verify. Act.**

An intelligent, jurisdiction-aware legal assistance platform that deconstructs complex legal documents, surfaces critical risks, verifies findings against authoritative legal sources via visible **Evidence Chains**, and produces practical next steps, negotiation checklists, and attorney-intake briefings.

---

## Live Demo

**Production:** https://lawpilot-sepia.vercel.app/

---

## Chosen Vertical

### AI for Legal Assistance & Access

LawPilot addresses the critical access-to-justice gap between unguided individuals and professional legal counsel by providing:
- **Document Understanding**: Converting dense legal text into transparent, plain-English findings with standout financial and time-bound obligations.
- **Risk Identification**: Flagging one-sided covenants, indemnities, and exit penalties.
- **Jurisdiction-Aware Legal Context**: Grounding analysis in local statutory frameworks (with first-class support for India and Maharashtra state law, plus US/Delaware routing).
- **Document Comparison**: Semantically matching clause revisions to detect hidden liabilities and scope shifts.
- **Grounded Q&A**: Interactive document exploration strictly constrained to verified facts.
- **Preparation & Action**: Action checklists, counterparty negotiation scripts, and structured attorney intake briefs.

> **Important Boundary & Disclaimer**: LawPilot provides informational legal assistance and document preparation support. It does **NOT** provide formal legal representation, execute irreversible legal acts, or replace the counsel of a licensed legal practitioner.

---

## Problem

Legal agreements govern employment, housing, business, and daily livelihoods, yet they remain nearly impossible for non-lawyers to evaluate safely. Everyday users face three core hurdles:

1. **Information Asymmetry**: Contracts are dense, highly technical, and obscure one-sided liabilities such as broad non-competes, punitive liquidated damages, and unilateral notice periods.
2. **Hallucination & Black-Box Risk**: Generic conversational AI often produces convincing, legal-sounding answers that fabricate non-existent statutory citations, misapply foreign legal precedents, or ignore jurisdictional boundaries.
3. **Inaction & Panic**: When faced with a risky clause, users don't know what concrete, reversible steps to take, what questions to ask HR or counterparty counsel, or how to prepare efficiently for a licensed attorney consultation.

---

## Approach and Logic

LawPilot bridges this gap through a 3-layer progressive disclosure philosophy: **Understand. Verify. Act.**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UNDERSTAND                                               │
│ Deconstructs agreements into structured clauses, key dates, │
│ financial commitments, and plain-English risk summaries.    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. VERIFY                                                   │
│ Maps every flagged issue to verbatim contract quotes,       │
│ jurisdiction-aware statutes, and explicit uncertainties.    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ACT                                                      │
│ Generates reversible negotiation steps, questions for HR/   │
│ counterparty, and a structured 1-2 page Lawyer Brief.       │
└─────────────────────────────────────────────────────────────┘
```

- **UNDERSTAND**: Transforms raw PDFs, Word documents, or plain text into normalized clauses, identified entities, and clear, prioritized findings with quantitative highlights (e.g., *₹4,50,000 training clawback*, *12-month nationwide non-compete*).
- **VERIFY**: Connects every finding to an auditable **Evidence Chain**, linking verbatim contractual text to validated statutory authorities and declaring explicit factual uncertainties.
- **ACT**: Generates safe, reversible preparation steps, specific questions to ask the drafting party, and a downloadable attorney intake brief designed to maximize legal consultation efficiency.

---

## How the Solution Works

### End-to-End Architecture Flow

```
Upload (PDF / DOCX / TXT)
  │
  ▼
Validation (Magic-byte inspection, MIME signature, 15MB size limit)
  │
  ▼
Extraction (Page-aware raw text extraction via unpdf & mammoth)
  │
  ▼
Clause Analysis (Pattern-based heading segmentation & clause categorization)
  │
  ▼
Jurisdiction (Jurisdiction context detection: India / Central / Maharashtra / Delaware)
  │
  ▼
Legal Research (Targeted statutory grounding against Central & State Acts)
  │
  ▼
Verification (Evidence chain assembly, source verification, uncertainty isolation)
  │
  ▼
Evidence (Multi-node audit trail linking verbatim quotes to legal citations)
  │
  ▼
Action (Deterministic action checklists, negotiation prompts & counsel brief)
```

### 3-Layer Progressive Disclosure

1. **Default Viewport (Essential)**: Answers *What did LawPilot find?*, *Why does it matter?*, and *What should I do?* with concise severity cards and quantitative values.
2. **One Click Deeper (Supporting Evidence)**: Expands clause previews, exact verbatim quotes, and direct negotiation talking points.
3. **Deepest View (Advanced Legal Context)**: Surfaces full statutory citations, judicial precedent doctrines (*e.g., Kailash Nath Associates v. DDA*), explicit uncertainties, and full attorney intake documents.

---

## Tech Stack

| Component | Technology | Role in Architecture |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | High-performance server rendering and isolated API routes |
| **UI Library** | React 19 | Modern declarative components and lifecycle |
| **Language** | TypeScript 5 (Strict Mode) | Compile-time contract enforcement across domain types |
| **Styling** | Tailwind CSS v4 | Clean design system tokens and responsive layouts |
| **AI Intelligence** | Google Gemini API (`@google/genai`) | Server-side structured extraction and grounded legal Q&A |
| **Schema Validation** | Zod | Runtime schema validation for AI payloads and contracts |
| **Document Parsing** | `unpdf`, `pdf-lib`, `mammoth` | Server-side extraction for PDF, DOCX, and TXT files |
| **Test Suite** | Vitest | Fast unit, integration, and invariant testing |
| **Icons** | Lucide React | Accessible, lightweight SVG iconography |
| **Session Persistence** | Browser `localStorage` | Client-side local storage for Action Plan checklists and chat history |

---

## Features

### 1. 📄 Document Intelligence
- **Multi-Format Ingestion**: Accepts PDF, DOCX, and TXT with magic-byte validation and sanitized text normalization.
- **Clause Segmentation**: Robust pattern recognition separating preamble, numbered sections, nested articles, schedules, and exhibits across multi-page agreements.
- **Standout Value Extraction**: Automatically parses quantitative commitments, training bonds (e.g., `₹4,50,000`), notice periods (`90 days`), and geographic scopes (`All-India`).
- **Entity & Metadata Extraction**: Identifies contracting parties, effective dates, and governing law clauses.

### 2. 🔗 Auditable Evidence Chains
- Every finding links contract excerpt $\rightarrow$ statutory citation $\rightarrow$ verification status $\rightarrow$ factual uncertainty.
- Grounded statutory verification with explicit uncertainty isolation: if a claim cannot be authoritatively substantiated, it is tagged with unverified status or isolated as an explicit factual uncertainty.
- Clear confidence pills and verification badges (`Verified`, `Partially Verified`, `Unverified`).

### 3. 💬 Grounded Document Q&A (Ask LawPilot)
- Interactive question-answering strictly bound to the uploaded document context.
- Four contextual suggestion pills for immediate exploration (*"Why was this flagged?"*, *"What does this clause mean?"*, *"What should I ask HR?"*, *"What is my notice period?"*).
- Explicit *"What would change this answer?"* clause and evidence references.
- Session persistence in local storage with one-click clear chat.

### 4. 🔄 Semantic Document Comparison (`/compare`)
- Upload baseline and redlined draft agreements or explore pre-loaded demo pairs.
- Distinguishes **Material Changes** (high liability, monetary increases, non-compete shifts) from all other general modifications.
- Maintains exact alignment between displayed material change cards and summary counts (no silent truncation).
- Side-by-side clause inspection with direct *Add to Action Plan* and *Ask LawPilot* integrations.

### 5. 🧭 Situation Navigator (`/situation`)
- Deconstructs real-world legal dilemmas entered in natural language (e.g., unpaid freelance invoices, landlord-tenant disputes, employment termination).
- Calibrated issue identification: extracts verified key facts, identifies missing information, and provides practical, reversible preparation routes.
- Handles vague prompts (e.g., *"I am sick"*) by requesting missing factual context and presenting health notices rather than inventing fabricated legal controversies.
- Concrete recovery routes: maps unpaid debts to formal demand notices, MSME Samadhaan conciliation, and summary suits under Order XXXVII of the CPC.

### 6. 📋 Action Plan & Negotiation Checklists
- Prioritized, numbered checklist of practical pre-execution steps.
- Categories: Urgent Items, Pre-Signing Verifications, Questions for HR/Employer, Documents to Collect, and Facts to Confirm.
- Interactive checkboxes with browser `localStorage` persistence.
- Domain invariant enforcing unique, stable item IDs across repeated renders with zero duplicate key warnings.

### 7. 💼 Lawyer-Ready Brief (`/analysis/[id]` → Brief)
- 1–2 page structured attorney intake document designed to streamline consultation.
- Synthesizes document summary, party concerns, relevant clauses with excerpts, verified legal authorities, open uncertainties, and strategic questions for counsel.
- Instant copy-to-clipboard (Markdown) and clean print stylesheet for consultation intake.

---

## Assumptions

- **Informational Legal Scope**: LawPilot is designed for preparation and educational support; it does not replace licensed legal counsel or provide legal representation.
- **Text Layer Availability**: Documents are assumed to contain machine-readable text layers (standard PDF, DOCX, TXT). Scanned documents without text layers require OCR preprocessing.
- **Jurisdictional Baseline**: Flagship legal intelligence is grounded in Indian central law (Contract Act, 1872; Specific Relief Act, 1963; Arbitration Act, 1996) and Maharashtra state law, with secondary routing for US/Delaware standards.
- **Extrinsic Facts**: Contract enforceability depends heavily on facts outside the four corners of the document (e.g., actual expenses incurred, employee status, or coercion); LawPilot models these as explicit factual uncertainties rather than asserting legal finality.
- **Local-First Privacy**: User session actions and chat histories are stored locally in the browser (`localStorage`), enabling zero-auth usage without requiring an account or cloud database write.

---

## Limitations

- **No Court Appearances or Formal Filings**: LawPilot does not draft court pleadings or submit formal filings to judicial or administrative bodies.
- **Document Boundary**: Grounded Q&A answers questions only based on the document text provided; it does not assume external unstated contract terms.
- **Jurisdictional Boundaries**: Deepest statutory grounding applies to Indian and US common-law frameworks; civil law jurisdictions are handled through general contractual principles.
- **Scanned Image Processing**: Documents containing only rasterized images without text layers cannot be extracted without an OCR conversion pipeline.

---

## Security

- **Server-Side API Keys**: Google Gemini API keys are consumed strictly in server environments (`process.env.GEMINI_API_KEY`) without client-side exposure.
- **Document Handling**: Documents are processed for the requested analysis and are not persisted by LawPilot in a third-party application database. External AI-provider handling is governed by the provider's applicable API terms and configuration.
- **Untrusted Content Sandboxing**: Uploaded document content is treated as untrusted data, enclosed in safety boundaries to mitigate prompt injection or instruction override risks.
- **Magic-Byte Validation**: Validates file headers on binary uploads (PDF `%PDF-`, DOCX `PK..`) to prevent MIME-type spoofing.
- **File Upload Limits**: Enforces a 15MB file size limit and rejects corrupt, empty (0 bytes), or unsupported files gracefully.
- **Sanitized Errors**: API routes sanitize stack traces and internal errors before returning user-facing HTTP responses.
- **No Secrets Committed**: Strict `.gitignore` rules prevent environment files from entering repository history.

---

## Efficiency

- **Selective AI Invocation**: Deterministic parsers handle normalization, regex boundary matching, and date extraction before LLM calls, minimizing unnecessary token consumption.
- **Clause-Level Targeted Prompts**: Analyzes specific flagged clauses rather than repeatedly resending entire multi-page agreements to the LLM.
- **Deterministic Synthesis Fallback**: In offline mode or when exploring demo documents, the system uses grounded deterministic synthesizers that execute in sub-second time.
- **Server-Side Parsing**: PDF and DOCX text extraction occurs entirely on the server, keeping client bundle sizes lightweight.
- **WebGL Lifecycle Management**: Background animations (ColorBends) pause rendering when scrolled off-screen or when the browser tab is inactive, preserving CPU and GPU cycles.
- **Reduced Motion**: Full compatibility with user `prefers-reduced-motion` settings.

---

## Testing

LawPilot is validated by an extensive automated test suite combining Vitest unit/integration tests and real browser E2E test suites via Chrome DevTools Protocol (CDP):

```bash
npm test
```

### Automated Unit & Integration Suite (17 Files · 227 Tests Passing)
- `tests/e2e-critical-flows.test.ts` (11 tests): End-to-end critical flows, real PDF regression, comparison invariants, situation routing, and unique ID invariants.
- `tests/security-and-edge-cases.test.ts` (23 tests): Magic-byte checks, boundary isolation, prompt injection defense, file size limits.
- `tests/compare-documents.test.ts` (29 tests): Clause matching, added/removed/modified changes, materiality scoring.
- `tests/action-plan-lawyer-brief.test.ts` (21 tests): Action plan safety filters, reversible next steps, lawyer brief sections.
- `tests/action-plan-unique-ids.test.ts` (8 tests): Deterministic ID generation, duplicate React key regression, elevation move semantics.
- `tests/ask-lawpilot-grounded-qa.test.ts` (18 tests): Grounded Q&A, citation boundaries, missing fact isolation.
- `tests/legal-research-verification.test.ts` (18 tests): Statutory verification, source hierarchy, jurisdiction grounding.
- `tests/situation-navigator.test.ts` (16 tests): Fact extraction, legal routing, vague input handling, recovery avenues.
- `tests/document-intelligence.test.ts` (17 tests): Extraction, clause mapping, entity recognition.
- `tests/jurisdiction-aware-intelligence.test.ts` (12 tests): India/Maharashtra law, Delaware routing, statutory rules.
- `tests/frictionless-intake-and-demo.test.ts` (12 tests): Demo intake, zero-auth access, sample report integrity.
- `tests/document-segmentation-robustness.test.ts` (5 tests): Real 4-page PDF extraction, multi-heading patterns.
- `tests/theme-toggle.test.ts` (11 tests): Dark/light theme state, accessibility, persistence.
- `tests/colorbends-lifecycle-and-mobile.test.ts` (7 tests): Canvas lifecycle, resize handling, fallback.
- `tests/brand-and-product-copy.test.ts` (5 tests): Standalone product language audit.
- `tests/hydration-scene-scroll.test.ts` (7 tests): SSR hydration safety, scroll listeners.
- `tests/presentation-simplification.test.ts` (7 tests): 3-layer progressive disclosure, headline readability.

### Real Browser E2E Suite (10 Critical Flows Verified)
1. **Homepage $\rightarrow$ Try Demo $\rightarrow$ Analysis**: ColorBends canvas initialized, navigated cleanly.
2. **Review $\rightarrow$ Upload Real PDF $\rightarrow$ Analysis**: Full 6-stage pipeline processed `LawPilot_Test_Employment_Agreement.pdf` (4 pages, 16 clauses, 5 findings).
3. **Analysis $\rightarrow$ Finding $\rightarrow$ Evidence Chain**: Modal open and statutory deep-link verified.
4. **Analysis $\rightarrow$ Ask LawPilot $\rightarrow$ Grounded Answer**: Suggestion chips and textarea questions verified with reload persistence.
5. **Compare $\rightarrow$ Sample Redline $\rightarrow$ Results**: Exactly 5 material changes visible with aligned summary counts.
6. **Situation Navigator $\rightarrow$ Scenarios $\rightarrow$ Output**: Tested vague prompts, unpaid invoice recovery, and empty validation.
7. **Action Plan $\rightarrow$ Toggle Item $\rightarrow$ Persistence**: Checkbox toggle verified and persisted across reloads.
8. **Lawyer Brief $\rightarrow$ Copy/Export**: Brief generated with counsel questions and clipboard confirmation.
9. **Theme Toggle $\rightarrow$ Refresh**: Light default in fresh profile $\rightarrow$ Dark $\rightarrow$ reload $\rightarrow$ Light $\rightarrow$ reload with zero flash.
10. **Mobile Audit (5 Viewports)**: 320px, 375px, 390px, 412px, 430px checked across all 5 routes with zero horizontal overflow.

---

## Accessibility

- **Semantic HTML**: Proper heading hierarchies (`h1` through `h4`), `<section>`, and `<article>` tags throughout all views.
- **Keyboard Navigation**: All interactive elements (upload zones, modals, tabs, and action checkboxes) are focusable and operable via standard keyboard controls (`Tab`, `Enter`, `Space`).
- **Modal Dialog Semantics**: Detail and Q&A modals implement `role="dialog"`, `aria-modal="true"`, focus retention, and `Escape` key dismissal.
- **Accessible Color Contrasts**: Status pills and severity badges pair high-contrast colors with text labels (`HIGH`, `MEDIUM`, `REVIEW`) to avoid color-only information signaling.
- **Accessible Checkbox Controls**: Checkboxes use descriptive `aria-label` attributes indicating current item state.
- **Reduced Motion Support**: UI transitions respect user `prefers-reduced-motion` settings.

---

## Problem Statement Alignment

| Problem Statement Requirement | LawPilot Capability | Where Demonstrated |
|---|---|---|
| **1. Simplify legal documents** | Plain-English summaries, 3-layer progressive disclosure, quantitative callouts | `/analysis/[id]`, `presentationTransformer.ts` |
| **2. Highlight important clauses** | Role-based risk scoring (`HIGH`, `MEDIUM`, `REVIEW`), exit clawback detection | `riskAnalysisAgent.ts`, Finding Detail Modal |
| **3. Identify risks/issues** | Surfacing punitive training bonds, one-sided termination clauses, overbroad restrictions | Finding cards, `SAMPLE_ANALYSIS_REPORT` |
| **4. Compare documents** | Semantic clause matcher, delta detection, materiality highlighting | `/compare`, `semanticChangeDetector.ts` |
| **5. Detect meaningful changes** | Clear metric shifts (*₹2,00,000 → ₹4,50,000*, *60d → 90d* notice, unilateral arbitration) | `ComparisonSummaryView.tsx`, `SideBySideClauseView.tsx` |
| **6. Answer questions from documents** | Grounded Q&A constrained strictly to document text, with citations and uncertainties | Ask LawPilot tab (`/analysis/[id]`), `AskLawPilotView.tsx` |
| **7. Explain practical implications** | "Why this matters" and "What to verify" breakdowns for every finding | `FindingDetailModal.tsx`, `presentationTransformer.ts` |
| **8. Help users understand next steps** | Reversible, actionable preparation checklists with scripts for counterparty | Action Plan tab (`/analysis/[id]`), `ActionPlan.tsx` |
| **9. Produce actionable checklists** | Numbered, categorized checklist with browser persistence and unique IDs | Action Plan tab (`/analysis/[id]`), `actionPlanningAgent.ts` |
| **10. Prepare for legal professionals** | 1–2 page structured Lawyer Brief with verified statutory references and questions | Lawyer Brief tab (`/analysis/[id]`), `LawyerBrief.tsx` |
| **11. Maintain professional boundaries** | Explicit disclaimers, uncertainty declarations, no definitive legality claims | `GlobalDisclaimer.tsx`, `legalSafetyRules.ts` |

---

## Setup

### Prerequisites
- Node.js 18.17 or higher
- npm 9 or higher

### Local Installation (Development)

```bash
# 1. Clone repository
git clone https://github.com/YashWagh23/LawPilot.git
cd LawPilot

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

- **Local Development:** Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Live Deployed Application:** Access the live production application at [https://lawpilot-sepia.vercel.app/](https://lawpilot-sepia.vercel.app/).

---

## Environment Variables

The only application credential for active AI analysis is the Google Gemini API key:

Create `.env.local`:

```env
# Google Gemini API Key (Server-Side Only - Not exposed to client browser)
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Zero-Auth & Local-First**: No database or cloud authentication service is required. All session persistence (Action Plan checkboxes, Ask LawPilot chat history) operates locally in client browser storage.
>
> **Offline Operation**: If `GEMINI_API_KEY` is not set, LawPilot automatically runs in safe offline/deterministic mode, fully analyzing uploaded agreements and providing complete interactive demo capabilities.

---

## Verification Commands

```bash
# Run unit & integration test suite (227 tests)
npm test

# Type-check TypeScript codebase
npx tsc --noEmit

# Run ESLint rules
npm run lint

# Compile production build
npm run build

# Run security vulnerability audit
npm audit
```

---

## Submission Checklist

- [x] Public GitHub repository (`YashWagh23/LawPilot`)
- [x] Complete project code committed and up to date
- [x] Comprehensive documentation in `README.md`
- [x] Chosen vertical clearly stated and explained
- [x] Approach, logic, and 3-layer architecture documented
- [x] Assumptions and limitations explicitly stated
- [x] Secret audit passed (zero API keys in git history, `.env.local` ignored)
- [x] `.env.example` committed with safe placeholders
- [x] Zero hardcoded local machine paths in repository code
- [x] Vitest test suite passes (17 files · 227 tests)
- [x] TypeScript compiler passes with 0 errors
- [x] ESLint passes with 0 errors / 0 warnings
- [x] Production build succeeds (`npm run build`)
- [x] Problem statement alignment table included
- [x] Flagship demo operational and documented
- [x] Live production deployment operational (https://lawpilot-sepia.vercel.app/)
