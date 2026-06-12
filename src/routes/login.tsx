import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Lock, QrCode, ShieldCheck, Store, ShoppingBag } from "lucide-react";
import { Avatar, Field, PrimaryButton, RoleChip, Tabs, Wordmark } from "@/components/trustflow/ui";
import { AppCanvas, GlassCard } from "@/components/trustflow/Glass";
import { GeminiLogo } from "@/components/trustflow/GeminiLogo";
import {
  DEFAULT_INVOICE,
  DEMO_ACCOUNTS,
  DEMO_PASSWORD_HINT,
  type InvoiceBrand,
  type Role,
  loadState,
  persistUser,
  registerAccount,
  validateLogin,
} from "@/lib/trustflow";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Chëkd — Log in or sign up" },
      {
        name: "description",
        content:
          "Sign in as a buyer or a seller. Open OPay-backed escrow vaults, build your trust score, and trade safely.",
      },
    ],
  }),
});

const FEATURES = [
  { icon: Lock, text: "OPay-backed escrow vault" },
  { icon: GeminiLogo, text: "AI extracts the order from your chat" },
  { icon: QrCode, text: "QR-confirmed delivery" },
  { icon: ShieldCheck, text: "Trust score for every user" },
];

const ACCENTS = ["#34D399", "#3B82F6", "#8B5CF6", "#F43F5E", "#F59E0B", "#0F172A"];

