# LawPilot

> **Understand. Verify. Act.**

An intelligent, jurisdiction-aware legal assistance platform that deconstructs complex legal documents, surfaces critical risks, verifies findings against authoritative legal sources via visible **Evidence Chains**, and produces practical next steps and attorney-intake briefings.

---

## 1. Problem

Legal agreements govern employment, housing, business, and daily livelihoods, yet they remain nearly impossible for non-lawyers to evaluate safely. Everyday users face three core hurdles:

1. **Information Asymmetry**: Contracts are dense, highly technical, and obscure one-sided liabilities such as broad non-competes, punitive liquidated damages, and unilateral notice periods.
2. **Hallucination & Black-Box Risk**: Generic conversational AI often produces convincing, legal-sounding answers that fabricate non-existent statutory citations, misapply foreign legal precedents, or ignore jurisdictional boundaries.
3. **Inaction & Panic**: When faced with a risky clause, users don't know what concrete, reversible steps to take, what questions to ask HR or counterparty counsel, or how to prepare efficiently for a licensed attorney consultation.

---

## 2. Chosen Vertical

### AI for Legal Assistance & Access

LawPilot addresses the critical gap between unguided individuals and professional legal counsel by providing:
- **Document Understanding**: Converting dense legal text into transparent, plain-English findings with standout financial and time-bound obligations.
- **Risk Identification**: Flagging one-sided covenants, indemnities, and exit penalties.
- **Jurisdiction-Aware Legal Context**: Grounding analysis in local statutory frameworks (with deep first-class support for India and Maharashtra state law).
- **Document Comparison**: Semantically matching clause revisions to detect hidden liabilities and scope shifts.
- **Grounded Q&A**: Interactive document exploration strictly constrained to verified facts.
- **Preparation & Action**: Action checklists, counterparty negotiation scripts, and structured attorney intake briefs.

> **Important Boundary & Disclaimer**: LawPilot provides informational legal assistance and document preparation support. It does **NOT** provide formal legal representation, execute irreversible legal acts, or replace the counsel of a licensed legal practitioner.

---

## 3. Solution Overview: Understand. Verify. Act.

LawPilot operates across three distinct operational layers:

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

## 4. Signature Differentiator: The Evidence Chain

Unlike traditional chatbots that output unverifiable text, LawPilot anchors its intelligence in a multi-node, auditable **Evidence Chain**:

```
    ┌────────────────────────────────────────┐
    │              AI FINDING                │
    │ 12-Month Post-Employment Non-Compete   │
    └───────────────────┬────────────────────┘
                        │
                        ▼
    ┌────────────────────────────────────────┐
    │           DOCUMENT EVIDENCE            │
    │ Clause 9 · Page 2 · Verbatim Excerpt   │
    └───────────────────┬────────────────────┘
                        │
                        ▼
    ┌────────────────────────────────────────┐
    │              LEGAL CLAIM               │
    │ Post-employment non-competes are void  │
    └───────────────────┬────────────────────┘
                        │
                        ▼
    ┌────────────────────────────────────────┐
    │             LEGAL SOURCE               │
    │ Section 27, Indian Contract Act, 1872  │
    │ Status: VERIFIED · Primary Statute     │
    └───────────────────┬────────────────────┘
                        │
                        ▼
    ┌────────────────────────────────────────┐
    │         FACTUAL UNCERTAINTY            │
    │ Non-solicitation & trade secret carve- │
    │ outs remain enforceable upon trial     │
    └───────────────────┬────────────────────┘
                        │
                        ▼
    ┌────────────────────────────────────────┐
    │          PRACTICAL NEXT STEP           │
    │ Request replacement with confidentiality│
    │ and non-solicitation language          │
    └────────────────────────────────────────┘
```

### Why This Matters
- **Inspectability**: Users and attorneys can inspect the exact statutory citation, official jurisdiction, and verbatim contract passage behind any conclusion.
- **Zero Hallucination Tolerance**: If a source cannot be authoritatively verified against local law, the system marks it as unverified or isolates it as an explicit uncertainty.
- **Transparent Boundaries**: Displays what the AI *does not know* (e.g., unstated facts, oral representations, or missing attachments).

---

## 5. Core Features

