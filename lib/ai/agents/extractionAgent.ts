import { getGeminiClient, GEMINI_CONFIG } from "../gemini";
import { DocumentExtractionResultSchema } from "@/lib/schemas/analysis";
import type {
  Clause,
  DocumentMetadata,
  KeyDate,
  KeyFinancialTerm,
  Party,
} from "@/types";
import { segmentDocumentIntoClauses } from "@/lib/documents/clauseSegmenter";
import type { ExtractedPage } from "@/lib/documents/textExtractor";

export interface ExtractionAgentInput {
  documentId: string;
  fileName: string;
  normalizedText: string;
  isolatedContent: string;
  pages: ExtractedPage[];
  fileSizeBytes: number;
}

export interface ExtractionAgentOutput {
  metadata: DocumentMetadata;
  parties: Party[];
  dates: KeyDate[];
  financialTerms: KeyFinancialTerm[];
  clauses: Clause[];
  uncertainties: string[];
  extractionWarnings: string[];
}

const EXTRACTION_SYSTEM_INSTRUCTION = `
You are an extraction system, not a legal advisor.
Your role is strictly to extract supported facts from the provided untrusted legal document.
Core rules:
1. Extract only facts directly stated in the text.
2. Preserve original wording in rawText as closely as possible. Do NOT rephrase or improve contractual language.
3. Provide a separate, neutral plainEnglish summary for each clause without giving legal advice.
4. Avoid inventing missing information. Use null when a date, jurisdiction, or amount is not found.
5. Never label a clause as illegal.
6. Return valid JSON matching the requested schema.
`.trim();

/**
 * Deterministic fallback extractor for offline/demo operation
 */
