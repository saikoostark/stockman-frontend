/**
 * Canonical action (permission) identifiers known to the backend group
 * registry. Keep in sync with the backend PermissionsEnum.
 */
export const ADMIN_ACTIONS = [
  "markets.read",
  "wallets.read",
  "wallets.fund",
  "trading.read",
  "trading.place",
  "trading.cancel",
  "alerts.read",
  "alerts.manage",
  "events.read",
  "audit.read",
  "access.manage",
  "catalog.manage",
] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export type Ownership = "own" | "owner_groups" | "all";

export interface ActionScope {
  ownership: Ownership;
  markets?: string[];
  currencies?: string[];
}

export interface GroupAttributes {
  schema_version: number;
  scopes: Record<string, ActionScope>;
  deny_actions: string[];
}

export interface Group {
  id: number;
  name: string;
  permissions: string[];
  attributes: GroupAttributes;
}

export interface User {
  id: number;
  username: string;
  email: string;
  locale: string;
  is_active: boolean;
  authorization_revision: number;
  group_ids: number[];
}
