'use client';

import { useState, useEffect } from 'react';
import type {
  MonthlyData,
  Transactions,
  CreditCardData,
  InvestmentsData,
  DividendsData,
} from '@/types/financial';

export type DatasetName = 'monthly' | 'transactions' | 'creditCard' | 'investments' | 'dividends';

interface DatasetTypeMap {
  monthly:      MonthlyData;
  transactions: Transactions;
  creditCard:   CreditCardData;
  investments:  InvestmentsData;
  dividends:    DividendsData;
}

interface UseFinancialDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * Fase 3: monthly e transactions buscam da API real.
 * creditCard, investments e dividends ainda lêem do archive (Etapa 3.2+).
 */
const datasetLoaders: Record<DatasetName, () => Promise<unknown>> = {
  // ✅ API real
  monthly: () =>
    fetch(`${API_BASE}/api/dashboard/monthly`).then(r => {
      if (!r.ok) throw new Error(`dashboard/monthly: ${r.status}`);
      return r.json();
    }),

  transactions: () =>
    fetch(`${API_BASE}/api/transactions?limit=1000`).then(r => {
      if (!r.ok) throw new Error(`transactions: ${r.status}`);
      return r.json();
    }),

  // ⚫ Etapa 3.2+ — sem dados ainda
  creditCard:  () => Promise.resolve(null),
  investments: () => Promise.resolve(null),
  dividends:   () => Promise.resolve(null),
};

export function useFinancialData<K extends DatasetName>(
  dataset: K,
): UseFinancialDataResult<DatasetTypeMap[K]> {
  const [data, setData]       = useState<DatasetTypeMap[K] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    datasetLoaders[dataset]()
      .then(result => {
        if (!cancelled) {
          setData(result as DatasetTypeMap[K]);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [dataset]);

  return { data, loading, error };
}
