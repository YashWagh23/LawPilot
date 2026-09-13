import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";
import type {
  AnalysisReport,
  Clause,
  DocumentMetadata,
  EvidenceChain,
  EvidenceLink,
  Finding,
  KeyDate,
  KeyFinancialTerm,
  LawyerBrief,
  SituationAssessment,
} from "@/types";

export const SAMPLE_DOCUMENT_METADATA: DocumentMetadata = {
  id: "demo-employment-agreement",
  title: "Employment & Proprietary Inventions Agreement",
  documentType: "employment_agreement",
  jurisdiction: "Delaware, USA",
  governingLaw: "State of Delaware",
  effectiveDate: "2026-05-01",
  pageCount: 3,
  wordCount: 1250,
  uploadedAt: "2026-03-12T10:00:00Z",
  fileName: "employment_agreement_demo.pdf",
  fileSizeBytes: 64200,
  isUntrustedContent: true,
  parties: [
    {
      id: "party-aegis",
      name: "Aegis Cloud Dynamics Inc.",
      role: "Employer",
      address: "100 Innovation Way, Suite 400, Dover, DE",
      jurisdiction: "Delaware",
      representationStatus: "represented",
    },
    {
      id: "party-alex",
      name: "Alex Morgan",
      role: "Employee",
      address: "Dover, Delaware",
      jurisdiction: "Delaware",
      representationStatus: "unrepresented",
    },
  ],
};

export const SAMPLE_FINANCIAL_TERMS: KeyFinancialTerm[] = [
  {
    id: "fin-salary",
    label: "Annual Base Salary",
    amount: 145000,
    formattedAmount: "$145,000 / year",
    currency: "USD",
    category: "salary",
    conditions: "Payable in semi-monthly installments per standard payroll schedule",
  },
  {
    id: "fin-training-reimbursement",
    label: "Early Departure Training Fee Reimbursement",
    amount: 18500,
    formattedAmount: "$18,500",
    currency: "USD",
    category: "reimbursement",
    conditions: "Payable immediately if Employee resigns within twelve (12) months of Effective Date",
  },
];

export const SAMPLE_KEY_DATES: KeyDate[] = [
  {
    id: "date-effective",
    label: "Effective Date",
    date: "2026-05-01",
    description: "Commencement of employment and accrual of rights/obligations",
  },
  {
    id: "date-probation",
    label: "Probationary Evaluation Period",
    date: "2026-07-30",
    description: "Initial ninety (90) calendar days performance evaluation window",
    noticePeriodDays: 90,
  },
  {
    id: "date-resignation-notice",
    label: "Resignation Notice Window",
    description: "Mandatory advance written notice required prior to voluntary departure",
    noticePeriodDays: 60,
  },
  {
    id: "date-retention-threshold",
    label: "Training Fee Reimbursement Expiration",
    date: "2027-04-30",
    description: "12-month tenure threshold after which the $18,500 training reimbursement expires",
  },
];

