import type {
  Clause,
  DocumentComparisonResult,
  JurisdictionContext,
} from "@/types";
import { GLOBAL_LEGAL_DISCLAIMER } from "@/lib/safety/disclaimer";
import { matchClausesSemantically } from "@/lib/comparison/clauseMatcher";
import { analyzeAllClauseDifferences } from "@/lib/comparison/semanticChangeDetector";
import {
  compareJurisdictions,
  integrateLegalContext,
} from "@/lib/comparison/legalContextIntegrator";

export const DEMO_PREVIOUS_JURISDICTION: JurisdictionContext = {
  country: "India",
  stateOrUT: "Maharashtra",
  governingLaw: "Laws of the Republic of India and exclusive jurisdiction of the Courts in Mumbai, Maharashtra",
  confidence: "high",
  source: "document",
  evidence: [
    "Section 10 explicitly designates the laws of the Republic of India and exclusive jurisdiction of the Courts in Mumbai, Maharashtra.",
    "Corporate Address: Platina Tower, Bandra-Kurla Complex (BKC), Mumbai 400051.",
  ],
};

export const DEMO_CURRENT_JURISDICTION: JurisdictionContext = {
  country: "India",
  stateOrUT: "Maharashtra",
  governingLaw: "Laws of the Republic of India and exclusive jurisdiction of the Courts in Mumbai, Maharashtra",
  confidence: "high",
  source: "document",
  evidence: [
    "Section 12 explicitly designates the substantive laws of the Republic of India and exclusive jurisdiction of the Courts in Mumbai, Maharashtra.",
    "Corporate Address: Platina Tower, Level 8, Bandra-Kurla Complex (BKC), Mumbai 400051.",
  ],
};

/**
 * Baseline Draft (Version A - Initial Agreement received by Employee)
 */
export const DEMO_PREVIOUS_CLAUSES: Clause[] = [
  {
    id: "prev-sec-1",
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
    id: "prev-sec-2",
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
    id: "prev-sec-3",
    section: "Section 3",
    title: "Probationary Evaluation Period",
    rawText:
      "The Employee's tenure shall commence with a probationary evaluation period of ninety (90) calendar days from the Effective Date. During such probationary period, either party may terminate this Agreement by giving thirty (30) days advance written notice.",
    plainEnglish:
      "The first 90 days are a probationary evaluation window. Either you or the company can terminate with 30 days notice.",
    category: "employment",
    pageNumber: 1,
    importance: "context_dependent",
    sectionNumber: "Section 3",
  },
  {
    id: "prev-sec-4",
    section: "Section 4",
    title: "Resignation Notice Period",
    rawText:
      "Following confirmation of employment, the Employee agrees to provide not less than sixty (60) days' notice prior to voluntary resignation. The Company and the Employee may mutually agree to waive or shorten the notice period upon satisfactory handover of all ongoing software engineering duties.",
    plainEnglish:
      "You must provide at least 60 days advance written notice before resigning. Both parties can agree to waive notice if handover is complete.",
    category: "notice",
    pageNumber: 1,
    importance: "review",
    sectionNumber: "Section 4",
  },
  {
    id: "prev-sec-5",
    section: "Section 5",
    title: "Early Departure Training Expense Reimbursement",
    rawText:
      "In consideration of the Company providing specialized cloud infrastructure training courses valued at INR 2,00,000 during the initial tenure, the Employee agrees that if the Employee voluntarily resigns within twelve (12) months from the Effective Date, the Employee shall reimburse the actual unamortized training cost, reducing on a pro-rata basis of 1/12th for each completed month of service.",
    plainEnglish:
      "If you leave voluntarily within 12 months, you reimburse up to ₹2,00,000 in actual training costs, reduced monthly on a pro-rata basis.",
    category: "payment",
    pageNumber: 2,
    importance: "review",
    sectionNumber: "Section 5",
  },
  {
    id: "prev-sec-6",
    section: "Section 6",
    title: "Confidentiality and Trade Secrets",
    rawText:
      "The Employee shall hold in strict secrecy all proprietary algorithms, system schematics, cryptographic architectures, customer datasets, and business trade secrets of the Company. This obligation of confidentiality shall survive indefinitely following the cessation of employment.",
    plainEnglish:
      "You cannot disclose or share company trade secrets, system architecture, or customer data with anyone, even after you leave.",
    category: "confidentiality",
    pageNumber: 2,
    importance: "context_dependent",
    sectionNumber: "Section 6",
  },
  {
    id: "prev-sec-7",
    section: "Section 7",
    title: "Intellectual Property and Inventions Assignment",
    rawText:
      "The Employee agrees that all software code, inventions, and technical architectures created in the course of employment during working hours or utilizing Company equipment and facilities shall belong exclusively to the Company.",
    plainEnglish:
      "Software code and inventions created in the course of your employment using company equipment belong to the company.",
    category: "intellectual_property",
    pageNumber: 2,
    importance: "review",
    sectionNumber: "Section 7",
  },
  {
    id: "prev-sec-8",
    section: "Section 8",
    title: "Post-Employment Restrictive Covenant",
    rawText:
      "For a period of six (6) months following termination of employment, the Employee agrees not to directly solicit active engineering clients or employees of the Company within the State of Maharashtra.",
    plainEnglish:
      "For 6 months after leaving, you agree not to solicit company clients or employees in Maharashtra.",
    category: "restriction",
    pageNumber: 2,
    importance: "review",
    sectionNumber: "Section 8",
  },
  {
    id: "prev-sec-9",
    section: "Section 9",
    title: "Dispute Resolution and Arbitration",
    rawText:
      "Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved through final and binding arbitration in Mumbai under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted by a sole arbitrator appointed by mutual consent of both parties.",
    plainEnglish:
      "All disputes go to arbitration in Mumbai before a sole arbitrator chosen by mutual agreement of both parties.",
    category: "dispute_resolution",
    pageNumber: 3,
    importance: "review",
    sectionNumber: "Section 9",
  },
  {
    id: "prev-sec-10",
    section: "Section 10",
    title: "Governing Law and Jurisdiction",
    rawText:
      "This Agreement shall be construed, interpreted, and governed exclusively in accordance with the substantive laws of the Republic of India. Subject to Section 9, the competent courts having ordinary original civil jurisdiction in Mumbai, Maharashtra shall have exclusive jurisdiction over any matters or disputes arising hereunder.",
    plainEnglish:
      "Indian law governs this agreement, and legal proceedings take place in Mumbai courts.",
    category: "jurisdiction",
    pageNumber: 3,
    importance: "context_dependent",
    sectionNumber: "Section 10",
  },
];

