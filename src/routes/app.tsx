import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
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
  LayoutDashboard,
  Loader2,
  Lock,
  PenLine,
  Play,
  Plus,
  QrCode,
  Receipt,
  RotateCcw,
  ScanLine,
  Settings2,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
  Upload,
  UserCircle,
  UserPlus,
  Users,
  Vault as VaultIcon,
  Wallet,
  X,
} from "lucide-react";
import { Avatar, Badge, PrimaryButton, TrustScoreBadge } from "@/components/trustflow/ui";
import { AppCanvas } from "@/components/trustflow/Glass";
import { TopNav, type NavItem } from "@/components/trustflow/AppNav";
import {
  ActivityFeed,
  MiniBarChart,
  SectionLabel,
  StatCard,
  TransactionTable,
  TrustRing,
} from "@/components/trustflow/widgets";
import { GeminiLogo } from "@/components/trustflow/GeminiLogo";
import {
  AMOUNT,
  BUYER,
  DEMO_VAULT_INFO,
  SELLER_NAME,
  WALLET_BASELINE,
  type AppState,
  type EventKind,
  type User,
  type Vault,
  applyTradeCompleted,
  bumpAccountTrust,
  clearSession,
  consumePendingView,
  demoActivity,
  demoMonthly,
  demoTransactions,
  getAccount,
  loadSharedState,
  loadState,
  makeInvoiceNo,
  naira,
  newVault,
  nextEventId,
  saveState,
  trustTier,
  VAULT_KEY,
} from "@/lib/trustflow";

const ACCENT = "#34D399";

export const Route = createFileRoute("/app")({
  component: AppPage,
  head: () => ({
    meta: [{ title: "TrustFlow AI — Your vaults" }],
  }),
});

type View = "dashboard" | "vaults" | "activity" | "vault";
type WizardStep = null | "method" | "upload" | "extracting" | "review";

type SessionProps = {
  state: AppState & { user: User };
  setState: React.Dispatch<React.SetStateAction<AppState | null>>;
};

/**
 * Shared session: hydrates the per-tab user + shared vault, persists changes,
 * guards auth, and keeps the vault synced across tabs (seller in one tab,
 * buyer in another) via the `storage` event.
 */
function useTrustflowSession() {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (!state) return;
    saveState(state);
    if (!state.user) navigate({ to: "/login" });
  }, [state, navigate]);

  // Cross-tab sync: when the shared vault changes in another tab, merge it in
  // and refresh this tab's user trust score from the accounts store.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== VAULT_KEY) return;
      setState((s) => {
        if (!s) return s;
        const shared = loadSharedState();
        const refreshed = s.user ? (getAccount(s.user.email) ?? s.user) : s.user;
        return { ...s, ...shared, user: refreshed };
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { state, setState };
}

function AppPage() {
  const { state, setState } = useTrustflowSession();

  if (!state || !state.user) {
    return (
      <main className="app-canvas min-h-screen flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-gray-400" />
      </main>
    );
  }

  const session = { state: state as AppState & { user: User }, setState };
  return state.user.role === "buyer" ? <BuyerApp {...session} /> : <SellerApp {...session} />;
}

/**
 * Shared vault demo engine. Owns the money-movement animation and every action
 * either party can take, with role-aware activity copy — so the seller and the
 * buyer pages can each run the full demo independently.
 */
function useVaultEngine({ state, setState }: SessionProps) {
  const [anim, setAnim] = useState<null | "deposit" | "release">(null);
  const [animBalance, setAnimBalance] = useState(0);
  const isSeller = state.user.role === "seller";
  const sellerFirst = SELLER_NAME.split(" ")[0];

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
      // Side effect kept out of the state updater (which can run twice): the
      // counterparty's persisted trust score ticks up once per completed trade.
      if (anim === "release") bumpAccountTrust(BUYER.email);
      setState((s) => {
        if (!s || !s.vault) return s;
        const v = s.vault;
        const seller = s.user?.role === "seller";
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
              events: [
                event(
                  seller
                    ? `${naira(AMOUNT)} secured in escrow ✓`
                    : `Your ${naira(AMOUNT)} is locked safely in escrow ✓`,
                  "funded",
                ),
                ...v.events,
              ],
            },
          };
        }
        // release complete — funds leave the vault for the seller's OPay account
        const invoiceNo = makeInvoiceNo(s.user?.invoice?.prefix);
        // Both parties' trust scores tick up on a clean, completed trade.
        const user = s.user ? applyTradeCompleted(s.user) : s.user;
        const events = seller
          ? [
              event(`Invoice ${invoiceNo} auto-generated`, "info"),
              event(`Trust score +2 for you and ${BUYER.name.split(" ")[0]} ✓`, "info"),
              event(`${naira(AMOUNT)} released to your OPay account ✓`, "released"),
            ]
          : [
              event(`Receipt ${invoiceNo} saved to your account`, "info"),
              event(`Trust score +2 for you and ${sellerFirst} ✓`, "info"),
              event(`Delivery confirmed — ${naira(AMOUNT)} released to ${sellerFirst} ✓`, "released"),
            ];
        return {
          ...s,
          user,
          walletBalance: (s.walletBalance ?? 0) + AMOUNT,
          vault: {
            ...v,
            balance: 0,
            payout: AMOUNT,
            status: "released",
            invoiceNo,
            events: [...events, ...v.events],
          },
        };
      });
      setAnim(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [anim]);

  // ---- vault mutation helpers ----
  const updateVault = (fn: (v: Vault) => Vault) =>
    setState((s) => (s && s.vault ? { ...s, vault: fn(s.vault) } : s));

  const addEvent = (text: string, kind: EventKind = "info") =>
    updateVault((v) => ({
      ...v,
      events: [{ id: nextEventId(), text, kind, at: Date.now() }, ...v.events],
    }));

  const createVault = () => setState((s) => (s ? { ...s, vault: newVault() } : s));

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard may be blocked — demo continues */
    }
    if (!state?.vault?.copied) addEvent("Vault code copied to clipboard", "info");
    updateVault((v) => ({ ...v, copied: true }));
  };

  // Buyer asks to join (real buyer action / seller-side presenter sim).
  const buyerRequestJoin = () => {
    updateVault((v) => ({ ...v, joinRequest: true }));
    addEvent(
      isSeller
        ? `${BUYER.name} requested to join this vault`
        : `You asked to join ${sellerFirst}'s vault`,
      "request",
    );
  };

  // Seller approves the join (real seller action / buyer-side presenter sim).
  const approveJoin = () => {
    updateVault((v) => ({
      ...v,
      joinRequest: false,
      status: "buyerJoined",
      buyer: { name: BUYER.name },
    }));
    addEvent(
      isSeller
        ? `${BUYER.name} joined the vault`
        : `${sellerFirst} approved you — you're in the vault`,
      "join",
    );
  };

  const declineJoin = () => {
    updateVault((v) => ({ ...v, joinRequest: false }));
    addEvent(
      isSeller ? `${BUYER.name}'s join request was declined` : `Your join request was declined`,
      "info",
    );
  };

  // Buyer funds the vault.
  const buyerDeposit = () => {
    if (state?.vault?.status !== "buyerJoined") return;
    addEvent(
      isSeller
        ? `${BUYER.name} is depositing ${naira(AMOUNT)}…`
        : `You're paying ${naira(AMOUNT)} into escrow…`,
      "deposit",
    );
    setAnimBalance(0);
    setAnim("deposit");
  };

  // Seller marks the item handed over.
  const markDelivered = () => {
    if (state?.vault?.status !== "funded") return;
    updateVault((v) => ({ ...v, status: "delivered" }));
    addEvent(
      isSeller
        ? `You marked the ${DEMO_VAULT_INFO.item} as delivered`
        : `${sellerFirst} marked the ${DEMO_VAULT_INFO.item} as delivered`,
      "delivered",
    );
  };

  // Buyer reveals their one-time release QR.
  const buyerShowQr = () => {
    if (state?.vault?.status !== "delivered" || state.vault.releaseQr) return;
    updateVault((v) => ({ ...v, releaseQr: true }));
    addEvent(
      isSeller ? `${BUYER.name} generated a one-time release QR` : `You generated a one-time release QR`,
      "info",
    );
  };

  // Seller scans the QR to release the funds.
  const releaseFunds = () => {
    if (state?.vault?.status !== "delivered" || !state.vault.releaseQr) return;
    addEvent(
      isSeller
        ? "Scanned buyer's QR — verifying and releasing funds…"
        : `${sellerFirst} scanned your QR — releasing your funds…`,
      "released",
    );
    setAnimBalance(AMOUNT);
    setAnim("release");
  };

  const resetVault = () => {
    setAnim(null);
    setAnimBalance(0);
    setState((s) => (s ? { ...s, vault: newVault(), walletBalance: WALLET_BASELINE } : s));
  };

  const vault = state.vault;
  const displayBalance = anim ? animBalance : (vault?.balance ?? 0);
  const displayPayout = anim === "release" ? AMOUNT - animBalance : (vault?.payout ?? 0);
  // Seller's wallet. During a release it ticks up in lockstep as the escrow drains.
  const walletBalance = state.walletBalance ?? 0;
  const displayWallet = anim === "release" ? walletBalance + (AMOUNT - animBalance) : walletBalance;

  return {
    anim,
    displayBalance,
    displayPayout,
    displayWallet,
    walletBalance,
    addEvent,
    createVault,
    copyCode,
    buyerRequestJoin,
    approveJoin,
    declineJoin,
    buyerDeposit,
    markDelivered,
    buyerShowQr,
    releaseFunds,
    resetVault,
  };
}