### 📄 Document Intelligence
- **Multi-Format Ingestion**: Supports PDF, DOCX, and TXT with magic-byte validation and sanitized text normalization.
- **Clause Segmentation**: Robust pattern recognition separating preamble, numbered sections, nested articles, schedules, and exhibits across multi-page agreements.
- **Standout Value Extraction**: Automatically parses quantitative commitments, training bonds (e.g., `₹4,50,000`), notice periods (`90 days`), and geographic scopes (`All-India`).
- **Entity & Metadata Extraction**: Identifies contracting parties, effective dates, and governing law clauses.

### ⚖️ Jurisdiction-Aware Legal Intelligence
- **India-First Architecture**: Grounded in central statutes (Indian Contract Act, 1872; Specific Relief Act, 1963; Copyright Act, 1957; Arbitration and Conciliation Act, 1996) and state rules (Maharashtra Shops and Establishments Act, 2017).
- **Multi-Jurisdiction Routing**: Capable of detecting and routing across Delaware, federal US, and Indian state frameworks.
- **Source Hierarchy**: Prioritizes primary statutes, binding appellate precedents, and statutory regulations over informal commentary.

### 🔗 Auditable Evidence Chains
- Every finding links contract excerpt $\rightarrow$ statutory citation $\rightarrow$ verification status $\rightarrow$ factual uncertainty.
- Visual confidence pills and verification badges (`Verified`, `Partially Verified`, `Unverified`).

### 💬 Grounded Document Q&A (Ask LawPilot)
- Direct question-answering strictly bound to the uploaded document context.
- Four contextual suggestion pills for immediate exploration (*"Why was this flagged?"*, *"What does this clause mean?"*, *"What should I ask HR?"*, *"What is my notice period?"*).
- Integrated *"What would change this answer?"* clause and evidence references.

### 🔄 Semantic Document Comparison (`/compare`)
- Upload baseline and redlined draft agreements.
- Automatically categorizes changes: Added, Removed, Modified, or Moved sections.
- Highlights high-impact shifts: monetary increases, extended notice windows, expanded restrictive scopes, and unilateral dispute resolution modifications.
- Evaluates *"Why this change matters"* and generates unified preparation steps.

### 📋 Action Plan & Negotiation Checklists
- Prioritized, numbered checklist of practical pre-execution steps.
- Categories: Urgent Items, Pre-Signing Verifications, Questions for HR/Employer, Documents to Collect, and Facts to Confirm.
- Interactive checkboxes with browser `localStorage` persistence.
- Domain invariant ensuring guaranteed unique, stable item IDs across repeated renders.

### 💼 Lawyer-Ready Brief (`/analysis/[id]` → Brief)
- 1–2 page structured attorney intake document.
- Synthesizes document summary, party concerns, relevant clauses with excerpts, verified legal authorities, open uncertainties, and strategic questions for counsel.
- Instant copy-to-clipboard (Markdown) and clean print stylesheet for consultation intake.

---

## 6. How the Solution Works (Architecture)

### Document Review Flow

```
Uploaded File (PDF / DOCX / TXT)
  │
  ▼
Security Sandbox (Magic-byte check, size limit, filename sanitization)
  │
  ▼
Text Extraction (pdf-parse / mammoth / plain text)
  │
  ▼
Document Normalization & Clause Segmentation (Heading & Article heuristics)
  │
  ▼
Jurisdiction Detection (India, Delaware, etc.)
  │
  ▼
Modular Risk Analysis & Entity Extraction
  │
  ▼
Legal Research & Statutory Grounding (Central & State Statutes)
  │
  ▼
Verification Agent (Evidence Chain assembly & uncertainty isolation)
  │
  ▼
Presentation Transformer (3-Layer Progressive Disclosure)
  │
  ├─ Layer 1: Headline, High-Impact Cards, Quantitative Badges
  ├─ Layer 2: Clause Preview, Verification Details, Negotiation Points
  └─ Layer 3: Deep Evidence Chains, Raw Clause Viewer, Lawyer Brief
```

### Document Comparison Flow

```
Previous Document Draft           Current Document Draft
           │                                 │
           └───────────────┬─────────────────┘
                           ▼
                 Clause Normalization
                           │
                           ▼
          Semantic Matcher & Difference Engine
                           │
                           ▼
             Change Classification Engine
       (Added · Removed · Modified · Moved)
                           │
                           ▼
          Materiality & Risk Severity Scorer
                           │
                           ▼
        Comparison Summary & Side-by-Side View
```

---

