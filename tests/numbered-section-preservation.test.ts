import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractDocumentContent } from "@/lib/documents/textExtractor";
import { normalizeDocumentContent } from "@/lib/documents/documentNormalizer";
import { segmentDocumentIntoClauses } from "@/lib/documents/clauseSegmenter";
import { compareDocumentBuffers } from "@/lib/comparison/documentComparator";
import type { Clause } from "@/types";

const fixtureText = (name: string) => fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");

/** Renders plain text into a real PDF with hard line wrapping, the way word processors wrap paragraphs. */
async function textToPdf(text: string, wrapAt: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  let page = doc.addPage([595, 842]);
  let y = 800;
  const put = (line: string) => {
    if (y < 50) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
    page.drawText(line, { x: 50, y, size: 10, font });
    y -= 14;
  };
  for (const para of text.split("\n")) {
    if (!para.trim()) {
      y -= 8;
      continue;
    }
    let line = "";
    for (const word of para.split(" ")) {
      if ((line + " " + word).trim().length > wrapAt) {
        put(line);
        line = word;
      } else {
        line = (line + " " + word).trim();
      }
    }
    if (line) put(line);
  }
  return Buffer.from(await doc.save());
}

async function segmentTxt(text: string): Promise<Clause[]> {
  const extracted = await extractDocumentContent(Buffer.from(text, "utf8"), "txt");
  const norm = normalizeDocumentContent(extracted.rawText, extracted.pages);
  return segmentDocumentIntoClauses(norm.normalizedFullText, norm.normalizedPages, "doc");
}

async function segmentPdf(text: string, wrapAt: number): Promise<Clause[]> {
  const extracted = await extractDocumentContent(await textToPdf(text, wrapAt), "pdf");
  const norm = normalizeDocumentContent(extracted.rawText, extracted.pages);
  return segmentDocumentIntoClauses(norm.normalizedFullText, norm.normalizedPages, "doc");
}

const sectionsOf = (clauses: Clause[]) => clauses.filter((c) => c.section !== "Preamble").map((c) => c.section);
const range = (n: number) => Array.from({ length: n }, (_, i) => `Section ${i + 1}`);

const FIXTURES = [
  { file: "leave_and_licence_pune.txt", label: "Pune leave and licence (titled sections)", sections: 8 },
  { file: "rental_agreement_pune_paragraphs.txt", label: "Pune rent agreement (untitled numbered paragraphs)", sections: 8 },
  { file: "saas_services_uk.txt", label: "UK SaaS agreement", sections: 8 },
  { file: "services_agreement_us.txt", label: "US master services agreement (decimal sub-clauses)", sections: 9 },
];

