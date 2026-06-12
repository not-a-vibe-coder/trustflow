// Chëkd demo "backend".
//
// There is no real server: this whole app is a hardcoded demo. Auth, accounts,
// the vault, the buyer joining and the deposit are all driven from here +
// localStorage so the experience behaves like a real app (persists across
// refresh / navigation, syncs across tabs) while staying fully scripted for a
// live presentation.

// ----- roles & accounts -----

export type Role = "seller" | "buyer";

/** Seller invoice branding — captured at sign-up, applied to the auto-generated
 *  invoice at the end of a completed deal. */
export type InvoiceBrand = {
  businessName: string; // "Chioma Fashion"
  accent: string; // hex, e.g. "#34D399"
  monogram: string; // "CF"
  prefix: string; // "CHF" -> CHF-10293
  footer: string; // contact / footer line
};

export const DEFAULT_INVOICE: InvoiceBrand = {
  businessName: "",
  accent: "#34D399",
  monogram: "",
  prefix: "INV",
  footer: "",
};

export type User = {
  id: string;
  role: Role;
  name: string;
  email: string;
  trustScore: number; // every user starts at 100
  tradesCompleted: number;
  invoice?: InvoiceBrand; // sellers only
  createdAt: number;
};

/** Internal record — adds the (demo-only) password to a public User. */
type StoredAccount = User & { password: string };

export const STARTING_TRUST = 100;
const DEMO_PASSWORD = "demo1234";

// The buyer persona used throughout the scripted vault flow. Kept in sync with
// the seeded buyer account below so the seller's vault and the buyer login tell
// one coherent story.
export const BUYER = {
  name: "Emeka Okafor",
  email: "emeka@chekd.ng",
  handle: "emeka@chekd.ng",
};

export const SELLER_NAME = "Chioma Esther";

const CHIOMA_INVOICE: InvoiceBrand = {
  businessName: "Chioma Fashion",
  accent: "#34D399",
  monogram: "CF",
  prefix: "CHF",
  footer: "Chioma Fashion · Lekki, Lagos · 0801 234 5678",
};

const SEED_ACCOUNTS: StoredAccount[] = [
  {
    id: "acc_chioma",
    role: "seller",
    name: "Chioma Esther",
    email: "chioma@chekd.ng",
    password: DEMO_PASSWORD,
    trustScore: 96,
    tradesCompleted: 8,
    invoice: CHIOMA_INVOICE,
    createdAt: Date.UTC(2026, 0, 12),
  },
  {
    id: "acc_emeka",
    role: "buyer",
    name: "Emeka Okafor",
    email: "emeka@chekd.ng",
    password: DEMO_PASSWORD,
    trustScore: 88,
    tradesCompleted: 5,
    createdAt: Date.UTC(2026, 1, 3),
  },
];

/** Public, presentation-friendly demo accounts for the login "click to fill" cards. */
export const DEMO_ACCOUNTS = [
  {
    name: "Chioma Esther",
    email: "chioma@chekd.ng",
    role: "seller" as Role,
    blurb: "Lagos fashion seller · Trust score 96",
    trustScore: 96,
    password: DEMO_PASSWORD,
  },
  {
    name: "Emeka Okafor",
    email: "emeka@chekd.ng",
    role: "buyer" as Role,
    blurb: "Repeat buyer · Trust score 88",
    trustScore: 88,
    password: DEMO_PASSWORD,
  },
];

export const DEMO_PASSWORD_HINT = DEMO_PASSWORD;

// ----- trust score system -----

export type TrustEvent = { delta: string; label: string };

/** The behaviour ledger shown on the Profile + landing (reference copy). */
export const TRUST_EVENTS: TrustEvent[] = [
  { delta: "+2", label: "Trade completed — buyer confirmed delivery" },
  { delta: "−10", label: "Report received — counterparty filed a complaint" },
  { delta: "+10", label: "Report dismissed — complaint found baseless" },
  { delta: "−15", label: "Dispute lost — ruled against you by admin" },
  { delta: "→ 0", label: "Account blacklisted — device, face & phone flagged permanently" },
];

export const TRUST_BLURB =
  "Every user starts at 100. Each completed trade builds your behaviour record. Reports and disputes move it down — fast. Before any trade starts, your counterparty sees your score. A low score means sellers can refuse you, and buyers can walk away. Hit zero and your account, device, and face are permanently flagged.";

export const TRUST_FORMULA = "Score = α · K + (1 − α) · B";
export const TRUST_FORMULA_ALPHA = "α = max(0.30, 1 − jobs / 20)";

export function trustTier(score: number): { label: string; tone: "high" | "mid" | "low" } {
  if (score >= 80) return { label: "Trusted", tone: "high" };
  if (score >= 50) return { label: "Building", tone: "mid" };
  return { label: "At risk", tone: "low" };
}