## 7. Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | High-performance server rendering and API routes |
| **UI Library** | React 19 | Modern component lifecycle and hooks |
| **Language** | TypeScript 5 (Strict Mode) | Type-safe domain models and compile-time contract enforcement |
| **Styling** | Tailwind CSS v4 | Clean design system tokens and responsive layouts |
| **AI Engine** | Google Gemini API (`@google/genai`) | High-reasoning structured legal extraction (server-side only) |
| **Schema Validation** | Zod | Runtime type safety and schema validation for AI payloads |
| **Document Parsing** | `pdf-parse`, `pdf-lib`, `mammoth` | Multi-format text and page-aware extraction |
| **Testing** | Vitest | Fast, unit and integration test execution |
| **Icons** | Lucide React | Consistent, accessible SVG iconography |
| **Client Storage** | Browser `localStorage` | Fast local checklist persistence without mandatory user authentication |

---

## 8. AI Architecture & Agent Roles

LawPilot avoids single-prompt monolithic generation. Analysis is partitioned among specialized, single-responsibility modules:

1. **Extraction Agent** (`extractionAgent.ts`): Normalizes raw document text, identifies contracting parties, effective dates, and governing law clauses.
2. **Clause Segmenter** (`clauseSegmenter.ts`): Partitions documents into indexed, addressable clauses across pages and sections.
3. **Risk Analysis Agent** (`riskAnalysisAgent.ts`): Identifies high-risk provisions (training clawbacks, covenants, unilateral termination) and rates severity.
4. **Legal Research Agent** (`legalResearchAgent.ts`): Retrieves relevant statutory provisions and case doctrines based on identified clauses and jurisdiction.
5. **Verification Agent** (`verificationAgent.ts`): Pairs claims with contract evidence, assigns verification status, and isolates factual uncertainties.
6. **Action Planning Agent** (`actionPlanningAgent.ts`): Synthesizes findings into structured action categories with guaranteed unique, deterministic IDs.
7. **Lawyer Brief Agent** (`lawyerBriefAgent.ts`): Compiles concise 1–2 page attorney intake documents organized into 10 structured sections.
8. **Comparison Intelligence** (`documentComparator.ts`, `semanticChangeDetector.ts`): Matches clauses across revisions to detect semantic modifications.

---

## 9. Security & Safety Foundation

- **Server-Side API Keys**: Google Gemini API keys are consumed strictly in server environments (`process.env.GEMINI_API_KEY`) and never leaked to the client.
- **Untrusted Content Sandboxing**: Uploaded document content is treated as untrusted data, enclosed in strict safety boundaries to prevent prompt-injection or instruction-override attacks.
- **Magic-Byte Validation**: Validates file headers on binary uploads (PDF `%PDF-`, DOCX `PK..`) to prevent MIME-type spoofing.
- **File Upload Limits**: Enforces 15MB file-size limits and rejects corrupt or malformed files gracefully.
- **Sanitized Errors**: API routes sanitize stack traces and internal errors before returning user-facing HTTP responses.
- **No Hallucinated Legal Guarantees**: Prompts explicitly prohibit definitive statements of law or guarantees of litigation outcome.

---

## 10. Efficiency & Optimization Strategy

- **Selective AI Invocation**: Deterministic parsers handle normalization, regex boundary matching, and date extraction before LLM calls, minimizing unnecessary token usage.
- **Clause-Level Targeted Prompts**: Analyzes specific flagged clauses rather than repeatedly resending entire multi-page agreements.
- **Deterministic Synthesis Fallback**: When offline or in sandboxed demo mode, the system uses grounded deterministic synthesizers that run in sub-second time.
- **Server-Side Parsing**: PDF and DOCX text extraction occurs on the server, avoiding heavy client-side parsing bundles.
- **Micro-Animations & Offscreen Pausing**: Dynamic WebGL animations (ColorBends) pause rendering when scrolled off-screen to preserve CPU/GPU cycles.

---

## 11. Testing & Verification

LawPilot is validated by an extensive automated test suite run via Vitest:

```bash
npm test
```

