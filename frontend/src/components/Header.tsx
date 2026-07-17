"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function Header() {
  const [token, setToken] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("client_id");
    localStorage.removeItem("nom_boutique");
    setToken(null);
    router.push("/");
  };

  if (pathname.startsWith("/widget-frame")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold text-zinc-100 hover:text-indigo-400 transition-colors">
          lebeSsni
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          <NavLink href="/" active={pathname === "/"}>
            Accueil
          </NavLink>
          <NavLink href="/privacy" active={pathname === "/privacy"}>
            Confidentialité
          </NavLink>
          {token ? (
            <>
              <NavLink href="/dashboard" active={pathname.startsWith("/dashboard")}>
                Dashboard
              </NavLink>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-zinc-700 px-4 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-indigo-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Connexion
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 sm:hidden"
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>
            ) : (
              <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-zinc-800 px-6 py-4 sm:hidden">
          <nav className="flex flex-col gap-3">
            <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>Accueil</MobileNavLink>
            <MobileNavLink href="/privacy" onClick={() => setMobileOpen(false)}>Confidentialité</MobileNavLink>
            {token ? (
              <>
                <MobileNavLink href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</MobileNavLink>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 text-left">
                  Déconnexion
                </button>
              </>
            ) : (
              <MobileNavLink href="/login" onClick={() => setMobileOpen(false)}>Connexion</MobileNavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active ? "text-indigo-400 font-medium" : "text-zinc-500 hover:text-zinc-200"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
    >
      {children}
    </Link>
  );
}
