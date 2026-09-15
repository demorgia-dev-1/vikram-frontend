"use client";

import type { Meta, WorkflowTransition } from "@/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

/* ---------- shared surface tokens ---------- */

export const cardClass =
  "rounded-xl border border-border-subtle bg-surface shadow-sm";

export const inputClass =
  "w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-subtle hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60";

export const labelClass = "block text-sm font-medium text-foreground";

/* ---------- primitives ---------- */

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("animate-spin", className)}
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={3}
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
    secondary:
      "border border-border-subtle bg-surface text-foreground hover:bg-surface-muted hover:border-border-strong",
    ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

/** Compact square button for table row actions; label drives tooltip + a11y name. */
export function IconButton({
  label,
  tone = "default",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "default" | "danger";
}) {
  const tones = {
    default: "text-muted hover:bg-surface-muted hover:text-foreground",
    danger: "text-muted hover:bg-danger-soft hover:text-danger",
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-40",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn(cardClass, className)}>{children}</section>;
}

export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3.5">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * Second header row: one filter per column, aligned under its column name, so
 * a control always sits beneath the field it narrows.
 */
export function FilterRow({ children }: { children: React.ReactNode }) {
  return (
    // The <thead> already supplies the muted ground and the closing border.
    <tr>{children}</tr>
  );
}

/** Header cell holding a filter control, or an empty spacer when given none. */
export function FilterCell({ children }: { children?: React.ReactNode }) {
  return <th className="px-5 pb-3 align-top font-normal">{children}</th>;
}

const controlClass =
  "h-8 w-full min-w-28 rounded-md border border-border-subtle bg-surface text-xs text-foreground outline-none transition-colors hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-ring/25";

export function ColumnSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle"
        aria-hidden
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(controlClass, "pl-7 pr-2 placeholder:text-subtle")}
      />
    </div>
  );
}

export function ColumnFilter({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(controlClass, "truncate px-1.5", !value && "text-muted")}
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Sits in the actions column of the filter row; only shown once one is set. */
export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-auto flex h-8 items-center rounded-md px-2 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
    >
      Clear
    </button>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "sky" | "green";
}) {
  const tones = {
    slate: "bg-surface-muted text-muted ring-border-subtle",
    sky: "bg-primary-soft text-primary ring-primary/20",
    green: "bg-success-soft text-success ring-success/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Status carries a dot plus its label, so state never rests on colour alone. */
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        active
          ? "bg-success-soft text-success ring-success/20"
          : "bg-surface-muted text-muted ring-border-subtle",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-success" : "bg-subtle",
        )}
        aria-hidden
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/** ACTIVE / COMPLETED / REVOKED, each with its own tone. */
export function WorkflowStatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    ACTIVE: "bg-primary-soft text-primary ring-primary/20",
    COMPLETED: "bg-success-soft text-success ring-success/20",
    REVOKED: "bg-danger-soft text-danger ring-danger/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[status] ?? "bg-surface-muted text-muted ring-border-subtle",
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="mt-0.5 h-4 w-4 shrink-0"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16h.01" strokeLinecap="round" />
      </svg>
      <span>{message}</span>
    </p>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-muted">{description}</p>
      ) : null}
    </div>
  );
}

/* ---------- table ---------- */

export const thClass =
  "px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted";

export const tdClass = "px-5 py-3.5 align-middle";

export function TableSkeleton({
  rows = 5,
  cols,
}: {
  rows?: number;
  cols: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row}>
          {Array.from({ length: cols }).map((__, col) => (
            <td key={col} className={tdClass}>
              <span className="block h-3.5 w-full max-w-32 animate-pulse rounded bg-surface-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function Pagination({
  meta,
  onPageChange,
  disabled,
}: {
  meta: Meta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-3">
      <p className="text-xs text-muted">
        {meta.total === 0 ? (
          "No results"
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-foreground">
              {from}–{to}
            </span>{" "}
            of <span className="font-medium text-foreground">{meta.total}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="px-3 py-1.5"
          disabled={disabled || meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </Button>
        <span className="px-1 text-xs text-muted">
          Page {meta.page} of {meta.totalPages || 1}
        </span>
        <Button
          variant="secondary"
          className="px-3 py-1.5"
          disabled={disabled || meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/* ---------- misc ---------- */

export function Avatar({
  name,
  className = "h-9 w-9 text-sm",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary",
        className,
      )}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Identity band at the top of a detail page: icon or avatar, title, meta, badges. */
export function DetailHero({
  name,
  subtitle,
  meta,
  icon,
  badges,
}: {
  name: string;
  subtitle?: React.ReactNode;
  /** Short inline facts under the title, e.g. customer · template · v1. */
  meta?: React.ReactNode[];
  icon?: React.ReactNode;
  badges?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        cardClass,
        "flex flex-wrap items-center gap-x-4 gap-y-3 p-5",
      )}
    >
      {icon ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          {icon}
        </span>
      ) : (
        <Avatar name={name} className="h-11 w-11 text-base" />
      )}

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold tracking-tight">
          {name}
        </h2>
        {subtitle ? (
          <p className="truncate text-sm text-muted">{subtitle}</p>
        ) : null}
        {meta && meta.length > 0 ? (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {meta.map((item, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 ? (
                  <span className="text-subtle" aria-hidden>
                    ·
                  </span>
                ) : null}
                {item}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      {badges ? (
        <div className="flex flex-wrap items-center gap-2">{badges}</div>
      ) : null}
    </div>
  );
}

/** Underline tab bar. Sections render on demand rather than all at once. */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("border-b border-border-subtle", className)}
      role="tablist"
    >
      <nav className="-mb-px flex gap-5 overflow-x-auto px-5">
        {tabs.map((tab) => {
          const selected = tab.id === active;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 pt-3.5 text-sm font-medium transition",
                selected
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    selected
                      ? "bg-primary-soft text-primary"
                      : "bg-surface-muted text-muted",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Detail fields as a responsive grid of stacked label/value pairs — reads far
 * better on wide screens than rows stretched between two edges.
 */
export function DetailGrid({
  columns = 2,
  className,
  children,
}: {
  columns?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
}) {
  const cols = {
    1: "",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <dl className={cn("grid gap-x-8 gap-y-5 p-5", cols[columns], className)}>
      {children}
    </dl>
  );
}

export function DetailItem({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

/** Placeholder for a value that could not be resolved to something readable. */
export function Muted({ children }: { children: React.ReactNode }) {
  return <span className="font-normal text-subtle">{children}</span>;
}

/** `src → dest`, used wherever a workflow transition is named. */
export function TransitionLabel({
  transition,
  className,
}: {
  transition: WorkflowTransition;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium",
        className,
      )}
    >
      {/* The action, when the transition has been named. */}
      {transition.name ? (
        <>
          <span className="truncate">{transition.name}</span>
          <span className="shrink-0 text-subtle" aria-hidden>
            ·
          </span>
        </>
      ) : null}
      <span
        className={cn(
          "flex min-w-0 items-center gap-1.5",
          transition.name && "font-normal text-muted",
        )}
      >
        <span className="truncate">{transition.srcStage.name}</span>
        <span className="shrink-0 text-subtle" aria-hidden>
          →
        </span>
        <span className="truncate">{transition.destStage.name}</span>
      </span>
    </span>
  );
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** power;

  return `${value >= 10 || power === 0 ? Math.round(value) : value.toFixed(1)} ${units[power]}`;
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
