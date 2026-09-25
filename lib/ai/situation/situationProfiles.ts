import type { SituationAssessment, SituationQuestion } from "@/types";
import { resolvePlace } from "@/lib/jurisdiction/jurisdictionDetector";

/**
 * Location handling for the Situation Navigator.
 *
 * The navigator has no uploaded document, so the user's own narrative is the only jurisdiction
 * signal. Content that names a country's laws, courts, currency or limits must match that
 * country; when the location is not stated the output must stay jurisdiction-neutral instead of
 * silently defaulting to U.S. law (the historical behavior).
 */

export type SituationCategory = SituationAssessment["identifiedCategory"];
export type LocationFamily = "india" | "united_states" | "other" | "unknown";

export interface SituationLocation {
  family: LocationFamily;
  country?: string;
  stateOrUT?: string;
  /** Human-readable, e.g. "India · Maharashtra". */
  label?: string;
}

export function detectSituationLocation(text: string): SituationLocation {
  const place = resolvePlace(text);
  const inr = /₹|\bINR\b|\bRs\.?\s*\d|\blakhs?\b|\bcrores?\b/i.test(text);
  const usd = /\$\s?\d|\bUSD\b|\bdollars?\b/i.test(text);

  if (place) {
    const family: LocationFamily = place.country === "India" ? "india" : place.country === "United States" ? "united_states" : "other";
    return {
      family,
      country: place.country,
      stateOrUT: place.stateOrUT,
      label: place.stateOrUT ? `${place.country} · ${place.stateOrUT}` : place.country,
    };
  }
  if (inr) return { family: "india", country: "India", label: "India" };
  if (usd) return { family: "united_states", country: "United States", label: "United States" };
  return { family: "unknown" };
}

const rx = (words: string[]) => new RegExp(`\\b(?:${words.join("|")})`, "i");

/** Scored, word-boundary classification (replaces substring checks like "rent" ⊂ "current"). */
export function classifySituationCategory(text: string): SituationCategory {
  const t = text.toLowerCase();
  const count = (re: RegExp) => (t.match(new RegExp(re.source, "gi")) || []).length;

  const scores: Record<string, number> = {
    landlord_tenant: count(rx(["landlord", "tenant", "tenancy", "lease", "leave and licen[cs]e", "licen[cs]or", "rented", "rental", "rent\\b", "security deposit", "deposit", "evict", "apartment", "flat\\b", "lessor", "lessee"])),
    employment_dispute: count(rx(["job\\b", "workplace", "boss", "employer", "employee", "employ", "terminat", "fired", "sacked", "severance", "wages?\\b", "salary", "overtime", "layoff", "laid off", "resign", "notice period", "full and final", "gratuity", "provident fund", "appointment letter", "hr\\b", "promotion", "probation"])),
    freelance_unpaid_invoice: count(rx(["invoice", "freelanc", "contractor", "milestone", "client owes", "client has not paid", "consultan", "deliverable"])) * 2,
    consumer_contract: count(rx(["refund", "defective", "warranty", "seller", "consumer", "purchased", "delivery", "product", "subscription"])),
    intellectual_property: count(rx(["copyright", "trademark", "patent", "plagiari", "infring", "logo"])),
    business_partnership: count(rx(["partner", "co-?founder", "shareholder", "equity split", "joint venture"])),
  };
  // A deposit-only mention inside an employment story should not flip the category.
  if (scores.landlord_tenant > 0 && !/\b(?:landlord|tenant|lease|rent|licen[cs]|flat\b|apartment|evict)/i.test(t)) scores.landlord_tenant = 0;

  let best: string | null = null;
  let bestScore = 0;
  // Precedence on ties: employment, landlord, freelance, consumer, ip, partnership.
  for (const key of ["employment_dispute", "landlord_tenant", "freelance_unpaid_invoice", "consumer_contract", "intellectual_property", "business_partnership"]) {
    if (scores[key] > bestScore) {
      best = key;
      bestScore = scores[key];
    }
  }
  return (best as SituationCategory) ?? "other";
}

