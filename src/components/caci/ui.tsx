"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";

// ============================================================
// CACI Brand Button
// Primary: CACI Red bg, white text, 48px height (mobile), squish on tap
// Secondary: CACI Blue outline, transparent bg
// ============================================================

type CACIButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type CACIButtonSize = "default" | "lg" | "sm" | "icon";

export interface CACIButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CACIButtonVariant;
  size?: CACIButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<CACIButtonVariant, string> = {
  primary:
    "bg-caci-red text-white hover:bg-caci-red-light active:bg-caci-red-dim shadow-sm",
  secondary:
    "border-[1.5px] border-caci-blue text-caci-blue bg-transparent hover:bg-caci-blue-bg active:bg-caci-blue-bg/80",
  ghost:
    "bg-transparent text-caci-blue hover:bg-caci-blue-bg active:bg-caci-blue-bg/80",
  danger:
    "bg-caci-red-bg text-caci-red border border-caci-red hover:bg-caci-red-bg/80 active:bg-caci-red-bg",
};

const sizeClasses: Record<CACIButtonSize, string> = {
  default: "h-12 px-4 text-[16px]",
  lg: "h-14 px-6 text-[16px]",
  sm: "h-9 px-3 text-[14px]",
  icon: "size-12 p-0",
};

export const CACIButton = React.forwardRef<HTMLButtonElement, CACIButtonProps>(
  (
    { className, variant = "primary", size = "default", loading, leftIcon, rightIcon, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all",
          "tap-squish outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-caci-blue",
          "disabled:pointer-events-none disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin-caci" />
            {children}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  },
);
CACIButton.displayName = "CACIButton";

// ============================================================
// CACI Brand Input — 16px font (iOS zoom prevention), focus ring CACI Blue
// ============================================================

export interface CACIInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  containerClassName?: string;
}

export const CACIInput = React.forwardRef<HTMLInputElement, CACIInputProps>(
  ({ className, label, error, leftIcon, rightAdornment, containerClassName, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id || reactId;
    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="block text-[14px] font-medium text-n700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-n400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-12 rounded-lg border bg-surface-input px-3 text-[16px] text-n900 placeholder:text-n300",
              "transition-input outline-none",
              "focus:border-caci-blue focus:ring-2 focus:ring-caci-blue/20",
              leftIcon && "pl-10",
              rightAdornment && "pr-12",
              error ? "border-caci-red focus:border-caci-red focus:ring-caci-red/20" : "border-border",
              className,
            )}
            {...props}
          />
          {rightAdornment && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2">
              {rightAdornment}
            </span>
          )}
        </div>
        {error && (
          <p className="text-[14px] text-caci-red animate-fade-in">{error}</p>
        )}
      </div>
    );
  },
);
CACIInput.displayName = "CACIInput";

// ============================================================
// CACI Textarea
// ============================================================

export interface CACITextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
}

export const CACITextarea = React.forwardRef<HTMLTextAreaElement, CACITextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const reactId = React.useId();
    const taId = id || reactId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={taId} className="block text-[14px] font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          className={cn(
            "w-full rounded-lg border bg-surface-input p-3 text-[16px] text-n900 placeholder:text-n300",
            "transition-input outline-none min-h-[96px] resize-y",
            "focus:border-caci-blue focus:ring-2 focus:ring-caci-blue/20",
            error ? "border-caci-red" : "border-border",
            className,
          )}
          {...props}
        />
        {error && <p className="text-[14px] text-caci-red">{error}</p>}
      </div>
    );
  },
);
CACITextarea.displayName = "CACITextarea";

// ============================================================
// CACI Select (native, styled)
// ============================================================

export interface CACISelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
}

export const CACISelect = React.forwardRef<HTMLSelectElement, CACISelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const reactId = React.useId();
    const selId = id || reactId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selId} className="block text-[14px] font-medium text-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selId}
          className={cn(
            "w-full h-12 rounded-lg border bg-surface-input px-3 text-[16px] text-n900",
            "transition-input outline-none cursor-pointer appearance-none",
            "focus:border-caci-blue focus:ring-2 focus:ring-caci-blue/20",
            "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236e7681%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[right_12px_center] pr-9",
            error ? "border-caci-red" : "border-border",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-[14px] text-caci-red">{error}</p>}
      </div>
    );
  },
);
CACISelect.displayName = "CACISelect";

