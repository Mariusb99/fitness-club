"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import type { Client } from "@/lib/types";
import { registerRomanianFont } from "@/lib/pdf/font";

interface Row {
  client: Client;
  trainerName: string;
  kgDelta: number | null;
  percentDelta: number | null;
}

export function ExportSummaryPdfButton({ rows, title }: { rows: Row[]; title: string }) {
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      await registerRomanianFont(doc);
      const margin = 44;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = margin;

      doc.setFont("DejaVuSans", "bold");
      doc.setFontSize(17);
      doc.setTextColor(20, 20, 20);
      doc.text("Fitness Club — Raport evoluție", margin, y);
      y += 20;
      doc.setFont("DejaVuSans", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`${title} · generat la ${new Date().toLocaleDateString("ro-RO")}`, margin, y);
      y += 20;
      doc.setDrawColor(230, 72, 58);
      doc.setLineWidth(1.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 24;

      const headers = ["Client", "Antrenor", "Status", "kg pierduți", "% progres"];
      const colWidths = [140, 130, 80, 80, 70];

      function drawHeaderRow() {
        doc.setFont("DejaVuSans", "bold");
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        let x = margin;
        headers.forEach((h, i) => {
          doc.text(h, x, y);
          x += colWidths[i];
        });
        y += 8;
        doc.setDrawColor(210, 210, 210);
        doc.line(margin, y, pageWidth - margin, y);
        y += 16;
      }

      drawHeaderRow();

      doc.setFont("DejaVuSans", "normal");
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);

      for (const row of rows) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
          drawHeaderRow();
        }
        let x = margin;
        const cells = [
          row.client.fullName,
          row.trainerName,
          row.client.status,
          row.kgDelta !== null ? `${row.kgDelta >= 0 ? "-" : "+"}${Math.abs(row.kgDelta).toFixed(1)} kg` : "—",
          row.percentDelta !== null ? `${row.percentDelta >= 0 ? "-" : "+"}${Math.abs(row.percentDelta).toFixed(1)}%` : "—",
        ];
        cells.forEach((c, i) => {
          doc.text(String(c), x, y);
          x += colWidths[i];
        });
        y += 18;
      }

      doc.save("raport-evolutie-fitness-club.pdf");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={pending}
      className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Export raport (PDF)
    </button>
  );
}
