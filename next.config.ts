import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // O poză făcută cu telefonul trece des de 1 MB — limita implicită a
      // Server Actions din Next.js — moment în care cererea e respinsă
      // direct de framework, înainte să ajungă la validarea noastră proprie
      // (MAX_PHOTO_BYTES, 10 MB, din acțiunea de încărcare foto). Ridicăm
      // limita aici ca să se potrivească.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
