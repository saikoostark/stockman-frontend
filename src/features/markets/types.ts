export type MarketCode = "CRYPTO" | "EGX";
export type CurrencyCode = "USDT" | "EGP";

export interface QuoteView {
  price: string;
  source: string;
  source_at: string;
  received_at: string;
  observation_id: string;
  generation: string;
  tradable: boolean;
  stale: boolean;
  delay_seconds: number;
  currency: string;
}

export interface InstrumentView {
  id: string;
  symbol: string;
  name: string;
  market: MarketCode;
  currency: CurrencyCode;
  provider: string;
  price_scale: number;
  quantity_scale: number;
  price_step: string;
  quantity_step: string;
  minimum_quantity: string;
  minimum_notional: string;
  enabled: boolean;
  watched: boolean;
  data_mode: string;
  delay_seconds: number;
  cadence_seconds: number;
  venue_timezone: string;
  availability: string;
  reason: string;
  quote: QuoteView | null;
}

export interface ObservationView {
  id: number;
  price: string;
  source: string;
  source_at: string;
  received_at: string;
  currency: string;
  data_mode: string;
  delay_seconds: number;
  observation_id: string;
  generation: string;
  tradable: boolean;
  kind: string;
}

export interface CandleView {
  source: string;
  opened_at: string;
  closed_at: string;
  interval: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  currency: string;
  delay_seconds: number;
  complete: boolean;
  tradable: boolean;
}

export interface WatchView {
  instrument: InstrumentView;
  created_at: string;
}

export interface ProviderView {
  provider: string;
  market: MarketCode;
  currency: CurrencyCode;
  status: string;
  reason: string;
  message: string;
  data_mode: string;
  venue_timezone: string;
  delay_seconds: number;
  cadence_seconds: number;
  history_limit: number;
  entitlement_verified: boolean;
  last_success_at: string | null;
  retry_at: string | null;
}
