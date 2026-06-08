import { ArrowRight, ShieldCheck } from "lucide-react";

// Shared chrome + form primitives for the TrustFlow app, styled to match the
// marketing site (emerald accent, dark pills, soft cards).

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="flex items-center gap-2 group">
      <span className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
        <ShieldCheck size={16} className="text-[#34D399]" />
      </span>
      <span className="text-[16px] font-semibold tracking-tight text-gray-900">
        TrustFlow<span className="text-[#059669]"> AI</span>
      </span>
    </a>
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
