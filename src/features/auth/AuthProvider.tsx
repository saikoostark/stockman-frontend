"use client";

import { createContext, useCallback, useContext, useMemo } from "react";

import { useCapabilities, useMe } from "./api";
import type { Capabilities, Me } from "./types";

interface AuthContextValue {
  user: Me | null;
  capabilities: Capabilities | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  can: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const capabilities = useCapabilities(me.data != null);

  const can = useCallback(
    (action: string) => Boolean(capabilities.data?.actions[action]),
    [capabilities.data],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data ?? null,
      capabilities: capabilities.data ?? null,
      isLoading: me.isPending,
      isAuthenticated: me.data != null,
      can,
    }),
    [me.data, me.isPending, capabilities.data, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
