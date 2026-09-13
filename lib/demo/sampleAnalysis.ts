import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";
import type {
  ActionPlan,
  AnalysisReport,
  Clause,
  DetailedLawyerBrief,
  DocumentMetadata,
  EvidenceChain,
  EvidenceLink,
  Finding,
  KeyDate,
  KeyFinancialTerm,
  LawyerBrief,
  SituationAssessment,
} from "@/types";

/**
 * Flagship Demo Document Metadata (India-First: Kavach Dynamics & Rohan Sharma)
 */
export const SAMPLE_DOCUMENT_METADATA: DocumentMetadata = {
  id: "demo-employment-agreement",
  title: "Employment & Proprietary Inventions Agreement",
  documentType: "employment_agreement",
  jurisdiction: "India",
  governingLaw: "Laws of the Republic of India and exclusive jurisdiction of the Courts in Mumbai, Maharashtra",
  jurisdictionContext: {
    country: "India",
    stateOrUT: "Maharashtra",
    governingLaw: "Laws of the Republic of India",
    confidence: "high",
    source: "document",
    evidence: [
      "Section 12 explicitly designates the laws of the Republic of India and submits to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra.",
      "Corporate Address: Platina Tower, Bandra-Kurla Complex (BKC), Bandra (East), Mumbai, Maharashtra 400051.",
      "Statutory & Regulatory Citations: Indian Contract Act, 1872 (§§ 27 & 74), Copyright Act, 1957 (§ 17(c)), and Arbitration and Conciliation Act, 1996 (§§ 11 & 12(5)).",
      "Currency & Entity Structure: Denominated in INR (₹) and executed by an Indian Private Limited Company (Pvt. Ltd.).",
    ],
  },
  effectiveDate: "2026-06-01",
  pageCount: 3,
  wordCount: 1320,
  uploadedAt: "2026-06-01T10:00:00Z",
  fileName: "employment_agreement_india_demo.pdf",
  fileSizeBytes: 68400,
  isUntrustedContent: true,
  parties: [
    {
      id: "party-kavach",
      name: "Kavach Dynamics Technologies Private Limited",
      role: "Employer",
      address: "Platina Tower, Level 8, Bandra-Kurla Complex (BKC), Bandra (East), Mumbai, Maharashtra 400051",
      jurisdiction: "Maharashtra, India",
      representationStatus: "represented",
    },
    {
      id: "party-rohan",
      name: "Rohan Sharma",
      role: "Employee",
      address: "Kalyani Nagar, Pune, Maharashtra 411006",
      jurisdiction: "Maharashtra, India",
      representationStatus: "unrepresented",
    },
  ],
};

export const SAMPLE_FINANCIAL_TERMS: KeyFinancialTerm[] = [
  {
    id: "fin-salary",
    label: "Annual Base Salary (Cost to Company - CTC)",
    amount: 3200000,
    formattedAmount: "₹32,00,000 / year",
    currency: "INR",
    category: "salary",
    conditions: "Payable in monthly installments in accordance with standard payroll schedule, subject to statutory EPF and tax deductions",
  },
  {
    id: "fin-training-reimbursement",
    label: "Early Departure Training Bond Repayment",
    amount: 450000,
    formattedAmount: "₹4,50,000",
    currency: "INR",
    category: "reimbursement",
    conditions: "Stipulated liquidated damages payable immediately if Employee resigns or departs within eighteen (18) months of Effective Date",
  },
];

export const SAMPLE_KEY_DATES: KeyDate[] = [
  {
    id: "date-effective",
    label: "Effective Date",
    date: "2026-06-01",
    description: "Commencement of employment tenure, intellectual property assignment, and contractual covenants",
  },
  {
    id: "date-probation",
    label: "Probationary Evaluation Period",
    date: "2026-08-30",
    description: "Initial ninety (90) calendar days performance evaluation window",
    noticePeriodDays: 90,
  },
  {
    id: "date-resignation-notice",
    label: "Resignation Notice Window",
    description: "Mandatory advance written notice required prior to voluntary departure (or salary in lieu thereof)",
    noticePeriodDays: 90,
  },
  {
    id: "date-retention-threshold",
    label: "Training Bond Repayment Expiration",
    date: "2027-11-30",
    description: "18-month tenure threshold after which the ₹4,50,000 training bond obligation lapses entirely",
  },
];

export const SAMPLE_CLAUSES: Clause[] = [
  {
    id: "clause-sec-1",
    section: "Section 1",
    title: "Position, Reporting, and Full-Time Devotion",
    rawText:
      "The Company hereby employs the Employee, and the Employee hereby accepts employment with the Company, in the position of Senior Distributed Systems Architect. The Employee shall report directly to the Chief Technology Officer at the Company's Mumbai headquarters and shall devote whole business time, attention, and professional energies exclusively to the business and affairs of the Company.",
    plainEnglish:
      "You are hired as Senior Distributed Systems Architect reporting to the CTO in Mumbai. You must work exclusively for the company during your employment.",
    category: "employment",
    pageNumber: 1,
    importance: "informational",
    sectionNumber: "Section 1",
  },
  {
    id: "clause-sec-2",
    section: "Section 2",
    title: "Compensation, Cost to Company, and Statutory Benefits",
    rawText:
      "As full remuneration for all services rendered under this Agreement, the Company shall pay to the Employee a total Cost-to-Company (CTC) of INR 32,00,000 (Rupees Thirty-Two Lakhs only) per annum, payable in equal monthly installments subject to statutory deductions including Employees' Provident Fund (EPF) and applicable income tax withholding under the Income Tax Act, 1961.",
    plainEnglish:
      "Your annual compensation (CTC) is ₹32,00,000 paid monthly, minus customary taxes and provident fund (EPF) deductions.",
    category: "payment",
    pageNumber: 1,
    importance: "informational",
    sectionNumber: "Section 2",
  },
  {
    id: "clause-sec-3",
    section: "Section 3",
    title: "Probationary Evaluation Period",
    rawText:
      "The Employee's tenure shall commence with a probationary evaluation period of ninety (90) calendar days from the Effective Date. During such probationary period, the Company shall assess the Employee's technical performance and suitability for regular employment confirmation.",
    plainEnglish:
      "The first 90 days are a probationary evaluation window during which the company reviews your performance before final confirmation.",
    category: "employment",
    pageNumber: 1,
    importance: "context_dependent",
    sectionNumber: "Section 3",
  },
  {
    id: "clause-sec-5",
    section: "Section 5",
    title: "Resignation Notice Period and Recovery",
    rawText:
      "To ensure operational continuity of core distributed banking infrastructure, the Employee agrees to provide not less than ninety (90) calendar days advance written notice prior to any voluntary resignation. In the event the Employee seeks immediate departure without serving the full notice window, the Company reserves the absolute right to deduct salary in lieu of notice from full and final settlement.",
    plainEnglish:
      "You must provide at least 90 calendar days (3 months) written notice before resigning. If you leave early, the company claims the right to deduct unserved notice pay from your final settlement.",
    category: "notice",
    pageNumber: 1,
    importance: "review",
    sectionNumber: "Section 5",
  },
  {
    id: "clause-sec-6",
    section: "Section 6",
    title: "Early Departure & Specialized Training Bond",
    rawText:
      "In consideration of the Company providing proprietary enterprise cloud architecture training valued at INR 4,50,000 during the initial tenure, the Employee covenants that if the Employee resigns or departs from service for any reason prior to completing eighteen (18) continuous months from the Effective Date, the Employee shall immediately reimburse to the Company the fixed sum of INR 4,50,000 (Rupees Four Lakh Fifty Thousand only) as liquidated damages and training expense recovery, and the Company is irrevocably authorized to deduct such amount from the Employee's accrued salary, earned leave encashment, and terminal dues.",
    plainEnglish:
      "If you resign for any reason within your first 18 months, you must pay back a flat ₹4,50,000 for training, and the company claims the right to deduct it directly from your final salary settlement.",
    category: "payment",
    pageNumber: 2,
    importance: "high_attention",
    sectionNumber: "Section 6",
  },
  {
    id: "clause-sec-7",
    section: "Section 7",
    title: "Confidentiality and Trade Secrets",
    rawText:
      "The Employee shall hold in strict secrecy all proprietary algorithms, system schematics, cryptographic architectures, customer datasets, and business trade secrets of the Company. This obligation of confidentiality shall survive indefinitely following the cessation of employment.",
    plainEnglish:
      "You cannot disclose or share company trade secrets, system architecture, or customer data with anyone, even after you leave.",
    category: "confidentiality",
    pageNumber: 2,
    importance: "context_dependent",
    sectionNumber: "Section 7",
  },
  {
    id: "clause-sec-8",
    section: "Section 8",
    title: "Comprehensive Intellectual Property Assignment",
    rawText:
      "The Employee hereby irrevocably assigns and transfers to the Company all right, title, and interest throughout the world in and to any and all software code, inventions, discoveries, architectural designs, algorithms, and improvements conceived, authored, or reduced to practice during the term of employment, whether or not during regular working hours, and whether or not utilizing Company hardware, servers, or facilities.",
    plainEnglish:
      "The company claims complete ownership of everything you program or invent while employed, even software written on your own personal laptop outside work hours.",
    category: "intellectual_property",
    pageNumber: 2,
    importance: "high_attention",
    sectionNumber: "Section 8",
  },
  {
    id: "clause-sec-9",
    section: "Section 9",
    title: "Post-Employment Restrictive Covenant (Non-Compete)",
    rawText:
      "For a period of twelve (12) months following termination of employment for any reason whatsoever, the Employee shall not, anywhere within the territory of the Republic of India, directly or indirectly engage in, perform consulting or engineering services for, advise, or hold equity in any enterprise, company, or startup offering competing distributed cloud infrastructure or high-throughput financial database systems.",
    plainEnglish:
      "For 1 full year after leaving, the contract says you cannot work for or advise any competing cloud or database technology company anywhere in India.",
    category: "restriction",
    pageNumber: 2,
    importance: "high_attention",
    sectionNumber: "Section 9",
  },
  {
    id: "clause-sec-11",
    section: "Section 11",
    title: "Dispute Resolution & Unilateral Arbitrator Appointment",
    rawText:
      "Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved through final and binding arbitration in Mumbai under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator appointed exclusively by the Managing Director of the Company. The parties shall bear arbitrator fees and administrative costs equally. The seat and venue of arbitration shall be Mumbai.",
    plainEnglish:
      "All disputes must go to arbitration in Mumbai rather than court. The company's Managing Director unilaterally appoints the sole arbitrator, and you must pay half the arbitration fees.",
    category: "dispute_resolution",
    pageNumber: 3,
    importance: "review",
    sectionNumber: "Section 11",
  },
  {
    id: "clause-sec-12",
    section: "Section 12",
    title: "Governing Law and Jurisdiction",
    rawText:
      "This Agreement shall be construed, interpreted, and governed exclusively in accordance with the substantive laws of the Republic of India. Subject to Section 11, the competent courts having ordinary original civil jurisdiction in Mumbai, Maharashtra shall have exclusive jurisdiction over any matters or disputes arising hereunder.",
    plainEnglish:
      "Indian law governs this agreement, and any legal proceedings must take place in the courts of Mumbai, Maharashtra.",
    category: "jurisdiction",
    pageNumber: 3,
    importance: "context_dependent",
    sectionNumber: "Section 12",
  },
];

