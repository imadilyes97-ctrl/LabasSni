import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "lebeSsni — Essayage Virtuel IA",
  description:
    "Essayage virtuel IA pour le e-commerce mode. Uploade ta photo, choisis un produit, vois le rendu en temps réel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