/**
 * Revised Redline Draft (Version B - Revised Agreement sent back by HR)
 * Contains the 6-7 material shifts and Section 4 insertion that shifts numbering.
 */
export const DEMO_CURRENT_CLAUSES: Clause[] = [
  {
    id: "curr-sec-1",
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
    id: "curr-sec-2",
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
    id: "curr-sec-3",
    section: "Section 3",
    title: "Probationary Evaluation Period",
    rawText:
      "The Employee's tenure shall commence with a probationary evaluation period of ninety (90) calendar days from the Effective Date. During such probationary period, the Company shall assess the Employee's technical performance and suitability for regular employment confirmation.",
    plainEnglish:
      "The first 90 days are a probationary evaluation window during which the company reviews your performance before confirmation.",
    category: "employment",
    pageNumber: 1,
    importance: "context_dependent",
    sectionNumber: "Section 3",
  },
  {
    // [NEW ADDED CLAUSE - Causes renumbering of subsequent sections!]
    id: "curr-sec-4",
    section: "Section 4",
    title: "Remote Work Infrastructure & Continuous Device Monitoring",
    rawText:
      "Where the Employee performs duties remotely, the Employee shall strictly utilize Company-approved cryptographic VPN gateways. The Company reserves the right to deploy continuous endpoint telemetry, activity logging, and security auditing software on any device accessing Company banking infrastructure, and Employee consents to remote inspection and data wiping upon security incident detection.",
    plainEnglish:
      "If working remotely, you must use company VPNs, and the company reserves the right to monitor your device and remotely wipe data in case of security incidents.",
    category: "data_privacy",
    pageNumber: 1,
    importance: "review",
    sectionNumber: "Section 4",
  },
  {
    // [MODIFIED: Section 4 -> Section 5, 60 days -> 90 days, unilateral salary deduction added]
    id: "curr-sec-5",
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
    // [MODIFIED: Section 5 -> Section 6, ₹2,00,000 -> ₹4,50,000, 12m amortized -> 18m cliff]
    id: "curr-sec-6",
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
    // [MOVED: Section 6 -> Section 7, content identical]
    id: "curr-sec-7",
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
    // [MODIFIED: Section 7 -> Section 8, scope expanded to 24/7 personal devices]
    id: "curr-sec-8",
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
    // [MODIFIED: Section 8 -> Section 9, 6m/Maha -> 12m/India nationwide]
    id: "curr-sec-9",
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
    // [MODIFIED: Section 9 -> Section 11, mutual appointment -> unilateral appointment by MD]
    id: "curr-sec-11",
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
    // [MOVED: Section 10 -> Section 12, content identical]
    id: "curr-sec-12",
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

/**
 * Builds the hydrated comparison result for the Flagship India Demo
 */
export function buildFlagshipDemoComparison(): DocumentComparisonResult {
  const pairs = matchClausesSemantically(DEMO_PREVIOUS_CLAUSES, DEMO_CURRENT_CLAUSES);
  const rawChanges = analyzeAllClauseDifferences(pairs);
  const jurisdictionComparison = compareJurisdictions(DEMO_PREVIOUS_JURISDICTION, DEMO_CURRENT_JURISDICTION);
  const integratedChanges = integrateLegalContext(rawChanges, jurisdictionComparison);

  // Compute summary metrics
  let clausesChanged = 0;
  let clausesAdded = 0;
  let clausesRemoved = 0;
  let clausesMoved = 0;
  let clausesUnchanged = 0;
  let highSignificanceCount = 0;
  let mediumSignificanceCount = 0;
  let lowSignificanceCount = 0;
  let informationalCount = 0;

  for (const c of integratedChanges) {
    if (c.changeType === "ADDED") clausesAdded++;
    else if (c.changeType === "REMOVED") clausesRemoved++;
    else if (c.changeType === "MOVED") clausesMoved++;
    else if (c.changeType === "UNCHANGED") clausesUnchanged++;
    else if (c.changeType === "MODIFIED") clausesChanged++;

    if (c.significance === "HIGH") highSignificanceCount++;
    else if (c.significance === "MEDIUM") mediumSignificanceCount++;
    else if (c.significance === "LOW") lowSignificanceCount++;
    else if (c.significance === "INFORMATIONAL") informationalCount++;
  }

  const materialChangesCount = highSignificanceCount + mediumSignificanceCount;

  // Filter top 3-5 material changes (HIGH first, then MEDIUM)
  const topMaterialChanges = integratedChanges
    .filter((c) => c.significance === "HIGH" || c.significance === "MEDIUM")
    .sort((a, b) => {
      const weight = { HIGH: 3, MEDIUM: 2, LOW: 1, INFORMATIONAL: 0 };
      return weight[b.significance] - weight[a.significance];
    })
    .slice(0, 5);

  return {
    id: "demo-comparison-kavach-rohan",
    previousDocument: {
      id: "doc-draft-v1",
      title: "Employment Agreement (Candidate Initial Baseline Draft)",
      fileName: "Kavach_Offer_Draft_v1.pdf",
      fileSizeBytes: 54200,
      pageCount: 3,
      wordCount: 1050,
    },
    currentDocument: {
      id: "doc-draft-v2-redline",
      title: "Employment Agreement (HR Revised Counterparty Redline)",
      fileName: "Kavach_Offer_HR_Redline_v2.pdf",
      fileSizeBytes: 68400,
      pageCount: 3,
      wordCount: 1320,
    },
    jurisdictionComparison,
    summary: {
      totalPreviousClauses: DEMO_PREVIOUS_CLAUSES.length,
      totalCurrentClauses: DEMO_CURRENT_CLAUSES.length,
      clausesChanged,
      clausesAdded,
      clausesRemoved,
      clausesMoved,
      clausesUnchanged,
      materialChangesCount,
      highSignificanceCount,
      mediumSignificanceCount,
      lowSignificanceCount,
      informationalCount,
    },
    changes: integratedChanges,
    topMaterialChanges,
    analyzedAt: new Date().toISOString(),
    disclaimer: GLOBAL_LEGAL_DISCLAIMER,
  };
}

export const FLAGSHIP_DEMO_COMPARISON = buildFlagshipDemoComparison();
