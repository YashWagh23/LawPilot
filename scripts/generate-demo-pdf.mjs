import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

async function generateEmploymentAgreementPdf() {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const sectionsPage1 = [
    { type: "title", text: "EMPLOYMENT & PROPRIETARY INVENTIONS AGREEMENT" },
    { type: "meta", text: "AEGIS CLOUD DYNAMICS INC. · CONFIDENTIAL" },
    {
      type: "p",
      text: "THIS EMPLOYMENT AND PROPRIETARY INVENTIONS AGREEMENT (the 'Agreement') is entered into and made effective as of May 1, 2026 (the 'Effective Date'), by and between Aegis Cloud Dynamics Inc., a Delaware corporation ('Employer' or 'Company'), and Alex Morgan, an individual residing in Dover, Delaware ('Employee'). Employer and Employee are collectively referred to herein as the 'Parties.'",
    },
    { type: "h", text: "SECTION 1. POSITION AND DUTIES" },
    {
      type: "p",
      text: "Employer hereby employs Employee, and Employee hereby accepts employment with Employer, in the position of Senior Distributed Systems Architect. Employee shall report to the Chief Technology Officer and shall devote full business time, attention, and energies to the performance of duties assigned by Employer.",
    },
    { type: "h", text: "SECTION 2. COMPENSATION AND BENEFITS" },
    {
      type: "p",
      text: "As full compensation for all services rendered, Employer shall pay Employee an annual base salary of $145,000 (One Hundred Forty-Five Thousand U.S. Dollars), payable in semi-monthly installments in accordance with Employer's standard payroll schedule. Employee shall be entitled to participate in customary health and retirement benefits.",
    },
    { type: "h", text: "SECTION 3. PROBATIONARY EVALUATION PERIOD" },
    {
      type: "p",
      text: "Employee's initial employment shall be subject to a probationary evaluation period of ninety (90) calendar days commencing on the Effective Date. During this probationary period, Employer shall evaluate Employee's performance and suitability for continued tenure.",
    },
    { type: "h", text: "SECTION 4. AT-WILL EMPLOYMENT" },
    {
      type: "p",
      text: "Employment under this Agreement is strictly at-will. Subject to the express notice and reimbursement provisions set forth below, either Employer or Employee may terminate the employment relationship at any time, with or without cause.",
    },
    { type: "h", text: "SECTION 5. RESIGNATION AND NOTICE PERIOD" },
    {
      type: "p",
      text: "In order to ensure continuity of distributed infrastructure operations, Employee agrees to provide not less than sixty (60) calendar days advance written notice to Employer prior to any voluntary resignation or termination of employment.",
    },
  ];

  const sectionsPage2 = [
    { type: "h", text: "SECTION 6. EARLY DEPARTURE & TRAINING FEE REIMBURSEMENT" },
    {
      type: "p",
      text: "In consideration of Employer providing specialized proprietary cloud orchestration training valued at $18,500 during the initial months of tenure, Employee agrees that if Employee resigns or departs employment for any reason prior to completing twelve (12) full months of service from the Effective Date, Employee shall immediately repay to Employer the full sum of $18,500 as reimbursement for specialized training expenses, and Employer is authorized to deduct any unpaid balance from final wages.",
    },
    { type: "h", text: "SECTION 7. CONFIDENTIAL INFORMATION" },
    {
      type: "p",
      text: "Employee shall hold in strict confidence all proprietary technical data, customer lists, architectural schematics, source code, and trade secrets of Employer. This non-disclosure obligation shall survive indefinitely following termination of employment.",
    },
    { type: "h", text: "SECTION 8. COMPREHENSIVE INVENTIONS ASSIGNMENT" },
    {
      type: "p",
      text: "Employee hereby assigns to Employer all right, title, and interest in and to any and all inventions, designs, software, improvements, and discoveries conceived, developed, or reduced to practice by Employee during the term of employment, whether or not during regular working hours, and whether or not using Company facilities or equipment.",
    },
    { type: "h", text: "SECTION 9. POST-EMPLOYMENT RESTRICTIVE COVENANTS" },
    {
      type: "p",
      text: "For a period of twelve (12) months following the termination of employment for any reason, Employee shall not, within a fifty (50) mile radius of Employer's corporate headquarters, directly or indirectly engage in, perform services for, consult with, or acquire an equity interest in any business entity providing competing cloud infrastructure or distributed systems orchestration services.",
    },
    { type: "h", text: "SECTION 10. NON-SOLICITATION OF CLIENTS AND PERSONNEL" },
    {
      type: "p",
      text: "During employment and for twelve (12) months thereafter, Employee shall not solicit, divert, or attempt to hire any employee, independent contractor, or customer of Employer.",
    },
  ];

  const sectionsPage3 = [
    { type: "h", text: "SECTION 11. MANDATORY BINDING ARBITRATION" },
    {
      type: "p",
      text: "Any dispute, claim, or controversy arising out of or relating to this Agreement, including claims of wrongful termination or compensation disputes, shall be resolved exclusively through final and binding arbitration administered by the American Arbitration Association in Dover, Delaware. Each party shall bear its own attorneys' fees and administrative arbitration costs regardless of outcome. Employee expressly waives any right to participate in a class or representative action.",
    },
    { type: "h", text: "SECTION 12. GOVERNING LAW AND VENUE" },
    {
      type: "p",
      text: "This Agreement shall be construed, interpreted, and governed exclusively by the laws of the State of Delaware, without regard to its principles of conflict of laws. The state courts of Kent County, Delaware shall have exclusive jurisdiction over any enforcement proceedings.",
    },
    { type: "h", text: "SECTION 13. ENTIRE AGREEMENT AND SEVERABILITY" },
    {
      type: "p",
      text: "This document constitutes the entire agreement between the Parties and supersedes all prior negotiations or oral understandings. If any provision is deemed unenforceable by an arbitrator, the remaining provisions shall remain in full force.",
    },
    { type: "sig", text: "IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date." },
  ];

  const pagesData = [sectionsPage1, sectionsPage2, sectionsPage3];

  for (let pIdx = 0; pIdx < pagesData.length; pIdx++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
    const { width, height } = page.getSize();
    let y = height - 50;

    // Header rule
    page.drawText(`Page ${pIdx + 1} of 3`, {
      x: width - 90,
      y: height - 30,
      size: 9,
      font: timesRoman,
      color: rgb(0.4, 0.4, 0.4),
    });

    const items = pagesData[pIdx];

    for (const item of items) {
      if (item.type === "title") {
        page.drawText(item.text, {
          x: 50,
          y,
          size: 14,
          font: timesBold,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= 22;
      } else if (item.type === "meta") {
        page.drawText(item.text, {
          x: 50,
          y,
          size: 9,
          font: timesBold,
          color: rgb(0.3, 0.3, 0.3),
        });
        y -= 20;
      } else if (item.type === "h") {
        y -= 8;
        page.drawText(item.text, {
          x: 50,
          y,
          size: 11,
          font: timesBold,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= 16;
      } else if (item.type === "p") {
        // Simple word wrap
        const words = item.text.split(" ");
        let line = "";
        for (const w of words) {
          const testLine = line + (line ? " " : "") + w;
          const textWidth = timesRoman.widthOfTextAtSize(testLine, 9.5);
          if (textWidth > 495) {
            page.drawText(line, {
              x: 50,
              y,
              size: 9.5,
              font: timesRoman,
              color: rgb(0.2, 0.2, 0.2),
            });
            y -= 13;
            line = w;
          } else {
            line = testLine;
          }
        }
        if (line) {
          page.drawText(line, {
            x: 50,
            y,
            size: 9.5,
            font: timesRoman,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 16;
        }
      } else if (item.type === "sig") {
        y -= 20;
        page.drawText(item.text, {
          x: 50,
          y,
          size: 9.5,
          font: timesBold,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= 35;
        page.drawText("AEGIS CLOUD DYNAMICS INC.          ALEX MORGAN", {
          x: 50,
          y,
          size: 9,
          font: timesBold,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 15;
        page.drawText("By: ___________________________          Sign: ___________________________", {
          x: 50,
          y,
          size: 9,
          font: timesRoman,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const targetDir = path.resolve("./public");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, "employment_agreement_demo.pdf");
  fs.writeFileSync(targetPath, Buffer.from(pdfBytes));
  console.log("Generated demo PDF at:", targetPath);
}

generateEmploymentAgreementPdf().catch(console.error);
