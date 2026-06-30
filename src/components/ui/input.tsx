import { Input as InputPrimitive } from '@base-ui/react/input'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  [
    'w-full min-w-0 font-[family-name:var(--font-sans)] font-normal text-[var(--text-primary)]',
    'placeholder:text-[var(--text-tertiary)] outline-none',
    'transition-[border-color,box-shadow,background] duration-150 ease-out',
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-[var(--surface-1)]',
    'read-only:cursor-default read-only:border-transparent read-only:bg-[var(--surface-1)] read-only:text-[var(--text-secondary)]',
    'read-only:focus-visible:border-transparent read-only:focus-visible:shadow-none read-only:focus-visible:ring-0',
    'focus-visible:border-[var(--blue)] focus-visible:bg-[var(--surface-1)]',
    'focus-visible:ring-3 focus-visible:ring-[rgba(10,132,255,0.22)] focus-visible:ring-offset-0',
    'aria-invalid:border-[var(--red)] aria-invalid:ring-3 aria-invalid:ring-[rgba(255,69,58,0.18)]',
  ],
  {
    variants: {
      variant: {
        default:
          'border border-[var(--separator-opaque)] bg-[var(--surface-2)] hover:border-white/18',
        filled:
          'border border-transparent bg-[var(--surface-2)] hover:border-transparent focus-visible:border-[var(--blue)]',
        ghost:
          'border border-transparent bg-transparent hover:border-transparent hover:bg-[var(--surface-hover)]',
        search:
          'rounded-[var(--radius-full)] border border-transparent bg-[var(--surface-2)] pl-10 hover:border-transparent focus-visible:rounded-[var(--radius-full)]',
        group:
          'h-full flex-1 border-0 bg-transparent p-0 shadow-none hover:border-transparent hover:bg-transparent focus-visible:border-0 focus-visible:bg-transparent focus-visible:ring-0',
      },
      size: {
        sm: 'h-9 rounded-[var(--radius-sm)] px-2.5 text-[length:var(--text-footnote)]',
        default:
          'h-11 rounded-[var(--radius-md)] px-3.5 text-[length:var(--text-subhead)]',
        lg: 'h-[54px] rounded-[var(--radius-md)] px-[18px] text-[length:var(--text-body)]',
      },
      inputState: {
        default: '',
        error:
          '!border-[var(--red)] !ring-3 !ring-[rgba(255,69,58,0.18)] focus-visible:!border-[var(--red)] focus-visible:!ring-[rgba(255,69,58,0.18)]',
        success:
          '!border-[var(--green)] !ring-3 !ring-[rgba(48,209,88,0.16)] focus-visible:!border-[var(--green)] focus-visible:!ring-[rgba(48,209,88,0.16)]',
        warning:
          '!border-[var(--orange)] !ring-3 !ring-[rgba(255,159,10,0.16)] focus-visible:!border-[var(--orange)] focus-visible:!ring-[rgba(255,159,10,0.16)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      inputState: 'default',
    },
  },
)

const textareaVariants = cva(
  [
    'w-full min-w-0 resize-y font-[family-name:var(--font-sans)] text-[length:var(--text-subhead)] leading-normal',
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none',
    'border border-[var(--separator-opaque)] bg-[var(--surface-2)] rounded-[var(--radius-md)]',
    'px-3.5 py-3 min-h-[90px]',
    'transition-[border-color,box-shadow,background] duration-150 ease-out',
    'focus-visible:border-[var(--blue)] focus-visible:bg-[var(--surface-1)]',
    'focus-visible:ring-3 focus-visible:ring-[rgba(10,132,255,0.22)] focus-visible:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-40',
    'aria-invalid:border-[var(--red)] aria-invalid:ring-3 aria-invalid:ring-[rgba(255,69,58,0.18)]',
  ],
  {
    variants: {
      inputState: {
        default: '',
        error:
          '!border-[var(--red)] !ring-3 !ring-[rgba(255,69,58,0.18)]',
        success:
          '!border-[var(--green)] !ring-3 !ring-[rgba(48,209,88,0.16)]',
        warning:
          '!border-[var(--orange)] !ring-3 !ring-[rgba(255,159,10,0.16)]',
      },
    },
    defaultVariants: {
      inputState: 'default',
    },
  },
)

export interface InputProps
  extends Omit<ComponentProps<typeof InputPrimitive>, 'size'>,
    VariantProps<typeof inputVariants> {}

function Input({
  className,
  type,
  variant,
  size,
  inputState,
  ...props
}: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, size, inputState }), className)}
      {...props}
    />
  )
}

export interface TextareaProps
  extends ComponentProps<'textarea'>,
    VariantProps<typeof textareaVariants> {}

function Textarea({
  className,
  inputState,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ inputState }), className)}
      {...props}
    />
  )
}

export type InputGroupProps = ComponentProps<'div'>

function InputGroup({ className, ...props }: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        'overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-2)]',
        className,
      )}
      {...props}
    />
  )
}

export type InputGroupRowProps = ComponentProps<'div'>

function InputGroupRow({ className, ...props }: InputGroupRowProps) {
  return (
    <div
      data-slot="input-group-row"
      className={cn(
        'flex h-[54px] items-center border-b border-white/[0.08] px-4 last:border-b-0',
        'focus-within:bg-[rgba(10,132,255,0.07)]',
        className,
      )}
      {...props}
    />
  )
}

export interface SelectProps
  extends Omit<ComponentProps<'select'>, 'size'>,
    VariantProps<typeof inputVariants> {}

function Select({
  className,
  variant,
  size,
  inputState,
  ...props
}: SelectProps) {
  return (
    <select
      data-slot="select"
      className={cn(inputVariants({ variant, size, inputState }), className)}
      {...props}
    />
  )
}

export {
  Input,
  Textarea,
  Select,
  InputGroup,
  InputGroupRow,
  inputVariants,
  textareaVariants,
}
