'use client';

import { useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api/client';

interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (msg: string) => void;
}

interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T | null>;
  loading: boolean;
  error: string | null;
}

export function useMutation<T = void, V = unknown>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string | ((v: V) => string),
  options?: UseMutationOptions<T>,
): UseMutationResult<T, V> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mutate(variables: V): Promise<T | null> {
    const url = typeof path === 'function' ? path(variables) : path;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(url, {
        method,
        body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
      });
      options?.onSuccess?.(result);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Erro na operação';
      setError(msg);
      options?.onError?.(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { mutate, loading, error };
}
