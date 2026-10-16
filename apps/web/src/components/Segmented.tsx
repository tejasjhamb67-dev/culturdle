"use client";

import { cx } from "@/lib/client/copy";

export function Segmented<T extends string>({
  options, value, onChange, label, className, size = "md",
}: {
  options: { value: T; label: React.ReactNode; badge?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div role="tablist" aria-label={label} className={cx("flex rounded-full bg-surface p-[3px]", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full text-[15px] transition-colors",
              size === "lg" ? "h-[38px]" : "h-[34px]",
              on ? "border border-border bg-bg font-semibold text-text shadow-sm" : "text-muted hover:text-text",
            )}
          >
            {o.label}
            {o.badge}
          </button>
        );
      })}
    </div>
  );
}
