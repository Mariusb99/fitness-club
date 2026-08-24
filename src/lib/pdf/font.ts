import type { jsPDF } from "jspdf";

// Fonturile standard din jsPDF (Helvetica etc.) nu au diacritice
// românești (ă, â, î, ș, ț). Folosim DejaVu Sans — un font open-source
// cu acoperire Unicode largă — încărcat o singură dată și memorat în
// cache pentru exporturile PDF ulterioare din aceeași sesiune de browser.

let cache: Promise<void> | null = null;

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function registerRomanianFont(doc: jsPDF): Promise<void> {
  if (!cache) {
    cache = (async () => {
      const [regular, bold] = await Promise.all([
        fetchAsBase64("/fonts/DejaVuSans.ttf"),
        fetchAsBase64("/fonts/DejaVuSans-Bold.ttf"),
      ]);
      REGULAR_B64 = regular;
      BOLD_B64 = bold;
    })();
  }
  return cache.then(() => {
    doc.addFileToVFS("DejaVuSans.ttf", REGULAR_B64);
    doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", BOLD_B64);
    doc.addFont("DejaVuSans-Bold.ttf", "DejaVuSans", "bold");
    doc.setFont("DejaVuSans", "normal");
  });
}

let REGULAR_B64 = "";
let BOLD_B64 = "";
