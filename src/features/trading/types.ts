export interface Order {
  id: string;
  instrument_id: string;
  symbol: string;
  currency: string;
  side: "BUY" | "SELL";
  order_type: "MARKET" | "LIMIT";
  quantity: string | null;
  limit_price: string | null;
  budget: string | null;
  reserved_cash: string;
  reserved_quantity: string;
  status: "OPEN" | "FILLED" | "CANCELLED" | "EXPIRED";
  created_at: string;
  accepted_at: string;
  expires_at: string | null;
  closed_at: string | null;
  close_reason: string;
  source_watermark: string;
  generation: string;
}

export interface Fill {
  id: string;
  order_id: string;
  instrument_id: string;
  symbol: string;
  currency: string;
  side: string;
  quantity: string;
  price: string;
  cash: string;
  cost_basis: string;
  realized_pnl: string;
  fees: string;
  source_at: string;
  source_watermark: string;
  generation: string;
  created_at: string;
}

export interface Holding {
  instrument_id: string;
  symbol: string;
  currency: string;
  available: string;
  reserved: string;
  cost_basis: string;
  realized_pnl: string;
  mark_price: string | null;
  market_value: string | null;
  unrealized_pnl: string | null;
  mark_source_at: string | null;
  stale: boolean;
}

export interface PortfolioCurrency {
  currency: string;
  realized_pnl: string;
  unrealized_pnl: string | null;
  market_value: string | null;
  stale: boolean;
  holdings: Holding[];
}
