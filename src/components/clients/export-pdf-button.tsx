"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import type { Client } from "@/lib/types";
import { age, bmi } from "@/lib/types";
import { registerRomanianFont } from "@/lib/pdf/font";

export function ExportClientPdfButton({
  client,
  trainerName,
}: {
  client: Client;
  trainerName: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      await registerRomanianFont(doc);
      const margin = 48;
      let y = margin;
      const lineHeight = 16;
      const pageWidth = doc.internal.pageSize.getWidth();

      function heading(text: string, size = 16) {
        doc.setFont("DejaVuSans", "bold");
        doc.setFontSize(size);
        doc.setTextColor(20, 20, 20);
        doc.text(text, margin, y);
        y += size * 1.1;
      }

      function label(text: string) {
        doc.setFont("DejaVuSans", "bold");
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text(text.toUpperCase(), margin, y);
        y += 13;
      }

      function value(text: string) {
        doc.setFont("DejaVuSans", "normal");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        const lines = doc.splitTextToSize(text || "—", pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * lineHeight * 0.75 + 6;
      }

      function ensureSpace(extra: number) {
        if (y + extra > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
      }

      heading("Fitness Club — Fișă client", 18);
      doc.setFont("DejaVuSans", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generat la ${new Date().toLocaleDateString("ro-RO")}`, margin, y);
      y += 24;

      heading(client.fullName, 14);
      doc.setDrawColor(230, 72, 58);
      doc.setLineWidth(1.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 20;

      label("Antrenor");
      value(trainerName);
      label("Email / Telefon");
      value(`${client.email ?? "—"}  ·  ${client.phone ?? "—"}`);
      const clientAge = age(client.birthDate);
      label("Vârstă / Gen / Status");
      value(
        `${clientAge ? `${clientAge} ani` : "—"} · ${client.gender ?? "—"} · ${client.status}`,
      );
      label("Obiective");
      value(client.goals ?? "—");
      label("Observații");
      value(client.notes ?? "—");

      if (client.anamnesis) {
        ensureSpace(100);
        heading("Anamneză", 13);
        label("Afecțiuni medicale");
        value(client.anamnesis.medicalConditions ?? "—");
        label("Medicamente");
        value(client.anamnesis.medications ?? "—");
        label("Accidentări / leziuni");
        value(client.anamnesis.injuries ?? "—");
        label("Alergii");
        value(client.anamnesis.allergies ?? "—");
        label("Contraindicații");
        value(client.anamnesis.contraindications ?? "—");
      }

      const sorted = [...client.measurements].sort((a, b) =>
        a.recordedAt.localeCompare(b.recordedAt),
      );
      if (sorted.length > 0) {
        ensureSpace(140);
        heading("Evoluție măsurători", 13);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const kgDelta = first.weightKg - last.weightKg;

        doc.setFont("DejaVuSans", "normal");
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        const headers = ["Data", "Greutate", "IMC", "Talie", "Șold", "Braț"];
        const colWidths = [80, 70, 60, 60, 60, 60];
        let x = margin;
        headers.forEach((h, i) => {
          doc.text(h, x, y);
          x += colWidths[i];
        });
        y += 14;
        doc.setDrawColor(210, 210, 210);
        doc.line(margin, y - 10, pageWidth - margin, y - 10);

        doc.setTextColor(20, 20, 20);
        for (const m of sorted) {
          ensureSpace(20);
          x = margin;
          const row = [
            new Date(m.recordedAt).toLocaleDateString("ro-RO"),
            `${m.weightKg} kg`,
            bmi(m.weightKg, m.heightCm).toFixed(1),
            m.waist ? `${m.waist} cm` : "—",
            m.hips ? `${m.hips} cm` : "—",
            m.arms ? `${m.arms} cm` : "—",
          ];
          row.forEach((cell, i) => {
            doc.text(String(cell), x, y);
            x += colWidths[i];
          });
          y += 16;
        }

        ensureSpace(40);
        y += 10;
        doc.setFont("DejaVuSans", "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text(
          `Total: ${kgDelta >= 0 ? "-" : "+"}${Math.abs(kgDelta).toFixed(1)} kg (${first.recordedAt ? new Date(first.recordedAt).toLocaleDateString("ro-RO") : ""} → ${new Date(last.recordedAt).toLocaleDateString("ro-RO")})`,
          margin,
          y,
        );
      }

      doc.save(`fisa-${client.fullName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={pending}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Export PDF
    </button>
  );
}