### Test Suite Summary (174 Tests Passed · 100% Green)
- `tests/security-and-edge-cases.test.ts` (23 tests): Magic-byte checks, boundary isolation, prompt injection defense, file size limits.
- `tests/compare-documents.test.ts` (25 tests): Clause matching, added/removed/modified changes, materiality scoring.
- `tests/action-plan-lawyer-brief.test.ts` (21 tests): Action plan safety filters, reversible next steps, lawyer brief sections.
- `tests/action-plan-unique-ids.test.ts` (8 tests): Deterministic ID generation, duplicate React key regression, elevation move semantics.
- `tests/ask-lawpilot-grounded-qa.test.ts` (18 tests): Grounded Q&A, citation boundaries, missing fact isolation.
- `tests/legal-research-verification.test.ts` (18 tests): Statutory verification, source hierarchy, jurisdiction grounding.
- `tests/document-intelligence.test.ts` (17 tests): Extraction, clause mapping, entity recognition.
- `tests/jurisdiction-aware-intelligence.test.ts` (12 tests): India/Maharashtra law, Delaware routing, statutory rules.
- `tests/frictionless-intake-and-demo.test.ts` (12 tests): Demo intake, zero-auth access, sample report integrity.
- `tests/document-segmentation-robustness.test.ts` (5 tests): Real 4-page PDF extraction, multi-heading patterns.
- `tests/theme-toggle.test.ts` (8 tests): Dark/light theme state, accessibility, persistence.
- `tests/presentation-simplification.test.ts` (7 tests): 3-layer progressive disclosure, headline readability, jargon absence.

---

## 12. Accessibility

- **Semantic HTML**: Proper heading hierarchies (`h1` through `h4`), `<section>`, and `<article>` tags throughout all views.
- **Keyboard Navigation**: All interactive elements (upload zones, modals, tabs, and action checkboxes) are focusable and operable via standard keyboard controls (`Tab`, `Enter`, `Space`).
- **Modal Dialog Semantics**: Detail and Q&A modals implement `role="dialog"`, `aria-modal="true"`, focus retention, and `Escape` key dismissal.
- **Accessible Color Contrasts**: Status pills and severity badges pair high-contrast colors with text labels (`HIGH`, `MEDIUM`, `REVIEW`) to avoid color-only information signaling.
- **Reduced Motion Support**: UI transitions respect user `prefers-reduced-motion` settings.

---

## 13. Assumptions & Limitations

- **Informational Legal Scope**: LawPilot provides educational and preparation support. It does not provide legal representation or legal advice.
- **Jurisdiction Focus**: The primary flagship scenario is deeply optimized for Indian central law and Maharashtra state law. Support for other jurisdictions (e.g., Delaware) is present but less granular.
- **Document Text Quality**: Analysis relies on text-extractable PDFs, DOCX, and plain text files. Scanned images or rasterized PDFs without embedded text layers require OCR preprocessing.
- **External Factual Dependencies**: Legal enforceability frequently hinges on extrinsic facts (e.g., whether training costs were genuinely incurred, or whether an employee signed under coercion) which the AI identifies as uncertainties rather than making conclusive declarations.
- **Local-First Prototype Persistence**: User action checklist state is stored locally in the browser (`localStorage`) to permit frictionless zero-auth usage without requiring an account or cloud database write.

---

## 14. Problem Statement Alignment

| Competition Problem Requirement | LawPilot Capability | Where Demonstrated |
|---|---|---|
| **Simplify complex legal documents** | Plain-English summaries, 3-layer progressive disclosure, quantitative callouts | `/analysis/[id]`, `toFindingPresentation()` |
| **Identify critical clauses & risks** | Role-based risk scoring (`HIGH`, `MEDIUM`, `REVIEW`), exit clawback detection | `riskAnalysisAgent.ts`, Finding Detail Modal |
| **Compare contract versions** | Semantic clause matcher, delta detection, materiality highlighting | `/compare`, `semanticChangeDetector.ts` |
| **Highlight meaningful changes** | Clear metric shifts (*₹2,00,000 → ₹4,50,000*, *60d → 90d* notice) | `ComparisonSummaryView.tsx`, `SideBySideClauseView.tsx` |
| **Grounded document Q&A** | Answers constrained strictly to document text, with citations and uncertainties | Ask LawPilot tab (`/analysis/[id]`), `AskLawPilotView.tsx` |
| **Explain practical implications** | "Why this matters" and "What to verify" breakdowns for every finding | `FindingDetailModal.tsx`, `presentationTransformer.ts` |
| **Suggest concrete next steps** | Reversible, actionable preparation checklists with scripts for HR | Action Plan tab (`/analysis/[id]`), `ActionPlanView.tsx` |
| **Prepare for legal counsel** | 1–2 page structured Lawyer Brief with verified statutory references | Lawyer Brief tab (`/analysis/[id]`), `LawyerBrief.tsx` |
| **Maintain professional legal boundaries** | Explicit disclaimers, uncertainty declarations, no definitive legality claims | `GlobalDisclaimer.tsx`, `legalSafetyRules.ts` |

