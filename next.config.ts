import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O poză făcută cu telefonul trece des de 1 MB — limita implicită a
      // Server Actions din Next.js — moment în care cererea e respinsă
      // direct de framework, înainte să ajungă la validarea noastră proprie
      // (MAX_PHOTO_BYTES, 10 MB per fotografie, din acțiunea de încărcare
      // foto). „Evoluția lunară" trimite până la 4 fotografii într-o
      // singură cerere, deci limita trebuie să acopere tot setul deodată,
      // nu doar o poză — de-aia e mult mai mare decât cei 10 MB per fișier.
      bodySizeLimit: "40mb",
    },
  },
};

export default nextConfig;
