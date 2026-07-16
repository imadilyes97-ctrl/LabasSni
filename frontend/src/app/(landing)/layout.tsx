import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "lebeSsni — Essayage Virtuel",
  description:
    "Essaye ce produit sur toi en un clic. Upload ta photo, vois le rendu en temps réel.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