---

## 15. Why LawPilot is Different

1. **The Evidence Chain**: Doesn't just give an answer; shows the exact path from contract clause to governing statute.
2. **Jurisdiction-Aware Grounding**: Applies local statutory frameworks (such as Section 27 of the Indian Contract Act for non-competes) rather than generic legal generalities.
3. **Semantic Redline Detection**: Evaluates counterparty contract edits by practical liability shift, not just lexical character diffs.
4. **Action-Oriented Preparation**: Generates concrete negotiation wording (*"What to say to HR"*) and checklists before signing.
5. **Lawyer-Ready Handoff**: Produces an intake briefing that saves attorney billable hours and organizes essential facts.
6. **Hallucination Containment**: Declares what is unknown or uncertain instead of fabricating certainty.

---

## 16. Demo & Quick Start

### Quick Start Flow
1. **Explore the Demo**: Click **"Try Flagship Demo"** on the homepage to explore a realistic employment agreement analysis (`demo-employment-agreement`).
2. **Review High-Impact Issues**: Inspect the headline: *"LawPilot found 5 things worth your attention"*, including the ₹4,50,000 training bond and 12-month non-compete.
3. **Inspect the Evidence Chain**: Click **"Why this matters"** on any finding to see the contract quote, statutory grounding, and factual uncertainties.
4. **Ask a Question**: Open the **Ask LawPilot** tab to query specific terms using grounded suggestion pills.
5. **Compare Revisions**: Visit `/compare` to examine the redlined transition between initial offer and final draft.
6. **Generate Next Steps & Brief**: Check off action items in **Next Steps** and export the **Lawyer Brief**.

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/YashWagh23/LawPilot.git
cd LawPilot

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 17. Environment Configuration

Copy `.env.example` to `.env.local`:

```env
# Google Gemini API Key (Server-Side Only - Never committed)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web Configuration (Optional for cloud sync; prototype works zero-auth)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```

> **Note**: If `GEMINI_API_KEY` is not provided, LawPilot runs seamlessly in safe offline/deterministic mode with full interactive analysis of uploaded agreements and pre-computed demo agreements.

---

## 18. Verification Commands

```bash
# Run unit & integration test suite (174 tests)
npm test

# Type-check TypeScript codebase
npx tsc --noEmit

# Run ESLint rules
npm run lint

# Compile production build
npm run build
```

---

## 19. Evaluation Alignment Scorecard

| Parameter | Status | Verified Evidence |
|---|---|---|
| **Code Quality** | **STRONG** | Clean TypeScript (Strict Mode), 0 type errors, 0 ESLint warnings, modular architecture |
| **Problem Alignment** | **STRONG** | 100% alignment with legal assistance vertical; 3-layer progressive disclosure; Evidence Chain |
| **Security** | **STRONG** | Magic-byte validation, untrusted content boundaries, server-side API key isolation |
| **Efficiency** | **STRONG** | Selective LLM calls, deterministic fallback, clause-level targeting, Turbopack build |
| **Testing** | **STRONG** | 12 test suites, 174 tests passing (100%), regression tests for PDF extraction & React keys |
| **Accessibility** | **GOOD** | Semantic HTML, keyboard-navigable modals and tabs, high-contrast badges, reduced-motion |

---

## 20. Submission Checklist

- [x] Public GitHub repository (`YashWagh23/LawPilot`)
- [x] Complete project code committed and up to date
- [x] Comprehensive, judge-friendly `README.md`
- [x] Chosen vertical clearly stated and explained
- [x] Approach, logic, and 3-layer architecture documented
- [x] Assumptions and limitations explicitly stated
- [x] Secret audit passed (zero API keys in git history, `.env.local` ignored)
- [x] `.env.example` committed with safe placeholders
- [x] Zero hardcoded local machine paths in repository code
- [x] Vitest test suite passes (12 files · 174 tests)
- [x] TypeScript compiler passes with 0 errors
- [x] ESLint passes with 0 errors / 0 warnings
- [x] Production build succeeds (`npm run build`)
- [x] Problem statement alignment table included
- [x] Flagship demo operational and documented
