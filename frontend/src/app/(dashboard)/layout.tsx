import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "lebeSsni — Dashboard Vendeur",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