interface Profile {
  concepts: SituationAssessment["relevantLegalConcepts"];
  options: SituationAssessment["possibleOptions"];
  questionsForLawyer: string[];
  extraEvidence: string[];
}

const stateNote = (loc: SituationLocation) => (loc.stateOrUT ? ` in ${loc.stateOrUT}` : "");

function indiaProfile(category: SituationCategory, loc: SituationLocation): Profile | null {
  const maha = loc.stateOrUT === "Maharashtra";
  switch (category) {
    case "employment_dispute":
      return {
        concepts: [
          {
            concept: "Contractual Notice, Notice Pay & Full-and-Final Settlement",
            plainEnglishExplanation:
              "Your appointment letter or contract usually sets the notice period and how unserved notice, leave encashment and other dues are settled in the full-and-final settlement.",
            caveat: "Whether a deduction or recovery is allowed depends on the contract, applicable wage law and whether the amount is reasonable.",
          },
          {
            concept: "Statutory Dues: Wages, Provident Fund and Gratuity",
            plainEnglishExplanation:
              "Indian labour and social-security laws set minimum protections on timely payment of wages, provident fund and, after qualifying service, gratuity.",
            caveat: "Coverage depends on the employer and employee category and on which labour code or earlier statute currently applies to your workplace.",
          },
          ...(maha
            ? [
                {
                  concept: "Maharashtra Establishment Rules",
                  plainEnglishExplanation:
                    "For many shops and establishments in Maharashtra, the Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017 sets rules on working conditions, leave and termination.",
                  caveat: "It applies only to covered establishments; confirm with the labour department or a lawyer.",
                },
              ]
            : []),
        ],
        options: [
          {
            title: "Request Written Termination/Relieving Documents and Salary Records",
            pros: ["Creates a documented record of dates, dues and reasons", "Low-effort and fully reversible"],
            risks: ["May prompt HR to involve legal counsel"],
            reversibility: "high",
          },
          {
            title: "Send a Written Representation to HR and Keep Records",
            pros: ["Puts your position on record politely", "Often resolves settlement disputes without escalation"],
            risks: ["The employer may respond formally"],
            reversibility: "high",
          },
          {
            title: `Consult the Labour Department or a Lawyer About a Legal Notice${stateNote(loc)}`,
            pros: ["A formal step that documents your claim and may prompt settlement"],
            risks: ["Escalates the dispute and may affect the working relationship"],
            reversibility: "moderate",
          },
        ],
        questionsForLawyer: [
          "Which labour law or code applies to my employer and role, and what notice and dues does it require?",
          "Is the deduction or recovery my employer claims permitted under my contract and applicable wage law?",
        ],
        extraEvidence: ["Appointment letter, offer letter and any amendments", "Salary slips, bank statements, Form 16 and provident fund statements"],
      };
    case "landlord_tenant":
      return {
        concepts: [
          {
            concept: "Security Deposit and Lock-in Under Your Agreement",
            plainEnglishExplanation:
              "Your rent or leave-and-licence agreement normally states the deposit, lock-in period, notice for leaving and any permitted deductions. Those terms are the starting point for a deposit dispute.",
            caveat: "Deductions must generally reflect real, documented loss; the wording of your agreement matters.",
          },
          {
            concept: "Registered and Stamped Rent / Leave-and-Licence Agreements",
            plainEnglishExplanation:
              `${maha ? "In Maharashtra, leave-and-licence agreements are typically registered and stamped. " : ""}A properly registered and stamped agreement is easier to rely on as evidence.`,
            caveat: "Rules on registration and stamp duty vary by state and agreement length.",
          },
          ...(maha
            ? [
                {
                  concept: "Maharashtra Rent Control Act, 1999",
                  plainEnglishExplanation: "Many tenancies in Maharashtra are covered by the Maharashtra Rent Control Act, 1999, which affects rent, eviction and forum.",
                  caveat: "Whether it applies depends on the type of premises and agreement (for example, leave-and-licence arrangements are treated differently).",
                },
              ]
            : []),
        ],
        options: [
          {
            title: "Send a Written Notice Demanding Deposit Refund or Repairs",
            pros: ["Creates proof of your request and the date", "Fully reversible"],
            risks: ["May prompt the landlord to seek legal advice"],
            reversibility: "high",
          },
          {
            title: "Consider a Lawyer's Legal Notice or Mediation",
            pros: ["Signals seriousness while leaving room to settle", "Mediation is usually cheaper than a suit"],
            risks: ["Legal notice can harden positions"],
            reversibility: "moderate",
          },
        ],
        questionsForLawyer: [
          `Which law and which court or forum govern my tenancy or leave-and-licence arrangement${stateNote(loc)}?`,
          "What deductions from the deposit does my agreement permit, and how must they be proved?",
        ],
        extraEvidence: ["Registered/stamped agreement and payment receipts for rent and deposit", "Photographs and messages showing the condition of the property"],
      };
    case "freelance_unpaid_invoice":
      return {
        concepts: [
          {
            concept: "Recovery of Unpaid Fees Under the Contract",
            plainEnglishExplanation:
              "A written or email agreement, delivered work and an unpaid invoice are the core of a recovery claim; a written demand or legal notice normally comes before any court filing.",
            caveat: "You need to be able to show what was agreed, what was delivered and that payment is overdue.",
          },
          {
            concept: "Delayed Payments to Micro and Small Enterprises",
            plainEnglishExplanation:
              "If you are a registered micro or small enterprise, the MSMED Act, 2006 sets a maximum payment period for buyers and provides for interest on delayed payments and a facilitation council process.",
            caveat: "It applies only to registered micro/small enterprises supplying goods or services; check your registration status.",
          },
          {
            concept: "Pre-Litigation Steps for Commercial Disputes",
            plainEnglishExplanation:
              "For many commercial disputes above a specified value, mediation before filing suit may be required, and court fees and forum depend on the claim value.",
            caveat: "Thresholds and procedure change; a lawyer can confirm what applies to your claim.",
          },
        ],
        options: [
          {
            title: "Send a Formal Written Payment Reminder With a Deadline",
            pros: ["Low cost and fully reversible", "Creates a record of a good-faith attempt to collect"],
            risks: ["May prompt the client to raise disputes about the work"],
            reversibility: "high",
          },
          {
            title: "Send a Legal Notice Through a Lawyer",
            pros: ["Often prompts payment", "Prepares the ground for recovery proceedings"],
            risks: ["Costs money and can harden the client's position"],
            reversibility: "moderate",
          },
          {
            title: "Evaluate Civil Recovery Proceedings",
            pros: ["A binding outcome if you succeed"],
            risks: ["Time, cost and uncertainty; court fees depend on the claim value"],
            reversibility: "low",
          },
        ],
        questionsForLawyer: [
          "Do I qualify as a micro or small enterprise, and does the MSMED Act help with this delayed payment?",
          "What pre-litigation steps apply to a claim of this size, and which forum is proper?",
        ],
        extraEvidence: ["Signed agreement, work order or email confirming scope and price", "Invoices, GST invoices and proof of delivery or client acceptance"],
      };
    default:
      return null;
  }
}

