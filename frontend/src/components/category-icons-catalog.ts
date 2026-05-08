/**
 * Catálogo de ícones de categoria: chaves persistidas no backend (string),
 * componentes Lucide apenas no front. Inclui aliases para chaves antigas/ alternativas.
 */
import type { LucideProps } from 'lucide-react';
import {
  Archive,
  Apple,
  Baby,
  Banknote,
  Beer,
  Bike,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  ChartColumn,
  CircleDollarSign,
  Cloud,
  Coffee,
  CreditCard,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Hospital,
  Lamp,
  Laptop,
  Milk,
  MonitorPlay,
  MoreHorizontal,
  Music,
  NotebookPen,
  Package,
  ParkingCircle,
  PartyPopper,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Plug,
  Pizza,
  Receipt,
  Repeat,
  Salad,
  Sandwich,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  ShowerHead,
  Smartphone,
  Sofa,
  Soup,
  Stethoscope,
  Store,
  Tag,
  Tags,
  Ticket,
  TrainFront,
  Tv,
  Utensils,
  Wallet,
  WashingMachine,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react';

type IconComponent = React.ComponentType<LucideProps>;

/** Mapeamento canônico: chave (kebab ou legada) → componente Lucide */
export const CATEGORY_ICONS: Record<string, IconComponent> = {
  // ── Genérico / compat ─────────────────────────────────────────────────────
  tag: Tag,
  tags: Tags,
  'circle-dollar-sign': CircleDollarSign,
  archive: Archive,
  'more-horizontal': MoreHorizontal,

  // Alimentação & bebidas
  utensils: Utensils,
  coffee: Coffee,
  pizza: Pizza,
  sandwich: Sandwich,
  apple: Apple,
  beef: Utensils,
  salad: Salad,
  soup: Soup,
  milk: Milk,

  // Mercado / compras
  'shopping-cart': ShoppingCart,
  'shopping-basket': ShoppingBasket,
  store: Store,
  package: Package,
  'shopping-bag': ShoppingBag,

  // Transporte
  car: Car,
  bus: Bus,
  bike: Bike,
  fuel: Fuel,
  'parking-circle': ParkingCircle,
  plane: Plane,
  'train-front': TrainFront,

  // Casa
  home: Home,
  sofa: Sofa,
  lamp: Lamp,
  plug: Plug,
  'shower-head': ShowerHead,
  'washing-machine': WashingMachine,

  // Saúde & fitness
  'heart-pulse': HeartPulse,
  pill: Pill,
  hospital: Hospital,
  stethoscope: Stethoscope,
  dumbbell: Dumbbell,

  // Lazer
  gamepad: Gamepad2,
  film: Film,
  music: Music,
  ticket: Ticket,
  beer: Beer,
  'party-popper': PartyPopper,

  // Assinaturas / streaming / tech
  repeat: Repeat,
  tv: Tv,
  'monitor-play': MonitorPlay,
  cloud: Cloud,
  wifi: Wifi,

  // Eletrônicos / vestuário / presentes
  shirt: Shirt,
  gift: Gift,
  smartphone: Smartphone,
  laptop: Laptop,

  // Finanças
  wallet: Wallet,
  'credit-card': CreditCard,
  receipt: Receipt,
  banknote: Banknote,
  'piggy-bank': PiggyBank,
  'chart-column': ChartColumn,

  // Educação / trabalho
  book: BookOpen,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  briefcase: Briefcase,
  'notebook-pen': NotebookPen,

  // Outros já usados no projeto
  baby: Baby,
  paw: PawPrint,
  wrench: Wrench,
  zap: Zap,
};

/**
 * Aliases: chave gravada no banco ou digitada → chave canônica em CATEGORY_ICONS.
 * Não altera dados no servidor; só resolve renderização.
 */
export const ICON_KEY_ALIASES: Record<string, string> = {
  food: 'utensils',
  restaurant: 'utensils',
  mercado: 'shopping-cart',
  delivery: 'bike',
  uber: 'car',
  netflix: 'tv',
  streaming: 'monitor-play',
  contas: 'receipt',
  moradia: 'home',
  educacao: 'book-open',
  'paw-print': 'paw',
};

/** Label amigável para busca e tooltips (chave canônica após resolver alias). */
export const ICON_LABELS: Record<string, string> = {
  tag: 'Genérico',
  tags: 'Múltiplas tags',
  utensils: 'Alimentação / refeições',
  coffee: 'Café',
  pizza: 'Pizza / fast-food',
  sandwich: 'Lanches',
  apple: 'Frutas / feira',
  beef: 'Carnes',
  salad: 'Saladas',
  soup: 'Sopas',
  milk: 'Laticínios',
  'shopping-cart': 'Mercado / carrinho',
  'shopping-basket': 'Cesta de compras',
  store: 'Loja',
  package: 'Pacote / entrega',
  'shopping-bag': 'Sacola de compras',
  car: 'Carro',
  bus: 'Ônibus',
  bike: 'Bike / entrega',
  fuel: 'Combustível',
  'parking-circle': 'Estacionamento',
  plane: 'Avião / viagem',
  'train-front': 'Trem',
  home: 'Casa',
  sofa: 'Sala / móveis',
  lamp: 'Iluminação',
  plug: 'Elétrica / tomadas',
  'shower-head': 'Banheiro / água',
  'washing-machine': 'Lavanderia',
  'heart-pulse': 'Saúde',
  pill: 'Medicamentos',
  hospital: 'Hospital',
  stethoscope: 'Consulta médica',
  dumbbell: 'Academia',
  gamepad: 'Jogos',
  film: 'Cinema / streaming',
  music: 'Música',
  ticket: 'Ingressos / eventos',
  beer: 'Bebidas / bar',
  'party-popper': 'Festas',
  repeat: 'Assinaturas / recorrente',
  tv: 'TV',
  'monitor-play': 'Vídeo / telas',
  cloud: 'Nuvem / online',
  wifi: 'Internet',
  shirt: 'Roupas',
  gift: 'Presentes',
  smartphone: 'Celular',
  laptop: 'Computador',
  wallet: 'Carteira / dinheiro',
  'credit-card': 'Cartão',
  receipt: 'Recibo / contas',
  banknote: 'Dinheiro',
  'piggy-bank': 'Economia',
  'chart-column': 'Finanças / gráfico',
  book: 'Livros',
  'book-open': 'Leitura',
  'graduation-cap': 'Graduação',
  briefcase: 'Trabalho',
  'notebook-pen': 'Estudos / anotações',
  baby: 'Filhos',
  paw: 'Pets',
  wrench: 'Serviços / manutenção',
  zap: 'Energia',
  'circle-dollar-sign': 'Valor / dólar',
  archive: 'Arquivo',
  'more-horizontal': 'Outros',
  circle: 'Tag genérica',
};

export interface CategoryIconGroup {
  id: string;
  title: string;
  keys: string[];
}

/** Grupos do seletor (ordem de exibição). Chaves devem existir em CATEGORY_ICONS após alias. */
export const CATEGORY_ICON_GROUPS: CategoryIconGroup[] = [
  {
    id: 'common',
    title: 'Uso comum',
    keys: ['tag', 'utensils', 'shopping-cart', 'car', 'home', 'wallet', 'receipt'],
  },
  {
    id: 'food',
    title: 'Alimentação',
    keys: ['utensils', 'coffee', 'pizza', 'sandwich', 'apple', 'milk', 'soup', 'salad', 'beer'],
  },
  {
    id: 'groceries',
    title: 'Mercado & compras',
    keys: ['shopping-cart', 'shopping-basket', 'store', 'package', 'shopping-bag', 'gift'],
  },
  {
    id: 'transport',
    title: 'Transporte',
    keys: ['car', 'bus', 'bike', 'fuel', 'parking-circle', 'plane', 'train-front'],
  },
  {
    id: 'home',
    title: 'Casa',
    keys: ['home', 'sofa', 'lamp', 'plug', 'shower-head', 'washing-machine', 'zap'],
  },
  {
    id: 'health',
    title: 'Saúde & bem-estar',
    keys: ['heart-pulse', 'pill', 'hospital', 'stethoscope', 'dumbbell'],
  },
  {
    id: 'leisure',
    title: 'Lazer',
    keys: ['gamepad', 'film', 'music', 'ticket', 'beer', 'party-popper'],
  },
  {
    id: 'subscriptions',
    title: 'Assinaturas & serviços',
    keys: ['repeat', 'tv', 'monitor-play', 'wifi', 'cloud'],
  },
  {
    id: 'finance',
    title: 'Finanças',
    keys: ['wallet', 'credit-card', 'receipt', 'banknote', 'piggy-bank', 'chart-column'],
  },
  {
    id: 'work-edu',
    title: 'Educação & trabalho',
    keys: ['book-open', 'graduation-cap', 'briefcase', 'laptop', 'smartphone'],
  },
  {
    id: 'other',
    title: 'Outros',
    keys: ['shirt', 'baby', 'paw', 'wrench', 'archive', 'tags', 'circle-dollar-sign', 'more-horizontal'],
  },
];

/** Lista plana deduplicada para compat com código legado (`ICON_OPTIONS`). */
export function getFlatIconOptions(): { key: string; label: string }[] {
  const seen = new Set<string>();
  const out: { key: string; label: string }[] = [];
  for (const g of CATEGORY_ICON_GROUPS) {
    for (const key of g.keys) {
      if (seen.has(key)) continue;
      seen.add(key);
      const resolved = resolveIconKey(key);
      out.push({
        key: resolved,
        label: ICON_LABELS[key] ?? ICON_LABELS[resolved] ?? key,
      });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

/**
 * Resolve alias → chave presente em CATEGORY_ICONS; fallback `tag`.
 */
export function resolveIconKey(icon: string | null | undefined): string {
  if (!icon || typeof icon !== 'string') return 'tag';
  const trimmed = icon.trim();
  if (!trimmed) return 'tag';
  const lower = trimmed.toLowerCase();
  const aliased = ICON_KEY_ALIASES[lower] ?? lower;
  if (CATEGORY_ICONS[aliased]) return aliased;
  if (CATEGORY_ICONS[trimmed]) return trimmed;
  return 'tag';
}