// ============================================================
// CACI Brand Card — surface-card, 8px radius, border-border, hover lift on desktop
// ============================================================

export interface CACICardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "sm" | "default" | "lg" | "none";
  as?: "div" | "button";
}

export function CACICard({
  className,
  children,
  hover = false,
  padding = "default",
  as: Comp = "div",
  ...props
}: CACICardProps) {
  const padClass = {
    none: "",
    sm: "p-3",
    default: "p-4",
    lg: "p-5 sm:p-6",
  }[padding];
  return (
    <Comp
      className={cn(
        "bg-surface-card rounded-lg border border-border",
        hover && "card-hover cursor-pointer text-left w-full block",
        padClass,
        className,
      )}
      {...(props as any)}
    >
      {children}
    </Comp>
  );
}

// ============================================================
// CACI Status & Role Badges
// ============================================================

export function MembershipStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-success-bg text-success dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800/40",
    inactive: "bg-n100 text-n500 dark:bg-slate-800 dark:text-slate-400 dark:border dark:border-slate-700/40",
    visitor: "bg-warning-bg text-warning dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-800/40",
  };
  const labels: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    visitor: "Visitor",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        styles[status] || styles.inactive,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {labels[status] || status}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-caci-blue-bg text-caci-blue dark:bg-blue-950/80 dark:text-blue-300 dark:border dark:border-blue-800/40",
    member: "bg-n50 text-n700 dark:bg-slate-800 dark:text-slate-300",
  };
  const labels: Record<string, string> = {
    admin: "Admin",
    member: "Member",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        styles[role] || styles.member,
      )}
    >
      {labels[role] || role}
    </span>
  );
}

export function TargetingBadge({ mode }: { mode: string }) {
  const styles: Record<string, string> = {
    assembly: "bg-caci-blue-bg text-caci-blue dark:bg-blue-950/80 dark:text-blue-300",
    group: "bg-success-bg text-success dark:bg-emerald-950/80 dark:text-emerald-300",
    members: "bg-warning-bg text-warning dark:bg-amber-950/80 dark:text-amber-300",
  };
  const labels: Record<string, string> = {
    assembly: "Assembly-wide",
    group: "Group",
    members: "Selected Members",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium", styles[mode])}>
      {labels[mode] || mode}
    </span>
  );
}

// ============================================================
// CACI Logo Mark — red shield with cross
// ============================================================

export function CaciLogo({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("rounded-full overflow-hidden shrink-0", className)}
      style={{ width: size, height: size }}
      aria-label="CACI Logo"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="CACI Logo"
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}

// ============================================================
// Sermon Cover Component (displays cover image or 60% transparent CACI logo fallback)
// ============================================================

