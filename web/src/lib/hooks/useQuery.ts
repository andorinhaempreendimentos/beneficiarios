'use client';

import { useEffect, useRef, useState } from 'react';
import { apiGet, ApiError } from '@/lib/api/client';

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useQuery<T>(
  path: string | null,
  params?: Record<string, string | number | boolean | undefined>,
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const builtPath = path
    ? buildPath(path, params)
    : null;

  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (!builtPath) return;
    prevPath.current = builtPath;
    setLoading(true);
    setError(null);
    let cancelled = false;

    apiGet<T>(builtPath)
      .then((res) => { if (!cancelled) { setData(res); setLoading(false); } })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.message : 'Erro ao carregar dados';
        setError(msg);
        setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtPath, tick]);

  return {
    data,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}

function buildPath(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return path;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${path}?${qs}` : path;
}