export const SAMPLE_CLAUSES: Clause[] = [
  {
    id: "clause-sec-1",
    section: "Section 1",
    title: "Position and Duties",
    rawText:
      "Employer hereby employs Employee, and Employee hereby accepts employment with Employer, in the position of Senior Distributed Systems Architect. Employee shall report to the Chief Technology Officer and shall devote full business time, attention, and energies to the performance of duties assigned by Employer.",
    plainEnglish:
      "You are hired as Senior Distributed Systems Architect reporting to the CTO. You must work exclusively for the company during business hours.",
    category: "employment",
    pageNumber: 1,
    importance: "informational",
    sectionNumber: "Section 1",
  },
  {
    id: "clause-sec-2",
    section: "Section 2",
    title: "Compensation and Benefits",
    rawText:
      "As full compensation for all services rendered, Employer shall pay Employee an annual base salary of $145,000 (One Hundred Forty-Five Thousand U.S. Dollars), payable in semi-monthly installments in accordance with Employer's standard payroll schedule. Employee shall be entitled to participate in customary health and retirement benefits.",
    plainEnglish:
      "Your base pay is $145,000 per year paid twice a month, plus standard company health and retirement benefits.",
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
      "Employee's initial employment shall be subject to a probationary evaluation period of ninety (90) calendar days commencing on the Effective Date. During this probationary period, Employer shall evaluate Employee's performance and suitability for continued tenure.",
    plainEnglish:
      "The first 90 days are a probationary evaluation window during which the company monitors performance.",
    category: "employment",
    pageNumber: 1,
    importance: "context_dependent",
    sectionNumber: "Section 3",
  },
  {
    id: "clause-sec-5",
    section: "Section 5",
    title: "Resignation and Notice Period",
    rawText:
      "In order to ensure continuity of distributed infrastructure operations, Employee agrees to provide not less than sixty (60) calendar days advance written notice to Employer prior to any voluntary resignation or termination of employment.",
    plainEnglish:
      "You must give at least 60 calendar days written notice before resigning, rather than the customary 14 days (two weeks).",
    category: "notice",
    pageNumber: 1,
    importance: "review",
    sectionNumber: "Section 5",
  },
  {
    id: "clause-sec-6",
    section: "Section 6",
    title: "Early Departure & Training Fee Reimbursement",
    rawText:
      "In consideration of Employer providing specialized proprietary cloud orchestration training valued at $18,500 during the initial months of tenure, Employee agrees that if Employee resigns or departs employment for any reason prior to completing twelve (12) full months of service from the Effective Date, Employee shall immediately repay to Employer the full sum of $18,500 as reimbursement for specialized training expenses, and Employer is authorized to deduct any unpaid balance from final wages.",
    plainEnglish:
      "If you leave or resign for any reason within your first 12 months, you must immediately pay back $18,500 for training, and the company claims the right to take it out of your final paycheck.",
    category: "payment",
    pageNumber: 2,
    importance: "high_attention",
    sectionNumber: "Section 6",
  },
  {
    id: "clause-sec-7",
    section: "Section 7",
    title: "Confidential Information",
    rawText:
      "Employee shall hold in strict confidence all proprietary technical data, customer lists, architectural schematics, source code, and trade secrets of Employer. This non-disclosure obligation shall survive indefinitely following termination of employment.",
    plainEnglish:
      "You cannot share company secrets, technical designs, or customer data with anyone, even after you leave the company.",
    category: "confidentiality",
    pageNumber: 2,
    importance: "context_dependent",
    sectionNumber: "Section 7",
  },
  {
    id: "clause-sec-8",
    section: "Section 8",
    title: "Comprehensive Inventions Assignment",
    rawText:
      "Employee hereby assigns to Employer all right, title, and interest in and to any and all inventions, designs, software, improvements, and discoveries conceived, developed, or reduced to practice by Employee during the term of employment, whether or not during regular working hours, and whether or not using Company facilities or equipment.",
    plainEnglish:
      "The company claims ownership of everything you invent or program while employed, even if you created it on your own personal time without using company computers.",
    category: "intellectual_property",
    pageNumber: 2,
    importance: "high_attention",
    sectionNumber: "Section 8",
  },
  {
    id: "clause-sec-9",
    section: "Section 9",
    title: "Post-Employment Restrictive Covenants",
    rawText:
      "For a period of twelve (12) months following the termination of employment for any reason, Employee shall not, within a fifty (50) mile radius of Employer's corporate headquarters, directly or indirectly engage in, perform services for, consult with, or acquire an equity interest in any business entity providing competing cloud infrastructure or distributed systems orchestration services.",
    plainEnglish:
      "For 1 year after leaving, you cannot work for or advise any competing cloud infrastructure company located within 50 miles of company headquarters.",
    category: "restriction",
    pageNumber: 2,
    importance: "high_attention",
    sectionNumber: "Section 9",
  },
  {
    id: "clause-sec-11",
    section: "Section 11",
    title: "Mandatory Binding Arbitration",
    rawText:
      "Any dispute, claim, or controversy arising out of or relating to this Agreement, including claims of wrongful termination or compensation disputes, shall be resolved exclusively through final and binding arbitration administered by the American Arbitration Association in Dover, Delaware. Each party shall bear its own attorneys' fees and administrative arbitration costs regardless of outcome. Employee expressly waives any right to participate in a class or representative action.",
    plainEnglish:
      "You waive your right to a court jury trial or class action. All disputes go to private arbitration in Delaware, and you must pay your own legal and arbitration costs even if you win.",
    category: "dispute_resolution",
    pageNumber: 3,
    importance: "review",
    sectionNumber: "Section 11",
  },
  {
    id: "clause-sec-12",
    section: "Section 12",
    title: "Governing Law and Venue",
    rawText:
      "This Agreement shall be construed, interpreted, and governed exclusively by the laws of the State of Delaware, without regard to its principles of conflict of laws. The state courts of Kent County, Delaware shall have exclusive jurisdiction over any enforcement proceedings.",
    plainEnglish:
      "Delaware state law controls this contract, and any enforcement actions must take place in Kent County, Delaware courts.",
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
      "if Employee resigns or departs employment for any reason prior to completing twelve (12) full months of service from the Effective Date, Employee shall immediately repay to Employer the full sum of $18,500 as reimbursement for specialized training expenses, and Employer is authorized to deduct any unpaid balance from final wages.",
  },
  {
    findingId: "finding-emp-2",
    documentId: "demo-employment-agreement",
    clauseId: "clause-sec-5",
    pageNumber: 1,
    section: "Section 5",
    quotedText:
      "Employee agrees to provide not less than sixty (60) calendar days advance written notice to Employer prior to any voluntary resignation or termination of employment.",
  },
  {
    findingId: "finding-emp-3",
    documentId: "demo-employment-agreement",
    clauseId: "clause-sec-8",
    pageNumber: 2,
    section: "Section 8",
    quotedText:
      "Employee hereby assigns to Employer all right, title, and interest in and to any and all inventions, designs, software, improvements, and discoveries conceived, developed, or reduced to practice by Employee during the term of employment, whether or not during regular working hours, and whether or not using Company facilities or equipment.",
  },
  {
    findingId: "finding-emp-4",
    documentId: "demo-employment-agreement",
    clauseId: "clause-sec-9",
    pageNumber: 2,
    section: "Section 9",
    quotedText:
      "For a period of twelve (12) months following the termination of employment for any reason, Employee shall not, within a fifty (50) mile radius of Employer's corporate headquarters, directly or indirectly engage in, perform services for, consult with, or acquire an equity interest in any business entity providing competing cloud infrastructure",
  },
  {
    findingId: "finding-emp-5",
    documentId: "demo-employment-agreement",
    clauseId: "clause-sec-11",
    pageNumber: 3,
    section: "Section 11",
    quotedText:
      "resolved exclusively through final and binding arbitration administered by the American Arbitration Association in Dover, Delaware. Each party shall bear its own attorneys' fees and administrative arbitration costs regardless of outcome. Employee expressly waives any right to participate in a class or representative action.",
  },
];

