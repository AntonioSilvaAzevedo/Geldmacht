import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2',
    'whitespace-nowrap border border-transparent font-[family-name:var(--font-sans)] font-semibold',
    'outline-none select-none [-webkit-tap-highlight-color:transparent]',
    'transition-[opacity,background,transform,box-shadow] duration-[120ms] ease-out',
    'focus-visible:ring-3 focus-visible:ring-[rgba(10,132,255,0.45)] focus-visible:ring-offset-0',
    'active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed',
    'disabled:opacity-[0.38] disabled:active:scale-100',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default:
          'bg-[var(--white)] text-[var(--black)] hover:opacity-[0.88]',
        primary:
          'bg-[var(--blue)] text-[var(--white)] hover:opacity-[0.88]',
        destructive:
          'bg-[var(--red)] text-[var(--white)] hover:opacity-[0.88] focus-visible:ring-[rgba(255,69,58,0.45)]',
        positive:
          'bg-[var(--green)] text-[var(--black)] hover:opacity-[0.88]',
        secondary:
          'bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)]',
        outline:
          'border-[var(--separator-opaque)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
        ghost:
          'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
        link:
          'h-auto rounded p-0 font-medium text-[var(--blue)] underline underline-offset-[3px] hover:opacity-[0.78]',
      },
      size: {
        sm: 'h-9 gap-1.5 rounded-[var(--radius-sm)] px-3.5 text-[length:var(--text-footnote)] [&_svg:not([class*="size-"])]:size-[15px]',
        default:
          'h-11 rounded-[var(--radius-md)] px-5 text-[length:var(--text-subhead)] [&_svg:not([class*="size-"])]:size-4',
        lg: 'h-[54px] rounded-[var(--radius-md)] px-7 text-[length:var(--text-body)] [&_svg:not([class*="size-"])]:size-[22px]',
        icon: 'size-11 rounded-[var(--radius-md)] p-0 [&_svg:not([class*="size-"])]:size-[18px]',
        'icon-sm':
          'size-9 rounded-[var(--radius-sm)] p-0 [&_svg:not([class*="size-"])]:size-[15px]',
        'icon-lg':
          'size-[54px] rounded-[var(--radius-md)] p-0 [&_svg:not([class*="size-"])]:size-[22px]',
      },
    },
    compoundVariants: [
      {
        variant: 'link',
        size: 'sm',
        className: 'text-[length:var(--text-footnote)]',
      },
      {
        variant: 'link',
        size: 'default',
        className: 'text-[length:var(--text-subhead)]',
      },
      {
        variant: 'link',
        size: 'lg',
        className: 'text-[length:var(--text-body)]',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends ComponentProps<typeof ButtonPrimitive>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size }),
        loading && 'pointer-events-none opacity-70',
        className,
      )}
      {...props}
    >
      {loading && (
        <Loader2
          className="absolute size-4 animate-spin"
          aria-hidden
        />
      )}
      <span
        className={cn(
          'inline-flex items-center justify-center gap-[inherit]',
          loading && 'opacity-0',
        )}
      >
        {children}
      </span>
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