type Mode = "login" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");

  // shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // signup
  const [role, setRole] = useState<Role>("seller");
  const [name, setName] = useState("");
  const [invoice, setInvoice] = useState<InvoiceBrand>(DEFAULT_INVOICE);

  useEffect(() => {
    if (loadState().user) navigate({ to: "/app" });
  }, [navigate]);

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setMode("login");
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  const finish = (to: string) => setTimeout(() => navigate({ to }), 450);

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const user = validateLogin(email, password);
    if (!user) {
      setError("Those credentials don't match. Try a demo account below.");
      return;
    }
    setBusy(true);
    persistUser(user);
    finish("/app");
  };

  const submitSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 4) {
      setError("Enter your name, email, and a password of at least 4 characters.");
      return;
    }
    const sellerInvoice: InvoiceBrand = {
      ...invoice,
      businessName: invoice.businessName.trim() || name.trim(),
      monogram: (invoice.monogram.trim() || initialsOf(invoice.businessName || name)).toUpperCase(),
      prefix: (invoice.prefix.trim() || "INV").toUpperCase(),
    };
    const { user, error: err } = registerAccount({
      role,
      name,
      email,
      password,
      invoice: role === "seller" ? sellerInvoice : undefined,
    });
    if (!user) {
      setError(err ?? "Could not create your account.");
      return;
    }
    setBusy(true);
    persistUser(user);
    finish("/app");
  };

  return (
    <AppCanvas className="flex flex-col">
      <header className="mx-auto w-full max-w-[1100px] px-5 sm:px-8 py-4 flex items-center justify-between">
        <Wordmark />
        <a
          href="/"
          className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Home
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-5 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-[1000px] w-full">
          {/* Brand panel */}
          <div className="hidden lg:flex flex-col">
            <img
              src="/chekd-logo.png"
              alt="Chëkd"
              className="w-44 -ml-3 mb-4 self-start select-none"
              draggable={false}
            />
            <span className="self-start text-[10px] font-semibold uppercase tracking-[0.18em] bg-gray-900 text-[#34D399] px-2.5 py-1 rounded-full">
              Safe social commerce
            </span>
            <h1 className="mt-5 font-display text-[44px] leading-[1.05] tracking-[-0.02em] text-gray-900">
              Safe trade for every Nigerian seller
            </h1>
            <p className="mt-4 text-[15px] text-gray-700 leading-[1.6] max-w-[42ch]">
              From WhatsApp chat to secure vault — in under two minutes. Sign in as a buyer or a
              seller to walk the full protected flow.
            </p>
            <ul className="mt-8 flex flex-col gap-3.5">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[14.5px] text-gray-800">
                  <span className="w-7 h-7 rounded-full bg-white/70 border border-white shadow-sm flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-[#059669]" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            {/* Demo accounts */}
            <div className="mt-9">
              <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-3">
                Demo accounts — click to fill
              </div>
              <div className="flex flex-col gap-3">
                {DEMO_ACCOUNTS.map((acc) => (
                  <DemoCard key={acc.email} acc={acc} onPick={() => fillDemo(acc)} />
                ))}
              </div>
            </div>
          </div>

          {/* Auth card */}
          <GlassCard className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <Tabs
                tabs={[
                  { value: "login", label: "Log in" },
                  { value: "signup", label: "Sign up" },
                ]}
                active={mode}
                onChange={(m) => {
                  setMode(m);
                  setError(null);
                }}
              />
            </div>

            {mode === "login" ? (
              <form className="mt-6 flex flex-col gap-4" onSubmit={submitLogin}>
                <div>
                  <h2 className="text-[22px] font-medium text-gray-900">Welcome back</h2>
                  <p className="text-[14px] text-gray-600 mt-1">Log in to your Chëkd account.</p>
                </div>
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="chioma@chekd.ng"
                  autoComplete="username"
                />
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  hint={`Password for all demo accounts: ${DEMO_PASSWORD_HINT}`}
                />
                {error && <ErrorNote>{error}</ErrorNote>}
                <SubmitRow busy={busy} label="Log in" />
                <p className="text-center text-[13px] text-gray-600">
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-medium text-[#059669] hover:underline"
                  >
                    Sign up free
                  </button>
                </p>
              </form>
            ) : (
              <form className="mt-6 flex flex-col gap-4" onSubmit={submitSignup}>
                <div>
                  <h2 className="text-[22px] font-medium text-gray-900">Create your account</h2>
                  <p className="text-[14px] text-gray-600 mt-1">
                    Join Chëkd — free, and your trust score starts at 100.
                  </p>
                </div>

                <RolePicker role={role} onChange={setRole} />

                <Field
                  label="Full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Chioma Esther"
                  autoComplete="name"
                />
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="you@chekd.ng"
                  autoComplete="email"
                />
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Create a password"
                  autoComplete="new-password"
                />

                {role === "seller" && (
                  <InvoiceSetup invoice={invoice} name={name} onChange={setInvoice} />
                )}

                {error && <ErrorNote>{error}</ErrorNote>}
                <SubmitRow busy={busy} label="Create account & continue" />
                <p className="text-center text-[13px] text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium text-[#059669] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {/* Demo accounts (mobile) */}
            <div className="lg:hidden mt-7 pt-6 border-t border-gray-200/70">
              <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-3">
                Demo accounts — tap to fill
              </div>
              <div className="flex flex-col gap-3">
                {DEMO_ACCOUNTS.map((acc) => (
                  <DemoCard key={acc.email} acc={acc} onPick={() => fillDemo(acc)} />
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <footer className="mx-auto w-full max-w-[1100px] px-5 sm:px-8 py-5 text-center lg:text-left">
        <span className="text-[12px] text-gray-500">
          OPay × Google National Innovation Challenge 2026
        </span>
      </footer>
    </AppCanvas>
  );
}

function DemoCard({
  acc,
  onPick,
}: {
  acc: (typeof DEMO_ACCOUNTS)[number];
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group text-left rounded-2xl bg-white/70 border border-white hover:border-[#34D399] hover:bg-white transition-colors p-3.5 flex items-center gap-3 shadow-sm"
    >
      <Avatar name={acc.name} accent={acc.role === "seller"} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-gray-900 truncate">{acc.name}</span>
          <RoleChip role={acc.role} />
        </div>
        <div className="text-[12.5px] text-gray-600 truncate">{acc.blurb}</div>
      </div>
      <span className="text-[11px] font-medium text-[#059669] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        Fill →
      </span>
    </button>
  );
}

function RolePicker({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  const opts: { value: Role; label: string; sub: string; icon: typeof Store }[] = [
    { value: "seller", label: "I'm a seller", sub: "Open vaults & get paid", icon: Store },
    { value: "buyer", label: "I'm a buyer", sub: "Pay safely into escrow", icon: ShoppingBag },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {opts.map(({ value, label, sub, icon: Icon }) => {
        const active = role === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`text-left rounded-2xl border-2 p-3.5 transition-colors ${
              active
                ? "border-[#34D399] bg-[#34D399]/[0.08]"
                : "border-gray-200 bg-white/60 hover:border-gray-300"
            }`}
          >
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                active ? "bg-[#34D399] text-gray-900" : "bg-gray-100 text-gray-500"
              }`}
            >
              <Icon size={17} />
            </span>
            <div className="mt-2.5 text-[14px] font-medium text-gray-900">{label}</div>
            <div className="text-[12px] text-gray-600">{sub}</div>
          </button>
        );
      })}
    </div>
  );
}

function InvoiceSetup({
  invoice,
  name,
  onChange,
}: {
  invoice: InvoiceBrand;
  name: string;
  onChange: (i: InvoiceBrand) => void;
}) {
  const set = (patch: Partial<InvoiceBrand>) => onChange({ ...invoice, ...patch });
  const businessName = invoice.businessName || name || "Your business";
  const monogram = (invoice.monogram || initialsOf(invoice.businessName || name) || "TF").toUpperCase();
  const prefix = (invoice.prefix || "INV").toUpperCase();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/50 p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          Customize your invoice
        </span>
        <span className="text-[11px] text-gray-400">· issued only when a deal completes</span>
      </div>

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

      {/* Live preview */}
      <div className="rounded-xl border border-gray-200 bg-white p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white"
              style={{ backgroundColor: invoice.accent }}
            >
              {monogram}
            </span>
            <span className="text-[14px] font-semibold text-gray-900">{businessName}</span>
          </div>
          <span className="text-[11px] font-mono text-gray-500">{prefix}-10293</span>
        </div>
        <div className="mt-2 h-px" style={{ backgroundColor: invoice.accent, opacity: 0.4 }} />
        <div className="mt-2 text-[11px] text-gray-500">
          {invoice.footer || "Your contact line appears here"}
        </div>
      </div>
    </div>
  );
}

function SubmitRow({ busy, label }: { busy: boolean; label: string }) {
  return (
    <div className="mt-1">
      {busy ? (
        <div className="inline-flex items-center gap-2 text-[#059669] text-[14px] font-medium py-2.5">
          <Loader2 size={16} className="animate-spin" /> One moment…
        </div>
      ) : (
        <PrimaryButton type="submit" full>
          {label}
        </PrimaryButton>
      )}
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] px-3.5 py-2.5">
      {children}
    </div>
  );
}

function initialsOf(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}
