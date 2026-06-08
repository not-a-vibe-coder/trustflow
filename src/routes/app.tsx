import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  CopyCheck,
  Cpu,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Landmark,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  PenLine,
  Play,
  QrCode,
  RotateCcw,
  ScanLine,
  ScanText,
  Settings2,
  Sparkles,
  Tag,
  Truck,
  Upload,
  UserPlus,
  Users,
  Wallet,
  Wand2,
  X,
} from "lucide-react";
import { Avatar, Badge, PrimaryButton, Wordmark } from "@/components/trustflow/ui";
import {
  AMOUNT,
  BUYER,
  DEMO_VAULT_INFO,
  type AppState,
  type EventKind,
  type Vault,
  clearSession,
  loadState,
  makeInvoiceNo,
  naira,
  newVault,
  nextEventId,
  saveState,
} from "@/lib/trustflow";

const ACCENT = "#34D399";

export const Route = createFileRoute("/app")({
  component: AppPage,
  head: () => ({
    meta: [{ title: "TrustFlow AI — Your vaults" }],
  }),
});

type View = "dashboard" | "vault";
type WizardStep = null | "method" | "upload" | "extracting" | "review";

function AppPage() {
  const navigate = useNavigate();

  const [state, setState] = useState<AppState | null>(null); // null until hydrated
  const [view, setView] = useState<View>("dashboard");
  const [wizard, setWizard] = useState<WizardStep>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // Transient money-movement animation: "deposit" fills the vault, "release" drains it.
  const [anim, setAnim] = useState<null | "deposit" | "release">(null);
  const [animBalance, setAnimBalance] = useState(0);

  const imageUrlRef = useRef<string | null>(null);
  imageUrlRef.current = imageUrl;

  // ---- hydrate from localStorage (client only) ----
  useEffect(() => {
    const s = loadState();
    setState(s);
    if (s.vault) setView("vault");
  }, []);

  // ---- persist + auth guard ----
  useEffect(() => {
    if (!state) return;
    saveState(state);
    if (!state.user) navigate({ to: "/login" });
  }, [state, navigate]);

  // ---- money-movement counter animation (deposit fills, release drains) ----
  useEffect(() => {
    if (!anim) return;
    const from = anim === "deposit" ? 0 : AMOUNT;
    const to = anim === "deposit" ? AMOUNT : 0;
    let raf = 0;
    const dur = anim === "deposit" ? 2200 : 1900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimBalance(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      setAnimBalance(to);
      setState((s) => {
        if (!s || !s.vault) return s;
        const v = s.vault;
        const event = (text: string, kind: EventKind) => ({
          id: nextEventId(),
          text,
          kind,
          at: Date.now(),
        });
        if (anim === "deposit") {
          return {
            ...s,
            vault: {
              ...v,
              balance: AMOUNT,
              status: "funded",
              events: [event(`${naira(AMOUNT)} secured in escrow ✓`, "funded"), ...v.events],
            },
          };
        }
        // release complete — funds have left the vault and landed in the seller's wallet (OPay)
        const invoiceNo = makeInvoiceNo();
        return {
          ...s,
          walletBalance: (s.walletBalance ?? 0) + AMOUNT,
          vault: {
            ...v,
            balance: 0,
            payout: AMOUNT,
            status: "released",
            invoiceNo,
            events: [
              event(`Invoice ${invoiceNo} auto-generated`, "info"),
              event(`${naira(AMOUNT)} released to your OPay account ✓`, "released"),
              ...v.events,
            ],
          },
        };
      });
      setAnim(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim]);

  // ---- clean up object URL on unmount ----
  useEffect(
    () => () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    },
    [],
  );

  // ---- vault mutation helpers ----
  const updateVault = (fn: (v: Vault) => Vault) =>
    setState((s) => (s && s.vault ? { ...s, vault: fn(s.vault) } : s));

  const addEvent = (text: string, kind: EventKind = "info") =>
    updateVault((v) => ({
      ...v,
      events: [{ id: nextEventId(), text, kind, at: Date.now() }, ...v.events],
    }));

  // ---- actions ----
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl((old) => {
      if (old && old !== "sample") URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  const createVault = () => {
    setState((s) => (s ? { ...s, vault: newVault() } : s));
    setWizard(null);
    setView("vault");
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard may be blocked — demo continues */
    }
    if (!state?.vault?.copied) addEvent("Vault code copied to clipboard", "info");
    updateVault((v) => ({ ...v, copied: true }));
  };

  // Presenter control: the buyer (on their own device, in reality) asks to join.
  const buyerRequestJoin = () => {
    updateVault((v) => ({ ...v, joinRequest: true }));
    addEvent(`${BUYER.name} requested to join this vault`, "request");
  };

  // Real seller action from the notification.
  const approveJoin = () => {
    updateVault((v) => ({
      ...v,
      joinRequest: false,
      status: "buyerJoined",
      buyer: { name: BUYER.name },
    }));
    addEvent(`${BUYER.name} joined the vault`, "join");
  };

  const declineJoin = () => {
    updateVault((v) => ({ ...v, joinRequest: false }));
    addEvent(`${BUYER.name}'s join request was declined`, "info");
  };

  // Presenter control: the buyer funds the vault.
  const buyerDeposit = () => {
    if (state?.vault?.status !== "buyerJoined") return;
    addEvent(`${BUYER.name} is depositing ${naira(AMOUNT)}…`, "deposit");
    setAnimBalance(0);
    setAnim("deposit");
  };

  // Real seller action: the item has been handed over.
  const markDelivered = () => {
    if (state?.vault?.status !== "funded") return;
    updateVault((v) => ({ ...v, status: "delivered" }));
    addEvent(`You marked the ${DEMO_VAULT_INFO.item} as delivered`, "delivered");
  };

  // Presenter control: the buyer reveals their one-time release QR.
  const buyerShowQr = () => {
    if (state?.vault?.status !== "delivered" || state.vault.releaseQr) return;
    updateVault((v) => ({ ...v, releaseQr: true }));
    addEvent(`${BUYER.name} generated a one-time release QR`, "info");
  };

  // Real seller action: scan the buyer's QR to release the funds.
  const releaseFunds = () => {
    if (state?.vault?.status !== "delivered" || !state.vault.releaseQr) return;
    addEvent("Scanned buyer's QR — verifying and releasing funds…", "released");
    setAnimBalance(AMOUNT);
    setAnim("release");
  };

  const resetDemo = () => {
    setAnim(null);
    setAnimBalance(0);
    setState((s) => (s ? { ...s, vault: newVault(), walletBalance: 0 } : s));
    setView("vault");
  };

  const logout = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  // ---- render ----
  if (!state || !state.user) {
    return (
      <main className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-gray-400" />
      </main>
    );
  }

  const { user, vault } = state;
  const displayBalance = anim ? animBalance : (vault?.balance ?? 0);
  const displayPayout = anim === "release" ? AMOUNT - animBalance : (vault?.payout ?? 0);
  // Seller's wallet. During a release it ticks up in lockstep as the escrow drains.
  const walletBalance = state.walletBalance ?? 0;
  const displayWallet = anim === "release" ? walletBalance + (AMOUNT - animBalance) : walletBalance;

  return (
    <main className="min-h-screen bg-[#EFEFEF]">
      {/* App header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wordmark />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
              <Sparkles size={11} className="text-[#059669]" /> Demo
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-full bg-gray-900 text-white px-3 py-1.5"
              style={anim === "release" ? { animation: "ring 1.4s ease-out infinite" } : undefined}
              title="Your TrustFlow balance — settled to OPay"
            >
              <Wallet size={14} className="text-[#34D399]" />
              <span className="text-[13px] font-semibold tabular-nums">{naira(displayWallet)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Avatar name={user.name} accent />
              <div className="leading-tight">
                <div className="text-[13px] font-medium text-gray-900">{user.name}</div>
                <div className="text-[11px] text-gray-500">{user.email}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-[13px] text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-5 sm:px-8 py-8 sm:py-10">
        {view === "dashboard" && (
          <Dashboard
            user={user}
            vault={vault}
            balance={displayWallet}
            onOpenVault={() => setWizard("method")}
            onOpenExisting={() => setView("vault")}
          />
        )}

        {view === "vault" && vault && (
          <VaultLive
            sellerName={user.name}
            vault={vault}
            displayBalance={displayBalance}
            displayPayout={displayPayout}
            anim={anim}
            onCopy={() => copyCode(vault.code)}
            onBack={() => setView("dashboard")}
            onMarkDelivered={markDelivered}
            onReleaseFunds={releaseFunds}
          />
        )}
      </div>

      {/* Open-vault wizard */}
      {wizard && (
        <OpenVaultWizard
          step={wizard}
          imageUrl={imageUrl}
          onClose={() => setWizard(null)}
          onPickAi={() => setWizard("upload")}
          onPickImage={onPickImage}
          onUseSample={() => setImageUrl("sample")}
          onExtract={() => {
            setWizard("extracting");
            setTimeout(() => setWizard("review"), 1900);
          }}
          onBackToUpload={() => setWizard("upload")}
          onCreate={createVault}
        />
      )}

      {/* Buyer join request (real seller action) */}
      {view === "vault" && vault?.joinRequest && (
        <JoinRequestToast onApprove={approveJoin} onDecline={declineJoin} />
      )}

      {/* Presenter controls — drive the buyer's side manually */}
      {view === "vault" && vault && (
        <PresenterControls
          vault={vault}
          anim={anim}
          onBuyerJoin={buyerRequestJoin}
          onBuyerDeposit={buyerDeposit}
          onBuyerShowQr={buyerShowQr}
          onReset={resetDemo}
        />
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes slideIn { from { opacity: 0; transform: translateX(24px);} to { opacity: 1; transform: translateX(0);} }
        @keyframes pop { 0% { transform: scale(.92); opacity: 0;} 60% { transform: scale(1.02);} 100% { transform: scale(1); opacity: 1;} }
        @keyframes ring { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,.45);} 100% { box-shadow: 0 0 0 14px rgba(52,211,153,0);} }
      `}</style>
    </main>
  );
}

// ---------- dashboard ----------

function Dashboard({
  user,
  vault,
  balance,
  onOpenVault,
  onOpenExisting,
}: {
  user: { name: string };
  vault: Vault | null;
  balance: number;
  onOpenVault: () => void;
  onOpenExisting: () => void;
}) {
  const firstName = user.name.split(" ")[0];
  return (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <Badge>Your vaults</Badge>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-medium text-gray-900 tracking-[-0.02em]">
            Welcome, {firstName} 👋
          </h1>
          <p className="mt-2 text-[15px] text-gray-600">
            {vault
              ? "Here are the vaults you've opened."
              : "Open a vault to protect your next deal."}
          </p>
        </div>
        <button
          onClick={onOpenVault}
          className="group bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full pl-6 pr-2 py-2.5 inline-flex items-center gap-3 transition-colors self-start"
        >
          <span>Open vault</span>
          <span className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45">
            <Wallet size={14} className="text-[#34D399]" />
          </span>
        </button>
      </div>

      {/* Seller wallet — earnings settled from completed vaults, separate from any escrow in progress */}
      <div className="mt-8 rounded-3xl bg-white p-5 sm:p-6 shadow-[0_2px_24px_rgba(0,0,0,0.06)] flex items-center gap-4">
        <span className="w-12 h-12 rounded-2xl bg-[#34D399]/15 flex items-center justify-center shrink-0">
          <Wallet size={22} className="text-[#059669]" />
        </span>
        <div className="min-w-0">
          <div className="text-[12px] text-gray-500 uppercase tracking-wider">Available balance</div>
          <div className="text-[28px] sm:text-[32px] font-medium text-gray-900 tabular-nums tracking-tight leading-tight">
            {naira(balance)}
          </div>
          <div className="text-[12px] text-gray-500 mt-0.5 inline-flex items-center gap-1.5">
            <Landmark size={12} className="text-[#059669]" /> Settles instantly to OPay •••• 7788
          </div>
        </div>
        <span className="ml-auto shrink-0 hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[#059669] bg-[#34D399]/15 rounded-full px-2.5 py-1">
          <BadgeCheck size={12} /> Instant payout
        </span>
      </div>

      {vault ? (
        <button
          onClick={onOpenExisting}
          className="mt-8 w-full text-left rounded-3xl bg-white p-5 sm:p-6 shadow-[0_2px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_32px_rgba(0,0,0,0.10)] transition-shadow flex items-center gap-4"
        >
          <span className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shrink-0">
            <Laptop size={22} className="text-[#34D399]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium text-gray-900">{vault.info.item}</span>
              <StatusPill status={vault.status} />
            </div>
            <div className="text-[13px] text-gray-500 mt-0.5">
              {vault.code} · {naira(vault.info.price)} · delivery {vault.info.delivery}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[12px] text-gray-400">In vault</div>
            <div className="text-[15px] font-semibold text-gray-900 tabular-nums">
              {naira(vault.balance)}
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </button>
      ) : (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-gray-300 bg-white/40 py-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
            <Lock size={26} className="text-gray-300" />
          </div>
          <p className="mt-5 text-[15px] font-medium text-gray-700">No active vaults</p>
          <p className="mt-1 text-[13px] text-gray-500 max-w-[36ch]">
            A vault holds the buyer's money safely until the item is delivered.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Vault["status"] }) {
  const map = {
    awaiting: { label: "Awaiting buyer", cls: "bg-gray-200 text-gray-700" },
    buyerJoined: { label: "Buyer joined", cls: "bg-gray-900 text-white" },
    funded: { label: "Funded", cls: "bg-[#34D399]/15 text-[#059669]" },
    delivered: { label: "Out for delivery", cls: "bg-gray-900 text-white" },
    released: { label: "Completed", cls: "bg-[#34D399] text-gray-900" },
  } as const;
  const s = map[status];
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  );
}

// ---------- open-vault wizard ----------

function OpenVaultWizard({
  step,
  imageUrl,
  onClose,
  onPickAi,
  onPickImage,
  onUseSample,
  onExtract,
  onBackToUpload,
  onCreate,
}: {
  step: Exclude<WizardStep, null>;
  imageUrl: string | null;
  onClose: () => void;
  onPickAi: () => void;
  onPickImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUseSample: () => void;
  onExtract: () => void;
  onBackToUpload: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-[680px] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ animation: "pop .35s ease both" }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {step === "method" && <MethodStep onPickAi={onPickAi} />}
        {step === "upload" && (
          <UploadStep
            imageUrl={imageUrl}
            onPickImage={onPickImage}
            onUseSample={onUseSample}
            onExtract={onExtract}
          />
        )}
        {step === "extracting" && <ExtractingStep />}
        {step === "review" && <ReviewStep onBack={onBackToUpload} onCreate={onCreate} />}
      </div>
    </div>
  );
}

function MethodStep({ onPickAi }: { onPickAi: () => void }) {
  return (
    <div>
      <Badge>Open vault</Badge>
      <h3 className="mt-4 text-[22px] font-medium text-gray-900">
        How do you want to set up this vault?
      </h3>
      <p className="text-[14px] text-gray-500 mt-1.5 mb-6">
        Choose how TrustFlow should capture the deal details.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={onPickAi}
          className="group text-left rounded-2xl border-2 border-[#34D399] bg-[#34D399]/[0.06] p-5 hover:bg-[#34D399]/[0.12] transition-colors relative"
        >
          <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-[#059669] bg-[#34D399]/20 rounded-full px-2 py-0.5">
            Recommended
          </span>
          <div className="w-11 h-11 rounded-xl bg-[#34D399] flex items-center justify-center">
            <Wand2 size={20} className="text-gray-900" />
          </div>
          <div className="mt-4 text-[16px] font-medium text-gray-900">Prepare with AI</div>
          <p className="mt-1.5 text-[13px] text-gray-600 leading-[1.5]">
            Upload your chat screenshot — Gemini reads it and fills in the item, price and delivery
            date.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#059669]">
            Continue{" "}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>

        <div className="text-left rounded-2xl border border-gray-200 p-5 opacity-90">
          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
            <PenLine size={20} className="text-gray-500" />
          </div>
          <div className="mt-4 text-[16px] font-medium text-gray-900">Prepare manually</div>
          <p className="mt-1.5 text-[13px] text-gray-600 leading-[1.5]">
            Type in the item, amount and delivery date yourself, field by field.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-400">
            Fill in by hand
          </span>
        </div>
      </div>
    </div>
  );
}

function UploadStep({
  imageUrl,
  onPickImage,
  onUseSample,
  onExtract,
}: {
  imageUrl: string | null;
  onPickImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUseSample: () => void;
  onExtract: () => void;
}) {
  const hasImage = Boolean(imageUrl);
  const isObjectUrl = imageUrl && imageUrl !== "sample";
  return (
    <div>
      <Badge>AI setup</Badge>
      <h3 className="mt-4 text-[22px] font-medium text-gray-900">Upload your chat</h3>
      <p className="text-[14px] text-gray-500 mt-1.5 mb-6">
        Drop a screenshot of the conversation where you agreed the deal.
      </p>

      <label
        className={`block rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
          hasImage
            ? "border-[#34D399] bg-[#34D399]/[0.05]"
            : "border-gray-300 hover:border-gray-400 bg-[#F7F7F7]"
        }`}
      >
        <input type="file" accept="image/*" className="sr-only" onChange={onPickImage} />
        {hasImage ? (
          <div className="p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
              {isObjectUrl ? (
                <img src={imageUrl!} alt="Uploaded chat" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-gray-900 flex items-center gap-1.5">
                <Check size={15} className="text-[#059669]" /> Screenshot ready
              </div>
              <div className="text-[13px] text-gray-500 truncate">
                chat-screenshot.png · tap to replace
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Upload size={22} className="text-[#059669]" />
            </div>
            <p className="mt-4 text-[14px] font-medium text-gray-800">Click to upload an image</p>
            <p className="mt-1 text-[12px] text-gray-500">PNG or JPG · any chat screenshot</p>
          </div>
        )}
      </label>

      {!hasImage && (
        <button
          onClick={onUseSample}
          className="mt-3 text-[12px] text-gray-500 hover:text-gray-800 underline underline-offset-2"
        >
          No image handy? Use a sample screenshot
        </button>
      )}

      <div className="mt-7">
        <PrimaryButton onClick={onExtract} disabled={!hasImage}>
          <span className="inline-flex items-center gap-2">
            <ScanText size={15} /> Extract with Gemini
          </span>
        </PrimaryButton>
      </div>
    </div>
  );
}

function ExtractingStep() {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center">
        <ScanText size={26} className="text-[#34D399]" />
      </div>
      <div className="mt-6 flex items-center gap-2.5 text-[15px] text-gray-700 font-medium">
        <Loader2 size={18} className="animate-spin text-[#059669]" />
        Gemini is reading your chat…
      </div>
      <p className="mt-2 text-[13px] text-gray-500 max-w-[40ch]">
        Extracting the item, agreed price and delivery date from the screenshot.
      </p>
    </div>
  );
}

function ReviewStep({ onBack, onCreate }: { onBack: () => void; onCreate: () => void }) {
  const rows: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    value: string;
  }[] = [
    { icon: Tag, label: "Category", value: DEMO_VAULT_INFO.category },
    { icon: Wallet, label: "Agreed price", value: naira(DEMO_VAULT_INFO.price) },
    { icon: Calendar, label: "Delivery day", value: DEMO_VAULT_INFO.delivery },
    { icon: Laptop, label: "Item", value: DEMO_VAULT_INFO.item },
    { icon: Cpu, label: "Memory", value: DEMO_VAULT_INFO.ram },
    { icon: HardDrive, label: "Storage", value: DEMO_VAULT_INFO.storage },
  ];
  return (
    <div>
      <div className="flex items-center justify-between">
        <Badge>Review</Badge>
        <span className="inline-flex items-center gap-1 text-[11px] text-[#059669] bg-[#34D399]/15 rounded-full px-2 py-0.5">
          <Sparkles size={11} /> {DEMO_VAULT_INFO.confidence}% confident
        </span>
      </div>
      <h3 className="mt-4 text-[22px] font-medium text-gray-900">Here's what AI extracted</h3>
      <p className="text-[14px] text-gray-500 mt-1.5 mb-6">
        Check the details, then create the vault — the buyer funds it against exactly these terms.
      </p>

      <dl className="grid sm:grid-cols-2 gap-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 p-3.5 flex items-start gap-3"
          >
            <span className="w-8 h-8 rounded-lg bg-[#34D399]/15 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-[#059669]" />
            </span>
            <div className="min-w-0">
              <dt className="text-[11px] text-gray-500 uppercase tracking-wider">{label}</dt>
              <dd className="text-[14px] text-gray-900 font-medium truncate">{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="mt-5 rounded-xl bg-gray-900 text-white p-4 flex items-center gap-3">
        <Lock size={18} className="text-[#34D399] shrink-0" />
        <p className="text-[13px] leading-[1.5]">
          The vault will hold <b className="text-[#34D399]">{naira(DEMO_VAULT_INFO.price)}</b> until
          the {DEMO_VAULT_INFO.item} is delivered by {DEMO_VAULT_INFO.delivery}.
        </p>
      </div>

      <div className="mt-7 flex items-center gap-3">
        <PrimaryButton onClick={onCreate}>Create vault</PrimaryButton>
        <button
          onClick={onBack}
          className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    </div>
  );
}

// ---------- live vault ----------

function VaultLive({
  sellerName,
  vault,
  displayBalance,
  displayPayout,
  anim,
  onCopy,
  onBack,
  onMarkDelivered,
  onReleaseFunds,
}: {
  sellerName: string;
  vault: Vault;
  displayBalance: number;
  displayPayout: number;
  anim: null | "deposit" | "release";
  onCopy: () => void;
  onBack: () => void;
  onMarkDelivered: () => void;
  onReleaseFunds: () => void;
}) {
  const pct = Math.min(100, (displayBalance / AMOUNT) * 100);
  const depositing = anim === "deposit";
  const releasing = anim === "release";
  const buyerJoined = vault.status !== "awaiting";
  const paid =
    vault.status === "funded" || vault.status === "delivered" || vault.status === "released";
  const isFunded = vault.status === "funded";
  const isDelivered = vault.status === "delivered";
  const isReleased = vault.status === "released";
  const sellerFirst = sellerName.split(" ")[0];

  return (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <button
        onClick={onBack}
        className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1.5"
      >
        <ArrowLeft size={14} /> All vaults
      </button>

      <div className="mt-3 flex items-center justify-between gap-4">
        <h1 className="text-[26px] sm:text-[30px] font-medium text-gray-900 tracking-[-0.02em]">
          {vault.info.item}
        </h1>
        <StatusPill status={vault.status} />
      </div>
      <p className="mt-1 text-[14px] text-gray-600">
        Share the code, approve the buyer, then release the funds on delivery — every step tracked
        here in real time.
      </p>

      <div className="mt-6 grid lg:grid-cols-[1.2fr_1fr] gap-5 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Escrow balance */}
          <div className="rounded-3xl bg-gray-900 text-white p-6 sm:p-7 relative overflow-hidden">
            <div
              className="pointer-events-none absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle, #34D399 0%, transparent 70%)" }}
            />
            <div className="relative flex items-center justify-between">
              <span className="text-[12px] text-gray-400 uppercase tracking-wider">
                Escrow vault · {vault.info.item}
              </span>
              <span className="text-[11px] text-[#34D399] flex items-center gap-1">
                <Lock size={12} /> Secured
              </span>
            </div>
            <div className="relative mt-5 flex items-end justify-between">
              <div>
                <div className="text-[12px] text-gray-400">Balance in vault</div>
                <div className="text-[36px] sm:text-[40px] font-medium tracking-tight tabular-nums">
                  {naira(displayBalance)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-gray-400">
                  {isReleased || releasing ? "Paid out" : "Target"}
                </div>
                <div className="text-[16px] font-medium text-gray-300 tabular-nums">
                  {isReleased || releasing ? naira(displayPayout) : naira(AMOUNT)}
                </div>
              </div>
            </div>
            <div className="relative mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{ width: `${pct}%`, backgroundColor: ACCENT }}
              />
            </div>
            <div className="relative mt-3 text-[13px]">
              {isReleased ? (
                <span className="inline-flex items-center gap-1.5 text-[#34D399] font-medium">
                  <BadgeCheck size={16} /> Released — vault emptied to your OPay account
                </span>
              ) : releasing ? (
                <span className="inline-flex items-center gap-1.5 text-gray-300">
                  <Loader2 size={14} className="animate-spin" /> Releasing {naira(displayPayout)} to{" "}
                  {sellerFirst}'s OPay…
                </span>
              ) : isDelivered ? (
                <span className="inline-flex items-center gap-1.5 text-gray-300">
                  <Truck size={14} className="text-[#34D399]" /> Delivered — scan the buyer's QR to
                  release
                </span>
              ) : isFunded ? (
                <span className="inline-flex items-center gap-1.5 text-[#34D399] font-medium">
                  <BadgeCheck size={16} /> Fully funded — held safely until delivery
                </span>
              ) : depositing ? (
                <span className="inline-flex items-center gap-1.5 text-gray-300">
                  <Loader2 size={14} className="animate-spin" /> {BUYER.name} is depositing…
                </span>
              ) : buyerJoined ? (
                <span className="inline-flex items-center gap-1.5 text-gray-300">
                  <Wallet size={14} /> Waiting for buyer to deposit
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-gray-400">
                  <Wallet size={14} /> Empty — buyer hasn't joined yet
                </span>
              )}
            </div>
          </div>

          {/* Delivery & release */}
          {(isFunded || isDelivered || isReleased) && (
            <div
              className="rounded-3xl bg-white p-6 shadow-[0_2px_24px_rgba(0,0,0,0.06)]"
              style={{ animation: "fadeUp .4s ease both" }}
            >
              <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Truck size={13} /> Delivery &amp; release
              </div>

              {isFunded && (
                <div>
                  <p className="text-[13px] text-gray-600 leading-[1.5] mb-4">
                    Hand the {vault.info.item} to {BUYER.name}, then mark it delivered. This opens
                    the one-time QR release — money only moves when you scan it.
                  </p>
                  <button
                    onClick={onMarkDelivered}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-[14px] font-medium rounded-full px-5 py-2.5 inline-flex items-center gap-2 transition-colors"
                  >
                    <Truck size={15} className="text-[#34D399]" /> Mark as delivered
                  </button>
                </div>
              )}

              {isDelivered && !vault.releaseQr && (
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 bg-[#F7F7F7] flex items-center justify-center shrink-0">
                    <QrCode size={30} className="text-gray-300" />
                  </div>
                  <div className="text-[13px] text-gray-600 leading-[1.5]">
                    <div className="inline-flex items-center gap-1.5 text-gray-500 font-medium">
                      <Loader2 size={13} className="animate-spin" /> Waiting for {BUYER.name}'s
                      release QR…
                    </div>
                    <p className="mt-1.5">
                      On delivery, {BUYER.name} taps <b>Release payment</b> to reveal a one-time QR.
                    </p>
                  </div>
                </div>
              )}

              {isDelivered && vault.releaseQr && !releasing && (
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="rounded-2xl border border-gray-200 p-3 bg-white shrink-0">
                    <FakeQR />
                    <div className="text-center text-[11px] text-gray-500 mt-1.5">
                      {BUYER.name}'s QR · expires 60s
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] text-gray-600 leading-[1.5] mb-4">
                      Scan {BUYER.name}'s one-time code to release{" "}
                      <b className="text-gray-900">{naira(AMOUNT)}</b> from the vault straight to
                      your OPay account.
                    </p>
                    <button
                      onClick={onReleaseFunds}
                      className="bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full px-5 py-2.5 inline-flex items-center gap-2 transition-colors"
                    >
                      <ScanLine size={16} /> Scan QR &amp; release {naira(AMOUNT)}
                    </button>
                  </div>
                </div>
              )}

              {releasing && (
                <div className="flex items-center gap-2.5 text-[14px] text-gray-700 font-medium py-3">
                  <Loader2 size={18} className="animate-spin text-[#059669]" />
                  Verifying QR &amp; moving funds to your OPay…
                </div>
              )}

              {isReleased && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl bg-[#34D399]/10 border border-[#34D399]/30 p-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-[#34D399] flex items-center justify-center shrink-0">
                      <Landmark size={18} className="text-gray-900" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-gray-900 tabular-nums">
                        {naira(AMOUNT)} paid out
                      </div>
                      <div className="text-[12px] text-gray-600">
                        OPay · {sellerName} · ****
                        {vault.code.slice(-4)}
                      </div>
                    </div>
                    <BadgeCheck size={20} className="text-[#059669] ml-auto shrink-0" />
                  </div>
                  <div className="rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                    <FileText size={16} className="text-[#059669] shrink-0" />
                    <span className="text-[13px] text-gray-700">
                      Invoice <b className="text-gray-900">{vault.invoiceNo}</b> auto-generated ·
                      paid
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vault code */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
            <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
              Vault code
            </div>
            <p className="text-[13px] text-gray-500 mt-1">
              Anyone with this code can ask to join — you approve every request.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 rounded-xl border border-gray-200 bg-[#F7F7F7] px-4 py-3 font-mono text-[18px] sm:text-[20px] tracking-[0.12em] text-gray-900">
                {vault.code}
              </div>
              <button
                onClick={onCopy}
                className={`shrink-0 rounded-xl px-4 py-3 text-[14px] font-medium inline-flex items-center gap-2 transition-colors ${
                  vault.copied
                    ? "bg-[#34D399]/15 text-[#059669]"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
                style={!vault.copied ? { animation: "ring 1.6s ease-out infinite" } : undefined}
              >
                {vault.copied ? <CopyCheck size={16} /> : <Copy size={16} />}
                {vault.copied ? "Copied" : "Copy code"}
              </button>
            </div>
            {vault.copied && !buyerJoined && (
              <p className="mt-3 text-[12px] text-gray-500 inline-flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" /> Shared — waiting for a buyer to join…
              </p>
            )}
          </div>

          {/* Participants */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
            <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Users size={13} /> Participants
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={sellerName} accent />
                  <div>
                    <div className="text-[14px] font-medium text-gray-900">{sellerName}</div>
                    <div className="text-[12px] text-gray-500">Seller · vault owner</div>
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#059669]">
                  You
                </span>
              </div>

              {vault.buyer ? (
                <div
                  className="flex items-center justify-between"
                  style={{ animation: "fadeUp .4s ease both" }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={vault.buyer.name} />
                    <div>
                      <div className="text-[14px] font-medium text-gray-900">
                        {vault.buyer.name}
                      </div>
                      <div className="text-[12px] text-gray-500">Buyer</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {paid ? "Paid" : "Joined"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-400">
                  <span className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <UserPlus size={15} />
                  </span>
                  <div className="text-[13px]">Waiting for a buyer…</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column — activity */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_2px_24px_rgba(0,0,0,0.06)] lg:sticky lg:top-24">
          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Bell size={13} /> Activity
          </div>
          <ol className="flex flex-col gap-0">
            {vault.events.map((ev, i) => (
              <li
                key={ev.id}
                className="flex gap-3"
                style={i === 0 ? { animation: "fadeUp .35s ease both" } : undefined}
              >
                <div className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${dotClass(ev.kind)}`} />
                  {i < vault.events.length - 1 && <span className="w-px flex-1 bg-gray-200 my-1" />}
                </div>
                <div
                  className={`pb-4 text-[13px] ${i === 0 ? "text-gray-900 font-medium" : "text-gray-600"}`}
                >
                  {ev.text}
                </div>
              </li>
            ))}
          </ol>

          {(isFunded || isDelivered) && (
            <div className="mt-2 pt-5 border-t border-gray-100">
              <div className="rounded-2xl bg-[#34D399]/10 border border-[#34D399]/30 p-4 flex items-start gap-3">
                <BadgeCheck size={20} className="text-[#059669] mt-0.5 shrink-0" />
                <div className="text-[13px] text-gray-800 leading-[1.5]">
                  Deal protected. {naira(AMOUNT)} is locked safely — it releases to you the moment
                  you scan {BUYER.name}'s QR on delivery.
                </div>
              </div>
            </div>
          )}

          {isReleased && (
            <div className="mt-2 pt-5 border-t border-gray-100">
              <div className="rounded-2xl bg-gray-900 text-white p-4 flex items-start gap-3">
                <BadgeCheck size={20} className="text-[#34D399] mt-0.5 shrink-0" />
                <div className="text-[13px] leading-[1.55]">
                  Done. {naira(AMOUNT)} moved from the vault to your OPay account on confirmed
                  delivery — <span className="text-[#34D399]">buyer protected, seller paid</span>,
                  and fully recorded.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function dotClass(kind: EventKind) {
  switch (kind) {
    case "funded":
    case "released":
      return "bg-[#34D399]";
    case "deposit":
      return "bg-[#059669]";
    case "join":
    case "delivered":
      return "bg-gray-900";
    case "request":
      return "bg-amber-400";
    default:
      return "bg-gray-300";
  }
}

// Deterministic pseudo-QR — decorative, stands in for the buyer's one-time release code.
function FakeQR() {
  const N = 21;
  const isFinder = (x: number, y: number) => {
    const inBox = (bx: number, by: number) => x >= bx && x < bx + 7 && y >= by && y < by + 7;
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
      const on = isFinder(x, y) ? finderOn(x, y) : (x * 13 + y * 7 + x * y * 3) % 5 < 2;
      if (on)
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#0b1220" />);
    }
  }
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="w-28 h-28" shapeRendering="crispEdges">
      <rect x={0} y={0} width={N} height={N} fill="white" />
      {cells}
    </svg>
  );
}

// ---------- buyer join request (real seller action) ----------

function JoinRequestToast({
  onApprove,
  onDecline,
}: {
  onApprove: () => void;
  onDecline: () => void;
}) {
  return (
    <div
      className="fixed z-50 right-4 top-20 sm:right-6 w-[calc(100%-2rem)] sm:w-[360px]"
      style={{ animation: "slideIn .4s ease both" }}
    >
      <div className="rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center gap-2 border-b border-gray-100">
          <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
            <Bell size={14} className="text-amber-600" />
          </span>
          <span className="text-[13px] font-semibold text-gray-900">Join request</span>
          <span className="ml-auto text-[11px] text-gray-400">now</span>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={BUYER.name} />
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-gray-900">{BUYER.name}</div>
              <div className="text-[12px] text-gray-500">wants to join your vault as the buyer</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={onApprove}
              className="flex-1 bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full py-2.5 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Check size={15} /> Approve
            </button>
            <button
              onClick={onDecline}
              className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[14px] font-medium rounded-full py-2.5 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- presenter controls ----------

function PresenterControls({
  vault,
  anim,
  onBuyerJoin,
  onBuyerDeposit,
  onBuyerShowQr,
  onReset,
}: {
  vault: Vault;
  anim: null | "deposit" | "release";
  onBuyerJoin: () => void;
  onBuyerDeposit: () => void;
  onBuyerShowQr: () => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(true);

  const reachedFunded =
    vault.status === "funded" || vault.status === "delivered" || vault.status === "released";
  const canJoin = vault.status === "awaiting" && !vault.joinRequest;
  const canDeposit = vault.status === "buyerJoined" && anim !== "deposit";
  const canShowQr = vault.status === "delivered" && !vault.releaseQr;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 left-4 bottom-4 bg-gray-900 text-white rounded-full px-4 py-2.5 text-[13px] font-medium shadow-xl inline-flex items-center gap-2"
      >
        <Settings2 size={15} className="text-[#34D399]" /> Presenter controls
      </button>
    );
  }

  return (
    <div className="fixed z-40 left-4 bottom-4 w-[calc(100%-2rem)] sm:w-[300px]">
      <div className="rounded-2xl bg-gray-900 text-white shadow-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10">
          <Settings2 size={15} className="text-[#34D399]" />
          <span className="text-[13px] font-semibold">Presenter controls</span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto text-gray-400 hover:text-white"
            aria-label="Hide"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-3 flex flex-col gap-2">
          <p className="text-[11px] text-gray-400 px-1 leading-[1.4]">
            Drive the buyer's side — these stand in for actions Emeka would take on his own device.
          </p>

          <ControlButton
            label="Buyer requests to join"
            note="Step 1 · after you share the code"
            icon={UserPlus}
            disabled={!canJoin}
            done={vault.status !== "awaiting" || vault.joinRequest}
            onClick={onBuyerJoin}
          />
          <ControlButton
            label={`Buyer deposits ${naira(AMOUNT)}`}
            note="Step 2 · after you approve"
            icon={Wallet}
            disabled={!canDeposit}
            done={reachedFunded}
            onClick={onBuyerDeposit}
          />
          <ControlButton
            label="Buyer shows release QR"
            note="Step 3 · after you mark delivered"
            icon={QrCode}
            disabled={!canShowQr}
            done={vault.status === "released" || (vault.status === "delivered" && vault.releaseQr)}
            onClick={onBuyerShowQr}
          />

          <button
            onClick={onReset}
            className="mt-1 text-[12px] text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5 px-1"
          >
            <RotateCcw size={13} /> Reset this vault
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  note,
  icon: Icon,
  disabled,
  done,
  onClick,
}: {
  label: string;
  note: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  disabled: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors flex items-center gap-3 ${
        done
          ? "bg-[#34D399]/15 text-[#34D399]"
          : disabled
            ? "bg-white/5 text-gray-500 cursor-not-allowed"
            : "bg-[#34D399] text-gray-900 hover:bg-[#10B981]"
      }`}
    >
      <span className="shrink-0">
        {done ? <Check size={16} /> : disabled ? <Icon size={16} /> : <Play size={15} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium leading-tight">{label}</span>
        <span
          className={`block text-[11px] leading-tight ${done ? "text-[#34D399]/80" : disabled ? "text-gray-500" : "text-gray-800/70"}`}
        >
          {note}
        </span>
      </span>
    </button>
  );
}
