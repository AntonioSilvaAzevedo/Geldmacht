import { useEffect, useState } from 'react';

import { api, type BankAccountConfig, type Category, type IncomeSourceConfig, type MonthState } from '@/lib/api';

export function useLancamentoModalData(bankId: number | null, date: string) {
  const [banks, setBanks] = useState<BankAccountConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSourceConfig[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [monthStatus, setMonthStatus] = useState<MonthState | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoadingRefs(true);
    setLoadError(null);
    void Promise.all([api.listBankAccounts(false), api.listCategories('bank'), api.listIncomeSources()])
      .then(([b, c, s]) => {
        if (cancel) return;
        setBanks(b.filter((x) => x.is_active));
        setCategories(c);
        setIncomeSources(s.filter((x) => x.is_active));
      })
      .catch((err) => {
        if (!cancel) setLoadError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      })
      .finally(() => {
        if (!cancel) setLoadingRefs(false);
      });
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    if (!bankId) {
      setMonthStatus(null);
      return;
    }
    let cancel = false;
    void api
      .getMonthStatus(bankId, date.slice(0, 7))
      .then((result) => {
        if (!cancel) setMonthStatus(result);
      })
      .catch(() => {
        if (!cancel) setMonthStatus(null);
      });
    return () => { cancel = true; };
  }, [bankId, date]);

  return { banks, categories, incomeSources, loadingRefs, loadError, monthStatus };
}