// ----- the demo deal -----

export const AMOUNT = 1200000;

// What "AI extraction" returns from the uploaded screenshot (hardcoded).
export const DEMO_VAULT_INFO = {
  category: "Electronics / Gadget purchase",
  price: AMOUNT,
  delivery: "14 June 2026",
  item: "MacBook M3",
  ram: "16GB RAM",
  storage: "512GB SSD",
  confidence: 97,
};

export type VaultInfo = typeof DEMO_VAULT_INFO;

// ----- demo dashboard data -----
//
// Pre-baked history so the dashboard, activity feed and profile feel lived-in
// the moment a demo account logs in (no real backend behind any of this).

/** Seller's settled earnings shown before any live demo deal completes. */
export const WALLET_BASELINE = 248_500;

export type TxStatus = "released" | "refunded" | "in_escrow";

export type DemoTx = {
  id: string;
  item: string;
  counterparty: string;
  amount: number;
  date: string; // human display, e.g. "10 Jun 2026"
  status: TxStatus;
  invoiceNo?: string;
};

const DEMO_TX_SELLER: DemoTx[] = [
  { id: "tx_s1", item: "Ankara Gown Set", counterparty: "Adaeze Nwosu", amount: 85_000, date: "10 Jun 2026", status: "released", invoiceNo: "CHF-10288" },
  { id: "tx_s2", item: "iPhone 13 Pro · UK used", counterparty: "Tunde Bakare", amount: 540_000, date: "6 Jun 2026", status: "released", invoiceNo: "CHF-10284" },
  { id: "tx_s3", item: "Custom Aso-Ebi · 5 yards", counterparty: "Ngozi Eze", amount: 120_000, date: "2 Jun 2026", status: "released", invoiceNo: "CHF-10279" },
  { id: "tx_s4", item: "Nike Air Force 1", counterparty: "David Okon", amount: 78_000, date: "28 May 2026", status: "refunded" },
  { id: "tx_s5", item: 'Samsung 43" Smart TV', counterparty: "Blessing Ade", amount: 310_000, date: "21 May 2026", status: "released", invoiceNo: "CHF-10268" },
  { id: "tx_s6", item: "Designer Bob Wig", counterparty: "Halima Yusuf", amount: 95_000, date: "14 May 2026", status: "released", invoiceNo: "CHF-10255" },
];

const DEMO_TX_BUYER: DemoTx[] = [
  { id: "tx_b1", item: "PS5 Slim + 2 pads", counterparty: "GameHub NG", amount: 720_000, date: "8 Jun 2026", status: "released", invoiceNo: "GH-4471" },
  { id: "tx_b2", item: "Ergonomic Office Chair", counterparty: "Lagos Furniture", amount: 145_000, date: "1 Jun 2026", status: "released", invoiceNo: "LF-2210" },
  { id: "tx_b3", item: "iPhone 12 · swap deal", counterparty: "Mobile Plug", amount: 260_000, date: "24 May 2026", status: "refunded" },
  { id: "tx_b4", item: "Air Jordan 4 Retro", counterparty: "KicksLagos", amount: 165_000, date: "16 May 2026", status: "released", invoiceNo: "KL-0091" },
  { id: "tx_b5", item: "Mini HD Projector", counterparty: "TechBay", amount: 88_000, date: "9 May 2026", status: "released", invoiceNo: "TB-7732" },
];

export function demoTransactions(role: Role): DemoTx[] {
  return role === "seller" ? DEMO_TX_SELLER : DEMO_TX_BUYER;
}

export type DemoActivityKind = "released" | "join" | "funded" | "trust" | "dispute" | "info";

export type DemoActivityItem = {
  id: string;
  kind: DemoActivityKind;
  text: string;
  time: string;
};

const DEMO_ACTIVITY_SELLER: DemoActivityItem[] = [
  { id: "a_s1", kind: "released", text: "₦85,000 released to your OPay — Ankara Gown Set", time: "2h ago" },
  { id: "a_s2", kind: "trust", text: "Trust score +2 — trade with Adaeze Nwosu completed", time: "2h ago" },
  { id: "a_s3", kind: "join", text: "Tunde Bakare joined your vault TF-7K2M-QX4P", time: "Yesterday" },
  { id: "a_s4", kind: "funded", text: "₦540,000 secured in escrow — iPhone 13 Pro", time: "Yesterday" },
  { id: "a_s5", kind: "dispute", text: "Report dismissed — complaint found baseless · +10", time: "3 days ago" },
  { id: "a_s6", kind: "info", text: "Invoice CHF-10279 auto-generated for Ngozi Eze", time: "4 days ago" },
];