function neutralProfile(category: SituationCategory): Profile | null {
  switch (category) {
    case "employment_dispute":
      return {
        concepts: [
          {
            concept: "Contractual and Statutory Notice & Termination Protections",
            plainEnglishExplanation:
              "Your employment contract and local employment law together determine notice, permitted reasons for ending employment and what you are owed at the end.",
            caveat: "The rules differ significantly between countries and states, so your location matters.",
          },
          {
            concept: "Timely Payment of Final Dues",
            plainEnglishExplanation: "Many places require earned wages and accrued benefits to be paid within a set time after employment ends.",
            caveat: "Deadlines and penalties depend on where you work.",
          },
        ],
        options: [
          {
            title: "Request Your Personnel File and Pay Records",
            pros: ["Establishes the facts and your records", "Low friction and reversible"],
            risks: ["May signal formal preparation to the employer"],
            reversibility: "high",
          },
          {
            title: "Review Any Severance or Settlement Document Before Signing",
            pros: ["Keeps your options open", "Lets you negotiate terms"],
            risks: ["Offers may have deadlines"],
            reversibility: "high",
          },
        ],
        questionsForLawyer: [
          "Which country's and state's employment law applies to my situation, and what notice and dues does it require?",
          "Are there statutory claims (for example unpaid final pay) based on the timeline?",
        ],
        extraEvidence: ["Employment contract or offer letter", "Pay records and written communications about the dispute"],
      };
    case "landlord_tenant":
      return {
        concepts: [
          {
            concept: "Security Deposit Return Rules",
            plainEnglishExplanation: "Many places require landlords to return deposits within a set time, with an itemized list of any deductions.",
            caveat: "Time limits and penalties differ by location; your agreement also matters.",
          },
          {
            concept: "Landlord's Repair Obligations",
            plainEnglishExplanation: "Landlords are commonly required to keep rented premises in reasonable condition, usually after written notice.",
            caveat: "Remedies such as withholding rent are restricted in many places; get advice first.",
          },
        ],
        options: [
          {
            title: "Send a Written Notice of the Issue",
            pros: ["Creates proof of your request and its date", "Fully reversible"],
            risks: ["May prompt the landlord to take advice"],
            reversibility: "high",
          },
          {
            title: "Ask a Local Housing Authority or Mediator for Help",
            pros: ["Often low cost or free", "Avoids court where possible"],
            risks: ["Outcomes depend on voluntary compliance"],
            reversibility: "high",
          },
        ],
        questionsForLawyer: [
          "Which local law governs my tenancy and the return of my deposit?",
          "What remedies are available if my deposit is wrongly withheld?",
        ],
        extraEvidence: ["Lease or rental agreement", "Photographs and messages showing the condition of the property"],
      };
    case "freelance_unpaid_invoice":
      return {
        concepts: [
          {
            concept: "Breach of Contract & Pre-Suit Demand",
            plainEnglishExplanation: "When services were delivered and an invoice is overdue, a written demand with a reasonable deadline normally comes before any court claim.",
            caveat: "Formal notice requirements differ by location.",
          },
        ],
        options: [
          {
            title: "Send a Formal Written Payment Reminder With a Deadline",
            pros: ["Low cost and fully reversible", "Creates a record of a good-faith attempt to collect"],
            risks: ["May prompt the client to dispute the work"],
            reversibility: "high",
          },
          {
            title: "Ask a Lawyer About a Formal Demand",
            pros: ["Increases the seriousness of the request"],
            risks: ["Costs money and may harden positions"],
            reversibility: "moderate",
          },
          {
            title: "Evaluate Any Simplified Court Procedure Available Where You Are",
            pros: ["May be quicker and cheaper than a full lawsuit"],
            risks: ["Limits, rules and costs depend on the location"],
            reversibility: "low",
          },
        ],
        questionsForLawyer: [
          "Which country's law governs this agreement, and what pre-suit steps apply?",
          "Is a simplified procedure available for a claim of this size?",
        ],
        extraEvidence: ["Agreement, statement of work or emails confirming scope and price", "Invoices and proof of delivery or acceptance"],
      };
    default:
      return null;
  }
}

