// TrustFlow demo "backend".
//
// There is no real server: this whole app is a hardcoded demo. Auth, the vault,
// the buyer joining and the deposit are all driven from here + localStorage so
// the experience behaves like a real app (persists across refresh / navigation)
// while staying fully scripted for a live presentation.

// ----- hardcoded credentials -----

export const CREDENTIALS = {
  // Accepts either the name or the email as the login identifier.
  name: "chioma esther",
  email: "chioma.esther@gmail.com",
  password: "54545454",
};

export const SELLER_NAME = "Chioma Esther";

export const BUYER = {
  name: "Emeka Okafor",
  handle: "emeka.okafor@gmail.com",
};

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

// ----- domain types -----

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

export type User = { name: string; email: string };

export type AppState = {
  user: User | null;
  vault: Vault | null;
  walletBalance: number; // seller's settled earnings (paid out from completed vaults), persists across deals
};

// ----- helpers -----

export const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export function validateLogin(identifier: string, password: string): User | null {
  const id = identifier.trim().toLowerCase();
  const matches = id === CREDENTIALS.name || id === CREDENTIALS.email;
  if (matches && password === CREDENTIALS.password) {
    return { name: SELLER_NAME, email: CREDENTIALS.email };
  }
  return null;
}

export function makeVaultCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TF-${seg()}-${seg()}`;
}

export function nextEventId(): number {
  return Math.floor(Math.random() * 1e9);
}

export function makeInvoiceNo(): string {
  return `INV-${String(Math.floor(Math.random() * 90000) + 10000)}`;
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

// ----- persistence (localStorage) -----

const KEY = "trustflow:state:v2";
const EMPTY: AppState = { user: null, vault: null, walletBalance: 0 };

export function loadState(): AppState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AppState;
    return {
      user: parsed.user ?? null,
      vault: parsed.vault ?? null,
      // Fall back to a previously released vault's payout so older saved sessions still show a balance.
      walletBalance: parsed.walletBalance ?? parsed.vault?.payout ?? 0,
    };
  } catch {
    return EMPTY;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable (private mode / embeds) — demo still runs in-memory */
  }
}

/** Sign in: persist the user while preserving any existing vault. */
export function persistUser(user: User): void {
  const current = loadState();
  saveState({ ...current, user });
}

export function clearSession(): void {
  saveState(EMPTY);
}