export function SermonCover({
  coverImageUrl,
  title,
  className,
  logoSize = 48,
}: {
  coverImageUrl?: string | null;
  title: string;
  className?: string;
  logoSize?: number;
}) {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [coverImageUrl]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-surface-card-alt flex items-center justify-center select-none shrink-0",
        className,
      )}
    >
      {coverImageUrl && !imgError ? (
        <img
          src={coverImageUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-transparent">
          <CaciLogo size={logoSize} className="opacity-85 filter drop-shadow-md transition-all duration-300 group-hover:opacity-100 group-hover:scale-105" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// CACI Avatar (initials fallback)
// ============================================================

export function CaciAvatar({
  name,
  photoUrl,
  size = 40,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  const colors = [
    "bg-caci-blue-bg text-caci-blue dark:bg-blue-950 dark:text-blue-300 dark:border dark:border-blue-800/50",
    "bg-caci-red-bg text-caci-red dark:bg-red-950 dark:text-red-300 dark:border dark:border-red-800/50",
    "bg-success-bg text-success dark:bg-emerald-950 dark:text-emerald-300 dark:border dark:border-emerald-800/50",
    "bg-warning-bg text-warning dark:bg-amber-950 dark:text-amber-300 dark:border dark:border-amber-800/50",
    "bg-n50 text-n700 dark:bg-slate-800 dark:text-slate-200 dark:border dark:border-slate-700/50",
  ];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const colorClass = colors[hash % colors.length];

  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-[14px]",
        colorClass,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ============================================================
// CACI Section Heading
// ============================================================

export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <h2 className="text-[18px] font-semibold text-n900">{title}</h2>
      {action}
    </div>
  );
}

// ============================================================
// CACI Empty State
// ============================================================

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      {icon && (
        <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-surface-card-alt text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-[16px] font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 text-[14px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================
// CACI Skeleton
// ============================================================

export function CACISkeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-caci rounded-md", className)} />;
}

// ============================================================
// CACI Stat Tile
// ============================================================

export function StatTile({
  label,
  value,
  icon,
  accent = "blue",
  trend,
  onClick,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: "red" | "blue" | "green" | "amber";
  trend?: { value: string; positive?: boolean };
  onClick?: () => void;
}) {
  const accentClasses = {
    red: "bg-caci-red-bg text-caci-red",
    blue: "bg-caci-blue-bg text-caci-blue",
    green: "bg-success-bg text-success",
    amber: "bg-warning-bg text-warning",
  }[accent];
  return (
    <CACICard hover={!!onClick} padding="default" onClick={onClick} className="flex items-start gap-3">
      {icon && (
        <div className={cn("flex size-10 items-center justify-center rounded-lg shrink-0", accentClasses)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-n400 uppercase tracking-wide">{label}</p>
        <p className="text-[24px] font-bold text-n900 leading-tight mt-0.5">{value}</p>
        {trend && (
          <p className={cn("text-[12px] mt-0.5", trend.positive ? "text-success" : "text-caci-red")}>
            {trend.value}
          </p>
        )}
      </div>
    </CACICard>
  );
}

// ============================================================
// CACI Circular Progress Ring — animated SVG ring for rates/percentages
// ============================================================

export function CircularProgress({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  label,
  sublabel,
  accent = "#004ba0",
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  accent?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - ratio);
  const center = size / 2;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e6edf3"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[14px] font-bold text-n900 leading-none">
            {label ?? `${Math.round(ratio * 100)}%`}
          </span>
        </div>
      </div>
      {sublabel && <span className="text-[11px] text-n400">{sublabel}</span>}
    </div>
  );
}

// ============================================================
// CACI Month Calendar — visual grid with event dots
// ============================================================

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface CalendarDayEvents {
  date: string; // YYYY-MM-DD
  count: number;
  dotColor?: string; // tailwind bg class for the dot
}

export function MonthCalendar({
  year,
  month, // 0-indexed (0 = January)
  events = [],
  onPrev,
  onNext,
  onDayClick,
  selectedDate,
}: {
  year: number;
  month: number;
  events?: CalendarDayEvents[];
  onPrev?: () => void;
  onNext?: () => void;
  onDayClick?: (dateStr: string) => void;
  selectedDate?: string; // YYYY-MM-DD
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay(); // 0 = Sunday

  // Build a lookup: "YYYY-MM-DD" → events
  const eventMap = React.useMemo(() => {
    const m: Record<string, CalendarDayEvents> = {};
    for (const e of events) m[e.date] = e;
    return m;
  }, [events]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Build cells: leading blanks + days
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Header with month/year + nav */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[16px] font-bold text-n900">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          {onPrev && (
            <button
              onClick={onPrev}
              className="size-8 flex items-center justify-center rounded-md border border-n100 text-n500 hover:text-caci-blue hover:border-caci-blue transition-colors"
              aria-label="Previous month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="size-8 flex items-center justify-center rounded-md border border-n100 text-n500 hover:text-caci-blue hover:border-caci-blue transition-colors"
              aria-label="Next month"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-n400 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`blank-${i}`} className="aspect-square" />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventMap[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasEvents = dayEvents && dayEvents.count > 0;

          return (
            <button
              key={day}
              onClick={() => onDayClick?.(dateStr)}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-[13px] transition-all relative",
                isToday && !isSelected && "bg-caci-blue-bg text-caci-blue font-bold",
                isSelected && "bg-caci-blue text-white font-bold",
                !isToday && !isSelected && "hover:bg-n50 text-n700",
                onDayClick && "cursor-pointer",
              )}
            >
              <span className={cn(isToday && !isSelected && "text-caci-blue")}>{day}</span>
              {hasEvents && (
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(dayEvents.count, 3) }).map((_, di) => (
                    <span
                      key={di}
                      className={cn(
                        "size-1.5 rounded-full",
                        isSelected ? "bg-white" : (dayEvents.dotColor || "bg-caci-blue"),
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CACI Reusable Header Add Button
// ============================================================

export function HeaderAddButton({ onClick, label = "Add" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="size-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors shrink-0"
      aria-label={label}
    >
      <Plus size={20} className="text-white" />
    </button>
  );
}