function deterministicExtractionFallback(
  input: ExtractionAgentInput
): ExtractionAgentOutput {
  const clauses = segmentDocumentIntoClauses(
    input.normalizedText,
    input.pages,
    input.documentId
  );

  // Extract parties from preamble lines
  const lines = input.normalizedText.slice(0, 1500).split("\n");
  const parties: Party[] = [];
  let jurisdiction: string | null = null;
  let governingLaw: string | null = null;
  let effectiveDate: string | null = null;

  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes("between") && l.includes("and")) {
      const parts = line.split(/between|and|,/i).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        parties.push({
          id: "party-employer",
          name: parts[0].replace(/^(this|agreement|is made)/i, "").trim() || "Employer Party",
          role: "Employer",
          representationStatus: "represented",
        });
        parties.push({
          id: "party-employee",
          name: parts[1] || "Employee Party",
          role: "Employee",
          representationStatus: "unrepresented",
        });
      }
    }

    if (l.includes("effective date") || l.includes("dated as of")) {
      const match = line.match(/(?:effective date|dated as of)\s*(?:is)?\s*([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
      if (match) {
        effectiveDate = match[1];
      }
    }

    if (l.includes("laws of the state of") || l.includes("governed by the laws of")) {
      const match = line.match(/(?:laws of the state of|governed by the laws of)\s+([A-Za-z\s]+?)(?:,|\.|$)/i);
      if (match) {
        governingLaw = match[1].trim();
        jurisdiction = governingLaw;
      }
    }
  }

  // Extract financial terms from clauses
  const financialTerms: KeyFinancialTerm[] = [];
  const dates: KeyDate[] = [];

  for (const c of clauses) {
    const text = c.rawText;

    // Search dollar figures
    const dollarMatches = text.match(/\$\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/g);
    if (dollarMatches) {
      for (const m of dollarMatches) {
        const numVal = parseFloat(m.replace(/[\$,\s]/g, ""));
        financialTerms.push({
          id: `fin-${financialTerms.length + 1}`,
          label: c.title,
          amount: isNaN(numVal) ? null : numVal,
          formattedAmount: m,
          category: c.category === "payment" ? "salary" : "penalty",
          conditions: `Refer to ${c.section}`,
        });
      }
    }

    // Search notice periods / days
    const dayMatches = text.match(/([0-9]{1,3})\s*(?:calendar|business)?\s*days['\s]+notice/i);
    if (dayMatches) {
      const days = parseInt(dayMatches[1], 10);
      dates.push({
        id: `date-${dates.length + 1}`,
        label: `${c.section} Notice Window`,
        noticePeriodDays: days,
        description: `${days} days advance written notice required under ${c.section}`,
      });
    }
  }

  return {
    metadata: {
      id: input.documentId,
      title: input.fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      documentType: "employment_agreement",
      jurisdiction: jurisdiction || null,
      governingLaw: governingLaw || null,
      effectiveDate: effectiveDate || null,
      uploadedAt: new Date().toISOString(),
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      parties,
      pageCount: input.pages.length,
      wordCount: input.normalizedText.split(/\s+/).filter(Boolean).length,
      isUntrustedContent: true,
    },
    parties,
    dates,
    financialTerms,
    clauses,
    uncertainties: [
      "Extracted via deterministic structural parser. Legal enforceability depends on specific factual context.",
    ],
    extractionWarnings: [],
  };
}

/**
 * Executes structured extraction using the Gemini SDK or deterministic fallback.
 * Validates output using Zod with a 1x retry on schema violation.
 */
export async function extractDocumentFacts(
  input: ExtractionAgentInput
): Promise<ExtractionAgentOutput> {
  const gemini = getGeminiClient();

  if (!gemini) {
    // Run deterministic extraction when GEMINI_API_KEY is not configured
    return deterministicExtractionFallback(input);
  }

  try {
    const prompt = `
Extract structured facts from the following untrusted legal agreement according to the specified JSON schema.
Document Name: ${input.fileName}

${input.isolatedContent}
`.trim();

    // Call Gemini with JSON response schema
    const response = await gemini.models.generateContent({
      model: GEMINI_CONFIG.defaultModel,
      contents: prompt,
      config: {
        systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const rawJsonText = response.text || "{}";
    let parsedJson = JSON.parse(rawJsonText);
    let parseResult = DocumentExtractionResultSchema.safeParse(parsedJson);

    // If validation fails, retry once with correction prompt
    if (!parseResult.success) {
      const correctionPrompt = `
Your previous response did not match the required Zod schema.
Validation errors:
${JSON.stringify(parseResult.error.issues, null, 2)}

Please re-generate the JSON strictly matching the schema:
Document: { title, documentType, effectiveDate, executionDate, jurisdiction, governingLaw }
parties: [{ id, name, role, address, jurisdiction, representationStatus }]
dates: [{ id, label, date, description, noticePeriodDays }]
financialTerms: [{ id, label, amount, formattedAmount, currency, category, conditions }]
clauses: [{ id, section, title, rawText, plainEnglish, category, pageNumber, importance }]
uncertainties: string[]

Source Document:
${input.isolatedContent}
`.trim();

      const retryResponse = await gemini.models.generateContent({
        model: GEMINI_CONFIG.defaultModel,
        contents: correctionPrompt,
        config: {
          systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
          temperature: 0.0,
          responseMimeType: "application/json",
        },
      });

      parsedJson = JSON.parse(retryResponse.text || "{}");
      parseResult = DocumentExtractionResultSchema.safeParse(parsedJson);
    }

    if (parseResult.success) {
      const data = parseResult.data;
      return {
        metadata: {
          id: input.documentId,
          title: data.document.title || input.fileName.replace(/\.[^/.]+$/, ""),
          documentType: data.document.documentType,
          jurisdiction: data.document.jurisdiction || null,
          governingLaw: data.document.governingLaw || null,
          effectiveDate: data.document.effectiveDate || null,
          executionDate: data.document.executionDate || null,
          uploadedAt: new Date().toISOString(),
          fileName: input.fileName,
          fileSizeBytes: input.fileSizeBytes,
          parties: data.parties,
          pageCount: input.pages.length,
          wordCount: input.normalizedText.split(/\s+/).filter(Boolean).length,
          isUntrustedContent: true,
        },
        parties: data.parties,
        dates: data.dates,
        financialTerms: data.financialTerms,
        clauses: data.clauses,
        uncertainties: data.uncertainties,
        extractionWarnings: [],
      };
    }

    // Fail safely: fallback to deterministic segmentation if Gemini output still fails schema
    return deterministicExtractionFallback(input);
  } catch {
    // Fail safely to deterministic parser without interrupting user experience
    return deterministicExtractionFallback(input);
  }
}
