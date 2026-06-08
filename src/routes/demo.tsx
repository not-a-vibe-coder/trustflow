import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardList,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Package,
  QrCode,
  ScanText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  User,
} from "lucide-react";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
  head: () => ({
    meta: [
      { title: "TrustFlow AI — Live demo" },
      { name: "description", content: "Walk through a protected transaction: paste chat, extract with AI, lock funds, QR delivery, release, auto-record." },
    ],
  }),
});

const ACCENT = "#34D399";

const STEPS = [
  { label: "Paste chat", icon: ClipboardList },
  { label: "AI extracts", icon: ScanText },
  { label: "Lock funds", icon: Lock },
  { label: "QR delivery", icon: QrCode },
  { label: "Release", icon: BadgeCheck },
  { label: "Auto-record", icon: FileText },
] as const;

const CHAT = [
  { from: "buyer", text: "Hi! Is the ankara wrap dress still available?" },
  { from: "seller", text: "Yes ma, it's ₦35,000. Which size do you want?" },
  { from: "buyer", text: "Medium. Send your account number, I'll pay now now." },
  { from: "seller", text: "0123456789 GTBank, Chioma Stores." },
  { from: "buyer", text: "Done! I've sent the ₦35,000. See screenshot 📸" },
  { from: "buyer", text: "Please ship today o, I need it for an event 🙏🙏" },
] as const;

const EXTRACTED = {
  item: "Ankara wrap dress",
  size: "Medium",
  qty: 1,
  amount: "₦35,000",
  buyer: "Ada O.",
  channel: "WhatsApp",
  confidence: 98,
};

// ---------- small building blocks ----------

function Stage({
  badge,
  title,
  subtitle,
  children,
}: {
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] bg-gray-900 text-[#34D399] px-2.5 py-1 rounded-full">
          {badge}
        </span>
      </div>
      <h2 className="text-[24px] sm:text-[30px] font-medium text-gray-900 tracking-[-0.02em]">{title}</h2>
      <p className="mt-2 mb-7 text-[14px] sm:text-[15px] text-gray-600 max-w-[52ch] leading-[1.6]">{subtitle}</p>
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group bg-[#34D399] hover:bg-[#10B981] disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 text-[14px] font-medium rounded-full pl-6 pr-2 py-2.5 inline-flex items-center gap-3 transition-colors"
    >
      <span>{children}</span>
      <span className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45">
        <ArrowRight size={14} className="text-[#34D399]" />
      </span>
    </button>
  );
}

function FakeQR() {
  // Deterministic pseudo-QR — purely decorative for the demo.
  const N = 21;
  const isFinder = (x: number, y: number) => {
    const inBox = (bx: number, by: number) =>
      x >= bx && x < bx + 7 && y >= by && y < by + 7;
    return inBox(0, 0) || inBox(N - 7, 0) || inBox(0, N - 7);
  };
  const finderOn = (x: number, y: number) => {
    const local = (bx: number, by: number) => {
      const lx = x - bx;
      const ly = y - by;
      const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6;
      const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
      return ring || core;
    };
    if (x < 7 && y < 7) return local(0, 0);
    if (x >= N - 7 && y < 7) return local(N - 7, 0);
    if (x < 7 && y >= N - 7) return local(0, N - 7);
    return false;
  };
  const cells = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let on: boolean;
      if (isFinder(x, y)) on = finderOn(x, y);
      else on = ((x * 13 + y * 7 + x * y * 3) % 5) < 2;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} rx={0.15} fill="#0b1220" />);
    }
  }
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="w-40 h-40 sm:w-44 sm:h-44" shapeRendering="crispEdges">
      <rect x={0} y={0} width={N} height={N} fill="white" />
      {cells}
    </svg>
  );
}

// ---------- the demo ----------