export const SAMPLE_EVIDENCE_LINKS: EvidenceLink[] = [
  {
    findingId: "finding-emp-1",
    documentId: "demo-employment-agreement",
    clauseId: "clause-sec-6",
    pageNumber: 2,
    section: "Section 6",
    quotedText:
      "if the Employee resigns or departs from service for any reason prior to completing eighteen (18) continuous months from the Effective Date, the Employee shall immediately reimburse to the Company the fixed sum of INR 4,50,000 (Rupees Four Lakh Fifty Thousand only) as liquidated damages and training expense recovery, and the Company is irrevocably authorized to deduct such amount from the Employee's accrued salary",
  },
  {
    findingId: "finding-emp-2",
    documentId: "demo-employment-agreement",
    clauseId: "clause-sec-5",
    pageNumber: 1,
    section: "Section 5",
    quotedText:
      "Employee agrees to provide not less than ninety (90) calendar days advance written notice prior to any voluntary resignation. In the event the Employee seeks immediate departure without serving the full notice window, the Company reserves the absolute right to deduct salary in lieu of notice from full and final settlement.",
  },
  {
    findingId: "finding-emp-3",
    documentId: "demo-employment-agreement",
    clauseId: "clause-sec-8",
    pageNumber: 2,
    section: "Section 8",
    quotedText:
      "assigns and transfers to the Company all right, title, and interest throughout the world in and to any and all software code, inventions, discoveries... conceived, authored, or reduced to practice during the term of employment, whether or not during regular working hours, and whether or not utilizing Company hardware, servers, or facilities.",
  },
  {
    findingId: "finding-emp-4",
    documentId: "demo-employment-agreement",
    clauseId: "clause-sec-9",
    pageNumber: 2,
    section: "Section 9",
    quotedText:
      "For a period of twelve (12) months following termination of employment for any reason whatsoever, the Employee shall not, anywhere within the territory of the Republic of India, directly or indirectly engage in, perform consulting or engineering services for, advise, or hold equity in any enterprise... offering competing distributed cloud infrastructure",
  },
  {
    findingId: "finding-emp-5",
    documentId: "demo-employment-agreement",
    clauseId: "clause-sec-11",
    pageNumber: 3,
    section: "Section 11",
    quotedText:
      "resolved through final and binding arbitration in Mumbai under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator appointed exclusively by the Managing Director of the Company. The parties shall bear arbitrator fees and administrative costs equally.",
  },
];

export const SAMPLE_FINDINGS: Finding[] = [
  {
    id: "finding-emp-1",
    title: "Early departure training bond reimbursement (₹4,50,000) raises Section 74 considerations",
    category: "Financial & Termination Obligations",
    severity: "high_attention",
    description:
      "Section 6 obligates the employee to pay a flat ₹4,50,000 if resigning within 18 months, and authorizes deductions from final salary and settlement.",
    whyItMatters:
      "Under Indian law, an employment bond cannot impose a punitive penalty; reimbursement is legally enforceable only to the extent of actual, reasonable expenses proved by the employer.",
    clauseId: "clause-sec-6",
    evidence: SAMPLE_EVIDENCE_LINKS[0],
    uncertainties: [
      "Whether the employer actually incurs ₹4,50,000 in documented third-party specialized training expenditures.",
      "Whether the company provides verifiable external credentials or internal onboarding.",
    ],
  },
  {
    id: "finding-emp-2",
    title: "90-day resignation notice period with unilateral salary deduction",
    category: "Notice Requirements",
    severity: "review",
    description:
      "Section 5 mandates 90 calendar days advance written notice prior to voluntary resignation, and authorizes salary withholding in lieu of notice.",
    whyItMatters:
      "A 3-month notice period can create friction when negotiating new employment opportunities, as tech employers commonly seek joining timelines of 30 to 60 days.",
    clauseId: "clause-sec-5",
    evidence: SAMPLE_EVIDENCE_LINKS[1],
    uncertainties: [
      "Whether the company customarily permits notice buyout or requires serving the entire 90-day duration.",
    ],
  },
  {
    id: "finding-emp-3",
    title: "Broad IP assignment captures personal off-duty creations and open-source contributions",
    category: "Intellectual Property Ownership",
    severity: "high_attention",
    description:
      "Section 8 claims company ownership over all software and inventions developed during the term of employment, even outside work hours on personal equipment.",
    whyItMatters:
      "Under Section 17(c) of the Copyright Act, 1957, employer ownership is statutorily presumed for works created in the course of employment; assigning personal hobby code or independent open-source contributions exceeds customary norms.",
    clauseId: "clause-sec-8",
    evidence: SAMPLE_EVIDENCE_LINKS[2],
    uncertainties: [
      "Whether the company provides a Prior Inventions Schedule (Exhibit A) to exclude pre-existing personal codebases and personal side projects.",
    ],
  },
  {
    id: "finding-emp-4",
    title: "12-month nationwide post-employment non-compete raises Section 27 invalidity questions",
    category: "Restrictive Covenants",
    severity: "high_attention",
    description:
      "Section 9 restricts competitive employment across the entire territory of India for 12 months following termination.",
    whyItMatters:
      "Under Section 27 of the Indian Contract Act, 1872 and Supreme Court precedents (Percept D'Mark v. Zaheer Khan), agreements in restraint of lawful profession or trade are void ab initio post-termination.",
    clauseId: "clause-sec-9",
    evidence: SAMPLE_EVIDENCE_LINKS[3],
    uncertainties: [
      "While post-employment non-competes are void under Section 27, in-term restrictions and non-solicitation or trade secret non-disclosure covenants remain enforceable.",
    ],
  },
  {
    id: "finding-emp-5",
    title: "Mandatory arbitration with unilateral sole arbitrator appointment",
    category: "Dispute Resolution & Forum",
    severity: "review",
    description:
      "Section 11 stipulates arbitration in Mumbai with a sole arbitrator appointed exclusively by the Company's Managing Director, with costs split equally.",
    whyItMatters:
      "Under the Arbitration and Conciliation Act, 1996 and Supreme Court precedent (Perkins Eastman), a party with an interest in the dispute cannot unilaterally appoint a sole arbitrator.",
    clauseId: "clause-sec-11",
    evidence: SAMPLE_EVIDENCE_LINKS[4],
    uncertainties: [
      "Whether the parties would mutually agree on an institutional arbitrator (e.g., MCIA) if a dispute arises.",
    ],
  },
];

