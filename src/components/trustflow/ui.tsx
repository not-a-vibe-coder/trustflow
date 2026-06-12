import { ArrowRight, ShieldCheck, Store, ShoppingBag } from "lucide-react";
import { trustTier, type Role } from "@/lib/trustflow";

// Shared chrome + form primitives for the TrustFlow app, styled to match the
// marketing site (emerald accent, dark pills, soft cards).

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="flex items-center gap-2 group">
      <span className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
        <ShieldCheck size={16} className="text-[#34D399]" />
      </span>
      <span className="font-display text-[19px] tracking-[-0.01em] text-gray-900 leading-none">
        Trust<span className="text-[#059669]">Flow</span>{" "}
        <span className="text-[12px] font-semibold align-middle text-[#059669]">AI</span>
      </span>
    </a>
  );
}

/** Small pill showing a user's live trust score, tinted by tier. */
export function TrustScoreBadge({
  score,
  className = "",
}: {
  score: number;
  className?: string;
}) {
  const { label, tone } = trustTier(score);
  const tones = {
    high: "bg-[#34D399]/15 text-[#047857]",
    mid: "bg-amber-100 text-amber-700",
    low: "bg-red-100 text-red-700",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${tones[tone]} ${className}`}
      title={`Trust score ${score} — ${label}`}
    >
      <ShieldCheck size={13} />
      <span className="tabular-nums">{score}</span>
      <span className="hidden sm:inline font-medium opacity-80">· {label}</span>
    </span>
  );
}

/** Buyer / Seller role chip. */
export function RoleChip({ role, className = "" }: { role: Role; className?: string }) {
  const isSeller = role === "seller";
  const Icon = isSeller ? Store : ShoppingBag;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
        isSeller ? "bg-gray-900 text-[#34D399]" : "bg-[#34D399] text-gray-900"
      } ${className}`}
    >
      <Icon size={12} /> {isSeller ? "Seller" : "Buyer"}
    </span>
  );
}

/** Lightweight segmented tab control. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-gray-100/80 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
            active === t.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] bg-gray-900 text-[#34D399] px-2.5 py-1 rounded-full">
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  full?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group bg-[#34D399] hover:bg-[#10B981] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 text-[14px] font-medium rounded-full pl-6 pr-2 py-2.5 inline-flex items-center justify-between gap-3 transition-colors ${
        full ? "w-full" : ""
      }`}
    >
      <span>{children}</span>
      <span className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45">
        <ArrowRight size={14} className="text-[#34D399]" />
      </span>
    </button>
  );
}

export function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <input
        {...props}
        className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[14px] text-gray-900 outline-none focus:border-[#34D399] focus:ring-2 focus:ring-[#34D399]/20 transition"
      />
      {hint && <span className="mt-1.5 block text-[12px] text-gray-400">{hint}</span>}
    </label>
  );
}

export function Avatar({ name, accent }: { name: string; accent?: boolean }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold ${
        accent ? "bg-[#34D399] text-gray-900" : "bg-gray-900 text-white"
      }`}
    >
      {initials}
    </span>
  );
}
