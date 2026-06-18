import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

function Breadcrumb({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn(className)}
      {...props}
    />
  );
}

function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "m-0 flex list-none flex-wrap items-center gap-1.5 p-0",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "text-[length:13px] text-[var(--blue-400)] no-underline transition-opacity duration-100 hover:opacity-80",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "breadcrumb-link",
    },
  });
}

function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(
        "text-[length:13px] font-normal text-[var(--text-primary)]",
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("text-[length:12px] text-[var(--text-muted)]", className)}
      {...props}
    >
      {children ?? "/"}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-5 items-center justify-center text-[var(--text-muted)] [&>svg]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontal />
      <span className="sr-only">Mais</span>
    </span>
  );
}

export interface BreadcrumbCrumb {
  href: string;
  label: string;
}

export interface PageBreadcrumbProps {
  items: BreadcrumbCrumb[];
  currentPage?: string;
  px?: number;
  className?: string;
}

export function PageBreadcrumb({
  items,
  currentPage,
  px = 32,
  className,
}: PageBreadcrumbProps) {
  if (items.length === 0 && !currentPage) return null;

  const paddingStyle = {
    paddingTop: 12,
    paddingBottom: 13,
    paddingLeft: px,
    paddingRight: px,
  } satisfies CSSProperties;

  return (
    <Breadcrumb
      data-page-breadcrumb=""
      className={cn(
        "flex shrink-0 items-center gap-1.5 border-b border-[var(--separator)] bg-[var(--surface-bg)]",
        className,
      )}
      style={paddingStyle}
    >
      <ChevronLeft
        size={13}
        className="shrink-0 text-[var(--blue-400)]"
        aria-hidden
      />
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={`${item.href}-${index}`}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={item.href} />}>
                {item.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}
        {currentPage ? (
          <>
            {items.length > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