export const SAMPLE_EVIDENCE_CHAINS: EvidenceChain[] = [
  {
    id: "chain-emp-1",
    jurisdictionContext: {
      country: "India",
      stateOrUT: "Maharashtra",
      governingLaw: "Laws of the Republic of India",
      confidence: "high",
      source: "document",
    },
    finding: SAMPLE_FINDINGS[0],
    documentEvidence: {
      clauseId: "clause-sec-6",
      section: "Section 6",
      pageNumber: 2,
      quotedText:
        "if the Employee resigns or departs from service for any reason prior to completing eighteen (18) continuous months from the Effective Date, the Employee shall immediately reimburse to the Company the fixed sum of INR 4,50,000 (Rupees Four Lakh Fifty Thousand only) as liquidated damages and training expense recovery, and the Company is irrevocably authorized to deduct such amount from the Employee's accrued salary",
      sourceType: "document",
      exactQuote:
        "if the Employee resigns or departs from service for any reason prior to completing eighteen (18) continuous months from the Effective Date, the Employee shall immediately reimburse to the Company the fixed sum of INR 4,50,000 (Rupees Four Lakh Fifty Thousand only) as liquidated damages and training expense recovery, and the Company is irrevocably authorized to deduct such amount from the Employee's accrued salary",
    },
    legalClaims: [
      {
        id: "claim-ica-74-1",
        findingId: "finding-emp-1",
        claim: "Under Section 74 of the Indian Contract Act, 1872, an employment bond stipulating a fixed recovery sum serves as an upper ceiling, requiring the employer to prove actual reasonable expenses incurred rather than enforcing a punitive forfeiture.",
        sourceIds: ["source-ica-section-74"],
        supportLevel: "direct",
        explanation: "Indian courts require employers to substantiate actual expenditure on specialized employee training; a fixed penalty without proof of actual loss or monthly pro-rata amortization is legally vulnerable.",
        uncertainties: [
          "Whether the employer can substantiate ₹4,50,000 in genuine third-party training invoices versus ordinary internal onboarding.",
        ],
        jurisdiction: "India",
        jurisdictionContext: {
          country: "India",
          stateOrUT: "Maharashtra",
          confidence: "high",
          source: "document",
        },
        verified: true,
      },
      {
        id: "claim-kailash-nath-1",
        findingId: "finding-emp-1",
        claim: "Supreme Court jurisprudence establishes that where actual damage or loss is capable of proof, such proof cannot be dispensed with under Section 74.",
        sourceIds: ["source-sci-kailash-nath"],
        supportLevel: "strong",
        explanation: "Kailash Nath Associates v. DDA reaffirms that reasonable compensation must be established based on actual loss suffered.",
        uncertainties: [
          "Whether the employer would seek recovery through salary deductions at full and final settlement or initiate formal recovery proceedings.",
        ],
        jurisdiction: "India",
        jurisdictionContext: {
          country: "India",
          confidence: "high",
          source: "document",
        },
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-ica-section-74",
        title: "Indian Contract Act, 1872 § 74 (Compensation for Breach of Contract where Penalty Stipulated for)",
        publisher: "Ministry of Law and Justice, Government of India (India Code)",
        sourceType: "official_legislation",
        citation: "Indian Contract Act, 1872 § 74",
        jurisdiction: "India",
        url: "https://www.indiacode.nic.in/handle/123456789/2187",
        sourceUrl: "https://www.indiacode.nic.in/handle/123456789/2187",
        relevance: "Governs the enforceability of liquidated damages, training bonds, and employee clawback stipulations",
        retrievedAt: "2026-03-01T00:00:00Z",
        publicationDate: "1872-04-25",
        verificationStatus: "verified",
        excerpt:
          "When a contract has been broken, if a sum is named in the contract as the amount to be paid in case of such breach, or if the contract contains any other stipulation by way of penalty, the party complaining of the breach is entitled, whether or not actual damage or loss is proved to have been caused thereby, to receive from the party who has broken the contract reasonable compensation not exceeding the amount so named or, as the case may be, the penalty stipulated for.",
        relevantExcerpt:
          "The party complaining of the breach is entitled... to receive from the party who has broken the contract reasonable compensation not exceeding the amount so named or, as the case may be, the penalty stipulated for.",
        notes: "The stipulated amount in an employment bond serves strictly as a ceiling; courts only award reasonable compensation reflecting actual documented expenditure on specialized training.",
        authorityType: "statute",
      },
      {
        id: "source-sci-kailash-nath",
        title: "Kailash Nath Associates v. Delhi Development Authority (Supreme Court of India)",
        publisher: "Supreme Court of India",
        sourceType: "official_court",
        citation: "Kailash Nath Associates v. Delhi Development Authority, (2015) 4 SCC 136",
        jurisdiction: "India",
        url: "https://main.sci.gov.in/",
        sourceUrl: "https://main.sci.gov.in/",
        relevance: "Authoritative Supreme Court precedent on proof of actual loss under Section 74 of the Indian Contract Act",
        retrievedAt: "2026-02-15T00:00:00Z",
        publicationDate: "2015-01-09",
        verificationStatus: "verified",
        excerpt:
          "Where it is possible to prove actual damage or loss, such proof is not dispensed with. It is only in cases where damage or loss is difficult or impossible to prove that the liquidated amount named in the contract, if a genuine pre-estimate of damage or loss, can be awarded.",
        relevantExcerpt:
          "Where it is possible to prove actual damage or loss, such proof is not dispensed with.",
        notes: "In employment bonds, employers must substantiate actual training expenditure incurred on the employee; flat penalty clawbacks without proof of loss or pro-rata amortization are unenforceable.",
        authorityType: "case_law",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-ica-section-74",
        claimId: "claim-ica-74-1",
        citation: "Indian Contract Act, 1872 § 74",
        relevantExcerpt: "The party complaining of the breach is entitled... to receive from the party who has broken the contract reasonable compensation not exceeding the amount so named or, as the case may be, the penalty stipulated for.",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "verified",
      verifiedAt: "2026-06-01T10:20:00Z",
      issues: [],
      confidenceLevel: "high",
    },
    uncertainties: [
      "Whether the training provided involves third-party transferable credentials or internal company onboarding.",
      "Whether the employer will agree to monthly pro-rata reduction of the training bond liability.",
    ],
    nextSteps: [
      {
        id: "act-emp-1",
        title: "Request Pro-Rata Monthly Amortization & Training Expense Invoices",
        description:
          "Propose that the ₹4,50,000 reimbursement reduces by 1/18th (₹25,000) for each completed month of service, and applies strictly to external accredited certification receipts.",
        priority: "high",
        partyResponsible: "Employee (Rohan Sharma)",
        isReversible: true,
        recommendedTimeline: "Before signing offer",
        practicalAdvice:
          "Say: 'I am committed to long-term tenure at Kavach Dynamics. Standard industry practice under Indian contract law is for training commitments to amortize monthly across the tenure.'",
      },
    ],
  },
  {
    id: "chain-emp-2",
    jurisdictionContext: {
      country: "India",
      stateOrUT: "Maharashtra",
      governingLaw: "Laws of the Republic of India",
      confidence: "high",
      source: "document",
    },
    finding: SAMPLE_FINDINGS[3],
    documentEvidence: {
      clauseId: "clause-sec-9",
      section: "Section 9",
      pageNumber: 2,
      quotedText:
        "For a period of twelve (12) months following termination of employment for any reason whatsoever, the Employee shall not, anywhere within the territory of the Republic of India, directly or indirectly engage in, perform consulting or engineering services for, advise, or hold equity in any enterprise... offering competing distributed cloud infrastructure",
      sourceType: "document",
      exactQuote:
        "For a period of twelve (12) months following termination of employment for any reason whatsoever, the Employee shall not, anywhere within the territory of the Republic of India, directly or indirectly engage in, perform consulting or engineering services for, advise, or hold equity in any enterprise... offering competing distributed cloud infrastructure",
    },
    legalClaims: [
      {
        id: "claim-ica-27-1",
        findingId: "finding-emp-4",
        claim: "Under Section 27 of the Indian Contract Act, 1872, every agreement by which anyone is restrained from exercising a lawful profession, trade, or business is to that extent void ab initio.",
        sourceIds: ["source-ica-section-27"],
        supportLevel: "direct",
        explanation: "Unlike common law jurisdictions such as the US or UK that evaluate non-competes under a reasonableness test, Indian statutory law under Section 27 invalidates post-employment non-compete covenants completely.",
        uncertainties: [
          "While post-employment covenants are void, in-term restrictions during active employment and non-solicitation covenants remain valid.",
        ],
        jurisdiction: "India",
        verified: true,
      },
      {
        id: "claim-percept-dmark-1",
        findingId: "finding-emp-4",
        claim: "The Supreme Court of India in Percept D'Mark v. Zaheer Khan affirmed that restrictive covenants extending beyond the term of employment are void and unenforceable under Section 27.",
        sourceIds: ["source-sci-percept-dmark"],
        supportLevel: "strong",
        explanation: "The doctrine of restraint of trade does not recognize post-employment restrictions against employees, regardless of geography or duration.",
        uncertainties: [
          "The company may still attempt to enforce confidentiality and trade secret non-disclosure to prevent joining direct competitors.",
        ],
        jurisdiction: "India",
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-ica-section-27",
        title: "Indian Contract Act, 1872 § 27 (Agreement in Restraint of Trade Void)",
        publisher: "Ministry of Law and Justice, Government of India (India Code)",
        sourceType: "official_legislation",
        citation: "Indian Contract Act, 1872 § 27",
        jurisdiction: "India",
        url: "https://www.indiacode.nic.in/handle/123456789/2187",
        sourceUrl: "https://www.indiacode.nic.in/handle/123456789/2187",
        relevance: "Statutory bar rendering post-employment restrictive covenants in restraint of trade void ab initio",
        retrievedAt: "2026-03-01T00:00:00Z",
        publicationDate: "1872-04-25",
        verificationStatus: "verified",
        excerpt:
          "Every agreement by which any one is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void. Exception 1.—Saving of agreement not to carry on business of which good-will is sold.",
        relevantExcerpt:
          "Every agreement by which any one is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void.",
        notes: "Indian courts strictly refuse to enforce post-employment non-compete agreements against employees under Section 27.",
        authorityType: "statute",
      },
      {
        id: "source-sci-percept-dmark",
        title: "Percept D'Mark (India) Pvt. Ltd. v. Zaheer Khan (Supreme Court of India)",
        publisher: "Supreme Court of India",
        sourceType: "official_court",
        citation: "Percept D'Mark (India) Pvt. Ltd. v. Zaheer Khan & Anr., (2006) 4 SCC 227",
        jurisdiction: "India",
        url: "https://main.sci.gov.in/",
        sourceUrl: "https://main.sci.gov.in/",
        relevance: "Landmark ruling confirming post-contractual covenants restraining trade or employment are invalid under Section 27",
        retrievedAt: "2026-02-15T00:00:00Z",
        publicationDate: "2006-03-22",
        verificationStatus: "verified",
        excerpt:
          "Under Section 27 of the Contract Act, a restrictive covenant extending beyond the term of the agreement is void and not enforceable. The doctrine of restraint of trade does not apply during the continuance of the contract for employment and it applies only when the contract comes to an end.",
        relevantExcerpt:
          "Under Section 27 of the Contract Act, a restrictive covenant extending beyond the term of the agreement is void and not enforceable.",
        notes: "Reaffirms that post-employment restrictions are legally invalid under Section 27.",
        authorityType: "case_law",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-ica-section-27",
        claimId: "claim-ica-27-1",
        citation: "Indian Contract Act, 1872 § 27",
        relevantExcerpt: "Every agreement by which any one is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void.",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "verified",
      verifiedAt: "2026-06-01T10:20:00Z",
      issues: [],
      confidenceLevel: "high",
    },
    uncertainties: [
      "While post-employment non-compete covenants are void in India, employers frequently rely on in-term negative covenants and trade secret protection.",
    ],
    nextSteps: [
      {
        id: "act-emp-2",
        title: "Clarify Non-Compete Scope & Emphasize Confidentiality Boundaries",
        description:
          "Advise employer that Section 27 of the Indian Contract Act renders post-employment non-competes void, and propose replacing Section 9 with robust non-solicitation of clients and trade secret confidentiality.",
        priority: "high",
        partyResponsible: "Employee",
        isReversible: true,
        recommendedTimeline: "Before signing agreement",
        practicalAdvice:
          "Frame this cooperatively: 'To align with Indian statutory requirements under Section 27, let us replace the post-employment restriction with clear client non-solicitation and data protection covenants.'",
      },
    ],
  },
  {
    id: "chain-emp-3",
    jurisdictionContext: {
      country: "India",
      stateOrUT: "Maharashtra",
      governingLaw: "Laws of the Republic of India",
      confidence: "high",
      source: "document",
    },
    finding: SAMPLE_FINDINGS[2],
    documentEvidence: {
      clauseId: "clause-sec-8",
      section: "Section 8",
      pageNumber: 2,
      quotedText:
        "assigns and transfers to the Company all right, title, and interest throughout the world in and to any and all software code, inventions, discoveries... conceived, authored, or reduced to practice during the term of employment, whether or not during regular working hours, and whether or not utilizing Company hardware, servers, or facilities.",
      sourceType: "document",
      exactQuote:
        "assigns and transfers to the Company all right, title, and interest throughout the world in and to any and all software code, inventions, discoveries... conceived, authored, or reduced to practice during the term of employment, whether or not during regular working hours, and whether or not utilizing Company hardware, servers, or facilities.",
    },
    legalClaims: [
      {
        id: "claim-copyright-17c-1",
        findingId: "finding-emp-3",
        claim: "Under Section 17(c) of the Copyright Act, 1957, employer first-ownership is statutorily limited to works made in the course of the author's employment under a contract of service.",
        sourceIds: ["source-copyright-act-17c"],
        supportLevel: "direct",
        explanation: "Works authored outside working hours without company hardware or trade secret data do not automatically fall under the 'course of employment' statutory presumption.",
        uncertainties: [
          "Whether the employee maintains pre-existing open-source software libraries or personal developer utilities.",
        ],
        jurisdiction: "India",
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-copyright-act-17c",
        title: "Copyright Act, 1957 § 17(c) (First Owner of Copyright in Works of Employment)",
        publisher: "Copyright Office, Government of India (India Code)",
        sourceType: "official_legislation",
        citation: "Copyright Act, 1957 § 17(c)",
        jurisdiction: "India",
        url: "https://copyright.gov.in/",
        sourceUrl: "https://copyright.gov.in/",
        relevance: "Governs statutory ownership of copyright works created under a contract of service vs personal creations",
        retrievedAt: "2026-02-20T00:00:00Z",
        publicationDate: "1957-06-04",
        verificationStatus: "verified",
        excerpt:
          "In the case of a work made in the course of the author's employment under a contract of service or apprenticeship, the employer shall, in the absence of any agreement to the contrary, be the first owner of the copyright therein.",
        relevantExcerpt:
          "In the case of a work made in the course of the author's employment under a contract of service or apprenticeship, the employer shall... be the first owner of the copyright therein.",
        notes: "The statutory presumption of employer ownership is restricted to works made 'in the course of employment'; works created on employee's own personal time without company resources require explicit valid assignment.",
        authorityType: "statute",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-copyright-act-17c",
        claimId: "claim-copyright-17c-1",
        citation: "Copyright Act, 1957 § 17(c)",
        relevantExcerpt: "In the case of a work made in the course of the author's employment under a contract of service or apprenticeship, the employer shall... be the first owner of the copyright therein.",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "verified",
      verifiedAt: "2026-06-01T10:20:00Z",
      issues: [],
      confidenceLevel: "high",
    },
    uncertainties: [
      "Whether the employee has an inventory of pre-existing personal GitHub repositories to attach as Exhibit A.",
    ],
    nextSteps: [
      {
        id: "act-emp-3",
        title: "Attach Exhibit A (Prior Inventions Schedule) for Personal Software",
        description:
          "Insert a standard Prior Inventions Schedule and clarify that personal off-duty projects created without Company resources or proprietary data remain Employee property.",
        priority: "high",
        partyResponsible: "Employee",
        isReversible: true,
        recommendedTimeline: "Before execution",
        practicalAdvice:
          "List all personal open-source projects, tools, and technical articles on Exhibit A prior to signing.",
      },
    ],
  },
  {
    id: "chain-emp-4",
    jurisdictionContext: {
      country: "India",
      stateOrUT: "Maharashtra",
      governingLaw: "Laws of the Republic of India",
      confidence: "high",
      source: "document",
    },
    finding: SAMPLE_FINDINGS[4],
    documentEvidence: {
      clauseId: "clause-sec-11",
      section: "Section 11",
      pageNumber: 3,
      quotedText:
        "resolved through final and binding arbitration in Mumbai under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator appointed exclusively by the Managing Director of the Company. The parties shall bear arbitrator fees and administrative costs equally.",
      sourceType: "document",
      exactQuote:
        "resolved through final and binding arbitration in Mumbai under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator appointed exclusively by the Managing Director of the Company. The parties shall bear arbitrator fees and administrative costs equally.",
    },
    legalClaims: [
      {
        id: "claim-arb-perkins-1",
        findingId: "finding-emp-5",
        claim: "Under the Arbitration and Conciliation Act, 1996 and Supreme Court precedent in Perkins Eastman Architects, an interested party cannot unilaterally appoint a sole arbitrator.",
        sourceIds: ["source-sci-perkins-eastman", "source-arbitration-act-12-5"],
        supportLevel: "direct",
        explanation: "Clauses giving an employer or its Managing Director exclusive authority to nominate the sole arbitrator violate Section 12(5) neutrality requirements.",
        uncertainties: [
          "Whether the employer would agree to institutional appointment through an independent forum such as the Mumbai Centre for International Arbitration (MCIA).",
        ],
        jurisdiction: "India",
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-arbitration-act-12-5",
        title: "Arbitration and Conciliation Act, 1996 § 12(5) & Seventh Schedule",
        publisher: "Ministry of Law and Justice, Government of India (India Code)",
        sourceType: "official_legislation",
        citation: "Arbitration and Conciliation Act, 1996 § 12(5)",
        jurisdiction: "India",
        url: "https://www.indiacode.nic.in/handle/123456789/1978",
        sourceUrl: "https://www.indiacode.nic.in/handle/123456789/1978",
        relevance: "Statutory disqualification of interested persons or unilateral appointees as arbitrators",
        retrievedAt: "2026-02-18T00:00:00Z",
        publicationDate: "2015-10-23",
        verificationStatus: "verified",
        excerpt:
          "Notwithstanding any prior agreement to the contrary, any person whose relationship with the parties or counsel or the subject-matter of the dispute falls under any of the categories specified in the Seventh Schedule shall be ineligible to be appointed as an arbitrator.",
        relevantExcerpt:
          "Notwithstanding any prior agreement to the contrary, any person whose relationship... falls under any of the categories specified in the Seventh Schedule shall be ineligible to be appointed as an arbitrator.",
        notes: "Prevents employers, their officers, legal counsel, or interested affiliates from acting as arbitrator.",
        authorityType: "statute",
      },
      {
        id: "source-sci-perkins-eastman",
        title: "Perkins Eastman Architects DPC v. HSCC (India) Ltd. (Supreme Court of India)",
        publisher: "Supreme Court of India",
        sourceType: "official_court",
        citation: "Perkins Eastman Architects DPC v. HSCC (India) Ltd., (2020) 20 SCC 760",
        jurisdiction: "India",
        url: "https://main.sci.gov.in/",
        sourceUrl: "https://main.sci.gov.in/",
        relevance: "Supreme Court ruling barring unilateral appointment of sole arbitrators by an interested party",
        retrievedAt: "2026-02-18T00:00:00Z",
        publicationDate: "2019-11-26",
        verificationStatus: "verified",
        excerpt:
          "A person who has an interest in the outcome or decision of the dispute must not have the power to appoint a sole arbitrator. Such an appointment power is legally invalid and void.",
        relevantExcerpt:
          "A person who has an interest in the outcome or decision of the dispute must not have the power to appoint a sole arbitrator.",
        notes: "Clauses providing that the company alone shall appoint the sole arbitrator are unenforceable under Section 11 and 12(5); the court or an independent institution must appoint the arbitrator upon deadlock.",
        authorityType: "case_law",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-sci-perkins-eastman",
        claimId: "claim-arb-perkins-1",
        citation: "Perkins Eastman Architects DPC v. HSCC (India) Ltd., (2020) 20 SCC 760",
        relevantExcerpt: "A person who has an interest in the outcome or decision of the dispute must not have the power to appoint a sole arbitrator.",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "verified",
      verifiedAt: "2026-06-01T10:20:00Z",
      issues: [],
      confidenceLevel: "high",
    },
    uncertainties: [
      "Whether the company would adopt institutional arbitral administration (e.g. MCIA) or mutual appointment by consent.",
    ],
    nextSteps: [
      {
        id: "act-emp-4",
        title: "Propose Mutual Consent for Arbitrator Appointment in Mumbai",
        description:
          "Amend Section 11 to provide that the sole arbitrator shall be appointed by mutual consent of both parties, or failing agreement, administered under the rules of the Mumbai Centre for International Arbitration (MCIA).",
        priority: "medium",
        partyResponsible: "Employee",
        isReversible: true,
        recommendedTimeline: "During pre-signing review",
        practicalAdvice:
          "Cite the Perkins Eastman Supreme Court ruling to show that unilateral appointment provisions are legally void.",
      },
    ],
  },
  {
    id: "chain-emp-5",
    jurisdictionContext: {
      country: "India",
      stateOrUT: "Maharashtra",
      governingLaw: "Laws of the Republic of India",
      confidence: "high",
      source: "document",
    },
    finding: SAMPLE_FINDINGS[1],
    documentEvidence: {
      clauseId: "clause-sec-5",
      section: "Section 5",
      pageNumber: 1,
      quotedText:
        "Employee agrees to provide not less than ninety (90) calendar days advance written notice prior to any voluntary resignation. In the event the Employee seeks immediate departure without serving the full notice window, the Company reserves the absolute right to deduct salary in lieu of notice from full and final settlement.",
      sourceType: "document",
      exactQuote:
        "Employee agrees to provide not less than ninety (90) calendar days advance written notice prior to any voluntary resignation. In the event the Employee seeks immediate departure without serving the full notice window, the Company reserves the absolute right to deduct salary in lieu of notice from full and final settlement.",
    },
    legalClaims: [
      {
        id: "claim-notice-reciprocity-1",
        findingId: "finding-emp-2",
        claim: "Under Indian employment norms and the Maharashtra Shops and Establishments Act, notice requirements should be mutual, and contractual deductions in lieu of notice must reflect basic salary without punitive clawbacks.",
        sourceIds: ["source-ica-section-74"],
        supportLevel: "partial",
        explanation: "While contractual notice periods are permissible, a 90-day requirement is on the longer side for technology roles where 30 to 60 days is standard.",
        uncertainties: [
          "Whether the employer will agree to a 30 or 60-day mutual notice window or allow employee-funded buyout.",
        ],
        jurisdiction: "India",
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-ica-section-74",
        title: "Indian Contract Act, 1872 § 74 (Reasonable Compensation)",
        publisher: "Ministry of Law and Justice, Government of India (India Code)",
        sourceType: "official_legislation",
        citation: "Indian Contract Act, 1872 § 74",
        jurisdiction: "India",
        url: "https://www.indiacode.nic.in/handle/123456789/2187",
        sourceUrl: "https://www.indiacode.nic.in/handle/123456789/2187",
        relevance: "Governs deductions and damages in lieu of unserved contractual notice",
        retrievedAt: "2026-03-01T00:00:00Z",
        publicationDate: "1872-04-25",
        verificationStatus: "verified",
        notes: "Deductions for unserved notice are typically limited to basic salary component rather than full gross CTC.",
        authorityType: "statute",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-ica-section-74",
        claimId: "claim-notice-reciprocity-1",
        citation: "Indian Contract Act, 1872 § 74",
        relevantExcerpt: "reasonable compensation not exceeding the amount so named",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "verified",
      verifiedAt: "2026-06-01T10:20:00Z",
      issues: [],
      confidenceLevel: "high",
    },
    uncertainties: [
      "Whether the employer allows early release with notice buyout if requested by employee.",
    ],
    nextSteps: [
      {
        id: "act-emp-5",
        title: "Propose Mutual 60-Day Notice Period with Option of Pay in Lieu",
        description:
          "Suggest amending Section 5 to sixty (60) days mutual notice for both employer and employee, with the explicit option for either party to offer pay in lieu of notice.",
        priority: "medium",
        partyResponsible: "Employee",
        isReversible: true,
        recommendedTimeline: "During offer negotiation",
        practicalAdvice:
          "Say: 'A 60-day mutual notice window provides sufficient transition time for complex software knowledge transfer while ensuring market alignment for senior roles.'",
      },
    ],
  },
];

export const SAMPLE_ACTION_PLAN: ActionPlan = {
  id: "action-plan-employment-agreement-01",
  documentId: "demo-employment-agreement",
  summary:
    "Preparation action plan for Rohan Sharma: 3 urgent pre-signing items, 2 before-signing alignments, 3 pointed questions for Kavach Dynamics Technologies Pvt. Ltd., 3 vital documents to collect, and professional review triggers grounded in Indian law.",
  urgentItems: [
    {
      id: "act-plan-urgent-1",
      title: "Propose Pro-Rata Amortization for ₹4,50,000 Training Bond Under Section 74",
      explanation:
        "Section 6 requires a full ₹4,50,000 repayment even if departing on month 17 of the 18-month bond window. Under Section 74 of the Indian Contract Act, 1872, liquidated damages must reflect actual reasonable loss rather than a punitive forfeiture.",
      actionType: "clarify",
      priority: "urgent",
      findingId: "finding-emp-1",
      findingTitle: "Early Departure Training Bond Reimbursement (₹4,50,000)",
      clauseId: "clause-sec-6",
      clauseSection: "Section 6",
      pageNumber: 2,
      isReversible: true,
      practicalAdvice:
        "Propose: 'The training reimbursement shall amortize pro-rata by 1/18th (₹25,000) for each completed month of service, and apply strictly to documented third-party training invoices.'",
    },
    {
      id: "act-plan-urgent-2",
      title: "Address Nationwide Non-Compete Under Section 27 of the Indian Contract Act",
      explanation:
        "Section 9 imposes a 12-month nationwide non-compete. Under Section 27 of the Indian Contract Act, 1872 and Supreme Court precedent (Percept D'Mark v. Zaheer Khan), post-employment non-compete agreements are void ab initio in India.",
      actionType: "ask_party",
      priority: "urgent",
      findingId: "finding-emp-4",
      findingTitle: "12-Month Post-Employment Nationwide Non-Compete",
      clauseId: "clause-sec-9",
      clauseSection: "Section 9",
      pageNumber: 2,
      isReversible: true,
      practicalAdvice:
        "Suggest replacing Section 9 with standard non-solicitation of clients/employees and strict confidentiality protection, which are legally enforceable in India.",
    },
    {
      id: "act-plan-urgent-3",
      title: "Execute and Attach Exhibit A Listing All Pre-Existing Inventions & Codebases",
      explanation:
        "Section 8 assigns all software code conceived during employment, including off-duty creations on personal equipment. Under Section 17(c) of the Copyright Act, 1957, statutory ownership is limited to works in the course of employment.",
      actionType: "preserve_evidence",
      priority: "urgent",
      findingId: "finding-emp-3",
      findingTitle: "Broad Intellectual Property Assignment Covering Personal Works",
      clauseId: "clause-sec-8",
      clauseSection: "Section 8",
      pageNumber: 2,
      isReversible: true,
      practicalAdvice:
        "List all personal GitHub repositories, open-source libraries, and hobby software on an attached Exhibit A schedule prior to signing.",
    },
  ],
  beforeSigning: [
    {
      id: "act-plan-before-1",
      title: "Negotiate Mutual 60-Day Notice Period",
      explanation:
        "Section 5 imposes a unilateral 90-day notice obligation on the employee. Proposing a 60-day mutual notice balances transition needs with career flexibility.",
      actionType: "clarify",
      priority: "important",
      findingId: "finding-emp-2",
      findingTitle: "90-Day Resignation Notice Period",
      clauseId: "clause-sec-5",
      clauseSection: "Section 5",
      pageNumber: 1,
      isReversible: true,
      practicalAdvice:
        "Propose mutual wording: 'Either party may terminate employment with sixty (60) calendar days advance written notice or basic salary in lieu thereof.'",
    },
    {
      id: "act-plan-before-2",
      title: "Align Arbitration Clause with Perkins Eastman Neutrality Rules",
      explanation:
        "Section 11 grants the Company's Managing Director the unilateral authority to appoint the sole arbitrator, which is invalid under Section 12(5) of the Arbitration Act.",
      actionType: "clarify",
      priority: "important",
      findingId: "finding-emp-5",
      findingTitle: "Mandatory Arbitration with Unilateral Arbitrator Appointment",
      clauseId: "clause-sec-11",
      clauseSection: "Section 11",
      pageNumber: 3,
      isReversible: true,
      practicalAdvice:
        "Propose appointing the sole arbitrator by mutual written consent or under the administration of the Mumbai Centre for International Arbitration (MCIA).",
    },
  ],
  questionsToAsk: [
    {
      id: "act-plan-q-1",
      title: "Clarify Training Bond Amortization & Involuntary Separation",
      explanation: "Ensure the ₹4,50,000 repayment is not triggered if separation occurs due to company restructuring or layoff.",
      actionType: "ask_party",
      priority: "urgent",
      findingId: "finding-emp-1",
      findingTitle: "Early Departure Training Bond Reimbursement (₹4,50,000)",
      clauseId: "clause-sec-6",
      clauseSection: "Section 6",
      pageNumber: 2,
      isReversible: true,
      practicalAdvice:
        "Ask: 'Does the reimbursement obligation extinguish if employment is terminated by the Company without cause or due to organizational restructuring?'",
    },
    {
      id: "act-plan-q-2",
      title: "Confirm Carve-Out for Personal Open-Source Contributions",
      explanation: "Verify that off-duty contributions to public open-source developer tools remain personal property.",
      actionType: "ask_party",
      priority: "urgent",
      findingId: "finding-emp-3",
      findingTitle: "Broad Intellectual Property Assignment Covering Personal Works",
      clauseId: "clause-sec-8",
      clauseSection: "Section 8",
      pageNumber: 2,
      isReversible: true,
      practicalAdvice:
        "Ask: 'Can we add explicit language confirming that independent open-source contributions developed on personal time without Company data remain employee IP?'",
    },
    {
      id: "act-plan-q-3",
      title: "Confirm Notice Buyout Policy for Resignation",
      explanation: "Clarify whether Kavach Dynamics permits notice buyout if a subsequent employer requires an earlier joining date.",
      actionType: "ask_party",
      priority: "important",
      findingId: "finding-emp-2",
      findingTitle: "90-Day Resignation Notice Period",
      clauseId: "clause-sec-5",
      clauseSection: "Section 5",
      pageNumber: 1,
      isReversible: true,
      practicalAdvice:
        "Ask: 'Does the Company support notice buyout based on basic salary if an employee transitions prior to 90 days?'",
    },
  ],
  documentsToCollect: [
    {
      id: "act-plan-doc-1",
      title: "Archive Personal Codebase Repositories and Git Commit Hashes",
      explanation: "Establish timestamped proof of personal software projects developed prior to starting employment.",
      actionType: "collect_document",
      priority: "urgent",
      findingId: "finding-emp-3",
      isReversible: true,
      practicalAdvice: "Export Git log commit histories and upload cryptographic hashes to personal cloud storage.",
    },
    {
      id: "act-plan-doc-2",
      title: "Request Itemized Syllabus & Invoices for Scheduled Training",
      explanation: "Verify whether the ₹4,50,000 program involves accredited external certifications.",
      actionType: "collect_document",
      priority: "important",
      findingId: "finding-emp-1",
      isReversible: true,
      practicalAdvice: "Request official third-party vendor payment receipts from HR before enrolling in any training.",
    },
    {
      id: "act-plan-doc-3",
      title: "Retain Signed CTC Annexure & Offer Letter",
      explanation: "Ensure the monthly CTC salary structure matches the ₹32,00,000 figure stated in Section 2.",
      actionType: "collect_document",
      priority: "recommended",
      isReversible: true,
      practicalAdvice: "Maintain offline copies of all offer documentation and HR correspondence.",
    },
  ],
  factsToConfirm: [
    {
      id: "act-plan-fact-1",
      title: "Confirm 90-Day Probationary Review Checkpoint",
      explanation: "Clarify whether notice period during the initial 90-day probation differs from the post-confirmation 90-day standard.",
      actionType: "confirm_fact",
      priority: "recommended",
      findingId: "finding-emp-2",
      isReversible: true,
      practicalAdvice: "Check if the employee handbook specifies a shorter 30-day notice during probation.",
    },
    {
      id: "act-plan-fact-2",
      title: "Confirm Full and Final Settlement Deductions Policy",
      explanation: "Clarify how leave encashment and statutory gratuity interact with Section 6 recovery claims.",
      actionType: "confirm_fact",
      priority: "important",
      findingId: "finding-emp-1",
      isReversible: true,
      practicalAdvice: "Review HR guidelines on full & final settlement (FnF) timelines.",
    },
  ],
  professionalReviewTriggers: [
    {
      id: "trigger-emp-bond",
      findingId: "finding-emp-1",
      clauseSection: "Section 6",
      reason: "Potential violation of Indian Contract Act § 74 regarding un-amortized penalty deductions and lack of proof of actual loss.",
      severity: "high_attention",
    },
    {
      id: "trigger-emp-noncompete",
      findingId: "finding-emp-4",
      clauseSection: "Section 9",
      reason: "Section 27 of the Indian Contract Act renders agreements in restraint of trade void ab initio; Supreme Court precedent (Percept D'Mark) confirms post-employment restrictions are unenforceable.",
      severity: "high_attention",
    },
    {
      id: "trigger-emp-ip",
      findingId: "finding-emp-3",
      clauseSection: "Section 8",
      reason: "Blanket assignment of personal off-duty creations exceeds Copyright Act § 17(c) 'course of employment' presumption.",
      severity: "high_attention",
    },
  ],
  followUpItems: [
    {
      id: "act-plan-follow-1",
      title: "Calendar 90-Day Probationary Milestone (August 15, 2026)",
      explanation: "Schedule performance checkpoint 15 days prior to the expiration of the 90-day probationary window.",
      actionType: "monitor_deadline",
      priority: "recommended",
      pageNumber: 1,
      isReversible: true,
      practicalAdvice: "Set a calendar reminder to review confirmation deliverables with the CTO.",
    },
    {
      id: "act-plan-follow-2",
      title: "Track 18-Month Training Bond Expiration (November 30, 2027)",
      explanation: "After 18 continuous months of service, the ₹4,50,000 reimbursement obligation lapses completely.",
      actionType: "monitor_deadline",
      priority: "important",
      pageNumber: 2,
      isReversible: true,
      practicalAdvice: "Note December 1, 2027 as the date of full liability release.",
    },
  ],
  generatedAt: "2026-06-01T10:25:00Z",
};

export const SAMPLE_LAWYER_BRIEF: LawyerBrief = {
  id: "brief-employment-agreement-01",
  generatedAt: "2026-06-01T10:15:00Z",
  documentSummary:
    "Executive Employment Agreement for Senior Distributed Systems Architect (₹32,00,000/yr CTC) between Kavach Dynamics Technologies Private Limited (Mumbai, Maharashtra) and Rohan Sharma (Pune, Maharashtra). Key issues identified under Indian law include a non-amortized ₹4,50,000 training bond, a 90-day resignation notice period, broad IP assignment covering off-duty works, a post-employment non-compete under Section 27, and unilateral arbitrator appointment under the Arbitration Act.",
  partiesInvolved: [
    "Kavach Dynamics Technologies Private Limited (Employer - Mumbai, Maharashtra)",
    "Rohan Sharma (Employee - Pune, Maharashtra)",
  ],
  keyIssuesToReview: [
    {
      issue: "Un-amortized ₹4,50,000 training bond reimbursement on resignation within 18 months (Section 6)",
      clauseReference: "Section 6 (Page 2)",
      severity: "high_attention",
      recommendedQuestion:
        "Under Section 74 of the Indian Contract Act and Supreme Court precedents (Fateh Chand, Kailash Nath Associates), can the employer enforce this ₹4,50,000 bond without proof of actual training expenditure, and should we demand monthly pro-rata amortization?",
    },
    {
      issue: "Post-employment 12-month nationwide non-compete covenant (Section 9)",
      clauseReference: "Section 9 (Page 2)",
      severity: "high_attention",
      recommendedQuestion:
        "Given that Section 27 of the Indian Contract Act and Percept D'Mark v. Zaheer Khan render post-employment restraints void ab initio, how should we advise client regarding this clause and replace it with standard client non-solicitation?",
    },
    {
      issue: "Comprehensive IP assignment capturing off-duty personal software (Section 8)",
      clauseReference: "Section 8 (Page 2)",
      severity: "high_attention",
      recommendedQuestion:
        "How should Exhibit A be structured under Section 17(c) of the Copyright Act, 1957 to ensure pre-existing personal open-source libraries and independent projects remain client's property?",
    },
    {
      issue: "Unilateral arbitrator appointment by Managing Director in Mumbai (Section 11)",
      clauseReference: "Section 11 (Page 3)",
      severity: "review",
      recommendedQuestion:
        "Does this unilateral arbitrator appointment clause violate Section 12(5) and the Perkins Eastman Supreme Court ruling, and should we propose MCIA institutional arbitration?",
    },
  ],
  missingInformation: [
    "Exhibit A (Prior Inventions and Personal Projects Schedule) is referenced implicitly but not attached.",
    "Itemized invoices or syllabus for the specialized ₹4,50,000 training course are omitted.",
    "Severance provisions in the event of company termination without cause are not addressed.",
  ],
  recommendedNegotiationPoints: [
    "Pro-rate Section 6 training bond so liability amortizes by 1/18th (₹25,000) for each completed month of service.",
    "Confirm that Section 9 non-compete is void post-employment under Section 27 and replace with reasonable non-solicitation.",
    "Add explicit carve-out to Section 8 for personal off-duty inventions created without company resources.",
    "Adjust Section 5 notice period from 90 days to a mutual 60 days.",
    "Amend Section 11 to require mutual consent for arbitrator appointment or MCIA administration.",
  ],
};

export const SAMPLE_DETAILED_LAWYER_BRIEF: DetailedLawyerBrief = {
  id: "detailed-brief-employment-agreement-01",
  generatedAt: "2026-06-01T10:30:00Z",
  matterSummary:
    "Review of Employment & Proprietary Inventions Agreement between Kavach Dynamics Technologies Private Limited (Mumbai, Maharashtra Employer) and Rohan Sharma (Software Engineer candidate for Senior Distributed Systems Architect at ₹32,00,000 CTC/year). Analysis flags 3 elevated-attention covenants under Indian law: an un-amortized ₹4,50,000 training bond, blanket personal IP assignment, and a 12-month post-employment non-compete. Client seeks counsel review on enforceability under Indian law (Indian Contract Act, 1872 §§ 27 & 74) and drafting assistance for standard carve-outs before execution.",
  document: {
    title: "Employment & Proprietary Inventions Agreement",
    documentType: "Executive Employment Agreement",
    date: "2026-06-01",
    parties: [
      "Kavach Dynamics Technologies Private Limited (Employer - Mumbai, Maharashtra)",
      "Rohan Sharma (Employee - Pune, Maharashtra)",
    ],
    jurisdiction: "India · Maharashtra",
    jurisdictionContext: {
      country: "India",
      stateOrUT: "Maharashtra",
      governingLaw: "Laws of the Republic of India",
      confidence: "high",
      source: "document",
    },
  },
  jurisdictionContext: {
    country: "India",
    stateOrUT: "Maharashtra",
    governingLaw: "Laws of the Republic of India",
    confidence: "high",
    source: "document",
  },
  userConcerns: [
    "[HIGH] Early Departure Training Bond (₹4,50,000): Requires full lump-sum repayment if employee leaves within 18 months, without monthly pro-rata amortization.",
    "[HIGH] Post-Employment Non-Compete: 12-month nationwide restriction on joining competing distributed systems firms, despite Section 27 of the Indian Contract Act.",
    "[HIGH] Broad IP Assignment: Captures all software created during employment term, including personal projects developed outside work hours without company hardware.",
    "[REVIEW] 90-Day Resignation Notice: Long unilateral requirement with salary deduction rights in lieu of notice.",
    "[REVIEW] Unilateral Arbitrator Appointment: Company Managing Director reserves exclusive right to appoint sole arbitrator, conflicting with Perkins Eastman.",
  ],
  relevantClauses: [
    {
      clauseId: "clause-sec-6",
      section: "Section 6",
      pageNumber: 2,
      excerpt:
        "if the Employee resigns or departs from service for any reason prior to completing eighteen (18) continuous months from the Effective Date, the Employee shall immediately reimburse to the Company the fixed sum of INR 4,50,000 (Rupees Four Lakh Fifty Thousand only) as liquidated damages and training expense recovery, and the Company is irrevocably authorized to deduct such amount from the Employee's accrued salary",
      plainEnglish:
        "Full ₹4,50,000 repayment required if departing within 18 months, even if leaving in month 17. No proof of actual third-party training costs required.",
      importance: "high_attention",
    },
    {
      clauseId: "clause-sec-9",
      section: "Section 9",
      pageNumber: 2,
      excerpt:
        "For a period of twelve (12) months following termination of employment for any reason whatsoever, the Employee shall not, anywhere within the territory of the Republic of India, directly or indirectly engage in, perform consulting or engineering services for, advise, or hold equity in any enterprise... offering competing distributed cloud infrastructure",
      plainEnglish:
        "12-month post-employment non-compete preventing employment with any competing software or cloud technology company across India.",
      importance: "high_attention",
    },
    {
      clauseId: "clause-sec-8",
      section: "Section 8",
      pageNumber: 2,
      excerpt:
        "assigns and transfers to the Company all right, title, and interest throughout the world in and to any and all software code, inventions, discoveries... conceived, authored, or reduced to practice during the term of employment, whether or not during regular working hours, and whether or not utilizing Company hardware, servers, or facilities.",
      plainEnglish:
        "Blanket assignment claiming ownership of software created on personal devices during personal time.",
      importance: "high_attention",
    },
    {
      clauseId: "clause-sec-5",
      section: "Section 5",
      pageNumber: 1,
      excerpt:
        "Employee agrees to provide not less than ninety (90) calendar days advance written notice prior to any voluntary resignation. In the event the Employee seeks immediate departure without serving the full notice window, the Company reserves the absolute right to deduct salary in lieu of notice from full and final settlement.",
      plainEnglish:
        "Mandatory 90-day notice prior to quitting; Company claims unilateral deduction rights from terminal dues.",
      importance: "review",
    },
    {
      clauseId: "clause-sec-11",
      section: "Section 11",
      pageNumber: 3,
      excerpt:
        "resolved through final and binding arbitration in Mumbai under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator appointed exclusively by the Managing Director of the Company. The parties shall bear arbitrator fees and administrative costs equally.",
      plainEnglish:
        "Mandatory arbitration in Mumbai where Company unilaterally chooses the sole arbitrator, and fees are shared equally.",
      importance: "review",
    },
  ],
  verifiedLegalContext: [
    {
      issueTitle: "Liquidated Damages & Training Bond Enforceability",
      sourceTitle: "Indian Contract Act, 1872 § 74 (Compensation for Breach)",
      citation: "Indian Contract Act, 1872 § 74",
      jurisdiction: "India",
      explanation:
        "Section 74 establishes that named sums in a contract serve as an upper ceiling. Supreme Court precedents (Fateh Chand, Kailash Nath Associates) require employers to prove actual reasonable training expenses rather than imposing a forfeiture penalty.",
      verificationStatus: "verified",
    },
    {
      issueTitle: "Post-Employment Non-Compete Voidness",
      sourceTitle: "Indian Contract Act, 1872 § 27 & Supreme Court Precedents",
      citation: "Indian Contract Act, 1872 § 27",
      jurisdiction: "India",
      explanation:
        "Under Section 27, covenants in restraint of trade extending beyond employment termination are void ab initio. The Supreme Court in Percept D'Mark v. Zaheer Khan affirmed that post-employment non-compete clauses are completely unenforceable in India.",
      verificationStatus: "verified",
    },
    {
      issueTitle: "Employee Invention Assignment Limits",
      sourceTitle: "Copyright Act, 1957 § 17(c) (Contract of Service Presumption)",
      citation: "Copyright Act, 1957 § 17(c)",
      jurisdiction: "India",
      explanation:
        "Statutory first-ownership applies to works created in the course of employment. Independent works developed outside work hours without employer assets require valid separate assignment.",
      verificationStatus: "verified",
    },
    {
      issueTitle: "Unilateral Arbitrator Appointment Prohibition",
      sourceTitle: "Arbitration and Conciliation Act, 1996 & Supreme Court Ruling",
      citation: "Arbitration and Conciliation Act, 1996 § 12(5) & Perkins Eastman",
      jurisdiction: "India",
      explanation:
        "Under Section 12(5) and the Supreme Court decision in Perkins Eastman Architects v. HSCC (India) Ltd., a party interested in the outcome of a dispute cannot unilaterally appoint a sole arbitrator.",
      verificationStatus: "verified",
    },
  ],
  whatRemainsUncertain: [
    "Whether Kavach Dynamics can provide itemized receipts proving ₹4,50,000 was spent on specialized third-party technical certifications.",
    "Whether Kavach Dynamics will agree to replace Section 9 with reasonable non-solicitation of clients and trade secret confidentiality.",
    "Whether the Company will attach a formal Exhibit A schedule excluding Rohan's pre-existing open-source code repositories.",
    "Whether the 90-day notice requirement can be reduced to 60 days by mutual consent during offer finalization.",
  ],
  documentsAvailable: [
    "Employment & Proprietary Inventions Agreement (complete 3-page draft)",
    "Formal Written Offer Letter (INR 32,00,000 CTC compensation confirmation)",
    "Inventory of Pre-Existing Personal Software Projects and GitHub commit histories",
    "Email correspondence regarding technical role scope and Mumbai office expectations",
  ],
  questionsForCounsel: [
    {
      findingId: "finding-emp-1",
      clauseReference: "Section 6",
      question:
        "Under Section 74 of the Indian Contract Act and Kailash Nath Associates, does the ₹4,50,000 lump-sum training bond constitute an unenforceable penalty, and what specific monthly amortization clause should we propose?",
      context:
        "The clause does not reduce repayment over the 18-month tenure and authorizes direct salary deductions without establishing actual loss.",
    },
    {
      findingId: "finding-emp-4",
      clauseReference: "Section 9",
      question:
        "How should we formally advise the client regarding the complete voidness of the 12-month post-employment non-compete under Section 27 and Percept D'Mark, while ensuring client remains protected under non-solicitation?",
      context:
        "Client seeks assurance that future employment in cloud or software architecture cannot be blocked by Kavach Dynamics under Indian law.",
    },
    {
      findingId: "finding-emp-3",
      clauseReference: "Section 8",
      question:
        "How should Exhibit A and Section 8 be drafted to align with Section 17(c) of the Copyright Act, 1957, safeguarding client's pre-existing software projects from employer ownership claims?",
      context:
        "Client maintains active open-source software repositories and personal developer utilities created prior to joining Kavach Dynamics.",
    },
    {
      findingId: "finding-emp-5",
      clauseReference: "Section 11",
      question:
        "In light of the Perkins Eastman Supreme Court ruling, how can we best restructure Section 11 to require mutual consent for arbitrator appointment or administration by the Mumbai Centre for International Arbitration (MCIA)?",
      context:
        "Unilateral appointment by the Managing Director creates severe procedural vulnerability in any compensation or termination dispute.",
    },
  ],
  importantDates: [
    {
      label: "Effective Commencement Date",
      date: "2026-06-01",
      description: "Start of employment tenure and accrual of contractual covenants.",
      isDeadline: true,
    },
    {
      label: "Probationary Performance Review Window",
      date: "2026-08-30",
      noticePeriodDays: 90,
      description: "Initial 90-day evaluation milestone.",
      isDeadline: false,
    },
    {
      label: "Resignation Notice Window",
      date: null,
      noticePeriodDays: 90,
      description: "Mandatory advance written notice required prior to voluntary departure.",
      isDeadline: true,
    },
    {
      label: "Training Bond Expiration",
      date: "2027-11-30",
      description: "18-month tenure threshold after which the ₹4,50,000 training bond obligation lapses entirely.",
      isDeadline: true,
    },
  ],
  disclaimer:
    "NOTICE & DISCLAIMER: This briefing document was generated by LawPilot to assist the user in preparing for an efficient consultation with an Advocate or legal practitioner in India. It organizes facts, clause excerpts, and verified Indian statutory context identified in the submitted document. This document does NOT constitute formal legal advice, representation, or an advocate-client relationship. All legal interpretations must be confirmed by a qualified legal professional.",
};

/**
 * Retained Delaware brief for backward-compatibility verification in legacy test suites.
 */
export const SAMPLE_DELAWARE_DETAILED_LAWYER_BRIEF: DetailedLawyerBrief = {
  id: "detailed-brief-delaware-legacy-01",
  generatedAt: "2026-03-12T10:30:00Z",
  matterSummary:
    "Review of Employment & Proprietary Inventions Agreement between Aegis Cloud Dynamics Inc. (Delaware Employer) and Alex Morgan (Employee candidate for Senior Distributed Systems Architect at $145,000/year). Features Delaware statutory citations.",
  document: {
    title: "Employment & Proprietary Inventions Agreement",
    documentType: "Executive Employment Agreement",
    date: "2026-05-01",
    parties: ["Aegis Cloud Dynamics Inc. (Employer)", "Alex Morgan (Employee)"],
    jurisdiction: "State of Delaware",
  },
  userConcerns: [
    "[HIGH] Early Departure Training Clawback ($18,500)",
    "[HIGH] Broad IP Assignment",
    "[HIGH] 12-Month Non-Compete",
  ],
  relevantClauses: [
    {
      clauseId: "clause-sec-6",
      section: "Section 6",
      pageNumber: 2,
      excerpt: "reimburse Employer the liquidated sum of Eighteen Thousand Five Hundred Dollars ($18,500.00)",
      plainEnglish: "Full $18,500 repayment required if departing within 1 year.",
      importance: "high_attention",
    },
    {
      clauseId: "clause-sec-8",
      section: "Section 8",
      pageNumber: 2,
      excerpt: "Employee hereby assigns to Employer all right, title, and interest in and to any and all inventions",
      plainEnglish: "Blanket assignment claiming ownership of software created on personal devices.",
      importance: "high_attention",
    },
    {
      clauseId: "clause-sec-9",
      section: "Section 9",
      pageNumber: 2,
      excerpt: "For a period of twelve (12) months following termination... directly or indirectly engage in competitive business within 50 miles",
      plainEnglish: "12-month non-compete preventing employment within 50 miles of Dover, DE.",
      importance: "high_attention",
    },
    {
      clauseId: "clause-sec-5",
      section: "Section 5",
      pageNumber: 1,
      excerpt: "provide not less than sixty (60) calendar days advance written notice",
      plainEnglish: "Mandatory 60-day notice prior to quitting.",
      importance: "review",
    },
    {
      clauseId: "clause-sec-11",
      section: "Section 11",
      pageNumber: 3,
      excerpt: "settled by confidential binding arbitration administered by the American Arbitration Association",
      plainEnglish: "Mandatory arbitration in Delaware.",
      importance: "review",
    },
  ],
  verifiedLegalContext: [
    {
      issueTitle: "Training Expense Reimbursement & Wage Deductions",
      sourceTitle: "Delaware Wage Payment and Collection Act",
      citation: "19 Del. C. § 1107 (Withholding and Deductions)",
      jurisdiction: "Delaware",
      explanation: "Prohibits employers from withholding wages without documented authorization.",
      verificationStatus: "verified",
    },
    {
      issueTitle: "Post-Employment Non-Compete Enforceability",
      sourceTitle: "Delaware Court of Chancery Precedent",
      citation: "Kodiak Bldg. Partners, LLC v. Adams, 2022 WL 5240507",
      jurisdiction: "Delaware",
      explanation: "Delaware courts refuse to enforce or blue-pencil overbroad non-competes.",
      verificationStatus: "verified",
    },
    {
      issueTitle: "Employee Invention Assignment Boundaries",
      sourceTitle: "Delaware Common Law Inventions Jurisprudence",
      citation: "Delaware Corporate & Employment Inventions Jurisprudence",
      jurisdiction: "Delaware",
      explanation: "Invention assignments are strictly construed regarding personal time creations.",
      verificationStatus: "verified",
    },
    {
      issueTitle: "Mandatory Arbitration Fee Bearing",
      sourceTitle: "AAA Employment Due Process Protocol (Rule 48)",
      citation: "AAA Employment Due Process Protocol & Rule 48",
      jurisdiction: "United States (Federal / Delaware)",
      explanation: "Under AAA Protocol, employer must bear hearing and arbitrator costs.",
      verificationStatus: "verified",
    },
  ],
  whatRemainsUncertain: [
    "Whether Aegis will provide itemized receipts for $18,500 training.",
  ],
  documentsAvailable: [
    "Employment & Proprietary Inventions Agreement (draft)",
  ],
  questionsForCounsel: [
    {
      findingId: "finding-emp-1",
      clauseReference: "Section 6",
      question: "Does the $18,500 training clawback constitute an unenforceable liquidated penalty under Delaware law?",
      context: "Clause does not reduce repayment over tenure.",
    },
    {
      findingId: "finding-emp-4",
      clauseReference: "Section 9",
      question: "Can we challenge the 50-mile restriction under Kodiak Bldg. Partners?",
      context: "Client works remotely.",
    },
    {
      findingId: "finding-emp-3",
      clauseReference: "Section 8",
      question: "How should Exhibit A be modified to incorporate standard carve-outs?",
      context: "Client has prior open-source repositories.",
    },
    {
      findingId: "finding-emp-11",
      clauseReference: "Section 11",
      question: "Will fee-splitting be severed under AAA Rule 48?",
      context: "Arbitration costs could be excessive.",
    },
  ],
  importantDates: [
    {
      label: "Effective Commencement Date",
      date: "2026-05-01",
      description: "Start of employment term.",
      isDeadline: true,
    },
  ],
  disclaimer:
    "NOTICE & DISCLAIMER: This briefing document was generated by LawPilot to assist the user in preparing for an consultation with a licensed legal practitioner.",
};

export const SAMPLE_ANALYSIS_REPORT: AnalysisReport = {
  id: "demo-employment-agreement",
  documentId: "demo-employment-agreement",
  metadata: SAMPLE_DOCUMENT_METADATA,
  createdAt: "2026-06-01T10:20:00Z",
  jurisdiction: SAMPLE_DOCUMENT_METADATA.jurisdictionContext,
  jurisdictionContext: SAMPLE_DOCUMENT_METADATA.jurisdictionContext,
  status: "completed",
  summary: {
    overallReadiness: "high_risk_clauses_present",
    keyTakeaway:
      "Identified 3 high-attention provisions (early departure training bond of ₹4,50,000, post-employment non-compete under Section 27, and broad IP assignment) and 2 review items (90-day notice and unilateral arbitration) that deserve review prior to signing under Indian law.",
    totalClausesAnalyzed: SAMPLE_CLAUSES.length,
    criticalAttentionCount: 0,
    highAttentionCount: 3,
    reviewCount: 2,
    contextDependentCount: 3,
    informationalCount: 2,
  },
  clauses: SAMPLE_CLAUSES,
  findings: SAMPLE_FINDINGS,
  evidenceLinks: SAMPLE_EVIDENCE_LINKS,
  financialTerms: SAMPLE_FINANCIAL_TERMS,
  keyDates: SAMPLE_KEY_DATES,
  evidenceChains: SAMPLE_EVIDENCE_CHAINS,
  actionItems: SAMPLE_FINDINGS.map((f, idx) => ({
    id: `act-${idx + 1}`,
    title: `Address ${f.title}`,
    description: f.whyItMatters,
    priority: f.severity === "high_attention" ? "high" : "medium",
    partyResponsible: "Rohan Sharma",
    isReversible: true,
    recommendedTimeline: "Before signing",
    practicalAdvice: `Review ${f.evidence.section} and request standard written adjustment.`,
  })),
  actionPlan: SAMPLE_ACTION_PLAN,
  lawyerBrief: SAMPLE_LAWYER_BRIEF,
  detailedLawyerBrief: SAMPLE_DETAILED_LAWYER_BRIEF,
  safetyDisclaimer: GLOBAL_LEGAL_DISCLAIMER,
};

export const SAMPLE_SITUATION_ASSESSMENT: SituationAssessment = {
  id: "situation-sample-unpaid-invoice",
  userPrompt:
    "I am a freelance software developer based in Austin, Texas. A client in California owes me $14,50,000 on an approved milestone invoice that was due 45 days ago. They are ignoring my emails. I have a signed statement of work, email approval of the code delivery, and timestamped GitHub commit logs.",
  situationSummary:
    "Unpaid milestone payment for delivered software development services under a signed Statement of Work, with payment overdue by 45 days and an unresponsive counterparty.",
  identifiedCategory: "freelance_unpaid_invoice",
  jurisdictionEstimate: "Texas (Creditor) / California (Debtor)",
  followUpQuestions: [
    {
      id: "sq-1",
      question: "Does your Statement of Work specify a governing law or choice of venue clause?",
      whyItMatters: "Governing law determines whether Texas or California courts have jurisdiction and whether prompt payment statutes apply.",
      responseType: "choice",
      options: ["Yes, Texas", "Yes, California", "No clause or silent", "Unsure"],
      isAnswered: true,
      answer: "No clause or silent",
    },
    {
      id: "sq-2",
      question: "Did the contract contain a clause awarding attorneys' fees to the prevailing party in any dispute?",
      whyItMatters: "Without an attorneys' fees clause or statutory fee-shifting, hiring a lawyer for $14,500 might cost more than the recovery.",
      responseType: "choice",
      options: ["Yes, prevailing party recovers fees", "No attorneys' fee clause", "Unsure"],
      isAnswered: true,
      answer: "Yes, prevailing party recovers fees",
    },
  ],
  missingFacts: [
    "Exact legal entity name of the client (LLC, Inc., or sole proprietor).",
    "Whether the client ever sent written objection or dispute within the 30-day acceptance window.",
    "Physical business address of the client in California.",
  ],
  relevantLegalConcepts: [
    {
      concept: "Breach of Written Contract & Account Stated",
      plainEnglishExplanation:
        "When an invoice is delivered and accepted without timely objection, it can establish an 'Account Stated', which is simpler to prove in court than renegotiating individual deliverables.",
      caveat: "Requires proving the invoice was received and not objected to within a customary period.",
    },
    {
      concept: "Texas Civil Practice & Remedies Code § 38.001 / California Civil Code § 1717",
      plainEnglishExplanation:
        "Statutory provisions that allow recovery of reasonable attorney fees for breach of a written contract or services rendered.",
      caveat: "Subject to proper pre-suit formal demand notice requirements.",
    },
  ],
  possibleOptions: [
    {
      title: "Send Formal Final Demand Letter with 10-Day Cure Notice",
      pros: [
        "Low cost ($0 - minimal)",
        "Establishes paper trail for pre-suit statutory fee recovery",
        "Frequently triggers response from finance departments",
      ],
      risks: [
        "May trigger defensive posturing or formal dispute",
      ],
      reversibility: "high",
    },
    {
      title: "Retain California or Texas Attorney for Demand on Law Firm Letterhead",
      pros: [
        "Significantly increases urgency",
        "Demonstrates credible readiness for litigation",
      ],
      risks: [
        "Legal fee expenditure ($300-$800 for demand letter)",
      ],
      reversibility: "moderate",
    },
    {
      title: "File Small Claims Action (Texas or California)",
      pros: [
        "California Small Claims limit is $12,500 for corporations (or $10,000 in Texas)",
        "No attorneys permitted in court; inexpensive filing fees ($30-$100)",
      ],
      risks: [
        "May require travel or remote appearance",
        "Enforcing an out-of-state judgment requires domesticating the judgment",
      ],
      reversibility: "low",
    },
  ],
  evidenceToCollect: [
    "Signed Master Services Agreement or Statement of Work",
    "Written delivery confirmation (email or PR approval)",
    "Delivered invoice with timestamp and payment instructions",
    "All follow-up email threads showing zero dispute of work quality",
  ],
  questionsForLawyer: [
    "Given the $14,500 amount, is it more cost-effective to sue in Texas Justice Court or California Small Claims / Limited Jurisdiction?",
    "Does Texas Civ. Prac. & Rem. Code § 38.001 apply to an out-of-state defendant who hired a Texas-based remote contractor?",
    "Can we demand pre-judgment statutory interest under California or Texas law?",
  ],
  actionChecklist: [
    {
      id: "sc-1",
      title: "Export and securely archive all Slack/email approval threads",
      description: "Ensure you have offline PDF exports of delivery sign-offs before any workspace access changes.",
      priority: "high",
      partyResponsible: "Freelancer",
      isReversible: true,
      recommendedTimeline: "Immediately",
      practicalAdvice: "Store exports in Google Drive or local encrypted storage.",
    },
    {
      id: "sc-2",
      title: "Send certified mail + email Formal Demand for Payment (10-day notice)",
      description: "Reference invoice number, milestone acceptance date, and prevailing party fee recovery clause.",
      priority: "high",
      partyResponsible: "Freelancer",
      isReversible: true,
      recommendedTimeline: "Within 48 hours",
      practicalAdvice: "Keep tone professional and factual without hostile threats.",
    },
  ],
  createdAt: "2026-03-12T11:00:00Z",
};