function SellerApp({ state, setState }: SessionProps) {
  const navigate = useNavigate();
  const eng = useVaultEngine({ state, setState });

  const [view, setView] = useState<View>("dashboard");
  const [wizard, setWizard] = useState<WizardStep>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const imageUrlRef = useRef<string | null>(null);
  imageUrlRef.current = imageUrl;

  // Honor a view handed over from the profile page's nav.
  useEffect(() => {
    const pv = consumePendingView();
    if (pv === "dashboard" || pv === "vaults" || pv === "activity") setView(pv);
  }, []);

  // ---- clean up object URL on unmount ----
  useEffect(
    () => () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    },
    [],
  );

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl((old) => {
      if (old && old !== "sample") URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  const createVault = () => {
    eng.createVault();
    setWizard(null);
    setView("vault");
  };

  const resetDemo = () => {
    eng.resetVault();
    setView("vault");
  };

  const logout = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  const { user, vault } = state;
  const {
    anim,
    displayBalance,
    displayPayout,
    displayWallet,
    copyCode,
    approveJoin,
    declineJoin,
    buyerRequestJoin,
    buyerDeposit,
    buyerShowQr,
    markDelivered,
    releaseFunds,
  } = eng;

  const navItems: NavItem[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, onClick: () => setView("dashboard") },
    { key: "vaults", label: "Vaults", icon: VaultIcon, onClick: () => setView("vaults") },
    { key: "activity", label: "Activity", icon: Activity, onClick: () => setView("activity") },
    { key: "profile", label: "Profile", icon: UserCircle, to: "/profile" },
  ];
  const activeKey = view === "vault" ? "vaults" : view;

  return (
    <AppCanvas>
      <TopNav
        user={user}
        items={navItems}
        active={activeKey}
        wallet={displayWallet}
        walletRinging={anim === "release"}
        onLogout={logout}
      />

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 sm:py-10">
        {view === "dashboard" && (
          <SellerDashboard
            user={user}
            vault={vault}
            balance={displayWallet}
            onOpenVault={() => setWizard("method")}
            onOpenExisting={() => setView("vault")}
            onGoActivity={() => setView("activity")}
            onGoVaults={() => setView("vaults")}
          />
        )}

        {view === "vaults" && (
          <VaultsView
            user={user}
            vault={vault}
            onOpenVault={() => setWizard("method")}
            onOpenExisting={() => setView("vault")}
          />
        )}

        {view === "activity" && <ActivityView user={user} />}

        {view === "vault" && vault && (
          <VaultLive
            sellerName={user.name}
            vault={vault}
            displayBalance={displayBalance}
            displayPayout={displayPayout}
            anim={anim}
            onCopy={() => copyCode(vault.code)}
            onBack={() => setView("vaults")}
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
    </AppCanvas>
  );
}

// ---------- buyer app ----------

type BuyerView = "dashboard" | "deal" | "activity";

function BuyerApp({ state, setState }: SessionProps) {
  const navigate = useNavigate();
  const eng = useVaultEngine({ state, setState });
  const { user, vault } = state;
  const [view, setView] = useState<BuyerView>(vault ? "deal" : "dashboard");

  // When a presenter opens a fresh vault, jump the buyer to the live deal.
  const vaultCode = vault?.code;
  useEffect(() => {
    if (vaultCode) setView("deal");
  }, [vaultCode]);

  // Honor a view handed over from the profile page's nav (wins over the jump).
  useEffect(() => {
    const pv = consumePendingView();
    if (pv === "dashboard" || pv === "activity") setView(pv);
  }, []);

  const logout = () => {
    clearSession();
    navigate({ to: "/login" });
  };
  const resetDemo = () => {
    eng.resetVault();
    setView("deal");
  };
  const startDemo = () => {
    eng.createVault();
    setView("deal");
  };
  const sellerScore = getAccount("chioma@trustflow.ng")?.trustScore ?? 96;

  const navItems: NavItem[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, onClick: () => setView("dashboard") },
    ...(vault
      ? [{ key: "deal", label: "Active deal", icon: ShieldCheck, onClick: () => setView("deal") } as NavItem]
      : []),
    { key: "activity", label: "Activity", icon: Activity, onClick: () => setView("activity") },
    { key: "profile", label: "Profile", icon: UserCircle, to: "/profile" },
  ];

  return (
    <AppCanvas>
      <TopNav user={user} items={navItems} active={view} onLogout={logout} />

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 sm:py-10">
        {view === "dashboard" && (
          <BuyerDashboard
            user={user}
            vault={vault}
            onGoActivity={() => setView("activity")}
            onGoDeal={() => setView("deal")}
            onStartDeal={startDemo}
          />
        )}

        {view === "activity" && <ActivityView user={user} />}

        {view === "deal" &&
          (vault ? (
            <BuyerVaultLive
              sellerScore={sellerScore}
              vault={vault}
              displayBalance={eng.displayBalance}
              displayPayout={eng.displayPayout}
              anim={eng.anim}
              onBack={() => setView("dashboard")}
              onRequestJoin={eng.buyerRequestJoin}
              onDeposit={eng.buyerDeposit}
              onShowQr={eng.buyerShowQr}
            />
          ) : (
            <BuyerNoDeal name={user.name} onStart={startDemo} />
          ))}
      </div>

      {/* Presenter controls — drive the seller's side manually */}
      {view === "deal" && vault && (
        <BuyerPresenterControls
          vault={vault}
          anim={eng.anim}
          onSellerApprove={eng.approveJoin}
          onSellerDeliver={eng.markDelivered}
          onSellerRelease={eng.releaseFunds}
          onReset={resetDemo}
        />
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes slideIn { from { opacity: 0; transform: translateX(24px);} to { opacity: 1; transform: translateX(0);} }
        @keyframes pop { 0% { transform: scale(.92); opacity: 0;} 60% { transform: scale(1.02);} 100% { transform: scale(1); opacity: 1;} }
        @keyframes ring { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,.45);} 100% { box-shadow: 0 0 0 14px rgba(52,211,153,0);} }
      `}</style>
    </AppCanvas>
  );
}

function BuyerNoDeal({ name, onStart }: { name: string; onStart: () => void }) {
  return (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <Badge>Your deals</Badge>
      <h1 className="mt-4 text-[28px] sm:text-[32px] font-medium text-gray-900 tracking-[-0.02em]">
        Welcome, {name.split(" ")[0]} 👋
      </h1>
      <p className="mt-2 text-[15px] text-gray-700 max-w-[52ch]">
        When a seller shares a TrustFlow vault code, you'll join it here and pay safely into escrow —
        your money is only released to the seller once you confirm delivery.
      </p>
      <div className="mt-8 glass-card p-10 sm:p-14 flex flex-col items-center text-center">
        <span className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
          <Lock size={26} className="text-gray-300" />
        </span>
        <p className="mt-5 text-[15px] font-medium text-gray-800">No active deal yet</p>
        <p className="mt-1 text-[13px] text-gray-600 max-w-[42ch]">
          A seller can share a vault code with you — or start a guided demo deal and walk the full
          protected flow yourself.
        </p>
        <button
          onClick={onStart}
          className="mt-6 group bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full pl-5 pr-2 py-2.5 inline-flex items-center gap-3 transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <Play size={15} /> Start a demo deal
          </span>
          <span className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45">
            <ShieldCheck size={14} className="text-[#34D399]" />
          </span>
        </button>
      </div>
    </div>
  );
}

// ---------- buyer live deal (mirror of the seller's vault view) ----------

function BuyerVaultLive({
  sellerScore,
  vault,
  displayBalance,
  displayPayout,
  anim,
  onBack,
  onRequestJoin,
  onDeposit,
  onShowQr,
}: {
  sellerScore: number;
  vault: Vault;
  displayBalance: number;
  displayPayout: number;
  anim: null | "deposit" | "release";
  onBack: () => void;
  onRequestJoin: () => void;
  onDeposit: () => void;
  onShowQr: () => void;
}) {
  const pct = Math.min(100, (displayBalance / AMOUNT) * 100);
  const depositing = anim === "deposit";
  const releasing = anim === "release";
  const status = vault.status;
  const requested = vault.joinRequest;
  const joined = status !== "awaiting";
  const isFunded = status === "funded";
  const isDelivered = status === "delivered";
  const isReleased = status === "released";
  const sellerFirst = SELLER_NAME.split(" ")[0];

  const reachedPay = ["funded", "delivered", "released"].includes(status);

  return (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <button
        onClick={onBack}
        className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1.5"
      >
        <ArrowLeft size={14} /> Dashboard
      </button>

      <div className="mt-3 flex items-center justify-between gap-4">
        <h1 className="text-[26px] sm:text-[30px] font-medium text-gray-900 tracking-[-0.02em]">
          {vault.info.item}
        </h1>
        <StatusPill status={status} />
      </div>
      <p className="mt-1 text-[14px] text-gray-600">
        {naira(vault.info.price)} · delivery {vault.info.delivery} — your money stays protected until
        you confirm delivery.
      </p>

      <div className="mt-6 grid lg:grid-cols-[1.2fr_1fr] gap-5 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Protected money */}
          <div className="glass-dark text-white p-6 sm:p-7 relative overflow-hidden">
            <div
              className="pointer-events-none absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle, #34D399 0%, transparent 70%)" }}
            />
            <div className="relative flex items-center justify-between">
              <span className="text-[12px] text-gray-400 uppercase tracking-wider">
                Your money · protected
              </span>
              <span className="text-[11px] text-[#34D399] flex items-center gap-1">
                <Lock size={12} /> In escrow
              </span>
            </div>
            <div className="relative mt-5 flex items-end justify-between">
              <div>
                <div className="text-[12px] text-gray-400">Locked in the vault</div>
                <div className="text-[36px] sm:text-[40px] font-medium tracking-tight tabular-nums">
                  {naira(displayBalance)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-gray-400">
                  {isReleased || releasing ? "Released" : "Agreed"}
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
                  <BadgeCheck size={16} /> Delivery confirmed — payment released to {sellerFirst}.
                </span>
              ) : releasing ? (
                <span className="inline-flex items-center gap-1.5 text-gray-300">
                  <Loader2 size={14} className="animate-spin" /> Releasing {naira(displayPayout)} to{" "}
                  {sellerFirst}…
                </span>
              ) : isDelivered ? (
                <span className="inline-flex items-center gap-1.5 text-gray-300">
                  <Truck size={14} className="text-[#34D399]" /> Delivered — release once you've
                  checked the item.
                </span>
              ) : isFunded ? (
                <span className="inline-flex items-center gap-1.5 text-[#34D399] font-medium">
                  <BadgeCheck size={16} /> Locked safely — held until you confirm delivery.
                </span>
              ) : depositing ? (
                <span className="inline-flex items-center gap-1.5 text-gray-300">
                  <Loader2 size={14} className="animate-spin" /> Moving your money into escrow…
                </span>
              ) : joined ? (
                <span className="inline-flex items-center gap-1.5 text-gray-300">
                  <Wallet size={14} /> Ready for you to pay into the vault.
                </span>
              ) : requested ? (
                <span className="inline-flex items-center gap-1.5 text-gray-300">
                  <Loader2 size={14} className="animate-spin" /> Waiting for {sellerFirst} to approve
                  you…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-gray-400">
                  <UserPlus size={14} /> Ask to join with {sellerFirst}'s vault code.
                </span>
              )}
            </div>
          </div>

          {/* Your next step — buyer's own actions */}
          <div className="glass-card p-6" style={{ animation: "fadeUp .4s ease both" }}>
            <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Wallet size={13} /> Your next step
            </div>

            {!joined && !requested && (
              <div>
                <p className="text-[13px] text-gray-600 leading-[1.5] mb-4">
                  Ask {sellerFirst} to let you into this vault. She approves you before any money
                  moves.
                </p>
                <button
                  onClick={onRequestJoin}
                  className="bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full px-5 py-2.5 inline-flex items-center gap-2 transition-colors"
                  style={{ animation: "ring 1.6s ease-out infinite" }}
                >
                  <UserPlus size={16} /> Ask to join this vault
                </button>
              </div>
            )}

            {!joined && requested && (
              <div className="flex items-center gap-2.5 text-[14px] text-gray-700 font-medium py-2">
                <Loader2 size={18} className="animate-spin text-[#059669]" />
                Waiting for {sellerFirst} to approve your request…
              </div>
            )}

            {status === "buyerJoined" && !depositing && (
              <div>
                <p className="text-[13px] text-gray-600 leading-[1.5] mb-4">
                  Pay into the OPay-backed vault. Your money is held safely — it is{" "}
                  <b className="text-gray-900">not</b> sent to {sellerFirst} until you confirm
                  delivery.
                </p>
                <button
                  onClick={onDeposit}
                  className="bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full px-5 py-2.5 inline-flex items-center gap-2 transition-colors"
                  style={{ animation: "ring 1.6s ease-out infinite" }}
                >
                  <Wallet size={16} /> Pay {naira(AMOUNT)} into escrow
                </button>
              </div>
            )}

            {depositing && (
              <div className="flex items-center gap-2.5 text-[14px] text-gray-700 font-medium py-2">
                <Loader2 size={18} className="animate-spin text-[#059669]" />
                Moving {naira(AMOUNT)} into the vault…
              </div>
            )}

            {isFunded && (
              <div className="flex items-start gap-3 text-[13px] text-gray-700 leading-[1.5]">
                <Truck size={18} className="text-[#059669] mt-0.5 shrink-0" />
                <span>
                  Paid and protected. Sit tight while {sellerFirst} delivers your {vault.info.item} —
                  you'll release payment once it's in your hands.
                </span>
              </div>
            )}

            {isDelivered && !vault.releaseQr && !releasing && (
              <div>
                <p className="text-[13px] text-gray-600 leading-[1.5] mb-4">
                  Got your {vault.info.item} and it's exactly as agreed? Reveal your one-time QR so{" "}
                  {sellerFirst} can release the funds.
                </p>
                <button
                  onClick={onShowQr}
                  className="bg-gray-900 hover:bg-gray-800 text-white text-[14px] font-medium rounded-full px-5 py-2.5 inline-flex items-center gap-2 transition-colors"
                  style={{ animation: "ring 1.6s ease-out infinite" }}
                >
                  <QrCode size={16} className="text-[#34D399]" /> Release payment
                </button>
              </div>
            )}

            {isDelivered && vault.releaseQr && !releasing && (
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="rounded-2xl border border-gray-200 p-3 bg-white shrink-0">
                  <FakeQR />
                  <div className="text-center text-[11px] text-gray-500 mt-1.5">
                    Your release QR · expires 60s
                  </div>
                </div>
                <div className="flex-1 text-[13px] text-gray-600 leading-[1.5]">
                  <div className="inline-flex items-center gap-1.5 text-gray-500 font-medium">
                    <Loader2 size={13} className="animate-spin" /> Waiting for {sellerFirst} to
                    scan…
                  </div>
                  <p className="mt-1.5">
                    Show this one-time code to {sellerFirst}. When she scans it,{" "}
                    <b className="text-gray-900">{naira(AMOUNT)}</b> is released from the vault.
                  </p>
                </div>
              </div>
            )}

            {releasing && (
              <div className="flex items-center gap-2.5 text-[14px] text-gray-700 font-medium py-2">
                <Loader2 size={18} className="animate-spin text-[#059669]" />
                Releasing {naira(AMOUNT)} to {sellerFirst}…
              </div>
            )}

            {isReleased && (
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl bg-[#34D399]/10 border border-[#34D399]/30 p-4 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#34D399] flex items-center justify-center shrink-0">
                    <BadgeCheck size={18} className="text-gray-900" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-gray-900 tabular-nums">
                      Delivery confirmed
                    </div>
                    <div className="text-[12px] text-gray-600">
                      {naira(AMOUNT)} released to {sellerFirst} · trust score +2
                    </div>
                  </div>
                </div>
                {vault.invoiceNo && (
                  <div className="rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                    <FileText size={16} className="text-[#059669] shrink-0" />
                    <span className="text-[13px] text-gray-700">
                      Receipt <b className="text-gray-900">{vault.invoiceNo}</b> saved to your account
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seller card */}
          <div className="glass-card p-6">
            <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Users size={13} /> Who you're trading with
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={SELLER_NAME} accent />
                <div>
                  <div className="text-[14px] font-medium text-gray-900">{SELLER_NAME}</div>
                  <div className="text-[12px] text-gray-600">Seller · Chioma Fashion</div>
                </div>
              </div>
              <TrustScoreBadge score={sellerScore} />
            </div>
            <p className="mt-3 text-[12.5px] text-gray-600 leading-[1.5]">
              You can see {sellerFirst}'s trust score before any money moves. A high score means a
              long record of completed, dispute-free trades.
            </p>
          </div>
        </div>

        {/* Right column — activity */}
        <div className="glass-card p-6 lg:sticky lg:top-24">
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

          {reachedPay && !isReleased && (
            <div className="mt-2 pt-5 border-t border-gray-100">
              <div className="rounded-2xl bg-[#34D399]/10 border border-[#34D399]/30 p-4 flex items-start gap-3">
                <BadgeCheck size={20} className="text-[#059669] mt-0.5 shrink-0" />
                <div className="text-[13px] text-gray-800 leading-[1.5]">
                  You're protected. {naira(AMOUNT)} is locked safely — it only reaches {sellerFirst}{" "}
                  when you release it on delivery.
                </div>
              </div>
            </div>
          )}

          {isReleased && (
            <div className="mt-2 pt-5 border-t border-gray-100">
              <div className="rounded-2xl bg-gray-900 text-white p-4 flex items-start gap-3">
                <BadgeCheck size={20} className="text-[#34D399] mt-0.5 shrink-0" />
                <div className="text-[13px] leading-[1.55]">
                  Done. You received the {vault.info.item} and released {naira(AMOUNT)} —{" "}
                  <span className="text-[#34D399]">buyer protected, seller paid</span>, fully
                  recorded.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- buyer presenter controls (drives the seller's side) ----------

function BuyerPresenterControls({
  vault,
  anim,
  onSellerApprove,
  onSellerDeliver,
  onSellerRelease,
  onReset,
}: {
  vault: Vault;
  anim: null | "deposit" | "release";
  onSellerApprove: () => void;
  onSellerDeliver: () => void;
  onSellerRelease: () => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(true);
  const sellerFirst = SELLER_NAME.split(" ")[0];

  const reachedJoined = ["buyerJoined", "funded", "delivered", "released"].includes(vault.status);
  const reachedDelivered = ["delivered", "released"].includes(vault.status);
  const reachedReleased = vault.status === "released";

  const canApprove = vault.status === "awaiting" && vault.joinRequest;
  const canDeliver = vault.status === "funded" && anim !== "deposit";
  const canRelease = vault.status === "delivered" && vault.releaseQr && anim !== "release";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 left-4 bottom-4 bg-gray-900 text-white rounded-full px-4 py-2.5 text-[13px] font-medium shadow-xl inline-flex items-center gap-2"
      >
        <Settings2 size={15} className="text-[#34D399]" /> Demo control guide
      </button>
    );
  }

  return (
    <div className="fixed z-40 left-4 bottom-4 w-[calc(100%-2rem)] sm:w-[320px]">
      <div className="glass-dark text-white overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10">
          <Settings2 size={15} className="text-[#34D399]" />
          <span className="text-[13px] font-semibold">Demo control guide</span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto text-gray-400 hover:text-white"
            aria-label="Hide"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-3 flex flex-col gap-2">
          <p className="text-[11px] text-gray-400 px-1 leading-[1.45]">
            This guide drives {sellerFirst}'s side of the demo for you. Take your own actions on the
            left, then tap each step here — they stand in for what {sellerFirst} does on her phone.
          </p>

          <ControlButton
            label={`1 · ${sellerFirst} approves your request`}
            note="Do this after you ask to join"
            icon={UserPlus}
            disabled={!canApprove}
            done={reachedJoined}
            onClick={onSellerApprove}
          />
          <ControlButton
            label={`2 · ${sellerFirst} marks it delivered`}
            note="Do this after you pay into escrow"
            icon={Truck}
            disabled={!canDeliver}
            done={reachedDelivered}
            onClick={onSellerDeliver}
          />
          <ControlButton
            label={`3 · ${sellerFirst} scans QR & releases`}
            note="Do this after you show the release QR"
            icon={ScanLine}
            disabled={!canRelease}
            done={reachedReleased}
            onClick={onSellerRelease}
          />

          <button
            onClick={onReset}
            className="mt-1 text-[12px] text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5 px-1"
          >
            <RotateCcw size={13} /> Reset this deal
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- dashboard ----------

/** Aggregate the demo history into the headline metrics shown on the dashboard. */
function useDashboardStats(role: User["role"]) {
  const txs = demoTransactions(role);
  const monthly = demoMonthly(role);
  const released = txs.filter((t) => t.status === "released");
  const lifetime = monthly.reduce((s, m) => s + m.value, 0) * 1000;
  const thisMonth = monthly[monthly.length - 1].value * 1000;
  const prevMonth = monthly[monthly.length - 2].value * 1000;
  const momPct = prevMonth ? Math.round(((thisMonth - prevMonth) / prevMonth) * 100) : 0;
  const successRate = Math.round((released.length / txs.length) * 100);
  return { txs, monthly, released, lifetime, thisMonth, momPct, successRate };
}

function PageHeading({
  badge,
  title,
  subtitle,
  action,
}: {
  badge: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <Badge>{badge}</Badge>
        <h1 className="mt-3 text-[26px] sm:text-[30px] font-medium text-gray-900 tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mt-1.5 text-[14.5px] text-gray-600 max-w-[60ch]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function OpenVaultButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[14px] font-medium rounded-full pl-5 pr-2 py-2.5 inline-flex items-center gap-3 transition-colors self-start shrink-0"
    >
      <span className="inline-flex items-center gap-2">
        <Plus size={16} /> Open vault
      </span>
      <span className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:-rotate-45">
        <VaultIcon size={14} className="text-[#34D399]" />
      </span>
    </button>
  );
}

function ViewAll({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[12px] font-medium text-[#059669] hover:underline inline-flex items-center gap-1"
    >
      View all <ChevronRight size={13} />
    </button>
  );
}

function BalanceHero({
  balance,
  role,
  onPrimary,
  className = "",
}: {
  balance: number;
  role: User["role"];
  onPrimary?: () => void;
  className?: string;
}) {
  const isSeller = role === "seller";
  return (
    <div className={`glass-dark text-white p-6 sm:p-7 relative overflow-hidden flex flex-col ${className}`}>
      <div
        className="pointer-events-none absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #34D399 0%, transparent 70%)" }}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[12px] text-gray-400 uppercase tracking-wider">
          {isSeller ? "Available balance" : "Total protected"}
        </span>
        <span className="text-[11px] text-[#34D399] inline-flex items-center gap-1">
          <ShieldCheck size={12} /> OPay-backed
        </span>
      </div>
      <div className="relative mt-4">
        <div className="text-[40px] sm:text-[46px] font-medium tracking-tight tabular-nums leading-none">
          {naira(balance)}
        </div>
        <div className="mt-2 text-[12.5px] text-gray-400 inline-flex items-center gap-1.5">
          <Landmark size={13} className="text-[#34D399]" />
          {isSeller ? "Settles instantly to OPay •••• 7788" : "Spent safely through escrow"}
        </div>
      </div>
      <div className="relative mt-auto pt-6 flex flex-wrap items-center gap-2.5">
        {isSeller ? (
          <>
            <button
              onClick={onPrimary}
              className="bg-[#34D399] hover:bg-[#10B981] text-gray-900 text-[13.5px] font-medium rounded-full px-4 py-2 inline-flex items-center gap-2 transition-colors"
            >
              <Plus size={15} /> Open vault
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white text-[13.5px] font-medium rounded-full px-4 py-2 inline-flex items-center gap-2 transition-colors">
              <ArrowUpRight size={15} className="text-[#34D399]" /> Withdraw
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#34D399] bg-[#34D399]/15 rounded-full px-3 py-1.5">
            <BadgeCheck size={13} /> Buyer protection active
          </span>
        )}
      </div>
    </div>
  );
}

function TrustScoreCard({ user, className = "" }: { user: User; className?: string }) {
  const { label, tone } = trustTier(user.trustScore);
  const ring = { high: "#34D399", mid: "#F59E0B", low: "#F43F5E" }[tone];
  return (
    <div className={`glass-card p-6 flex flex-col ${className}`}>
      <SectionLabel icon={ShieldCheck}>Trust score</SectionLabel>
      <div className="mt-3 flex items-center gap-4">
        <TrustRing score={user.trustScore} size={92} />
        <div className="min-w-0">
          <span
            className="inline-flex text-[12px] font-semibold rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: `${ring}26`, color: ring }}
          >
            {label}
          </span>
          <p className="mt-2 text-[12.5px] text-gray-600 leading-[1.5]">
            {user.tradesCompleted} completed trades. Counterparties see this before any money moves.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  data,
  highlight,
  className = "",
}: {
  title: string;
  data: ReturnType<typeof demoMonthly>;
  highlight: string;
  className?: string;
}) {
  return (
    <div className={`glass-card p-6 flex flex-col ${className}`}>
      <div className="flex items-center justify-between">
        <SectionLabel icon={TrendingUp}>{title}</SectionLabel>
        <span className="text-[12px] text-gray-400">last 7 months</span>
      </div>
      <div className="mt-2 text-[22px] font-medium text-gray-900 tabular-nums">
        {highlight}
        <span className="text-[12px] text-gray-400 font-normal ml-1.5">this month</span>
      </div>
      <MiniBarChart data={data} className="mt-5" />
    </div>
  );
}

function RecentActivityCard({
  role,
  onViewAll,
  className = "",
}: {
  role: User["role"];
  onViewAll: () => void;
  className?: string;
}) {
  return (
    <div className={`glass-card p-6 flex flex-col ${className}`}>
      <div className="flex items-center justify-between">
        <SectionLabel icon={Bell}>Recent activity</SectionLabel>
        <ViewAll onClick={onViewAll} />
      </div>
      <ActivityFeed items={demoActivity(role).slice(0, 5)} className="mt-3" />
    </div>
  );
}

function TransactionsCard({
  role,
  onViewAll,
  className = "",
}: {
  role: User["role"];
  onViewAll: () => void;
  className?: string;
}) {
  return (
    <div className={`glass-card p-6 flex flex-col ${className}`}>
      <div className="flex items-center justify-between">
        <SectionLabel icon={Receipt}>Transaction history</SectionLabel>
        <ViewAll onClick={onViewAll} />
      </div>
      <TransactionTable items={demoTransactions(role).slice(0, 4)} className="mt-2" />
    </div>
  );
}

function ActiveVaultCard({
  vault,
  onOpenExisting,
  onOpenVault,
  className = "",
}: {
  vault: Vault | null;
  onOpenExisting: () => void;
  onOpenVault: () => void;
  className?: string;
}) {
  return (
    <div className={`glass-card p-6 flex flex-col ${className}`}>
      <SectionLabel icon={VaultIcon}>Active vault</SectionLabel>
      {vault ? (
        <button
          onClick={onOpenExisting}
          className="mt-4 text-left rounded-2xl border border-gray-200/70 bg-white/50 hover:bg-white p-4 flex items-center gap-3 transition-colors"
        >
          <span className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
            <Laptop size={20} className="text-[#34D399]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-gray-900 truncate">{vault.info.item}</span>
              <StatusPill status={vault.status} />
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5 truncate">
              {vault.code} · {naira(vault.info.price)}
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </button>
      ) : (
        <button
          onClick={onOpenVault}
          className="mt-4 flex-1 min-h-[140px] rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#34D399] bg-white/30 hover:bg-white/50 p-6 flex flex-col items-center justify-center text-center transition-colors"
        >
          <span className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
            <Plus size={22} className="text-[#059669]" />
          </span>
          <p className="mt-3 text-[14px] font-medium text-gray-800">Open a new vault</p>
          <p className="mt-1 text-[12px] text-gray-500 max-w-[30ch]">
            Protect your next deal — AI fills in the details from your chat.
          </p>
        </button>
      )}
    </div>
  );
}

function BuyerDealCard({
  vault,
  onGoDeal,
  onStart,
  className = "",
}: {
  vault: Vault | null;
  onGoDeal: () => void;
  onStart: () => void;
  className?: string;
}) {
  return (
    <div className={`glass-card p-6 flex flex-col ${className}`}>
      <SectionLabel icon={ShieldCheck}>Active deal</SectionLabel>
      {vault ? (
        <button
          onClick={onGoDeal}
          className="mt-4 text-left rounded-2xl border border-gray-200/70 bg-white/50 hover:bg-white p-4 flex items-center gap-3 transition-colors"
        >
          <span className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
            <Lock size={19} className="text-[#34D399]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-gray-900 truncate">{vault.info.item}</span>
              <StatusPill status={vault.status} />
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5 truncate">
              {naira(vault.info.price)} · delivery {vault.info.delivery}
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300 shrink-0" />
        </button>
      ) : (
        <button
          onClick={onStart}
          className="mt-4 flex-1 min-h-[140px] rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#34D399] bg-white/30 hover:bg-white/50 p-6 flex flex-col items-center justify-center text-center transition-colors"
        >
          <span className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
            <Play size={20} className="text-[#059669]" />
          </span>
          <p className="mt-3 text-[14px] font-medium text-gray-800">Start a demo deal</p>
          <p className="mt-1 text-[12px] text-gray-500 max-w-[32ch]">
            Walk the full protected flow — join, pay into escrow, then release on delivery.
          </p>
        </button>
      )}
    </div>
  );
}

function SellerDashboard({
  user,
  vault,
  balance,
  onOpenVault,
  onOpenExisting,
  onGoActivity,
}: {
  user: User;
  vault: Vault | null;
  balance: number;
  onOpenVault: () => void;
  onOpenExisting: () => void;
  onGoActivity: () => void;
  onGoVaults: () => void;
}) {
  const { monthly, lifetime, thisMonth, momPct, successRate } = useDashboardStats(user.role);
  const firstName = user.name.split(" ")[0];
  return (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <PageHeading
        badge="Dashboard"
        title={`Welcome back, ${firstName} 👋`}
        subtitle="Here's how your shop is performing on TrustFlow."
        action={<OpenVaultButton onClick={onOpenVault} />}
      />

      <div className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <BalanceHero balance={balance} role="seller" onPrimary={onOpenVault} className="md:col-span-2 lg:col-span-4" />
        <TrustScoreCard user={user} className="md:col-span-2 lg:col-span-2" />

        <StatCard
          icon={TrendingUp}
          label="This month"
          value={naira(thisMonth)}
          sub={`${momPct >= 0 ? "+" : ""}${momPct}% vs last month`}
          trend={momPct >= 0 ? "up" : "down"}
          className="lg:col-span-2"
        />
        <StatCard
          icon={Wallet}
          label="Lifetime volume"
          value={naira(lifetime)}
          sub="across all vaults"
          trend="flat"
          className="lg:col-span-2"
        />
        <StatCard
          icon={BadgeCheck}
          label="Completed trades"
          value={String(user.tradesCompleted)}
          sub={`${successRate}% success rate`}
          trend="up"
          className="lg:col-span-2"
        />

        <ActiveVaultCard
          vault={vault}
          onOpenExisting={onOpenExisting}
          onOpenVault={onOpenVault}
          className="md:col-span-2 lg:col-span-3"
        />
        <ChartCard
          title="Escrow volume"
          data={monthly}
          highlight={naira(thisMonth)}
          className="md:col-span-2 lg:col-span-3"
        />

        <RecentActivityCard role={user.role} onViewAll={onGoActivity} className="md:col-span-2 lg:col-span-3" />
        <TransactionsCard role={user.role} onViewAll={onGoActivity} className="md:col-span-2 lg:col-span-3" />
      </div>
    </div>
  );
}

function BuyerDashboard({
  user,
  vault,
  onGoActivity,
  onGoDeal,
  onStartDeal,
}: {
  user: User;
  vault: Vault | null;
  onGoActivity: () => void;
  onGoDeal: () => void;
  onStartDeal: () => void;
}) {
  const { monthly, lifetime, thisMonth, momPct, successRate } = useDashboardStats(user.role);
  const firstName = user.name.split(" ")[0];
  return (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <PageHeading
        badge="Dashboard"
        title={`Welcome back, ${firstName} 👋`}
        subtitle="Every naira you spend on TrustFlow stays protected until you confirm delivery."
      />

      <div className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <BalanceHero balance={lifetime} role="buyer" className="md:col-span-2 lg:col-span-4" />
        <TrustScoreCard user={user} className="md:col-span-2 lg:col-span-2" />

        <StatCard
          icon={TrendingUp}
          label="This month"
          value={naira(thisMonth)}
          sub={`${momPct >= 0 ? "+" : ""}${momPct}% vs last month`}
          trend={momPct >= 0 ? "up" : "down"}
          className="lg:col-span-2"
        />
        <StatCard
          icon={BadgeCheck}
          label="Purchases"
          value={String(user.tradesCompleted)}
          sub={`${successRate}% delivered clean`}
          trend="up"
          className="lg:col-span-2"
        />
        <StatCard
          icon={ShieldCheck}
          label="Disputes won"
          value="1"
          sub="full refund recovered"
          trend="up"
          className="lg:col-span-2"
        />

        <BuyerDealCard
          vault={vault}
          onGoDeal={onGoDeal}
          onStart={onStartDeal}
          className="md:col-span-2 lg:col-span-3"
        />
        <ChartCard
          title="Protected spend"
          data={monthly}
          highlight={naira(thisMonth)}
          className="md:col-span-2 lg:col-span-3"
        />

        <RecentActivityCard role={user.role} onViewAll={onGoActivity} className="md:col-span-2 lg:col-span-3" />
        <TransactionsCard role={user.role} onViewAll={onGoActivity} className="md:col-span-2 lg:col-span-3" />
      </div>
    </div>
  );
}

function VaultsView({
  user,
  vault,
  onOpenVault,
  onOpenExisting,
}: {
  user: User;
  vault: Vault | null;
  onOpenVault: () => void;
  onOpenExisting: () => void;
}) {
  const txs = demoTransactions(user.role);
  return (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <PageHeading
        badge="Vaults"
        title="Your vaults"
        subtitle="Active escrow and every deal you've completed on TrustFlow."
        action={<OpenVaultButton onClick={onOpenVault} />}
      />

      <div className="mt-7">
        <SectionLabel icon={Lock}>Active</SectionLabel>
        {vault ? (
          <button
            onClick={onOpenExisting}
            className="mt-3 w-full text-left glass-card glass-card-hover p-5 flex items-center gap-4"
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
          <button
            onClick={onOpenVault}
            className="mt-3 w-full rounded-3xl border-2 border-dashed border-gray-300 hover:border-[#34D399] bg-white/40 py-12 flex flex-col items-center text-center transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Plus size={24} className="text-[#059669]" />
            </div>
            <p className="mt-4 text-[15px] font-medium text-gray-700">No active vault</p>
            <p className="mt-1 text-[13px] text-gray-500 max-w-[36ch]">
              Open a vault to hold a buyer's money safely until the item is delivered.
            </p>
          </button>
        )}
      </div>

      <div className="mt-8">
        <SectionLabel icon={Receipt}>Completed &amp; past vaults</SectionLabel>
        <div className="mt-3 glass-card p-5 sm:p-6">
          <TransactionTable items={txs} />
        </div>
      </div>
    </div>
  );
}

function ActivityView({ user }: { user: User }) {
  return (
    <div style={{ animation: "fadeUp .5s ease both" }}>
      <PageHeading
        badge="Activity"
        title="Activity & history"
        subtitle="Everything that's happened across your TrustFlow account."
      />
      <div className="mt-7 grid lg:grid-cols-2 gap-5 items-start">
        <div className="glass-card p-6">
          <SectionLabel icon={Bell}>Recent activity</SectionLabel>
          <ActivityFeed items={demoActivity(user.role)} className="mt-3" />
        </div>
        <div className="glass-card p-6">
          <SectionLabel icon={Receipt}>Transaction history</SectionLabel>
          <TransactionTable items={demoTransactions(user.role)} className="mt-2" />
        </div>
      </div>
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
          <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <GeminiLogo size={22} />
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
            <GeminiLogo size={15} /> Extract with Gemini
          </span>
        </PrimaryButton>
      </div>
    </div>
  );
}

function ExtractingStep() {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center">
        <GeminiLogo size={30} />
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
          <div className="glass-dark text-white p-6 sm:p-7 relative overflow-hidden">
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
              className="glass-card p-6"
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
          <div className="glass-card p-6">
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
          <div className="glass-card p-6">
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
        <div className="glass-card p-6 lg:sticky lg:top-24">
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
        <Settings2 size={15} className="text-[#34D399]" /> Demo control guide
      </button>
    );
  }

  return (
    <div className="fixed z-40 left-4 bottom-4 w-[calc(100%-2rem)] sm:w-[320px]">
      <div className="glass-dark text-white overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10">
          <Settings2 size={15} className="text-[#34D399]" />
          <span className="text-[13px] font-semibold">Demo control guide</span>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto text-gray-400 hover:text-white"
            aria-label="Hide"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-3 flex flex-col gap-2">
          <p className="text-[11px] text-gray-400 px-1 leading-[1.45]">
            This guide drives the buyer's side of the demo for you. Tap each step in order —
            they stand in for the actions {BUYER.name.split(" ")[0]} would take on his own phone.
            The active step lights up green.
          </p>

          <ControlButton
            label="1 · Buyer requests to join"
            note="Do this after you copy & share the vault code"
            icon={UserPlus}
            disabled={!canJoin}
            done={vault.status !== "awaiting" || vault.joinRequest}
            onClick={onBuyerJoin}
          />
          <ControlButton
            label={`2 · Buyer deposits ${naira(AMOUNT)}`}
            note="Do this after you approve the join request"
            icon={Wallet}
            disabled={!canDeposit}
            done={reachedFunded}
            onClick={onBuyerDeposit}
          />
          <ControlButton
            label="3 · Buyer shows release QR"
            note="Do this after you mark the item delivered"
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
