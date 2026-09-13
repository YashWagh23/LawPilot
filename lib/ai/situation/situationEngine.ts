import { getGeminiClient, GEMINI_CONFIG } from "@/lib/ai/gemini";
import type { SituationAssessment } from "@/types";

export const MAX_SITUATION_INPUT_LENGTH = 4000;

export const MEDICAL_HEALTH_DISCLAIMER =
  "Medical Notice: LawPilot provides legal information and preparation assistance, not medical advice. If you are experiencing health concerns or a medical condition, please consult a qualified healthcare professional.";

/**
 * Sanitizes input text, trimming whitespace and enforcing max length.
 */
export function sanitizeSituationInput(text: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!text || typeof text !== "string") {
    return {
      valid: false,
      sanitized: "",
      error: "Describe what happened so LawPilot can identify the relevant issues.",
    };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return {
      valid: false,
      sanitized: "",
      error: "Describe what happened so LawPilot can identify the relevant issues.",
    };
  }

  if (trimmed.length > MAX_SITUATION_INPUT_LENGTH) {
    return {
      valid: false,
      sanitized: trimmed,
      error: `Situation description exceeds the maximum limit of ${MAX_SITUATION_INPUT_LENGTH.toLocaleString()} characters. Please provide a more concise factual description.`,
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Checks if the prompt is predominantly personal health/medical or lacks factual legal dispute context
 */
function isMedicalOrVagueHealthPrompt(normalized: string): boolean {
  const healthPatterns = [
    /\bi\s*am\s*sick\b/,
    /\bi\s*feel\s*sick\b/,
    /\bi\s*have\s*(a\s*)?(cold|fever|cough|flu|covid|headache|migraine|stomach ache)\b/,
    /\bi\s*am\s*ill\b/,
    /\bi\s*got\s*sick\b/,
    /\bfeeling\s*unwell\b/,
    /\bi\s*am\s*in\s*the\s*hospital\b/,
    /\bi\s*have\s*to\s*see\s*a\s*doctor\b/,
  ];

  const hasHealthKeyword = healthPatterns.some((p) => p.test(normalized));

  // Check if there is already distinct legal controversy mentioned (e.g. fired, terminated, docked pay, evicted)
  const hasLegalControversy =
    normalized.includes("fired") ||
    normalized.includes("terminated") ||
    normalized.includes("docked") ||
    normalized.includes("retaliat") ||
    normalized.includes("denied leave") ||
    normalized.includes("fmla violation") ||
    normalized.includes("sued") ||
    normalized.includes("discipline");

  return hasHealthKeyword && !hasLegalControversy;
}

/**
 * Checks if input lacks sufficient factual or legal dispute context
 */
function isVagueOrInsufficientPrompt(normalized: string): boolean {
  const disputeKeywords = [
    "contract",
    "agree",
    "sign",
    "work",
    "job",
    "employ",
    "boss",
    "client",
    "custom",
    "landlord",
    "tenant",
    "rent",
    "lease",
    "apart",
    "money",
    "$",
    "dollar",
    "invoic",
    "pay",
    "paid",
    "owe",
    "fire",
    "terminat",
    "sever",
    "injur",
    "damag",
    "refund",
    "sue",
    "court",
    "notic",
    "theft",
    "stole",
    "ip",
    "patent",
    "copyright",
    "trademark",
    "promis",
    "doctor",
    "hospit",
    "polic",
  ];

  const hasDisputeKeyword = disputeKeywords.some((k) => normalized.includes(k));
  if (!hasDisputeKeyword) {
    return true;
  }

  if (normalized.length < 25) {
    return true;
  }

  return false;
}

/**
 * Deterministic Assessment Generator
 * Provides grounded, safe, calibrated situation assessments when offline or during fallback
 */
export function generateDeterministicSituationAssessment(userPrompt: string): SituationAssessment {
  const norm = userPrompt.toLowerCase().trim();
  const now = new Date().toISOString();
  const baseId = `sit-${Date.now()}`;

  // 1. VAGUE / PERSONAL HEALTH / "I AM SICK" HANDLING
  if (isMedicalOrVagueHealthPrompt(norm) || isVagueOrInsufficientPrompt(norm)) {
    const isHealth = isMedicalOrVagueHealthPrompt(norm);
    return {
      id: `${baseId}-insufficient`,
      userPrompt,
      situationSummary: isHealth
        ? `You noted a personal health circumstance ("${userPrompt.trim()}"). At this stage, there is not enough factual or legal context to identify a legal controversy from that alone.`
        : `You entered: "${userPrompt.trim()}". The provided description does not yet contain enough factual detail to identify a legal dispute or contractual issue.`,
      identifiedCategory: "insufficient_information",
      disclaimer: isHealth ? MEDICAL_HEALTH_DISCLAIMER : undefined,
      jurisdictionEstimate: "Unspecified jurisdiction",
      missingFacts: [
        "Whether this situation affects your active employment, housing, or a commercial contract.",
        "Whether an employer, landlord, or counterparty has taken or threatened any adverse action.",
        "Whether any written policy (such as an employee handbook, sick leave policy, or lease) applies.",
      ],
      followUpQuestions: [
        {
          id: "fq-1",
          question: "Is this situation related to your workplace, employment, or sick leave?",
          whyItMatters:
            "Statutory labor provisions (such as FMLA or local sick leave ordinances) govern employee leave rights, but only if you are in an employment relationship.",
          responseType: "choice",
          options: ["Yes, related to employment", "No, unrelated to work", "Unsure"],
        },
        {
          id: "fq-2",
          question: "Has an employer, landlord, or other party taken or threatened any adverse action?",
          whyItMatters:
            "A legal claim or dispute typically requires an adverse action (such as termination, deduction of wages, or notice to quit).",
          responseType: "choice",
          options: ["Yes, adverse action threatened/taken", "No action taken yet", "Unsure"],
        },
        {
          id: "fq-3",
          question: "Is there a written agreement, employee handbook, or medical notice policy?",
          whyItMatters:
            "Written policies dictate procedures for notice, doctor's certificates, and leave authorization.",
          responseType: "choice",
          options: ["Yes, written policy exists", "No written policy", "Unsure"],
        },
      ],
      relevantLegalConcepts: isHealth
        ? [
            {
              concept: "Statutory Sick Leave & Medical Leave Frameworks",
              plainEnglishExplanation:
                "Laws such as the Family and Medical Leave Act (FMLA) or municipal paid sick leave rules may protect eligible employees from retaliation for authorized health-related absences.",
              caveat:
                "Protection depends on employer size, length of service, medical certification, and whether the condition qualifies under applicable statutes.",
            },
          ]
        : [],
      possibleOptions: [
        {
          title: isHealth
            ? "Prioritize Health & Review Written Workplace/Leave Policies"
            : "Review Any Written Agreements or Policies",
          pros: [
            isHealth ? "Addresses immediate well-being first" : "Identifies existing rights and remedies",
            "Clarifies formal call-in, notice, and certification deadlines before misunderstandings arise",
          ],
          risks: [
            "Missing notification deadlines established in written policies could lead to unexcused absence designations.",
          ],
          reversibility: "high",
        },
        {
          title: "Preserve All Written Communications",
          pros: [
            "Creates a clear chronological record of notifications and counterparty responses",
            "Low-effort and fully reversible preparation step",
          ],
          risks: ["None when maintaining factual, professional correspondence"],
          reversibility: "high",
        },
      ],
      evidenceToCollect: [
        "Written notifications sent to your employer, client, or counterparty",
        "Applicable company policies, employee handbook excerpts, or contractual clauses",
        isHealth ? "Medical visit summaries or doctor's notes if required by policy" : "Any relevant invoices, receipts, or messages",
      ],
      questionsForLawyer: [
        "What state or local statutory protections apply to medical leave or sick leave in my jurisdiction?",
        "What documentation is an employer legally permitted to demand before excusing a health-related absence?",
      ],
      actionChecklist: [
        {
          id: "ac-1",
          title: isHealth ? "Follow medical provider advice and prioritize recovery" : "Clarify the key facts of the dispute",
          description: isHealth ? "LawPilot does not provide medical advice. Ensure your health needs are met first." : "Write down what happened in chronological order.",
          priority: "high",
          isReversible: true,
          partyResponsible: "User",
          recommendedTimeline: "Immediately",
          practicalAdvice: isHealth ? "Consult a physician or medical professional." : "Organize facts by date.",
        },
        {
          id: "ac-2",
          title: "Check written notice procedures",
          description: "Review any contract or handbook terms regarding reporting absences or formal disputes.",
          priority: "medium",
          isReversible: true,
          partyResponsible: "User",
          recommendedTimeline: "Within 24 hours",
          practicalAdvice: "Locate digital or paper copy of agreement/handbook.",
        },
      ],
      createdAt: now,
    };
  }

  // 2. UNPAID FREELANCE INVOICE (e.g. Sample Scenario or keyword matches)
  const isFreelanceInvoice =
    norm.includes("invoice") ||
    norm.includes("freelance") ||
    norm.includes("contractor") ||
    norm.includes("unpaid") ||
    norm.includes("milestone") ||
    norm.includes("client owes") ||
    norm.includes("14,500");

  if (isFreelanceInvoice) {
    return {
      id: `${baseId}-invoice`,
      userPrompt,
      situationSummary:
        "Unpaid invoice or milestone payment for contract or freelance services rendered, with payment overdue and counterparty non-responsiveness.",
      identifiedCategory: "freelance_unpaid_invoice",
      jurisdictionEstimate: norm.includes("california") || norm.includes("texas")
        ? "Texas (Service Provider) / California (Client)"
        : "State/Jurisdiction of contracting parties",
      missingFacts: [
        "Exact legal entity structure of the non-paying client (LLC, Corporation, or Sole Proprietor).",
        "Whether written acceptance or objection was issued within the agreed review window.",
        "Whether the underlying agreement contains a choice-of-law or dispute resolution clause.",
      ],
      followUpQuestions: [
        {
          id: "fq-inv-1",
          question: "Does your written agreement or Statement of Work include a choice of governing law or venue clause?",
          whyItMatters:
            "Governing law determines which state's court has jurisdiction and whether prompt payment remedies or statutory interest apply.",
          responseType: "choice",
          options: ["Yes, specifies client jurisdiction", "Yes, specifies my jurisdiction", "No choice-of-law clause", "Unsure"],
        },
        {
          id: "fq-inv-2",
          question: "Did the contract include an attorney fee-shifting provision for the prevailing party?",
          whyItMatters:
            "Without an attorneys' fee provision or specific statutory entitlement, litigation costs can exceed small or mid-size invoice values.",
          responseType: "choice",
          options: ["Yes, prevailing party clause included", "No fee-shifting clause", "Unsure"],
        },
        {
          id: "fq-inv-3",
          question: "Did the client send any written objection or dispute regarding deliverable quality?",
          whyItMatters:
            "A delivered invoice with unobjected deliverables often establishes an 'account stated', reducing the evidentiary burden to enforce payment.",
          responseType: "choice",
          options: ["No objection was ever raised", "Client raised quality disputes", "Unsure"],
        },
      ],
      relevantLegalConcepts: [
        {
          concept: "Breach of Contract & Account Stated",
          plainEnglishExplanation:
            "When services are rendered and an invoice is retained without timely objection, courts may treat the debt as an 'account stated', which simplifies proving the entitlement to payment.",
          caveat: "Requires proof of delivery, receipt of invoice, and absence of timely factual dispute.",
        },
        {
          concept: "Pre-Suit Formal Demand & Statutory Fee Recovery",
          plainEnglishExplanation:
            "Many jurisdictions require or incentivize sending a formal written demand letter providing a cure period (e.g. 10 to 30 days) before initiating litigation or claiming statutory fees.",
          caveat: "Must comply with specific statutory notice delivery methods (e.g. certified mail).",
        },
      ],
      possibleOptions: [
        {
          title: "Transmit Formal Final Demand Letter with 10-Day Cure Notice",
          pros: [
            "Low cost and completely reversible pre-litigation step",
            "Creates documented evidentiary foundation of good-faith effort to collect",
            "Often prompts payment when forwarded to corporate finance/accounting leadership",
          ],
          risks: ["May cause the counterparty to formally articulate defensive counterclaims"],
          reversibility: "high",
        },
        {
          title: "Engage Licensed Counsel for Formal Demand on Law Firm Letterhead",
          pros: [
            "Demonstrates immediate readiness to enforce legal remedies",
            "Increases priority level within the counterparty's organization",
          ],
          risks: ["Requires modest upfront expenditure ($250-$750) for demand drafting"],
          reversibility: "moderate",
        },
        {
          title: "Evaluate Small Claims Court Filing in Relevant Jurisdiction",
          pros: [
            "Simplified procedural rules with no attorneys required in many jurisdictions",
            "Relatively nominal filing and service fees",
          ],
          risks: [
            "Out-of-state defendants may require judgment domestication or special service of process",
            "Subject to statutory monetary jurisdictional caps (typically $5,000–$12,500)",
          ],
          reversibility: "low",
        },
      ],
      evidenceToCollect: [
        "Signed Master Services Agreement, Statement of Work, or written purchase order",
        "Timestamped proof of deliverable transmission (email approvals, pull request merges, delivery receipts)",
        "Delivered invoices showing payment due dates and wire/ACH instructions",
        "Complete record of follow-up communications demonstrating lack of timely objection",
      ],
      questionsForLawyer: [
        "Which jurisdiction's small claims or district court has personal jurisdiction over the out-of-state debtor?",
        "Does statutory interest or attorney-fee recovery apply to this commercial services debt?",
      ],
      actionChecklist: [
        {
          id: "ac-inv-1",
          title: "Secure offline archival copies of all deliverable approvals and communications",
          description: "Download all Slack messages, email threads, and repository access logs to a secure location.",
          priority: "high",
          isReversible: true,
          partyResponsible: "User",
          recommendedTimeline: "Immediately",
          practicalAdvice: "Export chat channels and PDF attachments to an encrypted drive.",
        },
        {
          id: "ac-inv-2",
          title: "Issue formal written payment reminder with cure deadline",
          description: "Send professional written notice stating invoice number, amount due, and request for payment.",
          priority: "high",
          isReversible: true,
          partyResponsible: "User",
          recommendedTimeline: "Within 48 hours",
          practicalAdvice: "Keep language polite, neutral, and reference exact invoice numbers.",
        },
      ],
      createdAt: now,
    };
  }

  // 3. EMPLOYMENT DISPUTE
  const isEmployment =
    norm.includes("job") ||
    norm.includes("workplace") ||
    norm.includes("boss") ||
    norm.includes("employer") ||
    norm.includes("employee") ||
    norm.includes("terminated") ||
    norm.includes("fired") ||
    norm.includes("severance") ||
    norm.includes("wage") ||
    norm.includes("overtime") ||
    norm.includes("layoff");

  if (isEmployment) {
    return {
      id: `${baseId}-employment`,
      userPrompt,
      situationSummary:
        "Workplace employment dispute involving potential termination, severance, wage calculation, or contractual terms.",
      identifiedCategory: "employment_dispute",
      jurisdictionEstimate: "State or national jurisdiction where employment was performed",
      missingFacts: [
        "Whether you were classified as an exempt employee, non-exempt employee, or independent contractor.",
        "Whether a written employment contract, offer letter, or severance agreement exists.",
        "Whether there are specific statutory claims (such as unpaid final wages or retaliation).",
      ],
      followUpQuestions: [
        {
          id: "fq-emp-1",
          question: "Did you sign an employment agreement, arbitration clause, or severance release?",
          whyItMatters:
            "Arbitration clauses change the forum from public court to private arbitration; severance releases typically waive all past claims.",
          responseType: "choice",
          options: ["Yes, signed agreement", "No signed agreement", "Unsure"],
        },
        {
          id: "fq-emp-2",
          question: "Have you received your final paycheck and itemized paystubs?",
          whyItMatters:
            "Many jurisdictions enforce strict statutory penalties for late payment of final wages upon termination.",
          responseType: "choice",
          options: ["Yes, received final pay", "Not yet received", "Unsure"],
        },
        {
          id: "fq-emp-3",
          question: "Are there written performance reviews or contemporaneous communications documenting the dispute?",
          whyItMatters:
            "Contemporaneous written records are crucial for evaluating whether employer justifications are factual or pretextual.",
          responseType: "choice",
          options: ["Yes, documented in writing", "Only verbal discussions", "Unsure"],
        },
      ],
      relevantLegalConcepts: [
        {
          concept: "At-Will Employment vs. Statutory & Contractual Exceptions",
          plainEnglishExplanation:
            "In most U.S. states, employment is presumed at-will unless modified by an express agreement or prohibited by statutory public policy (e.g. anti-retaliation).",
          caveat: "Exceptions require clear evidence of contract breach or protected activity.",
        },
        {
          concept: "Timely Payment of Final Wages & Statutory Penalties",
          plainEnglishExplanation:
            "State labor codes often mandate that all earned wages and accrued PTO be paid immediately or within strict statutory windows upon separation.",
          caveat: "Deadlines and waiting-time penalty amounts differ widely by state.",
        },
      ],
      possibleOptions: [
        {
          title: "Request Formal Personnel File and Wage Statements",
          pros: [
            "Establishes statutory right to your employment records in many jurisdictions",
            "Low friction, fully reversible discovery step",
          ],
          risks: ["Signals formal preparation to employer HR/legal department"],
          reversibility: "high",
        },
        {
          title: "Review Severance Agreement Before Signing Release",
          pros: [
            "Preserves ability to negotiate terms or consulting extension",
            "Allows statutory review windows (e.g. 21/45 days under OWBPA where applicable) to be utilized",
          ],
          risks: ["Severance offers may have stated expiration dates"],
          reversibility: "high",
        },
      ],
      evidenceToCollect: [
        "Offer letter, employee handbook acknowledgments, and signed employment contracts",
        "Recent performance evaluations, commendations, and disciplinary notices",
        "Recent paystubs and final wage settlement statements",
        "Personal copies of relevant email/Slack communications (without violating trade secret policies)",
      ],
      questionsForLawyer: [
        "Does the severance release language adequately protect me, and can we negotiate improved consideration?",
        "Are there actionable statutory wage or retaliation claims based on the factual timeline?",
      ],
      actionChecklist: [
        {
          id: "ac-emp-1",
          title: "Secure personal copies of compensation and benefit documentation",
          description: "Ensure you have offline records of pay statements, insurance options, and offer terms.",
          priority: "high",
          isReversible: true,
          partyResponsible: "User",
          recommendedTimeline: "Immediately",
          practicalAdvice: "Download electronic paystubs to personal computer storage.",
        },
      ],
      createdAt: now,
    };
  }

  // 4. LANDLORD / TENANT
  const isLandlordTenant =
    norm.includes("landlord") ||
    norm.includes("tenant") ||
    norm.includes("lease") ||
    norm.includes("rent") ||
    norm.includes("deposit") ||
    norm.includes("eviction") ||
    norm.includes("apartment");

  if (isLandlordTenant) {
    return {
      id: `${baseId}-housing`,
      userPrompt,
      situationSummary:
        "Residential or commercial landlord-tenant matter involving lease terms, security deposit, maintenance, or tenancy rights.",
      identifiedCategory: "landlord_tenant",
      jurisdictionEstimate: "City, county, and state where rental property is situated",
      missingFacts: [
        "Whether you have a written lease agreement and its active term or expiration date.",
        "Whether formal written notice of repairs, termination, or deposit deduction was delivered.",
        "Local municipal rent stabilization or tenant protection ordinances that apply.",
      ],
      followUpQuestions: [
        {
          id: "fq-lt-1",
          question: "Did you receive or provide written notice conforming to the lease requirements?",
          whyItMatters:
            "Tenancy statutes require strict written notice methods (e.g. certified mail or personal service) for formal legal effect.",
          responseType: "choice",
          options: ["Yes, written notice provided", "No written notice", "Unsure"],
        },
        {
          id: "fq-lt-2",
          question: "Do you have timestamped photographic or inspection evidence of the premises condition?",
          whyItMatters:
            "Move-in/move-out condition records are the primary defense against improper security deposit deductions.",
          responseType: "choice",
          options: ["Yes, have photos/checklist", "No photos taken", "Unsure"],
        },
        {
          id: "fq-lt-3",
          question: "What is the status of rent payments and security deposit receipts?",
          whyItMatters:
            "Establishing that rent was paid on time prevents landlords from asserting non-payment claims during disputes.",
          responseType: "choice",
          options: ["Rent fully paid", "Rent currently withheld/disputed", "Unsure"],
        },
      ],
      relevantLegalConcepts: [
        {
          concept: "Statutory Security Deposit Return & Itemization Rules",
          plainEnglishExplanation:
            "Landlords are statutorily required to return deposits within strict statutory windows (typically 14 to 30 days) with itemized repair receipts.",
          caveat: "Failure to provide timely itemization may forfeit the landlord's right to withhold deposit funds.",
        },
        {
          concept: "Implied Warranty of Habitability",
          plainEnglishExplanation:
            "Residential leases imply a landlord duty to maintain the premises in habitable condition meeting health and safety codes.",
          caveat: "Tenants must provide proper notice and a reasonable repair period before withholding rent or repairing and deducting.",
        },
      ],
      possibleOptions: [
        {
          title: "Send Formal Written Notice of Dispute via Certified Mail",
          pros: [
            "Establishes statutory notice timeline required by local housing laws",
            "Creates clear proof of delivery without forfeiting tenancy rights",
          ],
          risks: ["May prompt landlord to seek legal consultation"],
          reversibility: "high",
        },
        {
          title: "Request Local Housing Authority or Mediation Assistance",
          pros: [
            "Low-cost or free local dispute resolution services",
            "Helps avoid court filing fees and adversarial litigation",
          ],
          risks: ["Mediation outcomes depend on voluntary compliance unless formalized"],
          reversibility: "high",
        },
      ],
      evidenceToCollect: [
        "Signed lease agreement and any amendments or addenda",
        "Timestamped move-in and move-out inspection checklists and photographs",
        "Complete record of maintenance requests and landlord replies",
        "Bank records showing cleared rent and security deposit payments",
      ],
      questionsForLawyer: [
        "What local rent stabilization or eviction protection ordinances govern this municipality?",
        "What statutory damages are available if a landlord wrongfully withholds a security deposit?",
      ],
      actionChecklist: [
        {
          id: "ac-lt-1",
          title: "Preserve photographic evidence and lease records",
          description: "Back up all photos of property condition and written communications with management.",
          priority: "high",
          isReversible: true,
          partyResponsible: "User",
          recommendedTimeline: "Immediately",
          practicalAdvice: "Take high-resolution photos with date metadata of any disputed areas.",
        },
      ],
      createdAt: now,
    };
  }

  // 5. GENERIC / OTHER LEGAL DISPUTE
  return {
    id: `${baseId}-other`,
    userPrompt,
    situationSummary:
      "Contractual or interpersonal dispute requiring factual clarification and identification of governing legal instruments.",
    identifiedCategory: "other",
    jurisdictionEstimate: "Jurisdiction of contracting parties or location of incident",
    missingFacts: [
      "The specific written or oral terms agreed to between the parties.",
      "Key dates, milestone deliverables, and financial amounts involved.",
      "Whether formal demand or notice of default has been transmitted.",
    ],
    followUpQuestions: [
      {
        id: "fq-gen-1",
        question: "Is there a signed written agreement governing this transaction or relationship?",
        whyItMatters:
          "Written agreements provide the baseline terms and often contain dispute resolution or limitation-of-liability clauses.",
        responseType: "choice",
        options: ["Yes, written contract", "Oral agreement only", "Unsure"],
      },
      {
        id: "fq-gen-2",
        question: "What specific resolution or financial remedy are you seeking?",
        whyItMatters:
          "Determines whether remedies involve specific performance, monetary damages, or mutual rescission.",
        responseType: "choice",
        options: ["Monetary refund/payment", "Performance of agreed obligation", "Contract cancellation", "Unsure"],
      },
      {
        id: "fq-gen-3",
        question: "Have you provided written notice of the issue to the counterparty?",
        whyItMatters:
          "Most agreements require formal notice of default with a cure period before formal remedies can be exercised.",
        responseType: "choice",
        options: ["Yes, written notice provided", "No written notice", "Unsure"],
      },
    ],
    relevantLegalConcepts: [
      {
        concept: "Contract Enforceability & Duty to Mitigate",
        plainEnglishExplanation:
          "An aggrieved party generally has a legal duty to take reasonable steps to minimize financial losses resulting from a breach.",
        caveat: "What is reasonable depends on specific commercial circumstances.",
      },
    ],
    possibleOptions: [
      {
        title: "Assemble Factual Timeline and Written Correspondence",
        pros: [
          "Organizes factual chronology before consulting legal counsel",
          "Completely reversible preparation step",
        ],
        risks: ["None"],
        reversibility: "high",
      },
      {
        title: "Transmit Written Clarification or Notice of Dispute",
        pros: [
          "Opens a documented channel for good-faith resolution",
          "Avoids premature litigation expenses",
        ],
        risks: ["May cause counterparty to retain legal counsel"],
        reversibility: "high",
      },
    ],
    evidenceToCollect: [
      "All relevant agreements, receipts, invoices, and written communications",
      "Chronological timeline of key dates, payments, and deliverables",
    ],
    questionsForLawyer: [
      "What are the applicable statutes of limitation for this type of dispute in our jurisdiction?",
      "What pre-suit notice requirements exist before taking formal enforcement action?",
    ],
    actionChecklist: [
      {
        id: "ac-gen-1",
        title: "Organize documentation into chronological order",
        description: "Collate contracts, payment receipts, and communications into a single folder.",
        priority: "medium",
        isReversible: true,
        partyResponsible: "User",
        recommendedTimeline: "Within 3 days",
        practicalAdvice: "Create a shared or local folder sorted chronologically with clear file labels.",
      },
    ],
    createdAt: now,
  };
}

/**
 * AI-powered Situation Navigator Engine
 * Calls Gemini when available with strict legal safety calibration, falling back to deterministic engine.
 */
export async function analyzeSituation(userPrompt: string): Promise<SituationAssessment> {
  const { valid, sanitized, error } = sanitizeSituationInput(userPrompt);
  if (!valid) {
    throw new Error(error || "Invalid situation description.");
  }

  const norm = sanitized.toLowerCase();

  // If prompt is specifically personal health or too vague, preserve responsible AI rules immediately
  if (isMedicalOrVagueHealthPrompt(norm) || isVagueOrInsufficientPrompt(norm)) {
    return generateDeterministicSituationAssessment(sanitized);
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    return generateDeterministicSituationAssessment(sanitized);
  }

  try {
    const prompt = `You are the Situation Navigator engine for LawPilot.
Tagline: Understand. Verify. Act.

The user does NOT have a contract uploaded. They have narrated a factual situation:
<user_situation>
${sanitized}
</user_situation>

CORE OBJECTIVE:
Provide a structured, balanced preliminary assessment that organizes the facts, identifies the likely category, highlights missing facts, and suggests 1-3 practical, reversible next steps.

STRICT LEGAL SAFETY RULES:
1. LawPilot provides legal information and preparation assistance, NEVER formal legal representation or definitive legal advice.
2. NEVER guarantee outcomes, invent statutes, invent cases, invent legal facts, or tell users to sue.
3. FORBIDDEN PHRASES: "This is illegal", "You will definitely win", "Your counterparty cannot do this", "You should sue", "This violates the law".
4. If the prompt is medical/personal health without an explicit legal controversy (e.g. "I am sick"), DO NOT invent a legal controversy. Classify as "insufficient_information", provide a medical notice disclaimer, and ask clarifying questions.
5. Prioritize REVERSIBLE next steps (e.g. gather evidence, request records, send factual notice).
6. Provide maximum 3 high-value clarifying questions and 1-3 practical next steps.

Return ONLY a valid JSON object matching this exact structure:
{
  "id": "sit-${Date.now()}",
  "userPrompt": "${sanitized.replace(/"/g, '\\"')}",
  "situationSummary": "A concise 1-2 sentence plain-English summary of what LawPilot understood from the facts.",
  "identifiedCategory": "employment_dispute" | "landlord_tenant" | "consumer_contract" | "freelance_unpaid_invoice" | "intellectual_property" | "business_partnership" | "insufficient_information" | "other",
  "jurisdictionEstimate": "Likely jurisdiction or 'Unspecified jurisdiction'",
  "disclaimer": "Optional medical or specific notice if applicable",
  "missingFacts": ["Fact 1", "Fact 2", "Fact 3"],
  "followUpQuestions": [
    {
      "id": "fq-1",
      "question": "Question text?",
      "whyItMatters": "Why this fact changes the legal analysis or remedies.",
      "responseType": "choice",
      "options": ["Option A", "Option B", "Unsure"]
    }
  ],
  "relevantLegalConcepts": [
    {
      "concept": "Name of legal principle",
      "plainEnglishExplanation": "Plain explanation without jargon",
      "caveat": "Important limitation or requirement"
    }
  ],
  "possibleOptions": [
    {
      "title": "Practical next step title",
      "pros": ["Pro 1", "Pro 2"],
      "risks": ["Risk 1"],
      "reversibility": "high" | "moderate" | "low"
    }
  ],
  "evidenceToCollect": ["Document/evidence 1", "Document/evidence 2"],
  "questionsForLawyer": ["Question 1", "Question 2"],
  "actionChecklist": [
    {
      "id": "ac-1",
      "title": "Action title",
      "description": "Practical details",
      "priority": "high" | "medium" | "low",
      "isReversible": true,
      "partyResponsible": "User",
      "recommendedTimeline": "Immediately"
    }
  ],
  "createdAt": "${new Date().toISOString()}"
}`;

    const response = await gemini.models.generateContent({
      model: GEMINI_CONFIG.defaultModel,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "";
    if (!responseText) {
      return generateDeterministicSituationAssessment(sanitized);
    }

    const parsed = JSON.parse(responseText) as SituationAssessment;

    // Sanitize safety
    if (parsed && parsed.identifiedCategory) {
      if (!parsed.situationSummary) {
        parsed.situationSummary = `Factual situation analysis regarding ${parsed.identifiedCategory.replace(/_/g, " ")}.`;
      }
      return parsed;
    }

    return generateDeterministicSituationAssessment(sanitized);
  } catch (err) {
    console.warn("Gemini situation analysis failed or timed out, falling back to deterministic engine:", err);
    return generateDeterministicSituationAssessment(sanitized);
  }
}
