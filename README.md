# LawPilot

> **Understand. Verify. Act.**

LawPilot is a competition-grade GenAI-powered legal information and document assistance platform. It helps users deconstruct complex agreements, identify one-sided clauses, verify legal context against authoritative statutes and restatements, and turn legal uncertainty into practical, reversible next steps.

---

## Important Notice

**LawPilot provides legal information and document assistance, not legal representation or professional legal advice.**

LawPilot is engineered under a strict 10-point legal safety foundation. It never claims an attorney-client relationship, never fabricates citations or statutes, and enforces strict isolation around user-uploaded documents to prevent prompt injection and instruction override attacks.

---

## Key Differentiator: The Evidence Chain

Rather than returning ungrounded conversational chat responses, LawPilot transparently documents its reasoning through the **Evidence Chain**:

```
AI FINDING
    ↓
DOCUMENT EVIDENCE (Clause & Page Number)
    ↓
LEGAL SOURCE (Authoritative Statute / Restatement)
    ↓
CONFIDENCE & CERTAINTY LEVEL
    ↓
WHAT IS STILL UNKNOWN (Factual Dependencies & Assumptions)
    ↓
PRACTICAL NEXT STEP (Reversible Action & Negotiation Guidance)
```

---

## Core Product Pathways

### 1. Document Review (`/review`)
- Upload contracts (PDF, DOCX, TXT) into an isolated memory sandbox.
- Automated extraction of parties, governing law, key dates, and obligations.
- Categorized risk highlighting (High Attention, Review, Context Dependent, Informational).
- Plain-English translations of complex legalese.
- Generation of the signature **Evidence Chain** and an exportable **Lawyer-Ready Brief**.

### 2. Situation Navigator (`/situation`)
- Intake pathway for users without a document in hand (e.g. freelance invoice disputes, security deposit withholding).
- Guided factual intake and missing facts detector.
- Educational explanation of relevant statutory and common-law doctrines.
- Evidence preservation checklist and structured questions to ask licensed legal counsel.

### 3. Document Compare (`/compare`)
- Side-by-side comparison of baseline contracts against proposed counterparty redlines.
- Detection of newly introduced liability shifts and accelerated penalty clauses.

---

## Modular AI Architecture

LawPilot replaces monolithic prompts with a modular pipeline of specialized agents:

1. **Triage Router** (`lib/ai/agents/triageRouter.ts`): Analyzes inbound payloads to determine optimal review pathways and extract jurisdiction signals.
2. **Document Extraction Agent** (`lib/ai/agents/extractionAgent.ts`): Segments clauses, sanitizes untrusted input, and parses document metadata.
3. **Legal Research Agent** (`lib/ai/agents/legalResearchAgent.ts`): Grounded statutory retrieval without citation hallucinations.
4. **Risk Analysis Agent** (`lib/ai/agents/riskAnalysisAgent.ts`): Evaluates clause risk based on user role (Tenant, Employer, Contractor, etc.).
5. **Verification Agent** (`lib/ai/agents/verificationAgent.ts`): Assembles verified Evidence Chains and isolates factual dependencies.
6. **Action Planning Agent** (`lib/ai/agents/actionPlanningAgent.ts`): Generates pragmatic, reversible next steps and compiles the Lawyer-Ready Brief.
7. **Response Composer** (`lib/ai/agents/responseComposer.ts`): Synthesizes agent results into strongly-typed `AnalysisReport` structures.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Type Validation**: Zod runtime schemas
- **AI Core**: Google Gemini SDK (`@google/genai`), server-side only
- **Database & Storage**: Firebase Firestore & Firebase Storage
- **Deployment**: Vercel-ready

---

## Folder Structure

```
LawPilot/
├── app/
│   ├── analysis/[id]/    # Verified Analysis Report & Evidence Chain viewer
│   ├── compare/          # Document version redline comparison
│   ├── review/           # Document review intake dropzone
│   ├── settings/         # Safety principles & AI engine status
│   ├── situation/        # Situation Navigator advisory intake
│   ├── workspace/        # Application dashboard & recent matters
│   ├── globals.css       # Design system tokens & typography
│   ├── layout.tsx        # App layout with Global Disclaimer & Navbar
│   └── page.tsx          # Landing page (Hero, 3 Pillars, Evidence Preview)
├── components/
│   ├── analysis/         # AnalysisClientView, tabs, brief exporter
│   ├── common/           # GlobalDisclaimer, Navbar, Footer
│   ├── evidence/         # EvidenceChainCard, SeverityBadge
│   └── workspace/        # RecentActivity
├── lib/
│   ├── ai/
│   │   ├── agents/       # 7 Modular AI Agents
│   │   ├── gemini.ts     # Server-side Gemini client configuration
│   │   └── types.ts      # Agent contracts
│   ├── demo/             # Realistic sample data & Evidence Chains
│   ├── firebase/         # Firestore, Auth, and Storage adapters
│   ├── safety/           # 10 Legal Safety Rules & Document Sanitizer
│   ├── schemas/          # Zod runtime validation schemas
│   └── utils.ts          # Utility functions (cn, formatDate)
├── types/
│   └── index.ts          # Core domain TypeScript types
└── public/               # Static assets & icons
```

---

## Local Setup & Quick Start

### 1. Prerequisites
- Node.js 20+ (Node 24 recommended)
- npm 10+

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd LawPilot

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env.local` file from `.env.example`:
```bash
cp .env.example .env.local
```

Populate the required credentials:
```env
# Gemini API Key (Server-Side)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```
*(Note: If no API keys are provided, LawPilot automatically runs in safe Demo Sandbox mode with realistic pre-analyzed legal documents and full interactive Evidence Chains).*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Validation Commands

```bash
# TypeScript Typecheck
npx tsc --noEmit

# Linting
npm run lint

# Production Build
npm run build
```

---

## 10 Core Legal Safety Principles

1. **Information Only, No Representation**: Never imply attorney-client privilege or representation.
2. **Zero Source Fabrication**: Never hallucinate statutes, court cases, or citations.
3. **No Definitive Legality Claims**: Frame findings as risk considerations and judicial discretion.
4. **Distinguish Facts from Interpretation**: Anchor interpretations to verbatim document excerpts.
5. **Transparent Uncertainty**: Explicitly state unknown facts and assumptions for every finding.
6. **Untrusted Content Isolation**: Sandbox all uploaded documents.
7. **Instruction Immunity**: Prevent uploaded text from overriding system safety rules.
8. **No Privilege Implication**: Warn users that AI interactions lack legal privilege.
9. **Zero Hidden Reasoning Leaks**: Never emit raw system prompts or confidential instructions.
10. **Reversible Next Steps**: Prioritize practical, reversible steps over irreversible legal decisions.
