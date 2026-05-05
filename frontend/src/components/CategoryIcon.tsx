'use client';

import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  HeartPulse,
  Gamepad2,
  Plane,
  Dumbbell,
  Receipt,
  Tag,
  Shirt,
  BookOpen,
  Music,
  Wifi,
  Coffee,
  Baby,
  PawPrint,
  Wrench,
  Gift,
  Zap,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

// ── Mapa de chave → componente ────────────────────────────────────────────────
// Nunca renderizar ícone dinamicamente a partir de string arbitrária.
// Adicionar ícones aqui conforme necessário.

type IconComponent = React.ComponentType<LucideProps>;

export const CATEGORY_ICONS: Record<string, IconComponent> = {
  'shopping-cart': ShoppingCart,
  'utensils':      Utensils,
  'car':           Car,
  'home':          Home,
  'heart-pulse':   HeartPulse,
  'gamepad':       Gamepad2,
  'plane':         Plane,
  'dumbbell':      Dumbbell,
  'receipt':       Receipt,
  'tag':           Tag,
  'shirt':         Shirt,
  'book':          BookOpen,
  'music':         Music,
  'wifi':          Wifi,
  'coffee':        Coffee,
  'baby':          Baby,
  'paw':           PawPrint,
  'wrench':        Wrench,
  'gift':          Gift,
  'zap':           Zap,
};

/** Opções para o seletor de ícones — label amigável + chave. */
export const ICON_OPTIONS: { key: string; label: string }[] = [
  { key: 'tag',           label: 'Genérico' },
  { key: 'shopping-cart', label: 'Compras' },
  { key: 'utensils',      label: 'Alimentação' },
  { key: 'car',           label: 'Transporte' },
  { key: 'home',          label: 'Casa' },
  { key: 'heart-pulse',   label: 'Saúde' },
  { key: 'gamepad',       label: 'Lazer' },
  { key: 'plane',         label: 'Viagem' },
  { key: 'dumbbell',      label: 'Academia' },
  { key: 'receipt',       label: 'Contas' },
  { key: 'shirt',         label: 'Vestuário' },
  { key: 'book',          label: 'Educação' },
  { key: 'music',         label: 'Música' },
  { key: 'wifi',          label: 'Internet' },
  { key: 'coffee',        label: 'Café' },
  { key: 'baby',          label: 'Filhos' },
  { key: 'paw',           label: 'Pets' },
  { key: 'wrench',        label: 'Serviços' },
  { key: 'gift',          label: 'Presente' },
  { key: 'zap',           label: 'Energia' },
];

interface CategoryIconProps {
  icon?: string | null;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Renderiza o ícone de uma categoria.
 * Usa fallback `Tag` quando o ícone não existe ou é nulo.
 */
export default function CategoryIcon({ icon, size = 14, color, className }: CategoryIconProps) {
  const IconComponent = (icon && CATEGORY_ICONS[icon]) ? CATEGORY_ICONS[icon] : Tag;
  return <IconComponent size={size} color={color} className={className} />;
}