const DEMO_ACTIVITY_BUYER: DemoActivityItem[] = [
  { id: "a_b1", kind: "released", text: "You confirmed delivery — ₦720,000 released to GameHub NG", time: "5h ago" },
  { id: "a_b2", kind: "trust", text: "Trust score +2 — clean trade with GameHub NG", time: "5h ago" },
  { id: "a_b3", kind: "funded", text: "₦145,000 locked in escrow — Ergonomic Office Chair", time: "2 days ago" },
  { id: "a_b4", kind: "dispute", text: "Refund approved — iPhone 12 not as described", time: "1 week ago" },
  { id: "a_b5", kind: "join", text: "You joined Mobile Plug's vault TF-9F3T-LM2K", time: "1 week ago" },
  { id: "a_b6", kind: "info", text: "Receipt KL-0091 saved — Air Jordan 4 Retro", time: "2 weeks ago" },
];

export function demoActivity(role: Role): DemoActivityItem[] {
  return role === "seller" ? DEMO_ACTIVITY_SELLER : DEMO_ACTIVITY_BUYER;
}

export type MonthPoint = { label: string; value: number }; // value in ₦ thousands

const DEMO_MONTHLY_SELLER: MonthPoint[] = [
  { label: "Dec", value: 410 },
  { label: "Jan", value: 620 },
  { label: "Feb", value: 540 },
  { label: "Mar", value: 880 },
  { label: "Apr", value: 760 },
  { label: "May", value: 1190 },
  { label: "Jun", value: 1340 },
];

const DEMO_MONTHLY_BUYER: MonthPoint[] = [
  { label: "Dec", value: 180 },
  { label: "Jan", value: 240 },
  { label: "Feb", value: 90 },
  { label: "Mar", value: 410 },
  { label: "Apr", value: 165 },
  { label: "May", value: 348 },
  { label: "Jun", value: 865 },
];

export function demoMonthly(role: Role): MonthPoint[] {
  return role === "seller" ? DEMO_MONTHLY_SELLER : DEMO_MONTHLY_BUYER;
}

// ----- vault domain types -----

export type VaultStatus = "awaiting" | "buyerJoined" | "funded" | "delivered" | "released";
export type EventKind =
  | "info"
  | "request"
  | "join"
  | "deposit"
  | "funded"
  | "delivered"
  | "released";

export type VaultEvent = {
  id: number;
  text: string;
  kind: EventKind;
  at: number;
};

export type Vault = {
  code: string;
  info: VaultInfo;
  status: VaultStatus;
  copied: boolean;
  joinRequest: boolean;
  buyer: { name: string } | null;
  balance: number; // funds currently held in the vault
  payout: number; // funds disbursed to the seller's OPay account
  releaseQr: boolean; // buyer has shown their one-time release QR
  invoiceNo: string | null; // auto-generated on completion
  events: VaultEvent[];
  createdAt: number;
};

export type AppState = {
  user: User | null;
  vault: Vault | null;
  walletBalance: number; // seller's settled earnings, persists across deals
};

// ----- helpers -----

export const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export function makeVaultCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TF-${seg()}-${seg()}`;
}

export function nextEventId(): number {
  return Math.floor(Math.random() * 1e9);
}

export function makeInvoiceNo(prefix = "INV"): string {
  return `${prefix}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}

export function newVault(): Vault {
  return {
    code: makeVaultCode(),
    info: DEMO_VAULT_INFO,
    status: "awaiting",
    copied: false,
    joinRequest: false,
    buyer: null,
    balance: 0,
    payout: 0,
    releaseQr: false,
    invoiceNo: null,
    events: [
      {
        id: nextEventId(),
        text: "Vault created and locked — waiting for a buyer",
        kind: "info",
        at: Date.now(),
      },
    ],
    createdAt: Date.now(),
  };
}

// ----- accounts persistence (localStorage) -----

const ACCOUNTS_KEY = "trustflow:accounts:v1";

function readAccounts(): Record<string, StoredAccount> {
  if (typeof window === "undefined") return {};
  let map: Record<string, StoredAccount> = {};
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (raw) map = JSON.parse(raw) as Record<string, StoredAccount>;
  } catch {
    map = {};
  }
  // Always ensure the seed accounts exist (without clobbering evolved scores).
  let changed = false;
  for (const seed of SEED_ACCOUNTS) {
    if (!map[seed.email]) {
      map[seed.email] = { ...seed };
      changed = true;
    }
  }
  if (changed) writeAccounts(map);
  return map;
}

function writeAccounts(map: Record<string, StoredAccount>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
  } catch {
    /* storage may be unavailable — demo still runs in-memory */
  }
}

function toUser(acc: StoredAccount): User {
  const { password: _pw, ...user } = acc;
  void _pw;
  return user;
}