function DemoPage() {
  const [step, setStep] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [released, setReleased] = useState(false);

  const reset = () => {
    setStep(0);
    setAnalyzing(false);
    setExtracted(false);
    setLocked(false);
    setScanned(false);
    setReleased(false);
  };

  const runAnalysis = () => {
    setStep(1);
    setAnalyzing(true);
    setExtracted(false);
    setTimeout(() => {
      setAnalyzing(false);
      setExtracted(true);
    }, 1700);
  };

  const lockFunds = () => {
    setLocked(true);
  };

  const scan = () => {
    setScanned(true);
  };

  const release = () => {
    setReleased(true);
    setTimeout(() => setStep(5), 1100);
  };

  return (
    <main className="min-h-screen bg-[#EFEFEF]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <ShieldCheck size={16} className="text-[#34D399]" />
            </span>
            <span className="text-[16px] font-semibold tracking-tight text-gray-900">
              TrustFlow<span className="text-[#059669]"> AI</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-gray-500 bg-gray-100 rounded-full px-3 py-1">
              <Sparkles size={12} className="text-[#059669]" /> Simulated demo
            </span>
            <a href="/" className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5">
              <ArrowLeft size={14} /> Home
            </a>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="mx-auto max-w-[1100px] px-5 sm:px-8 pt-8 sm:pt-12">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-1 sm:gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      active ? "bg-gray-900 text-[#34D399]" : done ? "bg-[#34D399] text-gray-900" : "bg-white text-gray-400 border border-gray-200"
                    }`}
                  >
                    {done ? <Check size={15} /> : <Icon size={15} />}
                  </div>
                  <span className={`text-[12px] hidden sm:inline ${active ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-4 sm:w-8 h-px ${done ? "bg-[#34D399]" : "bg-gray-300"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card */}
      <div className="mx-auto max-w-[1100px] px-5 sm:px-8 py-8 sm:py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_2px_24px_rgba(0,0,0,0.06)] min-h-[460px] flex flex-col">
          <div className="flex-1">
            {/* STEP 0 — Paste chat */}
            {step === 0 && (
              <Stage
                badge="Step 01"
                title="Seller pastes the chat"
                subtitle="No new app to learn. The seller drops the WhatsApp conversation straight into TrustFlow — exactly as it happened."
              >
                <div className="max-w-[460px] rounded-2xl bg-[#F5F5F5] p-4 sm:p-5 flex flex-col gap-2.5">
                  {CHAT.map((m, i) => (
                    <div key={i} className={`flex ${m.from === "seller" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] text-[13px] leading-[1.45] px-3.5 py-2 rounded-2xl ${
                          m.from === "seller"
                            ? "bg-[#34D399] text-gray-900 rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-7">
                  <PrimaryButton onClick={runAnalysis}>Analyze with Gemini</PrimaryButton>
                </div>
              </Stage>
            )}

            {/* STEP 1 — AI extracts */}
            {step === 1 && (
              <Stage
                badge="Step 02"
                title="Gemini reads the conversation"
                subtitle="The AI extracts the full order automatically and flags fraud signals a rushed human would miss."
              >
                {analyzing ? (
                  <div className="flex items-center gap-3 text-gray-600 text-[14px] py-10">
                    <Loader2 size={20} className="animate-spin text-[#059669]" />
                    Analyzing conversation, payment claim and behaviour…
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Extracted order */}
                    <div className="rounded-2xl border border-gray-200 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Extracted order</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#059669] bg-[#34D399]/15 rounded-full px-2 py-0.5">
                          <Sparkles size={11} /> {EXTRACTED.confidence}% confident
                        </span>
                      </div>
                      <dl className="flex flex-col gap-2.5 text-[14px]">
                        {[
                          ["Item", `${EXTRACTED.item} (${EXTRACTED.size})`],
                          ["Quantity", String(EXTRACTED.qty)],
                          ["Amount", EXTRACTED.amount],
                          ["Buyer", EXTRACTED.buyer],
                          ["Channel", EXTRACTED.channel],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                            <dt className="text-gray-500">{k}</dt>
                            <dd className="text-gray-900 font-medium">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {/* Fraud check */}
                    <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
                      <div className="flex items-center gap-2 mb-4 text-red-700">
                        <TriangleAlert size={16} />
                        <span className="text-[12px] font-semibold uppercase tracking-wider">Fraud signals</span>
                      </div>
                      <ul className="flex flex-col gap-3 text-[13px] text-gray-700">
                        <li className="flex gap-2.5">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          Payment screenshot attached but <b>not verified</b> against any bank inflow.
                        </li>
                        <li className="flex gap-2.5">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          Buyer is applying <b>time pressure</b> ("now now", "ship today") — a known scam pattern.
                        </li>
                      </ul>
                      <div className="mt-4 pt-4 border-t border-red-200 text-[13px] text-gray-900 font-medium flex items-start gap-2">
                        <ShieldCheck size={16} className="text-[#059669] shrink-0 mt-0.5" />
                        Recommendation: don't ship. Route the ₦35,000 through TrustPay escrow first.
                      </div>
                    </div>
                  </div>
                )}
                {extracted && (
                  <div className="mt-7">
                    <PrimaryButton onClick={() => setStep(2)}>Protect with TrustPay</PrimaryButton>
                  </div>
                )}
              </Stage>
            )}

            {/* STEP 2 — Lock funds */}
            {step === 2 && (
              <Stage
                badge="Step 03"
                title="Buyer locks the funds"
                subtitle="The buyer pays into a secure OPay-backed vault. The seller can see the money is real — fake screenshots become impossible."
              >
                <div className="max-w-[440px] rounded-2xl bg-gray-900 text-white p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-400 uppercase tracking-wider">OPay vault</span>
                    <span className="text-[11px] text-[#34D399] flex items-center gap-1">
                      <Lock size={12} /> Escrow
                    </span>
                  </div>
                  <div className="mt-4 text-[34px] font-medium tracking-tight">₦35,000</div>
                  <div className="text-[13px] text-gray-400">from {EXTRACTED.buyer} · for {EXTRACTED.item}</div>
                  <div className="mt-5 pt-5 border-t border-white/10">
                    {locked ? (
                      <div className="flex items-center gap-2 text-[#34D399] text-[14px] font-medium">
                        <BadgeCheck size={18} /> Funds secured — released only on confirmed delivery
                      </div>
                    ) : (
                      <button
                        onClick={lockFunds}
                        className="w-full bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full py-2.5 transition-colors"
                      >
                        Lock ₦35,000 in vault
                      </button>
                    )}
                  </div>
                </div>
                {locked && (
                  <div className="mt-7">
                    <PrimaryButton onClick={() => setStep(3)}>Continue to delivery</PrimaryButton>
                  </div>
                )}
              </Stage>
            )}

            {/* STEP 3 — QR delivery */}
            {step === 3 && (
              <Stage
                badge="Step 04"
                title="Delivery, confirmed by QR"
                subtitle="On hand-off, the buyer shows a one-time QR code. The seller scans it to prove the goods were delivered — no disputes, no stalling."
              >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="rounded-2xl border border-gray-200 p-4 bg-white">
                    <FakeQR />
                    <div className="text-center text-[12px] text-gray-500 mt-1">Buyer's delivery QR</div>
                  </div>
                  <div className="flex-1">
                    {scanned ? (
                      <div className="rounded-2xl bg-[#34D399]/15 border border-[#34D399]/40 p-5 flex items-start gap-3">
                        <BadgeCheck size={20} className="text-[#059669] mt-0.5 shrink-0" />
                        <div>
                          <div className="text-[15px] font-medium text-gray-900">Delivery confirmed</div>
                          <div className="text-[13px] text-gray-600 mt-1">Buyer received the {EXTRACTED.item}. The vault is now cleared to release.</div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={scan}
                        className="bg-gray-900 hover:bg-gray-800 text-white text-[14px] font-medium rounded-full px-6 py-2.5 inline-flex items-center gap-2 transition-colors"
                      >
                        <QrCode size={16} className="text-[#34D399]" /> Scan buyer's QR
                      </button>
                    )}
                  </div>
                </div>
                {scanned && (
                  <div className="mt-7">
                    <PrimaryButton onClick={() => setStep(4)}>Release the funds</PrimaryButton>
                  </div>
                )}
              </Stage>
            )}

            {/* STEP 4 — Release */}
            {step === 4 && (
              <Stage
                badge="Step 05"
                title="Money releases instantly"
                subtitle="With delivery confirmed, the vault pays out to the seller's OPay account in real time."
              >
                <div className="max-w-[440px] rounded-2xl border border-gray-200 p-6">
                  <div className="flex flex-col gap-2.5 text-[14px]">
                    <div className="flex justify-between"><span className="text-gray-500">Order total</span><span className="text-gray-900 font-medium">₦35,000</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">TrustFlow fee (1%)</span><span className="text-gray-900 font-medium">− ₦350</span></div>
                    <div className="flex justify-between pt-2.5 border-t border-gray-200"><span className="text-gray-900 font-medium">You receive</span><span className="text-[#059669] font-semibold">₦34,650</span></div>
                  </div>
                  <div className="mt-5">
                    {released ? (
                      <div className="flex items-center gap-2 text-[#059669] text-[14px] font-medium">
                        <Loader2 size={16} className="animate-spin" /> Releasing to your OPay…
                      </div>
                    ) : (
                      <button
                        onClick={release}
                        className="w-full bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full py-2.5 transition-colors"
                      >
                        Release ₦34,650 to seller
                      </button>
                    )}
                  </div>
                </div>
              </Stage>
            )}

            {/* STEP 5 — Auto-record */}
            {step === 5 && (
              <Stage
                badge="Step 06"
                title="Everything records itself"
                subtitle="The moment money moves, TrustFlow does the paperwork — so the seller's books are always up to date with zero manual work."
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { icon: FileText, title: "Invoice generated", body: "INV-00123 · ₦35,000 · paid", },
                    { icon: Package, title: "Inventory updated", body: `${EXTRACTED.item}: 12 → 11 in stock` },
                    { icon: User, title: "Customer saved", body: `${EXTRACTED.buyer} · repeat buyer profile` },
                  ].map(({ icon: Icon, title, body }) => (
                    <div key={title} className="rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#34D399]/15 flex items-center justify-center">
                        <Icon size={18} className="text-[#059669]" />
                      </div>
                      <div className="flex items-center gap-1.5 text-[15px] font-medium text-gray-900">
                        <Check size={15} className="text-[#059669]" /> {title}
                      </div>
                      <div className="text-[13px] text-gray-600">{body}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-7 rounded-2xl bg-gray-900 text-white p-5 flex items-start gap-3 max-w-[640px]">
                  <BadgeCheck size={20} className="text-[#34D399] mt-0.5 shrink-0" />
                  <div className="text-[14px] leading-[1.55]">
                    A transaction that started with a <span className="text-red-300">fake screenshot</span> ended with the
                    seller paid, the buyer protected, and a complete record — <span className="text-[#34D399]">zero fraud</span>.
                  </div>
                </div>

                <div className="mt-7 flex items-center gap-3">
                  <button
                    onClick={reset}
                    className="bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full px-6 py-2.5 transition-colors inline-flex items-center gap-2"
                  >
                    <MapPin size={15} /> Start a new transaction
                  </button>
                  <a href="/" className="text-[14px] text-gray-600 hover:text-gray-900 transition-colors">Back to home</a>
                </div>
              </Stage>
            )}
          </div>

          {/* Footer nav (back) */}
          {step > 0 && step < 5 && (
            <div className="mt-8 pt-5 border-t border-gray-100">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back a step
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[12px] text-gray-400 mt-5 max-w-[60ch] mx-auto">
          This is a front-end demo. AI extraction, payments and QR scanning are simulated to
          illustrate the TrustFlow flow end-to-end.
        </p>
      </div>
    </main>
  );
}
