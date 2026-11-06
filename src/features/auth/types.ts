export type AppLocale = "en" | "ar" | "de" | "es";

export interface Me {
  id: number;
  username: string;
  email: string;
  locale: AppLocale;
  is_active: boolean;
  authorization_revision: number;
  group_ids: number[];
}

export interface ActionScope {
  ownership: "own" | "owner_groups" | "all";
  markets?: string[];
  currencies?: string[];
  owner_group_ids?: number[];
}

export interface PolicySchema {
  schema_version: number;
  markets: string[];
  currencies: string[];
  actions: Record<
    string,
    { ownership: string[]; markets: boolean; currencies: boolean }
  >;
}

export interface Capabilities {
  authorization_revision: number;
  actions: Record<string, ActionScope[]>;
  policy_schema: PolicySchema;
}