export const SAMPLE_FINDINGS: Finding[] = [
  {
    id: "finding-emp-1",
    title: "Early departure training fee reimbursement ($18,500) deserves attention",
    category: "Financial & Termination Obligations",
    severity: "high_attention",
    description:
      "Section 6 obligates the employee to repay $18,500 if departing within 12 months, and authorizes deductions from final wages.",
    whyItMatters:
      "This creates a direct financial obligation upon resignation that could substantially restrict your ability to transition to another opportunity during your first year.",
    clauseId: "clause-sec-6",
    evidence: SAMPLE_EVIDENCE_LINKS[0],
    uncertainties: [
      "Whether the $18,500 reflects documented out-of-pocket training costs or acts as a retention penalty.",
      "Delaware and federal Fair Labor Standards Act (FLSA) wage deduction rules governing deductions that reduce final pay below minimum wage thresholds.",
    ],
  },
  {
    id: "finding-emp-2",
    title: "60-day resignation notice period is unusually long",
    category: "Notice Requirements",
    severity: "review",
    description:
      "Section 5 mandates 60 calendar days advance written notice prior to voluntary resignation, compared to the industry standard of 14 days.",
    whyItMatters:
      "Prospective employers frequently expect new hires to start within 2 to 4 weeks. A 60-day notice requirement could complicate future job offers unless waived by the company.",
    clauseId: "clause-sec-5",
    evidence: SAMPLE_EVIDENCE_LINKS[1],
    uncertainties: [
      "Whether the company typically grants early releases upon request, or enforces the full 60 days.",
    ],
  },
  {
    id: "finding-emp-3",
    title: "Inventions assignment language is potentially broad",
    category: "Intellectual Property Ownership",
    severity: "high_attention",
    description:
      "Section 8 claims ownership over inventions conceived during employment regardless of whether created during working hours or using company facilities.",
    whyItMatters:
      "Without an explicit carve-out for personal, off-duty projects created on personal hardware, this clause could assert company ownership over independent open-source or hobby software.",
    clauseId: "clause-sec-8",
    evidence: SAMPLE_EVIDENCE_LINKS[2],
    uncertainties: [
      "Whether the employer provides an Exhibit A (Prior Inventions Schedule) to register pre-existing personal intellectual property.",
    ],
  },
  {
    id: "finding-emp-4",
    title: "12-month post-employment restriction on competing services",
    category: "Restrictive Covenants",
    severity: "high_attention",
    description:
      "Section 9 bars competitive employment within a 50-mile radius of Dover, Delaware for 12 months following termination.",
    whyItMatters:
      "Could limit local opportunities in cloud infrastructure. Worth evaluating whether remote work outside the geographic radius would be treated as compliant.",
    clauseId: "clause-sec-9",
    evidence: SAMPLE_EVIDENCE_LINKS[3],
    uncertainties: [
      "Delaware courts evaluate non-competes under a reasonableness test balancing employer protectable interests with employee mobility.",
    ],
  },
  {
    id: "finding-emp-5",
    title: "Mandatory arbitration with cost-bearing waiver",
    category: "Dispute Resolution & Forum",
    severity: "review",
    description:
      "Section 11 requires American Arbitration Association arbitration in Delaware and stipulates that each party bears its own fees regardless of outcome.",
    whyItMatters:
      "Arbitration fees can be significant for an individual claimant. Eliminates access to public jury trials and class action participation.",
    clauseId: "clause-sec-11",
    evidence: SAMPLE_EVIDENCE_LINKS[4],
    uncertainties: [
      "Whether employment arbitration rules require the employer to cover primary arbitrator forum fees.",
    ],
  },
];

