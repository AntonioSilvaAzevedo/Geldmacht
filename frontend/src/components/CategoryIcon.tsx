'use client';

import { Tag } from 'lucide-react';

import {
  CATEGORY_ICONS,
  getFlatIconOptions,
  resolveIconKey,
} from './category-icons-catalog';

export {
  CATEGORY_ICONS,
  CATEGORY_ICON_GROUPS,
  getFlatIconOptions,
  ICON_KEY_ALIASES,
  ICON_LABELS,
  resolveIconKey,
} from './category-icons-catalog';

export type { CategoryIconGroup } from './category-icons-catalog';

/** Lista plana para compatibilidade com código legado (`ICON_OPTIONS`). */
export const ICON_OPTIONS = getFlatIconOptions();

interface CategoryIconProps {
  icon?: string | null;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Renderiza o ícone de uma categoria ou subcategoria.
 * Usa fallback `Tag` quando a chave não existe após aliases.
 */
export default function CategoryIcon({ icon, size = 14, color, className }: CategoryIconProps) {
  const key = resolveIconKey(icon);
  const IconComponent = CATEGORY_ICONS[key] ?? Tag;
  return <IconComponent size={size} color={color} className={className} />;
}