export function validateLogin(email: string, password: string): User | null {
  const key = email.trim().toLowerCase();
  const acc = readAccounts()[key];
  if (acc && acc.password === password) return toUser(acc);
  return null;
}

export type SignupInput = {
  role: Role;
  name: string;
  email: string;
  password: string;
  invoice?: InvoiceBrand;
};

/** Create + persist a new account (trust score starts at 100) and return it. */
export function registerAccount(input: SignupInput): { user: User | null; error?: string } {
  const key = input.email.trim().toLowerCase();
  const map = readAccounts();
  if (map[key]) return { user: null, error: "An account with this email already exists." };
  const acc: StoredAccount = {
    id: `acc_${Math.random().toString(36).slice(2, 9)}`,
    role: input.role,
    name: input.name.trim(),
    email: key,
    password: input.password,
    trustScore: STARTING_TRUST,
    tradesCompleted: 0,
    invoice: input.role === "seller" ? input.invoice : undefined,
    createdAt: Date.now(),
  };
  map[key] = acc;
  writeAccounts(map);
  return { user: toUser(acc) };
}

/** Apply a completed-trade bump (+2 score, +1 trade) to a persisted account. */
export function bumpAccountTrust(email: string): void {
  const key = email.trim().toLowerCase();
  const map = readAccounts();
  const acc = map[key];
  if (!acc) return;
  acc.trustScore = Math.min(100, acc.trustScore + 2);
  acc.tradesCompleted += 1;
  writeAccounts(map);
}

/** Persist edits to a seller's invoice branding. */
export function updateAccountInvoice(email: string, invoice: InvoiceBrand): void {
  const key = email.trim().toLowerCase();
  const map = readAccounts();
  const acc = map[key];
  if (!acc) return;
  acc.invoice = invoice;
  writeAccounts(map);
}

/** Return the trade-completed bump applied to a user in app state. */
export function applyTradeCompleted(user: User): User {
  return {
    ...user,
    trustScore: Math.min(100, user.trustScore + 2),
    tradesCompleted: user.tradesCompleted + 1,
  };
}

/** Public lookup of a persisted account (no password) — used to refresh a
 *  session user's live trust score after a counterparty action. */
export function getAccount(email: string): User | null {
  const acc = readAccounts()[email.trim().toLowerCase()];
  return acc ? toUser(acc) : null;
}

// ----- persistence -----
//
// The session USER lives in sessionStorage (per browser tab) so a presenter can
// be logged in as the seller in one tab and the buyer in another at the same
// time. The shared VAULT + wallet live in localStorage so both tabs see the
// same deal and stay in sync via the `storage` event.

const USER_KEY = "trustflow:user:v3"; // sessionStorage, per tab
export const VAULT_KEY = "trustflow:vault:v3"; // localStorage, shared

export type SharedState = { vault: Vault | null; walletBalance: number };

function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function loadShared(): SharedState {
  if (typeof window === "undefined") return { vault: null, walletBalance: WALLET_BASELINE };
  try {
    const raw = window.localStorage.getItem(VAULT_KEY);
    if (!raw) return { vault: null, walletBalance: WALLET_BASELINE };
    const parsed = JSON.parse(raw) as Partial<SharedState>;
    return {
      vault: parsed.vault ?? null,
      walletBalance: parsed.walletBalance ?? parsed.vault?.payout ?? WALLET_BASELINE,
    };
  } catch {
    return { vault: null, walletBalance: WALLET_BASELINE };
  }
}

export function loadState(): AppState {
  return { user: loadUser(), ...loadShared() };
}

export function loadSharedState(): SharedState {
  return loadShared();
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    if (state.user) window.sessionStorage.setItem(USER_KEY, JSON.stringify(state.user));
    else window.sessionStorage.removeItem(USER_KEY);
    window.localStorage.setItem(
      VAULT_KEY,
      JSON.stringify({ vault: state.vault, walletBalance: state.walletBalance }),
    );
  } catch {
    /* storage may be unavailable (private mode / embeds) — demo still runs in-memory */
  }
}

/** Sign in: persist the session user for this tab. */
export function persistUser(user: User): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

// Lets the profile page hand the in-app nav a target view: it stashes the
// intended view, navigates to /app, and the app consumes it once on mount.
const PENDING_VIEW_KEY = "trustflow:view";

export function setPendingView(view: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_VIEW_KEY, view);
  } catch {
    /* ignore */
  }
}

export function consumePendingView(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(PENDING_VIEW_KEY);
    if (v) window.sessionStorage.removeItem(PENDING_VIEW_KEY);
    return v;
  } catch {
    return null;
  }
}

/** Log out this tab only — the shared vault stays so a presenter can swap logins. */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}
