import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  Check,
  Clock,
  Eye,
  FileText,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  Settings2,
  ShieldCheck,
  Smartphone,
  UserCircle,
  Vault as VaultIcon,
} from "lucide-react";
import { Avatar, Field, PrimaryButton, RoleChip } from "@/components/trustflow/ui";
import { AppCanvas, GlassCard } from "@/components/trustflow/Glass";
import { TopNav, type NavItem } from "@/components/trustflow/AppNav";
import { ActivityFeed, SectionLabel, Toggle } from "@/components/trustflow/widgets";
import {
  DEFAULT_INVOICE,
  type InvoiceBrand,
  type User,
  type Vault,
  TRUST_BLURB,
  TRUST_EVENTS,
  TRUST_FORMULA,
  TRUST_FORMULA_ALPHA,
  clearSession,
  demoActivity,
  loadState,
  naira,
  persistUser,
  setPendingView,
  trustTier,
  updateAccountInvoice,
} from "@/lib/trustflow";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "Chëkd — Your profile" }],
  }),
});

const ACCENTS = ["#34D399", "#3B82F6", "#8B5CF6", "#F43F5E", "#F59E0B", "#0F172A"];

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [vault, setVault] = useState<Vault | null>(null);

  useEffect(() => {
    const s = loadState();
    if (!s.user) {
      navigate({ to: "/login" });
      return;
    }
    setUser(s.user);
    setVault(s.vault);
  }, [navigate]);

  if (!user) {
    return (
      <main className="app-canvas min-h-screen flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-gray-400" />
      </main>
    );
  }

  const logout = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  const goApp = (v: string) => {
    setPendingView(v);
    navigate({ to: "/app" });
  };

  const navItems: NavItem[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, onClick: () => goApp("dashboard") },
    ...(user.role === "seller"
      ? [{ key: "vaults", label: "Vaults", icon: VaultIcon, onClick: () => goApp("vaults") } as NavItem]
      : []),
    { key: "activity", label: "Activity", icon: Activity, onClick: () => goApp("activity") },
    { key: "profile", label: "Profile", icon: UserCircle, to: "/profile" },
  ];

  return (
    <AppCanvas>
      <TopNav user={user} items={navItems} active="profile" onLogout={logout} />

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 sm:py-10 flex flex-col gap-6">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-medium text-gray-900 tracking-[-0.02em]">
            Your profile
          </h1>
          <p className="mt-1.5 text-[14px] text-gray-700">
            Your trust score, account details, activity and settings — all in one place.
          </p>
        </div>

        <TrustHero user={user} />

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <AccountCard user={user} />
          <TrustLedger />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <ActivityCard user={user} />
          <SettingsCard />
        </div>

        <HistoryCard user={user} vault={vault} />

        {user.role === "seller" && <InvoiceEditor user={user} onSaved={setUser} />}
      </div>
    </AppCanvas>
  );
}

function ActivityCard({ user }: { user: User }) {
  return (
    <GlassCard className="p-6">
      <SectionLabel icon={Bell}>Recent activity</SectionLabel>
      <ActivityFeed items={demoActivity(user.role).slice(0, 6)} className="mt-3" />
    </GlassCard>
  );
}

