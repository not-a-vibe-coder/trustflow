import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  FileText,
  Lock,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Wallet,
} from "lucide-react";
import {
  type DemoActivityItem,
  type DemoActivityKind,
  type DemoTx,
  type MonthPoint,
  type TxStatus,
  naira,
  trustTier,
} from "@/lib/trustflow";

// Reusable dashboard / profile widgets — bento-friendly cards built on the
// shared glass surfaces. Pure presentation, fed by the demo data in trustflow.ts.

/** Small uppercase section label used above card content. */
export function SectionLabel({ icon: Icon, children }: { icon?: IconType; children: ReactNode }) {
  return (
    <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon size={13} />}
      {children}
    </span>
  );
}

type IconType = React.ComponentType<{ size?: number; className?: string }>;

/** Compact KPI card — icon, label, big value and an optional delta/sub line. */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  className = "",
}: {
  icon: IconType;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "flat";
  className?: string;
}) {
  const trendColor =
    trend === "up" ? "text-[#047857]" : trend === "down" ? "text-red-600" : "text-gray-500";
  return (
    <div className={`glass-card glass-card-hover p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="w-9 h-9 rounded-xl bg-[#34D399]/15 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-[#059669]" />
        </span>
      </div>
      <div className="mt-4">
        <div className="text-[26px] sm:text-[28px] font-medium text-gray-900 tabular-nums tracking-tight leading-none">
          {value}
        </div>
        {sub && (
          <div className={`mt-1.5 text-[12px] font-medium ${trendColor} flex items-center gap-1`}>
            {trend === "up" && <ArrowUpRight size={13} />}
            {trend === "down" && <ArrowDownLeft size={13} />}
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

const ACTIVITY_STYLE: Record<DemoActivityKind, { icon: IconType; bg: string; fg: string }> = {
  released: { icon: Wallet, bg: "bg-[#34D399]/15", fg: "text-[#059669]" },
  funded: { icon: Lock, bg: "bg-[#34D399]/15", fg: "text-[#059669]" },
  trust: { icon: ShieldCheck, bg: "bg-[#34D399]/15", fg: "text-[#059669]" },
  join: { icon: UserPlus, bg: "bg-gray-900/5", fg: "text-gray-700" },
  dispute: { icon: ShieldAlert, bg: "bg-amber-100", fg: "text-amber-600" },
  info: { icon: FileText, bg: "bg-gray-900/5", fg: "text-gray-500" },
};

/** Vertical timeline of recent account activity. */
export function ActivityFeed({
  items,
  className = "",
}: {
  items: DemoActivityItem[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-col gap-1 ${className}`}>
      {items.map((it) => {
        const s = ACTIVITY_STYLE[it.kind];
        const Icon = s.icon;
        return (
          <li
            key={it.id}
            className="flex items-start gap-3 rounded-xl px-2 -mx-2 py-2 hover:bg-white/50 transition-colors"
          >
            <span className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <Icon size={15} className={s.fg} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-gray-800 leading-[1.45]">{it.text}</p>
              <span className="text-[11px] text-gray-400">{it.time}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const TX_STYLE: Record<TxStatus, { label: string; cls: string }> = {
  released: { label: "Released", cls: "bg-[#34D399]/15 text-[#047857]" },
  refunded: { label: "Refunded", cls: "bg-amber-100 text-amber-700" },
  in_escrow: { label: "In escrow", cls: "bg-gray-900 text-white" },
};

export function TxStatusPill({ status }: { status: TxStatus }) {
  const s = TX_STYLE[status];
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
}

/** Transaction history list — reads as a table on desktop, stacks on mobile. */
export function TransactionTable({
  items,
  className = "",
}: {
  items: DemoTx[];
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {items.map((tx, i) => {
        const refunded = tx.status === "refunded";
        return (
          <div
            key={tx.id}
            className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-gray-200/60" : ""}`}
          >
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                refunded ? "bg-amber-100" : "bg-[#34D399]/15"
              }`}
            >
              {refunded ? (
                <RefreshCcw size={15} className="text-amber-600" />
              ) : (
                <BadgeCheck size={15} className="text-[#059669]" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-gray-900 truncate">{tx.item}</div>
              <div className="text-[12px] text-gray-500 truncate">
                {tx.counterparty} · {tx.date}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`text-[13.5px] font-semibold tabular-nums ${
                  refunded ? "text-gray-500 line-through" : "text-gray-900"
                }`}
              >
                {naira(tx.amount)}
              </div>
              <div className="mt-0.5 flex justify-end">
                <TxStatusPill status={tx.status} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Lightweight responsive bar chart — no chart lib, just flexed columns. */
export function MiniBarChart({
  data,
  suffix = "k",
  className = "",
}: {
  data: MonthPoint[];
  suffix?: string;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={`flex items-end gap-2 sm:gap-3 h-[120px] ${className}`}>
      {data.map((d, i) => {
        const h = Math.max(6, Math.round((d.value / max) * 100));
        const isLast = i === data.length - 1;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <div
              className="w-full rounded-t-md relative group transition-[height] duration-700"
              style={{
                height: `${h}%`,
                background: isLast
                  ? "linear-gradient(180deg,#34D399,#059669)"
                  : "linear-gradient(180deg,rgba(52,211,153,0.5),rgba(52,211,153,0.18))",
              }}
              title={`${d.label}: ₦${d.value}${suffix}`}
            >
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-900 bg-white/90 rounded px-1.5 py-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ₦{d.value}{suffix}
              </span>
            </div>
            <span className={`text-[10px] ${isLast ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Circular trust-score gauge, tinted by tier. */
export function TrustRing({ score, size = 104 }: { score: number; size?: number }) {
  const { tone } = trustTier(score);
  const ring = { high: "#34D399", mid: "#F59E0B", low: "#F43F5E" }[tone];
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ring}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[24px] font-medium text-gray-900 tabular-nums leading-none">{score}</span>
        <span className="text-[10px] text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

/** Controlled settings toggle switch. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  icon?: IconType;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 text-left rounded-xl px-2 -mx-2 py-2 hover:bg-white/50 transition-colors"
    >
      {Icon && (
        <span className="w-9 h-9 rounded-xl bg-white/70 border border-white flex items-center justify-center shrink-0">
          <Icon size={15} className="text-[#059669]" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-gray-900">{label}</span>
        {description && <span className="block text-[12px] text-gray-500 leading-[1.4]">{description}</span>}
      </span>
      <span
        className={`shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors ${
          checked ? "bg-[#34D399]" : "bg-gray-300"
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
