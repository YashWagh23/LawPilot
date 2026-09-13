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
      exactQuote:
        "if Employee resigns or departs employment for any reason prior to completing twelve (12) full months of service from the Effective Date, Employee shall immediately repay to Employer the full sum of $18,500 as reimbursement for specialized training expenses, and Employer is authorized to deduct any unpaid balance from final wages.",
    },
    legalSource: {
      id: "source-del-wage-act",
      title: "Delaware Wage Payment and Collection Act (19 Del. C. § 1107)",
      citation: "19 Del. C. § 1107 (Withholding and Deductions)",
      jurisdiction: "Delaware",
      authorityType: "statute",
      excerpt:
        "No employer may withhold or divert any portion of an employee's wages unless the employer is required or empowered to do so by state or federal law, or the employer has a signed authorization from the employee for a lawful deduction.",
      sourceUrl: "https://delcode.delaware.gov/title19/c011/index.html",
      verificationStatus: "verified",
      notes: "Deductions for training repayment are scrutinized to ensure they represent genuine educational expenses rather than liquidated damages for departure.",
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
      exactQuote:
        "Employee hereby assigns to Employer all right, title, and interest in and to any and all inventions... conceived, developed, or reduced to practice by Employee during the term of employment, whether or not during regular working hours, and whether or not using Company facilities or equipment.",
    },
    legalSource: {
      id: "source-del-invention-std",
      title: "Delaware Common Law & Standard Invention Assignment Principles",
      citation: "Delaware Corporate & Employment Jurisprudence",
      jurisdiction: "Delaware",
      authorityType: "standard_practice",
      excerpt:
        "Invention assignments are enforceable to protect employer trade secrets and work within the scope of employment, but overly broad assignments covering off-duty unrelated inventions are strictly construed against the employer.",
      verificationStatus: "verified",
      notes: "Market standard practice includes an explicit carve-out for inventions created on employee's own time without company assets.",
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
    finding: SAMPLE_FINDINGS[1],
    documentEvidence: {
      clauseId: "clause-sec-5",
      section: "Section 5",
      pageNumber: 1,
      exactQuote:
        "Employee agrees to provide not less than sixty (60) calendar days advance written notice to Employer prior to any voluntary resignation or termination of employment.",
    },
    legalSource: {
      id: "source-at-will-doctrine",
      title: "Delaware At-Will Employment Doctrine & Mutuality Principles",
      citation: "Delaware At-Will Precedent",
      jurisdiction: "Delaware",
      authorityType: "standard_practice",
      excerpt:
        "Employment relationships are presumed at-will unless modified by agreement. While contractual notice periods can be agreed upon, mutuality of notice obligations is standard.",
      verificationStatus: "context_only",
      notes: "At-will employment typically features 2-week reciprocal notice periods.",
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
