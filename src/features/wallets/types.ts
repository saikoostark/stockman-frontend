export type WalletCurrency = "EGP" | "USDT";

export interface Wallet {
  currency: WalletCurrency;
  available: string;
  reserved: string;
}

export interface JournalEntry {
  account: "AVAILABLE" | "RESERVED" | "ISSUANCE" | "CLEARING";
  amount: string;
}

export interface Journal {
  id: string;
  currency: string;
  kind: string;
  reference: string;
  reversal_of: string | null;
  created_at: string;
  posted_at: string | null;
  reason: string;
  entries: JournalEntry[];
}
