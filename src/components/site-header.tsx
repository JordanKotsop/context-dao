import Link from "next/link";
import { WalletButton } from "./wallet-button";

interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

interface SiteHeaderProps {
  activeNav?: string;
}

const navLinks: NavLink[] = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/league", label: "League" },
  { href: "/", label: "Home" },
];

export function SiteHeader({ activeNav }: SiteHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 md:px-12">
      <Link
        href="/"
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime">
          <span className="text-sm font-bold text-black">CD</span>
        </div>
        <span className="hidden text-sm font-medium text-white/70 sm:block">
          ContextDAO
        </span>
      </Link>
      <div className="flex items-center gap-6">
        <nav className="hidden items-center gap-6 text-sm text-white/50 md:flex">
          {navLinks.map((link) =>
            link.label === activeNav ? (
              <span key={link.href} className="text-white">
                {link.label}
              </span>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white/80"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
