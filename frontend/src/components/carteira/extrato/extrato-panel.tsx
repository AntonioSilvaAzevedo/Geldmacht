"use client";

import { Button } from "@/components/ui/button";
import type { BankAccountConfig } from "@/lib/api";

export interface ExtratoPanelProps {
  accounts: BankAccountConfig[];
  activeAccountId: number | null;
  setActiveAccountId: (id: number) => void;
}

export function ExtratoPanel({
  accounts,
  activeAccountId,
  setActiveAccountId,
}: ExtratoPanelProps) {
  const activeAccount = accounts.find(
    (account) => account.id === activeAccountId,
  );

  if (accounts.length === 0) {
    return (
      <div className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-[var(--surface-card)] px-6 py-10 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          Nenhuma conta bancária nesta instituição.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.06] bg-[var(--surface-card)]">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <div className="text-[15px] font-bold tracking-[-0.01em]">
            Extrato
          </div>
          {activeAccount && (
            <div className="mt-[3px] text-xs text-[var(--text-secondary)]">
              {activeAccount.name}
            </div>
          )}
        </div>

        {accounts.length > 1 && (
          <div className="flex gap-1.5">
            {accounts.map((account) => (
              <Button
                key={account.id}
                type="button"
                variant={
                  activeAccountId === account.id ? "secondary" : "outline"
                }
                size="sm"
                className={`max-w-[148px] shrink truncate px-3 py-[5px] text-xs font-semibold tracking-wide ${activeAccountId === account.id ? "" : "font-normal opacity-95"}`}
                onClick={() => setActiveAccountId(account.id)}
              >
                {account.name.length > 12
                  ? `${account.name.slice(0, 10)}…`
                  : account.name}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