export const SAMPLE_EVIDENCE_CHAINS: EvidenceChain[] = [
  {
    id: "chain-emp-1",
    finding: SAMPLE_FINDINGS[0],
    documentEvidence: {
      clauseId: "clause-sec-6",
      section: "Section 6",
      pageNumber: 2,
      quotedText:
        "if Employee resigns or departs employment for any reason prior to completing twelve (12) full months of service from the Effective Date, Employee shall immediately repay to Employer the full sum of $18,500 as reimbursement for specialized training expenses, and Employer is authorized to deduct any unpaid balance from final wages.",
      sourceType: "document",
      exactQuote:
        "if Employee resigns or departs employment for any reason prior to completing twelve (12) full months of service from the Effective Date, Employee shall immediately repay to Employer the full sum of $18,500 as reimbursement for specialized training expenses, and Employer is authorized to deduct any unpaid balance from final wages.",
    },
    legalClaims: [
      {
        id: "claim-del-wage-1",
        findingId: "finding-emp-1",
        claim: "Under Delaware law, contractual wage deductions for training repayment require express statutory compliance and cannot reduce compensation below minimum wage standards.",
        sourceIds: ["source-del-wage-act"],
        supportLevel: "direct",
        explanation: "19 Del. C. § 1107 restricts deductions from wages to those authorized by law or signed employee authorizations for lawful purposes.",
        uncertainties: [
          "Whether the employer can prove direct tuition costs totaling $18,500 versus ordinary internal onboarding overhead.",
        ],
        jurisdiction: "Delaware",
        verified: true,
      },
      {
        id: "claim-training-amort-1",
        findingId: "finding-emp-1",
        claim: "Un-amortized lump-sum training clawbacks face heightened judicial scrutiny if they operate as punitive retention penalties rather than genuine cost recoveries.",
        sourceIds: ["source-restatement-emp-807"],
        supportLevel: "strong",
        explanation: "Restatement of Employment Law § 8.07 requires training repayment provisions to amortize over employee tenure.",
        uncertainties: [
          "Whether Delaware Chancery or Superior courts would reform the unamortized amount or declare the deduction void.",
        ],
        jurisdiction: "United States (General)",
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-del-wage-act",
        title: "Delaware Wage Payment and Collection Act (19 Del. C. § 1107)",
        publisher: "Delaware General Assembly",
        sourceType: "official_legislation",
        citation: "19 Del. C. § 1107 (Withholding and Deductions)",
        jurisdiction: "Delaware",
        url: "https://delcode.delaware.gov/title19/c011/index.html",
        sourceUrl: "https://delcode.delaware.gov/title19/c011/index.html",
        relevance: "Governs mandatory deductions and wage withholding for employee training repayment agreements",
        retrievedAt: "2026-03-01T00:00:00Z",
        publicationDate: "2024-01-01",
        verificationStatus: "verified",
        excerpt:
          "No employer may withhold or divert any portion of an employee's wages unless the employer is required or empowered to do so by state or federal law, or the employer has a signed authorization from the employee for a lawful deduction.",
        relevantExcerpt:
          "No employer may withhold or divert any portion of an employee's wages unless the employer has a signed authorization from the employee for a lawful deduction.",
        notes: "Deductions for training repayment are scrutinized to ensure they represent genuine educational expenses rather than liquidated damages for departure.",
        authorityType: "statute",
      },
      {
        id: "source-restatement-emp-807",
        title: "Restatement of Employment Law § 8.07 (Training Repayment)",
        publisher: "American Law Institute",
        sourceType: "recognized_legal_source",
        citation: "Restatement (Third) of Employment Law § 8.07",
        jurisdiction: "United States (General)",
        url: "https://www.ali.org/publications/show/employment-law/",
        sourceUrl: "https://www.ali.org/publications/show/employment-law/",
        relevance: "Authoritative treatise standard on enforceable employee training loan and reimbursement conditions",
        retrievedAt: "2026-02-15T00:00:00Z",
        publicationDate: "2015-07-01",
        verificationStatus: "verified",
        excerpt:
          "An agreement requiring an employee to repay training costs upon early departure is enforceable only to the extent the training confers transferable general skills and the reimbursement is reasonably related to actual expenditures amortized over a reasonable tenure.",
        relevantExcerpt:
          "Reimbursement is enforceable only to the extent the reimbursement is reasonably related to actual expenditures amortized over a reasonable tenure.",
        notes: "Pro-rata monthly amortization is standard to withstand judicial scrutiny as a non-punitive training investment.",
        authorityType: "restatement",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-del-wage-act",
        claimId: "claim-del-wage-1",
        citation: "19 Del. C. § 1107",
        relevantExcerpt: "No employer may withhold or divert any portion of an employee's wages unless the employer has a signed authorization from the employee for a lawful deduction.",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "verified",
      verifiedAt: "2026-03-12T10:20:00Z",
      issues: [],
      confidenceLevel: "high",
    },
    uncertainties: [
      "Whether the training provided involves third-party transferable credentials or internal company onboarding.",
      "Whether the employer would seek wage deductions or initiate separate breach of contract litigation.",
    ],
    nextSteps: [
      {
        id: "act-emp-1",
        title: "Request Pro-Rata Scaling & Clarify Training Scope",
        description:
          "Propose amending Section 6 so that the $18,500 reimbursement reduces by 1/12th ($1,541.66) for each month of completed service, and applies solely to external accredited certifications.",
        priority: "high",
        partyResponsible: "Employee (Alex Morgan)",
        isReversible: true,
        recommendedTimeline: "Before signing offer",
        practicalAdvice:
          "Frame this as an industry-standard pro-rata vesting schedule: 'I am excited to commit long-term, and standard market practice is for training repayment to amortize monthly over the first year.'",
      },
    ],
    legalSource: {
      id: "source-del-wage-act",
      title: "Delaware Wage Payment and Collection Act (19 Del. C. § 1107)",
      publisher: "Delaware General Assembly",
      sourceType: "official_legislation",
      citation: "19 Del. C. § 1107 (Withholding and Deductions)",
      jurisdiction: "Delaware",
      url: "https://delcode.delaware.gov/title19/c011/index.html",
      sourceUrl: "https://delcode.delaware.gov/title19/c011/index.html",
      relevance: "Governs mandatory deductions and wage withholding for employee training repayment agreements",
      retrievedAt: "2026-03-01T00:00:00Z",
      publicationDate: "2024-01-01",
      verificationStatus: "verified",
      excerpt:
        "No employer may withhold or divert any portion of an employee's wages unless the employer is required or empowered to do so by state or federal law, or the employer has a signed authorization from the employee for a lawful deduction.",
      relevantExcerpt:
        "No employer may withhold or divert any portion of an employee's wages unless the employer has a signed authorization from the employee for a lawful deduction.",
      notes: "Deductions for training repayment are scrutinized to ensure they represent genuine educational expenses rather than liquidated damages for departure.",
      authorityType: "statute",
    },
    confidence: {
      level: "high",
      rationale:
        "Clear statutory framework governing permissible wage deductions and training reimbursement agreements in Delaware.",
    },
    uncertainty: {
      id: "unc-emp-1",
      findingId: "finding-emp-1",
      factualDependencies: [
        "Whether the training provided involves third-party transferable credentials or internal company onboarding.",
        "Whether repayment terms scale down on a pro-rata basis (e.g. 1/12th reduction per month worked).",
      ],
      unverifiedAssumptions: [
        "Assumes Delaware law governs as stipulated in Section 12 recital.",
      ],
      explanation:
        "While Delaware permits voluntary training repayment agreements, provisions that do not pro-rate the repayment over time or that deduct wages below legal minimums face judicial scrutiny.",
      isFactVsInterpretationClear: true,
    },
    practicalNextStep: {
      id: "act-emp-1",
      title: "Request Pro-Rata Scaling & Clarify Training Scope",
      description:
        "Propose amending Section 6 so that the $18,500 reimbursement reduces by 1/12th ($1,541.66) for each month of completed service, and applies solely to external accredited certifications.",
      priority: "high",
      partyResponsible: "Employee (Alex Morgan)",
      isReversible: true,
      recommendedTimeline: "Before signing offer",
      practicalAdvice:
        "Frame this as an industry-standard pro-rata vesting schedule: 'I am excited to commit long-term, and standard market practice is for training repayment to amortize monthly over the first year.'",
    },
  },
  {
    id: "chain-emp-2",
    finding: SAMPLE_FINDINGS[2],
    documentEvidence: {
      clauseId: "clause-sec-8",
      section: "Section 8",
      pageNumber: 2,
      quotedText:
        "Employee hereby assigns to Employer all right, title, and interest in and to any and all inventions... conceived, developed, or reduced to practice by Employee during the term of employment, whether or not during regular working hours, and whether or not using Company facilities or equipment.",
      sourceType: "document",
      exactQuote:
        "Employee hereby assigns to Employer all right, title, and interest in and to any and all inventions... conceived, developed, or reduced to practice by Employee during the term of employment, whether or not during regular working hours, and whether or not using Company facilities or equipment.",
    },
    legalClaims: [
      {
        id: "claim-ip-del-1",
        findingId: "finding-emp-3",
        claim: "Under Delaware common law, invention assignments are enforceable to protect employer trade secrets, but assignments encompassing off-duty personal creations are strictly construed against overreach.",
        sourceIds: ["source-del-invention-assignment"],
        supportLevel: "strong",
        explanation: "Employers may capture inventions directly related to the business or resulting from company resources, but personal projects developed on personal time require clear statutory or contractual boundaries.",
        uncertainties: [
          "Whether Employee has existing open-source code repositories or side software projects.",
        ],
        jurisdiction: "Delaware",
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-del-invention-assignment",
        title: "Delaware Common Law Rules on Inventions Assignments",
        publisher: "Delaware Supreme Court",
        sourceType: "official_court",
        citation: "Delaware Corporate & Employment Inventions Jurisprudence",
        jurisdiction: "Delaware",
        url: "https://courts.delaware.gov/",
        sourceUrl: "https://courts.delaware.gov/",
        relevance: "Governs ownership of inventions created outside regular working hours without employer resources",
        retrievedAt: "2026-02-20T00:00:00Z",
        publicationDate: "2021-05-15",
        verificationStatus: "verified",
        excerpt:
          "Agreements assigning employee inventions to employers are valid to protect business-related IP, but provisions claiming inventions created on the employee's own time without company assets are strictly construed.",
        relevantExcerpt:
          "Provisions claiming inventions created on the employee's own time without company assets are strictly construed.",
        notes: "Customary practice includes an explicit schedule of prior inventions and carve-out for personal off-duty works.",
        authorityType: "case_law",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-del-invention-assignment",
        claimId: "claim-ip-del-1",
        citation: "Delaware Inventions Jurisprudence",
        relevantExcerpt: "Provisions claiming inventions created on the employee's own time without company assets are strictly construed.",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "verified",
      verifiedAt: "2026-03-12T10:20:00Z",
      issues: [],
      confidenceLevel: "high",
    },
    uncertainties: [
      "Whether Employee has pre-existing personal software projects or repositories to exclude.",
    ],
    nextSteps: [
      {
        id: "act-emp-2",
        title: "Attach Exhibit A (List of Prior Inventions) and Add Personal Equipment Carve-Out",
        description:
          "Insert standard carve-out: 'This assignment shall not apply to inventions developed entirely on Employee's own time without using Employer's equipment, supplies, or trade secret information, and which do not relate to Employer's actual business.'",
        priority: "high",
        partyResponsible: "Employee",
        isReversible: true,
        recommendedTimeline: "During pre-execution review",
        practicalAdvice:
          "Request the standard Prior Inventions Schedule to document all pre-existing GitHub repositories.",
      },
    ],
    legalSource: {
      id: "source-del-invention-assignment",
      title: "Delaware Common Law Rules on Inventions Assignments",
      publisher: "Delaware Supreme Court",
      sourceType: "official_court",
      citation: "Delaware Corporate & Employment Inventions Jurisprudence",
      jurisdiction: "Delaware",
      url: "https://courts.delaware.gov/",
      sourceUrl: "https://courts.delaware.gov/",
      relevance: "Governs ownership of inventions created outside regular working hours without employer resources",
      retrievedAt: "2026-02-20T00:00:00Z",
      publicationDate: "2021-05-15",
      verificationStatus: "verified",
      excerpt:
        "Agreements assigning employee inventions to employers are valid to protect business-related IP, but provisions claiming inventions created on the employee's own time without company assets are strictly construed.",
      relevantExcerpt:
        "Provisions claiming inventions created on the employee's own time without company assets are strictly construed.",
      notes: "Customary practice includes an explicit schedule of prior inventions and carve-out for personal off-duty works.",
      authorityType: "case_law",
    },
    confidence: {
      level: "high",
      rationale:
        "Scope explicitly encompasses inventions created outside working hours without company assets, which is broader than customary tech employment norms.",
    },
    uncertainty: {
      id: "unc-emp-2",
      findingId: "finding-emp-3",
      factualDependencies: [
        "Whether Employee has pre-existing personal software projects or repositories to exclude.",
      ],
      unverifiedAssumptions: [
        "Assumes Employee develops software in personal capacity outside employment.",
      ],
      explanation:
        "Courts typically enforce assignments directly relating to the employer's line of business, but broader language creates ambiguity for personal open-source projects.",
      isFactVsInterpretationClear: true,
    },
    practicalNextStep: {
      id: "act-emp-2",
      title: "Attach Exhibit A (List of Prior Inventions) and Add Personal Equipment Carve-Out",
      description:
        "Insert standard carve-out: 'This assignment shall not apply to inventions developed entirely on Employee's own time without using Employer's equipment, supplies, or trade secret information, and which do not relate to Employer's actual business.'",
      priority: "high",
      partyResponsible: "Employee",
      isReversible: true,
      recommendedTimeline: "During pre-execution review",
      practicalAdvice:
        "Request the standard Prior Inventions Schedule to document all pre-existing GitHub repositories.",
    },
  },
  {
    id: "chain-emp-3",
    finding: SAMPLE_FINDINGS[3],
    documentEvidence: {
      clauseId: "clause-sec-9",
      section: "Section 9",
      pageNumber: 2,
      quotedText:
        "For a period of twelve (12) months following termination of employment for any reason, Employee shall not directly or indirectly engage in, perform services for, consult with, or have any financial interest in any business entity providing cloud infrastructure software or distributed database services within a fifty (50) mile radius of Dover, Delaware.",
      sourceType: "document",
      exactQuote:
        "For a period of twelve (12) months following termination of employment for any reason, Employee shall not directly or indirectly engage in, perform services for, consult with, or have any financial interest in any business entity providing cloud infrastructure software or distributed database services within a fifty (50) mile radius of Dover, Delaware.",
    },
    legalClaims: [
      {
        id: "claim-del-noncompete-1",
        findingId: "finding-emp-4",
        claim: "Delaware courts apply a strict reasonableness test balancing the employer's legitimate protectable interest against undue hardship on the employee.",
        sourceIds: ["source-del-chancery-noncompete"],
        supportLevel: "direct",
        explanation: "Under Delaware Court of Chancery precedent (Kodiak Bldg. Partners), non-competes are scrutinized closely and broad geographic/activity bans that exceed the employer's actual customer relationships face potential refusal of blue-penciling.",
        uncertainties: [
          "Whether Delaware courts would blue-pencil (narrow) or refuse to enforce the geographic restriction in a remote work environment.",
        ],
        jurisdiction: "Delaware",
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-del-chancery-noncompete",
        title: "Delaware Court of Chancery Non-Compete Reasonableness Standards",
        publisher: "Delaware Court of Chancery",
        sourceType: "official_court",
        citation: "Kodiak Bldg. Partners, LLC v. Adams, 2022 WL 5240507 (Del. Ch. 2022)",
        jurisdiction: "Delaware",
        url: "https://courts.delaware.gov/opinions/",
        sourceUrl: "https://courts.delaware.gov/opinions/",
        relevance: "Binding precedent regarding geographic and scope reasonableness in Delaware non-competition covenants",
        retrievedAt: "2026-03-01T00:00:00Z",
        publicationDate: "2022-10-06",
        verificationStatus: "verified",
        excerpt:
          "To be enforceable under Delaware law, a restrictive covenant must be reasonable in scope and duration, advance a legitimate economic interest of the employer, and survive a balancing of the equities.",
        relevantExcerpt:
          "A restrictive covenant must be reasonable in scope and duration, advance a legitimate economic interest of the employer, and survive a balancing of the equities.",
        notes: "Delaware courts increasingly decline to mechanically blue-pencil overbroad non-compete agreements.",
        authorityType: "case_law",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-del-chancery-noncompete",
        claimId: "claim-del-noncompete-1",
        citation: "Kodiak Bldg. Partners, LLC v. Adams, 2022 WL 5240507",
        relevantExcerpt: "To be enforceable under Delaware law, a restrictive covenant must be reasonable in scope and duration, advance a legitimate economic interest of the employer, and survive a balancing of the equities.",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "partially_verified",
      verifiedAt: "2026-03-12T10:20:00Z",
      issues: [
        "Enforceability depends heavily on specific factual proof of protectable trade secrets and actual geographic market reach.",
      ],
      confidenceLevel: "moderate",
    },
    uncertainties: [
      "Whether remote work performed from Dover for an out-of-state employer would violate the 50-mile radius clause.",
      "Delaware courts evaluate non-competes under a reasonableness test balancing employer protectable interests with employee mobility.",
    ],
    nextSteps: [
      {
        id: "act-emp-4",
        title: "Clarify Remote Work Permissibility & Narrow Non-Compete Scope",
        description:
          "Request limiting Section 9 to direct named competitors where employee would use proprietary trade secrets, excluding general distributed systems consulting.",
        priority: "high",
        partyResponsible: "Employee",
        isReversible: true,
        recommendedTimeline: "Before executing agreement",
        practicalAdvice:
          "Say: 'Because modern distributed engineering is inherently distributed and remote, let us tie the restriction directly to named competitors rather than a geographic radius.'",
      },
    ],
    legalSource: {
      id: "source-del-chancery-noncompete",
      title: "Delaware Court of Chancery Non-Compete Reasonableness Standards",
      publisher: "Delaware Court of Chancery",
      sourceType: "official_court",
      citation: "Kodiak Bldg. Partners, LLC v. Adams, 2022 WL 5240507 (Del. Ch. 2022)",
      jurisdiction: "Delaware",
      url: "https://courts.delaware.gov/opinions/",
      sourceUrl: "https://courts.delaware.gov/opinions/",
      relevance: "Binding precedent regarding geographic and scope reasonableness in Delaware non-competition covenants",
      retrievedAt: "2026-03-01T00:00:00Z",
      publicationDate: "2022-10-06",
      verificationStatus: "verified",
      excerpt:
        "To be enforceable under Delaware law, a restrictive covenant must be reasonable in scope and duration, advance a legitimate economic interest of the employer, and survive a balancing of the equities.",
      relevantExcerpt:
        "A restrictive covenant must be reasonable in scope and duration, advance a legitimate economic interest of the employer, and survive a balancing of the equities.",
      notes: "Delaware courts increasingly decline to mechanically blue-pencil overbroad non-compete agreements.",
      authorityType: "case_law",
    },
    confidence: {
      level: "moderate",
      rationale:
        "Non-compete covenants are governed by well-established reasonableness standards, but enforceability is fact-dependent on employer protectable interest.",
    },
    uncertainty: {
      id: "unc-emp-4",
      findingId: "finding-emp-4",
      factualDependencies: [
        "Whether Employee has direct client contacts or proprietary architectural trade secrets.",
        "Whether the company conducts genuine local business within 50 miles of Dover.",
      ],
      unverifiedAssumptions: [
        "Assumes Employee may seek subsequent employment in cloud/database systems.",
      ],
      explanation:
        "Delaware courts evaluate non-competes under a reasonableness test balancing employer protectable interests with employee mobility.",
      isFactVsInterpretationClear: true,
    },
    practicalNextStep: {
      id: "act-emp-4",
      title: "Clarify Remote Work Permissibility & Narrow Non-Compete Scope",
      description:
        "Request limiting Section 9 to direct named competitors where employee would use proprietary trade secrets, excluding general distributed systems consulting.",
      priority: "high",
      partyResponsible: "Employee",
      isReversible: true,
      recommendedTimeline: "Before executing agreement",
      practicalAdvice:
        "Say: 'Because modern distributed engineering is inherently distributed and remote, let us tie the restriction directly to named competitors rather than a geographic radius.'",
    },
  },
  {
    id: "chain-emp-4",
    finding: SAMPLE_FINDINGS[4],
    documentEvidence: {
      clauseId: "clause-sec-11",
      section: "Section 11",
      pageNumber: 3,
      quotedText:
        "Any dispute, controversy, or claim arising out of or relating to this Agreement... shall be settled by confidential binding arbitration administered by the American Arbitration Association... each party shall bear its own attorneys' fees and an equal share of arbitrator compensation and administrative expenses.",
      sourceType: "document",
      exactQuote:
        "Any dispute, controversy, or claim arising out of or relating to this Agreement... shall be settled by confidential binding arbitration administered by the American Arbitration Association... each party shall bear its own attorneys' fees and an equal share of arbitrator compensation and administrative expenses.",
    },
    legalClaims: [
      {
        id: "claim-del-arbitration-1",
        findingId: "finding-emp-5",
        claim: "Under the AAA Employment Due Process Protocol, employer-mandated arbitration agreements cannot require the employee to bear arbitrator forum fees.",
        sourceIds: ["source-aaa-employment-rules"],
        supportLevel: "direct",
        explanation: "When arbitration is mandated by an employer, AAA rules cap the employee's share of filing costs and place all arbitrator compensation and administrative hearing expenses on the employer.",
        uncertainties: [
          "Whether the arbitration clause's fee-splitting provision would be severed or enforced as written.",
        ],
        jurisdiction: "United States (Federal / Delaware)",
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-aaa-employment-rules",
        title: "AAA Employment Arbitration Rules & Due Process Protocol (Rule 48)",
        publisher: "American Arbitration Association",
        sourceType: "regulator",
        citation: "AAA Employment Due Process Protocol & Rule 48",
        jurisdiction: "United States (Federal / Delaware)",
        url: "https://www.adr.org/employment",
        sourceUrl: "https://www.adr.org/employment",
        relevance: "Establishes fee-bearing limits for employees in employer-mandated arbitration proceedings",
        retrievedAt: "2026-02-18T00:00:00Z",
        publicationDate: "2023-11-01",
        verificationStatus: "verified",
        excerpt:
          "Under the AAA Employment Due Process Protocol, in disputes arising out of employer-promulgated plans, the employee's filing fee is capped, and all other administrative and arbitrator fees must be borne by the employer.",
        relevantExcerpt:
          "The employee's filing fee is capped, and all other administrative and arbitrator fees must be borne by the employer.",
        notes: "Clause provisions stating that each party pays half of all arbitration costs are often overridden by AAA rules.",
        authorityType: "regulation",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-aaa-employment-rules",
        claimId: "claim-del-arbitration-1",
        citation: "AAA Employment Due Process Protocol & Rule 48",
        relevantExcerpt: "Under the AAA Employment Due Process Protocol, the employee's filing fee is capped, and all other administrative and arbitrator fees must be borne by the employer.",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "verified",
      verifiedAt: "2026-03-12T10:20:00Z",
      issues: [],
      confidenceLevel: "high",
    },
    uncertainties: [
      "Whether the company would agree to incorporate standard AAA employment fee schedules explicitly in the contract.",
    ],
    nextSteps: [
      {
        id: "act-emp-5",
        title: "Clarify Arbitration Fee Allocation Under AAA Rules",
        description:
          "Add clarifying sentence to Section 11: 'Arbitrator compensation and administrative forum fees shall be borne by Employer in accordance with AAA Employment Rules.'",
        priority: "medium",
        partyResponsible: "Employee",
        isReversible: true,
        recommendedTimeline: "During pre-signing review",
        practicalAdvice:
          "Highlight that AAA rules already mandate employer fee coverage, so aligning the text prevents future jurisdictional disputes.",
      },
    ],
    legalSource: {
      id: "source-aaa-employment-rules",
      title: "AAA Employment Arbitration Rules & Due Process Protocol (Rule 48)",
      publisher: "American Arbitration Association",
      sourceType: "regulator",
      citation: "AAA Employment Due Process Protocol & Rule 48",
      jurisdiction: "United States (Federal / Delaware)",
      url: "https://www.adr.org/employment",
      sourceUrl: "https://www.adr.org/employment",
      relevance: "Establishes fee-bearing limits for employees in employer-mandated arbitration proceedings",
      retrievedAt: "2026-02-18T00:00:00Z",
      publicationDate: "2023-11-01",
      verificationStatus: "verified",
      excerpt:
        "Under the AAA Employment Due Process Protocol, in disputes arising out of employer-promulgated plans, the employee's filing fee is capped, and all other administrative and arbitrator fees must be borne by the employer.",
      relevantExcerpt:
        "The employee's filing fee is capped, and all other administrative and arbitrator fees must be borne by the employer.",
      notes: "Clause provisions stating that each party pays half of all arbitration costs are often overridden by AAA rules.",
      authorityType: "regulation",
    },
    confidence: {
      level: "high",
      rationale:
        "Clear administrative rules established by the named arbitration tribunal (AAA).",
    },
    uncertainty: {
      id: "unc-emp-5",
      findingId: "finding-emp-5",
      factualDependencies: [
        "Whether the agreement is treated as an employer-promulgated standard plan or an individually negotiated executive contract.",
      ],
      unverifiedAssumptions: [],
      explanation:
        "Whether employment arbitration rules require the employer to cover primary arbitrator forum fees.",
      isFactVsInterpretationClear: true,
    },
    practicalNextStep: {
      id: "act-emp-5",
      title: "Clarify Arbitration Fee Allocation Under AAA Rules",
      description:
        "Add clarifying sentence to Section 11: 'Arbitrator compensation and administrative forum fees shall be borne by Employer in accordance with AAA Employment Rules.'",
      priority: "medium",
      partyResponsible: "Employee",
      isReversible: true,
      recommendedTimeline: "During pre-signing review",
      practicalAdvice:
        "Highlight that AAA rules already mandate employer fee coverage, so aligning the text prevents future jurisdictional disputes.",
    },
  },
  {
    id: "chain-emp-5",
    finding: SAMPLE_FINDINGS[1],
    documentEvidence: {
      clauseId: "clause-sec-5",
      section: "Section 5",
      pageNumber: 1,
      quotedText:
        "Employee agrees to provide not less than sixty (60) calendar days advance written notice to Employer prior to any voluntary resignation or termination of employment.",
      sourceType: "document",
      exactQuote:
        "Employee agrees to provide not less than sixty (60) calendar days advance written notice to Employer prior to any voluntary resignation or termination of employment.",
    },
    legalClaims: [
      {
        id: "claim-del-notice-1",
        findingId: "finding-emp-2",
        claim: "Under Delaware at-will employment principles, contractual notice provisions are enforceable agreement covenants, but reciprocity is customary to prevent unilateral lock-in.",
        sourceIds: ["source-at-will-doctrine"],
        supportLevel: "partial",
        explanation: "Contractual notice clauses are permissible, but 60 days is significantly longer than the customary 14-day notice.",
        uncertainties: [
          "Whether the employer pays salary if they choose to waive the 60-day notice window upon notice receipt.",
        ],
        jurisdiction: "Delaware",
        verified: true,
      },
    ],
    legalSources: [
      {
        id: "source-at-will-doctrine",
        title: "Delaware At-Will Employment Doctrine & Mutuality Principles",
        publisher: "Delaware Courts",
        sourceType: "recognized_legal_source",
        citation: "Delaware At-Will Precedent",
        jurisdiction: "Delaware",
        url: "https://courts.delaware.gov/",
        sourceUrl: "https://courts.delaware.gov/",
        relevance: "At-will employment precedent regarding notice windows and mutuality",
        retrievedAt: "2026-02-15T00:00:00Z",
        publicationDate: "2020-01-01",
        verificationStatus: "verified",
        excerpt:
          "Employment relationships are presumed at-will unless modified by agreement. While contractual notice periods can be agreed upon, mutuality of notice obligations is standard.",
        relevantExcerpt:
          "Employment relationships are presumed at-will unless modified by agreement. While contractual notice periods can be agreed upon, mutuality of notice obligations is standard.",
        notes: "At-will employment typically features 2-week reciprocal notice periods.",
        authorityType: "standard_practice",
      },
    ],
    legalEvidence: [
      {
        legalSourceId: "source-at-will-doctrine",
        claimId: "claim-del-notice-1",
        citation: "Delaware At-Will Precedent",
        relevantExcerpt: "Employment relationships are presumed at-will unless modified by agreement.",
        sourceType: "legal",
      },
    ],
    verification: {
      status: "partially_verified",
      verifiedAt: "2026-03-12T10:20:00Z",
      issues: [
        "Contractual notice periods are generally matter of contract negotiation rather than strict statutory prohibition.",
      ],
      confidenceLevel: "moderate",
    },
    uncertainties: [
      "Whether the Employer is required to pay salary during the 60-day window if Employer elects to waive reporting.",
    ],
    nextSteps: [
      {
        id: "act-emp-3",
        title: "Propose Mutual 30-Day Notice Period with Garden Leave Option",
        description:
          "Suggest amending Section 5 to thirty (30) days mutual notice for both parties, with employer option to provide pay in lieu of notice.",
        priority: "medium",
        partyResponsible: "Employee",
        isReversible: true,
        recommendedTimeline: "During offer negotiation",
        practicalAdvice:
          "Say: 'A 30-day mutual notice window provides ample transition time for complex architecture knowledge transfer while remaining standard for senior engineering roles.'",
      },
    ],
    legalSource: {
      id: "source-at-will-doctrine",
      title: "Delaware At-Will Employment Doctrine & Mutuality Principles",
      publisher: "Delaware Courts",
      sourceType: "recognized_legal_source",
      citation: "Delaware At-Will Precedent",
      jurisdiction: "Delaware",
      url: "https://courts.delaware.gov/",
      sourceUrl: "https://courts.delaware.gov/",
      relevance: "At-will employment precedent regarding notice windows and mutuality",
      retrievedAt: "2026-02-15T00:00:00Z",
      publicationDate: "2020-01-01",
      verificationStatus: "context_only",
      notes: "At-will employment typically features 2-week reciprocal notice periods.",
      authorityType: "standard_practice",
    },
    confidence: {
      level: "moderate",
      rationale:
        "Notice periods are legally permissible contractual terms, but 60 days is four times the customary 14-day standard.",
    },
    uncertainty: {
      id: "unc-emp-3",
      findingId: "finding-emp-2",
      factualDependencies: [
        "Whether the Employer is required to pay salary during the 60-day window if Employer elects to waive reporting.",
      ],
      unverifiedAssumptions: [
        "Assumes Employee will seek standard 14-day transition period in future opportunities.",
      ],
      explanation:
        "Contractual notice clauses are generally enforceable as agreement terms, but may be compromised if the employer reserves unilateral termination rights without reciprocal notice.",
      isFactVsInterpretationClear: true,
    },
    practicalNextStep: {
      id: "act-emp-3",
      title: "Propose Mutual 30-Day Notice Period with Garden Leave Option",
      description:
        "Suggest amending Section 5 to thirty (30) days mutual notice for both parties, with employer option to provide pay in lieu of notice.",
      priority: "medium",
      partyResponsible: "Employee",
      isReversible: true,
      recommendedTimeline: "During offer negotiation",
      practicalAdvice:
        "Say: 'A 30-day mutual notice window provides ample transition time for complex architecture knowledge transfer while remaining standard for senior engineering roles.'",
    },
  },
];

export const SAMPLE_LAWYER_BRIEF: LawyerBrief = {
  id: "brief-employment-agreement-01",
  generatedAt: "2026-03-12T10:15:00Z",
  documentSummary:
    "Executive Employment Agreement for Senior Distributed Systems Architect ($145,000/yr) between Aegis Cloud Dynamics Inc. (Employer) and Alex Morgan (Employee). Features strict retention terms including an un-amortized $18,500 training reimbursement, 60-day notice period, broad IP assignment, 12-month non-compete, and mandatory arbitration in Delaware.",
  partiesInvolved: [
    "Aegis Cloud Dynamics Inc. (Employer)",
    "Alex Morgan (Employee)",
  ],
  keyIssuesToReview: [
    {
      issue: "Un-amortized $18,500 training reimbursement on resignation within 12 months (Section 6)",
      clauseReference: "Section 6 (Page 2)",
      severity: "high_attention",
      recommendedQuestion:
        "Is this training reimbursement provision enforceable under Delaware wage deduction laws, and should we push for monthly pro-rata amortization?",
    },
    {
      issue: "Comprehensive IP assignment captures off-duty, personal creations (Section 8)",
      clauseReference: "Section 8 (Page 2)",
      severity: "high_attention",
      recommendedQuestion:
        "How should we draft the carve-out for pre-existing software projects and off-duty creations to protect personal intellectual property?",
    },
    {
      issue: "60-day resignation notice requirement (Section 5)",
      clauseReference: "Section 5 (Page 1)",
      severity: "review",
      recommendedQuestion:
        "If the employee gives 60 days notice and the employer terminates immediately, is the employer obligated to pay out the 60-day notice window?",
    },
    {
      issue: "Post-employment 12-month non-compete within 50-mile radius (Section 9)",
      clauseReference: "Section 9 (Page 2)",
      severity: "high_attention",
      recommendedQuestion:
        "How is this non-compete evaluated in Delaware for remote distributed systems roles where clients and servers operate nationally?",
    },
  ],
  missingInformation: [
    "Exhibit A (Prior Inventions Schedule) is referenced implicitly but not attached.",
    "Specific course description or receipts for the $18,500 training program are omitted.",
    "Severance terms in the event of termination without cause are not addressed.",
  ],
  recommendedNegotiationPoints: [
    "Pro-rate Section 6 training repayment so liability amortizes by 1/12th each month worked.",
    "Add standard California/Delaware statutory carve-out to Section 8 for personal inventions.",
    "Adjust Section 5 notice period from 60 days to a mutual 30 days.",
    "Limit Section 9 non-compete strictly to direct competitors using proprietary trade secrets.",
  ],
};

export const SAMPLE_ANALYSIS_REPORT: AnalysisReport = {
  id: "demo-employment-agreement",
  documentId: "demo-employment-agreement",
  metadata: SAMPLE_DOCUMENT_METADATA,
  createdAt: "2026-03-12T10:20:00Z",
  status: "completed",
  summary: {
    overallReadiness: "high_risk_clauses_present",
    keyTakeaway:
      "Identified 3 high-attention provisions (early departure training reimbursement of $18,500, broad IP assignment, and 12-month non-compete) and 2 review items (60-day notice and arbitration fees) that deserve discussion before signing.",
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
    partyResponsible: "Alex Morgan",
    isReversible: true,
    recommendedTimeline: "Before signing",
    practicalAdvice: `Review ${f.evidence.section} and request standard written adjustment.`,
  })),
  lawyerBrief: SAMPLE_LAWYER_BRIEF,
  safetyDisclaimer: GLOBAL_LEGAL_DISCLAIMER,
};

export const SAMPLE_SITUATION_ASSESSMENT: SituationAssessment = {
  id: "situation-sample-unpaid-invoice",
  userPrompt:
    "I am a freelance software developer based in Austin, Texas. A client in California owes me $14,500 on an approved milestone invoice that was due 45 days ago. They are ignoring my emails. I have a signed statement of work, email approval of the code delivery, and timestamped GitHub commit logs.",
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
