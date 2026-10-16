import Link from "next/link";
import { cx } from "@/lib/client/copy";

type Variant = "primary" | "secondary" | "ghost";
const BASE = "t-button inline-flex items-center justify-center gap-2 rounded-[10px] px-5 transition-opacity disabled:opacity-40 disabled:pointer-events-none";
const V: Record<Variant, string> = {
  primary: "bg-correct text-on-correct",
  secondary: "border-[1.5px] border-border-strong text-text bg-bg",
  ghost: "text-text underline-offset-4 hover:underline",
};

type Common = { variant?: Variant; size?: "lg" | "md"; full?: boolean; className?: string; children: React.ReactNode };

export function Button({ variant = "primary", size = "lg", full, className, children, ...rest }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={cx(BASE, V[variant], size === "lg" ? "h-[52px]" : "h-12", full && "w-full", className)}>
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", size = "lg", full, className, children, href }: Common & { href: string }) {
  return (
    <Link href={href} className={cx(BASE, V[variant], size === "lg" ? "h-[52px]" : "h-12", full && "w-full", className)}>
      {children}
    </Link>
  );
}
