export type AlertKind = "PRICE_ABOVE" | "PRICE_BELOW" | "PERCENT_RISE" | "PERCENT_DROP";

export interface Alert {
  id: string;
  instrument_id: string;
  symbol: string;
  market: string;
  currency: string;
  kind: AlertKind;
  threshold: string;
  window_seconds: number | null;
  cooldown_seconds: number;
  enabled: boolean;
  last_condition: boolean | null;
  last_observation_id: string;
  generation: string | null;
  last_source_at: string | null;
  last_triggered_at: string | null;
  baseline_at: string | null;
  state_reason: string;
  created_at: string;
  updated_at: string;
}

export interface InstrumentOption {
  id: string;
  symbol: string;
  name: string;
  currency: string;
}

/** Raw item shape returned by GET /instruments/ before mapping to InstrumentOption. */
export interface InstrumentListItem extends InstrumentOption {
  market: string;
}

export interface CreateAlertInput {
  instrument_id: string;
  kind: AlertKind;
  threshold: string;
  window_seconds?: number | null;
  cooldown_seconds?: number;
  enabled?: boolean;
}

export type UpdateAlertInput = Partial<CreateAlertInput>;

export interface DeletedAlert {
  id: string;
  deleted: boolean;
}
