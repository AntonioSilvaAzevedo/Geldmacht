'use client';

import Link from 'next/link';
import { AlertTriangle, Database, Upload } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Variant = 'empty' | 'error';

interface Props {
  variant: Variant;
  title?: string;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const VARIANTS = {
  empty: {
    iconBg: 'rgba(49,130,206,0.1)',
    iconColor: 'var(--blue-400)',
    DefaultIcon: Database,
    defaultTitle: 'Nenhum dado importado ainda',
    defaultMessage: 'Importe um extrato para começar a ver seus dados no Dashboard.',
  },
  error: {
    iconBg: 'rgba(229,62,62,0.1)',
    iconColor: 'var(--red-400)',
    DefaultIcon: AlertTriangle,
    defaultTitle: 'Erro ao carregar dados',
    defaultMessage: 'Verifique se o backend está rodando em localhost:8000',
  },
} as const;

export default function StatePanel({
  variant,
  title,
  message,
  actionHref,
  actionLabel = 'Importar extrato',
  onAction,
  icon,
}: Props) {
  const v = VARIANTS[variant];
  const Icon = v.DefaultIcon;
  const hasAction = actionHref != null || onAction != null;
  const resolvedTitle = title ?? v.defaultTitle;
  const resolvedMessage = message ?? v.defaultMessage;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 48,
      textAlign: 'center',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: v.iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon ?? <Icon size={22} color={v.iconColor} />}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          {resolvedTitle}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginBottom: hasAction ? 16 : 0,
          maxWidth: 320,
        }}>
          {resolvedMessage}
        </div>
        {hasAction && (onAction ? (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : (
          <Link
            href={actionHref!}
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
          >
            <Upload size={14} />
            {actionLabel}
          </Link>
        ))}
      </div>
    </div>
  );
}
