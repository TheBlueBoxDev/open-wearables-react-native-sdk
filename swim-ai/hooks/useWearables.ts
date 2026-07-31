import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  ProviderSetting,
  UserConnection,
  getProviders,
  getUserConnections,
} from "../api/cloud";

export function useWearables(userId: string | null) {
  const [apiProviders, setApiProviders] = useState<ProviderSetting[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const loadedOnceRef = useRef(false);
  const pendingAuthRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    if (userId == null) {
      setApiProviders([]);
      setConnections([]);
      setError(null);
      setLoading(false);
      return;
    }

    if (loadedOnceRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [providers, userConnections] = await Promise.all([
        getProviders(),
        getUserConnections(userId),
      ]);
      if (!mountedRef.current) return;

      setApiProviders(providers);
      setConnections(userConnections);
      setError(null);
    } catch (e: any) {
      if (!mountedRef.current) return;
      setError(e?.message ?? String(e));
    } finally {
      if (mountedRef.current) {
        loadedOnceRef.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [userId]);

  // The user leaves the app for the provider's OAuth page in an external
  // browser; re-fetch the connections when they come back.
  const markPendingAuth = useCallback(() => {
    pendingAuthRef.current = true;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !pendingAuthRef.current) return;
      pendingAuthRef.current = false;
      refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  return {
    apiProviders,
    connections,
    loading,
    refreshing,
    error,
    refetch,
    markPendingAuth,
  };
}
