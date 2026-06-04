import { useState, useEffect, useCallback } from "react";
import type { ModelStatus } from "../lib/ipc";
import { sidecar } from "../lib/sidecar";

interface UseModelStatusResult {
  status: ModelStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useModelStatus(): UseModelStatusResult {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await sidecar.modelStatus();
      setStatus(s);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { status, loading, error, refetch: fetch };
}