function SettingsCard() {
  const [dealAlerts, setDealAlerts] = useState(true);
  const [trustAlerts, setTrustAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  return (
    <GlassCard className="p-6">
      <SectionLabel icon={Settings2}>Settings</SectionLabel>
      <div className="mt-3 flex flex-col gap-1">
        <Toggle
          icon={Bell}
          label="Deal notifications"
          description="When a buyer joins, funds, or releases a vault."
          checked={dealAlerts}
          onChange={setDealAlerts}
        />
        <Toggle
          icon={ShieldCheck}
          label="Trust score alerts"
          description="Get told the moment your score changes."
          checked={trustAlerts}
          onChange={setTrustAlerts}
        />
        <Toggle
          icon={Lock}
          label="Two-factor authentication"
          description="Require a code on every new-device login."
          checked={twoFactor}
          onChange={setTwoFactor}
        />
        <Toggle
          icon={Eye}
          label="Public trust profile"
          description="Let counterparties view your score before trading."
          checked={publicProfile}
          onChange={setPublicProfile}
        />
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200/60 flex items-center gap-3 text-[12px] text-gray-500">
        <Smartphone size={14} className="text-[#059669]" />
        Signed in on this device · Lagos, NG
      </div>
    </GlassCard>
  );
}

function TrustHero({ user }: { user: User }) {
  const { label, tone } = trustTier(user.trustScore);
  const ring = { high: "#34D399", mid: "#F59E0B", low: "#F43F5E" }[tone];
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - user.trustScore / 100);

  return (
    <GlassCard className="p-6 sm:p-8" variant="dark">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
        <div className="relative shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
            <circle
              cx="64"
              cy="64"
              r="52"
              fill="none"
              stroke={ring}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[34px] font-medium text-white tabular-nums leading-none">
              {user.trustScore}
            </span>
            <span className="text-[11px] text-gray-400">/ 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} accent={user.role === "seller"} />
            <div>
              <div className="text-[16px] font-medium text-white flex items-center gap-2">
                {user.name}
                <span
                  className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                  style={{ backgroundColor: `${ring}26`, color: ring }}
                >
                  {label}
                </span>
              </div>
              <div className="text-[12px] text-gray-400">
                {user.tradesCompleted} completed trade{user.tradesCompleted === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <p className="mt-4 text-[13px] text-gray-300 leading-[1.6] max-w-[52ch]">{TRUST_BLURB}</p>
          <div className="mt-4 inline-flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-white/5 border border-white/10 px-3.5 py-2">
            <span className="text-[12px] font-mono text-[#34D399]">{TRUST_FORMULA}</span>
            <span className="text-[11px] font-mono text-gray-500">{TRUST_FORMULA_ALPHA}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function AccountCard({ user }: { user: User }) {
  const since = new Date(user.createdAt).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
  const rows = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: ShieldCheck, label: "Account type", value: user.role === "seller" ? "Seller" : "Buyer" },
    { icon: Clock, label: "Member since", value: since },
  ];
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
          Account
        </span>
        <RoleChip role={user.role} />
      </div>
      <div className="flex flex-col gap-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-white/70 border border-white flex items-center justify-center shrink-0">
              <Icon size={15} className="text-[#059669]" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</div>
              <div className="text-[14px] text-gray-900 font-medium truncate">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function TrustLedger() {
  return (
    <GlassCard className="p-6">
      <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
        How your score moves
      </span>
      <ul className="mt-4 flex flex-col gap-2.5">
        {TRUST_EVENTS.map((e) => {
          const positive = e.delta.startsWith("+");
          const zero = e.delta.startsWith("→");
          return (
            <li key={e.label} className="flex items-start gap-3">
              <span
                className={`text-[12px] font-bold tabular-nums rounded-md px-1.5 py-0.5 shrink-0 ${
                  positive
                    ? "bg-[#34D399]/15 text-[#047857]"
                    : zero
                      ? "bg-gray-900 text-white"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {e.delta}
              </span>
              <span className="text-[12.5px] text-gray-700 leading-[1.5]">{e.label}</span>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}

function HistoryCard({ user, vault }: { user: User; vault: Vault | null }) {
  const released = vault?.status === "released";
  const past = Math.max(0, user.tradesCompleted - (released ? 1 : 0));
  return (
    <GlassCard className="p-6">
      <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
        Trade history
      </span>
      <div className="mt-4 flex flex-col gap-3">
        {vault ? (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200/70 bg-white/50 p-3.5">
            <span className="w-10 h-10 rounded-xl bg-[#34D399]/15 flex items-center justify-center shrink-0">
              {released ? (
                <BadgeCheck size={18} className="text-[#059669]" />
              ) : (
                <Clock size={18} className="text-[#059669]" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium text-gray-900 truncate">
                {vault.info.item}
              </div>
              <div className="text-[12px] text-gray-600">
                {naira(vault.info.price)} ·{" "}
                {released ? `paid out · ${vault.invoiceNo}` : "in progress"}
              </div>
            </div>
            {released && <span className="text-[12px] font-semibold text-[#047857]">+2</span>}
          </div>
        ) : (
          <p className="text-[13px] text-gray-600">No active deal right now.</p>
        )}
        {past > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200/70 bg-white/40 p-3.5">
            <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-gray-500" />
            </span>
            <div className="text-[13px] text-gray-700">
              <b className="text-gray-900">{past}</b> earlier completed trade{past === 1 ? "" : "s"}{" "}
              on record
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function InvoiceEditor({ user, onSaved }: { user: User; onSaved: (u: User) => void }) {
  const [invoice, setInvoice] = useState<InvoiceBrand>(user.invoice ?? DEFAULT_INVOICE);
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<InvoiceBrand>) => {
    setInvoice((i) => ({ ...i, ...patch }));
    setSaved(false);
  };

  const save = () => {
    const next: InvoiceBrand = {
      ...invoice,
      businessName: invoice.businessName.trim() || user.name,
      monogram: (invoice.monogram.trim() || "TF").toUpperCase(),
      prefix: (invoice.prefix.trim() || "INV").toUpperCase(),
    };
    updateAccountInvoice(user.email, next);
    const updated = { ...user, invoice: next };
    persistUser(updated);
    onSaved(updated);
    setInvoice(next);
    setSaved(true);
  };

  const monogram = (invoice.monogram || "TF").toUpperCase();
  const prefix = (invoice.prefix || "INV").toUpperCase();
  const businessName = invoice.businessName || user.name;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
          Invoice branding
        </span>
        <span className="text-[11px] text-gray-400">issued only when a deal completes</span>
      </div>

      <div className="mt-4 grid lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-4">
          <Field
            label="Business name"
            value={invoice.businessName}
            onChange={(e) => set({ businessName: e.target.value })}
            placeholder="Chioma Fashion"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Monogram"
              value={invoice.monogram}
              onChange={(e) => set({ monogram: e.target.value.slice(0, 3).toUpperCase() })}
              placeholder="CF"
            />
            <Field
              label="Invoice prefix"
              value={invoice.prefix}
              onChange={(e) => set({ prefix: e.target.value.slice(0, 5).toUpperCase() })}
              placeholder="CHF"
            />
          </div>
          <div>
            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
              Brand colour
            </span>
            <div className="mt-2 flex items-center gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Use ${c}`}
                  onClick={() => set({ accent: c })}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    invoice.accent === c ? "ring-2 ring-offset-2 ring-gray-900 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Field
            label="Footer / contact line"
            value={invoice.footer}
            onChange={(e) => set({ footer: e.target.value })}
            placeholder="Lekki, Lagos · 0801 234 5678"
          />
          <div className="flex items-center gap-3">
            <PrimaryButton onClick={save}>{saved ? "Saved" : "Save branding"}</PrimaryButton>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#047857]">
                <Check size={15} /> Branding updated
              </span>
            )}
          </div>
        </div>

        {/* Live invoice preview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-bold text-white"
                style={{ backgroundColor: invoice.accent }}
              >
                {monogram}
              </span>
              <div>
                <div className="text-[15px] font-semibold text-gray-900">{businessName}</div>
                <div className="text-[11px] text-gray-500">Invoice</div>
              </div>
            </div>
            <span className="text-[11px] font-mono text-gray-500">{prefix}-10293</span>
          </div>
          <div className="mt-4 h-px" style={{ backgroundColor: invoice.accent, opacity: 0.4 }} />
          <div className="mt-4 space-y-2">
            <Row k="MacBook M3" v={naira(1200000)} />
            <Row k="Escrow fee" v="₦0" />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[12px] font-medium text-gray-500">Total paid</span>
            <span className="text-[15px] font-semibold" style={{ color: invoice.accent }}>
              {naira(1200000)}
            </span>
          </div>
          <div className="mt-4 text-[11px] text-gray-500">
            {invoice.footer || "Your contact line appears here"}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-gray-700">{k}</span>
      <span className="text-gray-900 font-medium tabular-nums">{v}</span>
    </div>
  );
}
