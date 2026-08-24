import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitness Club",
  description: "Platformă internă pentru antrenori și administrarea clienților",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-bg text-text">{children}</body>
    </html>
  );
}
