import { useCallback, useEffect, useState } from "react";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export type Loaded<T> = {
  data: T | undefined;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Загружает данные и перезагружает их при смене deps.
 * 401 означает, что сессия истекла: пользователь сбрасывается, страница покажет вход.
 */
export function useLoad<T>(load: (() => Promise<T>) | null, deps: unknown[]): Loaded<T> {
  const { forget } = useAuth();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(Boolean(load));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!load) { setLoading(false); setData(undefined); return; }
    let alive = true;
    setLoading(true);
    load()
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e: unknown) => {
        if (!alive) return;
        const err = e instanceof ApiError ? e : new ApiError(0, undefined, null);
        if (err.status === 401) forget();
        setError(err);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- зависимости задаёт вызывающий
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
