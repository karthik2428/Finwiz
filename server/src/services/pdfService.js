// src/services/pdfService.js

import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs-extra";
import os from "os";

function currency(x) {
  const value = Number(x || 0);
  return value === 0
    ? "—"
    : `₹${value.toLocaleString("en-IN")}`;
}

function drawDivider(doc) {
  doc.moveTo(40, doc.y)
     .lineTo(555, doc.y)
     .strokeColor("#E6E6E6")
     .stroke()
     .moveDown();
}

export async function createMonthlyReportPDF(user, month, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];

      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", async () => {
        const buffer = Buffer.concat(chunks);

        const fileName = `finwiz-report-${user._id}-${month}-${Date.now()}.pdf`;
        const tmpDir = path.join(os.tmpdir(), "finwiz_reports");
        await fs.ensureDir(tmpDir);
        const filePath = path.join(tmpDir, fileName);
        await fs.writeFile(filePath, buffer);

        resolve({ buffer, fileName, filePath });
      });

      const isEmptyMonth =
        data.summary.income === 0 &&
        data.summary.expense === 0;

      /* ================= HEADER ================= */

      doc
        .fontSize(24)
        .fillColor("#1A237E")
        .text("FinWiz");

      doc
        .fontSize(14)
        .fillColor("#555")
        .text("Financial Report");

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor("#777")
        .text(`${user.name} | ${user.email}`)
        .text(`Period: ${month}`);

      doc.moveDown(1);
      drawDivider(doc);

      /* ================= SUMMARY ================= */

      doc.fontSize(15).fillColor("#000").text("Financial Summary");
      doc.moveDown(0.8);

      if (isEmptyMonth) {
        const boxY = doc.y;

        doc
          .roundedRect(40, boxY, 515, 90, 8)
          .fillAndStroke("#FFF8E1", "#FFE082");

        doc
          .fillColor("#E65100")
          .fontSize(12)
          .text(
            `No transactions recorded for ${month}.`,
            60,
            boxY + 25
          );

        doc
          .fillColor("#333")
          .fontSize(11)
          .text(
            "Upload transactions to generate detailed financial insights.",
            60,
            boxY + 45
          );

        doc.moveDown(6);

      } else {

        const cardY = doc.y;

        doc
          .roundedRect(40, cardY, 515, 120, 8)
          .fillAndStroke("#F4F6FB", "#E0E0E0");

        // Opening Balance
        doc
          .fontSize(11)
          .fillColor("#000")
          .text("Opening Balance", 70, cardY + 20)
          .fontSize(14)
          .fillColor("#1565C0")
          .text(currency(data.summary.openingBalance), 70, cardY + 40);

        // Income
        doc
          .fontSize(11)
          .fillColor("#000")
          .text("Income", 240, cardY + 20)
          .fontSize(14)
          .fillColor("#2E7D32")
          .text(currency(data.summary.income), 240, cardY + 40);

        // Expense
        doc
          .fontSize(11)
          .fillColor("#000")
          .text("Expense", 410, cardY + 20)
          .fontSize(14)
          .fillColor("#C62828")
          .text(currency(data.summary.expense), 410, cardY + 40);

        // Net This Period
        doc
          .fontSize(11)
          .fillColor("#000")
          .text("Net This Period", 70, cardY + 75)
          .fontSize(14)
          .fillColor(
            data.summary.periodNet >= 0 ? "#2E7D32" : "#C62828"
          )
          .text(currency(data.summary.periodNet), 70, cardY + 95);

        // Closing Balance
        doc
          .fontSize(11)
          .fillColor("#000")
          .text("Closing Balance", 240, cardY + 75)
          .fontSize(16)
          .fillColor("#1A237E")
          .text(currency(data.summary.closingBalance), 240, cardY + 95);

        doc.moveDown(8);
      }

      drawDivider(doc);

      /* ================= CATEGORY BREAKDOWN ================= */

      doc.fontSize(15).fillColor("#000").text("Category Breakdown");
      doc.moveDown(0.5);

      if (!data.categories || data.categories.length === 0) {
        doc.fontSize(11).fillColor("#777")
           .text("No expense categories recorded.");
      } else {
        data.categories.slice(0, 15).forEach(cat => {
          doc
            .fontSize(11)
            .fillColor("#333")
            .text(cat._id || "Other", 60, doc.y, { continued: true })
            .fillColor("#000")
            .text(currency(cat.total), { align: "right" });
        });
      }

      doc.moveDown(1);
      drawDivider(doc);

      /* ================= GOALS ================= */

      doc.addPage();
      doc.fontSize(16).fillColor("#000").text("Goals Overview");
      doc.moveDown();

      if (!data.goals || !data.goals.length) {
        doc.fontSize(11).fillColor("#777").text("No goals found.");
      } else {
        data.goals.forEach(g => {
          const y = doc.y;

          doc
            .roundedRect(40, y, 515, 80, 6)
            .fillAndStroke("#FAFAFA", "#E0E0E0");

          doc
            .fillColor("#1A237E")
            .fontSize(12)
            .text(g.title, 60, y + 10);

          doc
            .fillColor("#333")
            .fontSize(10)
            .text(`Target: ${currency(g.targetAmount)}`, 60, y + 28)
            .text(`Saved: ${currency(g.currentSaved)}`, 60, y + 42)
            .text(`Remaining: ${currency(g.remaining)}`, 300, y + 28)
            .text(
              `Monthly Needed: ${currency(g.requiredMonthlySaving)}`,
              300,
              y + 42
            );

          doc.moveDown(5);
        });
      }

      /* ================= SUBSCRIPTIONS ================= */

      doc.addPage();
      doc.fontSize(16).fillColor("#000").text("Active Subscriptions");
      doc.moveDown();

      if (!data.subscriptions || !data.subscriptions.length) {
        doc.fontSize(11).fillColor("#777")
           .text("No active subscriptions.");
      } else {
        data.subscriptions.forEach(s => {
          doc
            .fontSize(11)
            .fillColor("#333")
            .text(`${s.title} — ${currency(s.monthlyCost)}`);

          if (s.priceCreep) {
            doc.fillColor("#C62828")
               .text("Price creep detected");
          }

          doc.moveDown(0.5);
        });
      }

      /* ================= FORECAST ================= */

      doc.addPage();
      doc.fontSize(16).fillColor("#000").text("Forecast Analysis");
      doc.moveDown();

      doc
        .fontSize(12)
        .fillColor("#1565C0")
        .text(
          `Predicted Savings (WMA): ${currency(data.forecast.wmaForecast)}`
        );

      /* ================= FOOTER ================= */

      doc.moveDown(4);
      drawDivider(doc);

      doc
        .fontSize(9)
        .fillColor("#888")
        .text(
          `Generated by FinWiz on ${new Date().toLocaleString()}`,
          { align: "center" }
        );

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}