describe("Numbered sections survive segmentation for arbitrary TXT and PDF layouts", () => {
  for (const { file, label, sections } of FIXTURES) {
    describe(label, () => {
      const text = fixtureText(file);

      it("TXT: exactly the document's top-level sections, in order", async () => {
        expect(sectionsOf(await segmentTxt(text))).toEqual(range(sections));
      });

      for (const wrapAt of [90, 62, 48, 38]) {
        it(`PDF wrapped at ${wrapAt} columns: same sections as the TXT`, async () => {
          expect(sectionsOf(await segmentPdf(text, wrapAt))).toEqual(range(sections));
        });
      }
    });
  }

  it("keeps decimal sub-clauses inside their parent section (US services agreement)", async () => {
    const clauses = await segmentTxt(fixtureText("services_agreement_us.txt"));
    const fees = clauses.find((c) => c.section === "Section 2")!;
    expect(fees.title).toBe("FEES AND PAYMENT");
    expect(fees.rawText).toContain("2.1 Fees.");
    expect(fees.rawText).toContain("2.3 Late Payment");
    expect(fees.rawText).toContain("1.5% per month");
    expect(clauses.some((c) => /^Section \d+\.\d+$/.test(c.section))).toBe(false);
    const governing = clauses.find((c) => c.section === "Section 8")!;
    expect(governing.rawText).toContain("Wilmington, Delaware");
  });

  it("reads long single-line TXT paragraphs (no hard wrapping) and derives titles for untitled paragraphs", async () => {
    const clauses = await segmentTxt(fixtureText("rental_agreement_pune_paragraphs.txt"));
    const rent = clauses.find((c) => c.section === "Section 2")!;
    expect(rent.rawText).toContain("Rs. 45,000");
    expect(rent.rawText).toContain("18% per annum");
    expect(rent.title.length).toBeGreaterThan(3);
    expect(rent.title.length).toBeLessThan(60);
    const lockIn = clauses.find((c) => c.section === "Section 4")!;
    expect(lockIn.rawText).toContain("liquidated damages");
  });

  it("splits a long TXT line whose heading is followed inline by the body", async () => {
    const text = [
      "SERVICES AGREEMENT",
      "This Agreement is made between Alpha Ltd and Beta Ltd for consulting work.",
      "1. Services. The Consultant shall provide the consulting services described in Schedule A to the Client for the entire term of this Agreement.",
      "2. Fees. The Client shall pay the Consultant a fixed monthly fee within thirty (30) days of each invoice issued by the Consultant.",
      "3. Term. This Agreement continues for twelve (12) months from the date of signature unless terminated earlier in accordance with its terms.",
    ].join("\n\n");
    const clauses = await segmentTxt(text);
    expect(sectionsOf(clauses)).toEqual(["Section 1", "Section 2", "Section 3"]);
    expect(clauses.map((c) => c.title)).toContain("Fees");
  });

  it("accepts a section number that stands alone on its own line", async () => {
    const text = ["1.", "Licensed Premises", "The Licensor grants a licence for eleven months.", "2.", "Licence Fee", "The Licensee shall pay monthly rent."].join("\n");
    const clauses = await segmentTxt(text);
    expect(clauses.map((c) => [c.section, c.title])).toEqual([
      ["Section 1", "Licensed Premises"],
      ["Section 2", "Licence Fee"],
    ]);
  });

  it("does not turn a wrapped date or figure at the start of a line into a new section", async () => {
    const text = [
      "1. Term",
      "The Agreement is made on and commences from",
      "2 April 2026 and continues for a period of twelve months, with a fee of",
      "3 Lakh Rupees payable in advance.",
      "2. Fees",
      "Rent is due on the first of every month.",
      "3. Notice",
      "Thirty (30) days written notice is required.",
    ].join("\n");
    const clauses = await segmentTxt(text);
    expect(sectionsOf(clauses)).toEqual(["Section 1", "Section 2", "Section 3"]);
    expect(clauses[0].rawText).toContain("2 April 2026");
    expect(clauses[0].rawText).toContain("3 Lakh Rupees");
  });

  it("does not treat a numbered list restarting inside a section, or an in-text cross-reference, as sections", async () => {
    const text = [
      "1. Obligations",
      "The Tenant shall:",
      "1. Pay the rent on time;",
      "2. Keep the premises clean; and",
      "3. Not cause nuisance to neighbours.",
      "Section 5 above continues to apply after termination.",
      "2. Termination",
      "Either party may terminate on thirty (30) days notice.",
    ].join("\n");
    const clauses = await segmentTxt(text);
    expect(sectionsOf(clauses)).toEqual(["Section 1", "Section 2"]);
    expect(clauses[0].rawText).toContain("Section 5 above continues");
  });

  it("does not read the first letters of an ordinary word as an Article or Exhibit number", async () => {
    const text = [
      "1. Scope",
      "The Supplier delivers the goods described below.",
      "Article Indemnity is dealt with later in this document.",
      "Schedule payments are due monthly and exhibit no delay.",
    ].join("\n");
    const clauses = await segmentTxt(text);
    expect(clauses).toHaveLength(1);
    expect(clauses[0].rawText).toContain("Article Indemnity");
    expect(clauses[0].rawText).toContain("Schedule payments");
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("Compare no longer marks existing sections as removed", () => {
  const revise = (text: string, from: string, to: string) => {
    expect(text).toContain(from);
    return text.replace(from, to);
  };

  async function compare(prev: { buf: Buffer; name: string }, curr: { buf: Buffer; name: string }) {
    return compareDocumentBuffers({
      previousBuffer: prev.buf,
      previousFileName: prev.name,
      currentBuffer: curr.buf,
      currentFileName: curr.name,
    });
  }

  const CASES = [
    {
      label: "Pune leave and licence",
      file: "leave_and_licence_pune.txt",
      edit: ["thirty (30) days prior written notice", "sixty (60) days prior written notice"],
      sections: 8,
    },
    {
      label: "Pune rent agreement with untitled paragraphs",
      file: "rental_agreement_pune_paragraphs.txt",
      edit: ["The Landlord hereby lets to the Tenant", "The Landlord hereby leases to the Tenant"],
      sections: 8,
    },
    {
      label: "US master services agreement",
      file: "services_agreement_us.txt",
      edit: ["sixty (60) days written notice of non-renewal", "ninety (90) days written notice of non-renewal"],
      sections: 9,
    },
    {
      label: "UK SaaS agreement",
      file: "saas_services_uk.txt",
      edit: ["ninety (90) days written notice of non-renewal", "sixty (60) days written notice of non-renewal"],
      sections: 8,
    },
  ];

  for (const { label, file, edit, sections } of CASES) {
    describe(label, () => {
      const original = fixtureText(file);
      const revised = revise(original, edit[0], edit[1]);

      it("TXT v1 against a wrapped PDF of v2: every section is matched, nothing removed or added", async () => {
        const result = await compare(
          { buf: Buffer.from(original, "utf8"), name: "v1.txt" },
          { buf: await textToPdf(revised, 52), name: "v2.pdf" }
        );
        expect(result.summary.clausesRemoved).toBe(0);
        expect(result.summary.clausesAdded).toBe(0);
        expect(result.summary.totalPreviousClauses).toBe(result.summary.totalCurrentClauses);
        expect(result.changes.filter((c) => c.changeType !== "UNCHANGED" && c.changeType !== "MODIFIED")).toHaveLength(0);
        expect(result.summary.clausesChanged).toBeGreaterThanOrEqual(1);
        expect(result.summary.clausesUnchanged + result.summary.clausesChanged).toBe(sections + 1);
      });

      it("the same text wrapped differently in two PDFs: only the real edit is reported", async () => {
        const result = await compare(
          { buf: await textToPdf(original, 92), name: "v1.pdf" },
          { buf: await textToPdf(revised, 40), name: "v2.pdf" }
        );
        expect(result.summary.clausesRemoved).toBe(0);
        expect(result.summary.clausesAdded).toBe(0);
        expect(result.summary.clausesMoved).toBe(0);
        expect(result.summary.clausesChanged).toBe(1);
      });
    });
  }

  it("flagship employment demo PDF against an edited plain-text copy: nothing removed or added", async () => {
    const pdf = fs.readFileSync(path.join(__dirname, "fixtures", "LawPilot_Test_Employment_Agreement.pdf"));
    const extracted = await extractDocumentContent(pdf, "pdf");
    const text = extracted.pages.map((p) => p.text).join("\n");
    expect(text).toMatch(/notice/i);
    const edited = text.replace(/\((\d+)\)\s*calendar days/i, (_m, n) => `(${Number(n) + 30}) calendar days`);
    expect(edited).not.toBe(text);
    const result = await compare({ buf: pdf, name: "employment.pdf" }, { buf: Buffer.from(edited, "utf8"), name: "employment_v2.txt" });
    expect(result.summary.clausesRemoved).toBe(0);
    expect(result.summary.clausesAdded).toBe(0);
    expect(result.summary.clausesChanged).toBeGreaterThanOrEqual(1);
  });
});