const LOCATION_QUESTION: SituationQuestion = {
  id: "fq-location",
  question: "In which country and state or city did this happen?",
  whyItMatters: "Laws, deadlines, forums and remedies differ by location; without it LawPilot can only give general information.",
  responseType: "text",
};

/**
 * Adapts a base assessment to the user's actual location. India → Indian concepts, forums and
 * currency-neutral wording; unknown/other locations → jurisdiction-neutral; U.S. signals keep the
 * base (U.S.-oriented) content.
 */
export function localizeAssessment(assessment: SituationAssessment, loc: SituationLocation): SituationAssessment {
  const category = assessment.identifiedCategory;
  let out: SituationAssessment = { ...assessment };

  if (loc.family !== "united_states") {
    const profile = loc.family === "india" ? indiaProfile(category, loc) : neutralProfile(category);
    if (profile) {
      out = {
        ...out,
        relevantLegalConcepts: profile.concepts,
        possibleOptions: profile.options,
        questionsForLawyer: profile.questionsForLawyer,
        evidenceToCollect: Array.from(new Set([...profile.extraEvidence, ...assessment.evidenceToCollect.filter((e) => !/\bACH\b|wire|Slack|paystub/i.test(e))])),
        followUpQuestions: assessment.followUpQuestions.map((q) => ({
          ...q,
          whyItMatters: q.whyItMatters
            .replace(/\(e\.g\. certified mail or personal service\)/, "(for example registered post or personal service)")
            .replace(/Without an attorneys' fee provision or specific statutory entitlement/, "Without a costs (fee-shifting) provision or specific statutory entitlement")
            .replace(/Governing law determines which state's court has jurisdiction and whether prompt payment remedies or statutory interest apply\./, "Governing law determines which court has jurisdiction and whether statutory remedies or interest apply.")
            .replace(/Many jurisdictions enforce strict statutory penalties/, "Many places enforce statutory penalties"),
        })),
      };
    }
    // Health / insufficient-information: swap the U.S.-specific leave statutes for neutral wording.
    if (category === "insufficient_information") {
      out = {
        ...out,
        relevantLegalConcepts: out.relevantLegalConcepts.map(() => ({
          concept: "Sick Leave & Medical Leave Entitlements",
          plainEnglishExplanation:
            loc.family === "india"
              ? "Paid sick leave and medical leave are set by your appointment letter, company policy and applicable state or central labour law."
              : "Sick and medical leave rights depend on local law, your contract and company policy.",
          caveat: "Protection depends on your employer, length of service, medical certification and where you work.",
        })),
        followUpQuestions: out.followUpQuestions.map((q) => ({
          ...q,
          whyItMatters: q.whyItMatters.replace(/Statutory labor provisions \(such as FMLA or local sick leave ordinances\)/, "Leave rights under labour law and company policy"),
        })),
        questionsForLawyer: out.questionsForLawyer.map((q) => q.replace("What state or local statutory protections apply to medical leave or sick leave in my jurisdiction?", "What legal protections apply to medical or sick leave where I work?")),
      };
    }
    // Currency in option text
    out.possibleOptions = out.possibleOptions.map((o) => ({
      ...o,
      risks: o.risks.map((r) => r.replace(/\(\$\d[\d,–-]*\)/g, "").replace(/\s{2,}/g, " ").trim()),
    }));
  }

  out.jurisdictionEstimate =
    loc.family === "unknown"
      ? "Not stated — please tell LawPilot where this happened"
      : `${loc.label}${loc.family === "india" && !loc.stateOrUT ? " (state not stated)" : ""} (from your description)`;

  if (loc.family === "unknown" && category !== "insufficient_information") {
    out.missingFacts = Array.from(new Set(["The country and state or city where this happened (laws and forums differ).", ...out.missingFacts])).slice(0, 4);
    out.followUpQuestions = [LOCATION_QUESTION, ...out.followUpQuestions.filter((q) => q.id !== "fq-location")].slice(0, 3);
  }

  return out;
}

/** Terms that must not appear in a non-U.S. assessment (used to police live-AI output). */
export const US_ONLY_TERMS = /\bFMLA\b|\bOWBPA\b|\bat-will\b|\bU\.S\.\b|\bUnited States\b|\bIRS\b|\bAAA\b|\bJAMS\b|\bRestatement\b|\bsmall claims\b.*\$|\$\s?\d/i;
