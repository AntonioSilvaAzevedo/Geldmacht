'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  children?: ReactNode;
  className?: string;
}

const ACTION_CLASS =
  'inline-flex items-center justify-center gap-1.5 rounded-[9px] border border-[var(--border-default)] bg-transparent px-[18px] py-[9px] text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]';

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
  children,
  className,
}: EmptyStateProps) {
  const hasInlineAction = actionLabel != null && (onAction != null || actionHref != null);

  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className ?? ''}`}
    >
      {icon != null && (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-hover)] text-[var(--text-tertiary)]">
          {icon}
        </div>
      )}

      <div className="flex flex-col items-center gap-1.5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {title}
        </h2>
        {description != null && (
          <p className="max-w-[300px] text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        )}
      </div>

      {hasInlineAction &&
        (actionHref != null ? (
          <Link href={actionHref} className={ACTION_CLASS}>
            {actionLabel}
          </Link>
        ) : (
          <button type="button" onClick={onAction} className={ACTION_CLASS}>
            {actionLabel}
          </button>
        ))}

      {children}
    </div>
  );
}
