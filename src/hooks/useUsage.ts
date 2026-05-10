import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UsageState {
  freeUsesCount: number;
  freeRemaining: number;
  subscriptionExpiresAt: string | null;
  subscriptionStartedAt: string | null;
  activeCode: string | null;
  hasActiveSubscription: boolean;
  loading: boolean;
}

const FREE_LIMIT = 4;

export function useUsage(userId: string | undefined) {
  const [state, setState] = useState<UsageState>({
    freeUsesCount: 0,
    freeRemaining: FREE_LIMIT,
    subscriptionExpiresAt: null,
    subscriptionStartedAt: null,
    activeCode: null,
    hasActiveSubscription: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!userId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const { data } = await supabase
      .from("user_usage")
      .select("free_uses_count, subscription_expires_at, subscription_started_at, active_code")
      .eq("user_id", userId)
      .maybeSingle();

    const freeUsesCount = data?.free_uses_count ?? 0;
    const expiresAt = data?.subscription_expires_at ?? null;
    const startedAt = (data as any)?.subscription_started_at ?? null;
    const activeCode = data?.active_code ?? null;
    const hasActive = !!expiresAt && new Date(expiresAt) > new Date();

    setState({
      freeUsesCount,
      freeRemaining: Math.max(0, FREE_LIMIT - freeUsesCount),
      subscriptionExpiresAt: expiresAt,
      subscriptionStartedAt: startedAt,
      activeCode,
      hasActiveSubscription: hasActive,
      loading: false,
    });
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
