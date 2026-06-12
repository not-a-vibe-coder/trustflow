import { Link } from "@tanstack/react-router";
import { LogOut, Wallet } from "lucide-react";
import { Avatar, TrustScoreBadge, Wordmark } from "./ui";
import { naira, type User } from "@/lib/trustflow";

// Organized top navigation shared by the app + profile pages. Reads like a
// sidebar (icon + label, clear active state) but laid out horizontally.

type IconType = React.ComponentType<{ size?: number; className?: string }>;
type AppRoute = "/app" | "/profile";

export type NavItem = {
  key: string;
  label: string;
  icon: IconType;
  /** Route to link to (cross-page nav). */
  to?: AppRoute;
  /** In-page view switch (same route). */
  onClick?: () => void;
};

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const cls = `inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
    active
      ? "bg-gray-900 text-white shadow-sm"
      : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
  }`;
  const inner = (
    <>
      <Icon size={15} className={active ? "text-[#34D399]" : ""} />
      <span>{item.label}</span>
    </>
  );
  if (item.to) {
    return (
      <Link to={item.to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={item.onClick} className={cls}>
      {inner}
    </button>
  );
}

/** Mobile bottom-tab-style button — equal width so the row fits any screen. */
function MobileTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const cls = `flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 px-1 text-[10.5px] font-medium transition-colors ${
    active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-white/70"
  }`;
  const inner = (
    <>
      <Icon size={17} className={active ? "text-[#34D399]" : ""} />
      <span className="truncate max-w-full">{item.label}</span>
    </>
  );
  if (item.to) {
    return (
      <Link to={item.to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={item.onClick} className={cls}>
      {inner}
    </button>
  );
}

export function TopNav({
  user,
  items,
  active,
  wallet,
  walletRinging,
  onLogout,
}: {
  user: User;
  items: NavItem[];
  active: string;
  wallet?: number;
  walletRinging?: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/60">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left — brand */}
        <Wordmark />

        {/* Center — primary navigation */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/50 border border-white/70 p-1">
          {items.map((it) => (
            <NavButton key={it.key} item={it} active={it.key === active} />
          ))}
        </nav>

        {/* Right — wallet, trust & account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {wallet !== undefined && (
            <div
              className="hidden min-[560px]:flex items-center gap-2 rounded-full bg-gray-900 text-white px-3 py-1.5"
              style={walletRinging ? { animation: "ring 1.4s ease-out infinite" } : undefined}
              title="Your Chëkd balance — settled to OPay"
            >
              <Wallet size={14} className="text-[#34D399]" />
              <span className="text-[13px] font-semibold tabular-nums">{naira(wallet)}</span>
            </div>
          )}

          <TrustScoreBadge score={user.trustScore} className="hidden min-[400px]:inline-flex" />

          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full hover:bg-white/70 p-1 xl:pr-2.5 transition-colors"
            title="Your profile"
          >
            <Avatar name={user.name} accent={user.role === "seller"} />
            <span className="hidden xl:block leading-tight pr-0.5">
              <span className="block text-[13px] font-medium text-gray-900">{user.name}</span>
              <span className="block text-[11px] text-gray-500 capitalize">{user.role}</span>
            </span>
          </Link>

          <button
            onClick={onLogout}
            className="w-9 h-9 rounded-full hover:bg-white/70 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {/* Mobile nav — equal-width tabs that fit any device */}
      <nav className="md:hidden border-t border-white/50 px-2 py-1.5">
        <div className="flex items-stretch gap-1">
          {items.map((it) => (
            <MobileTab key={it.key} item={it} active={it.key === active} />
          ))}
        </div>
      </nav>
    </header>
  );
}
