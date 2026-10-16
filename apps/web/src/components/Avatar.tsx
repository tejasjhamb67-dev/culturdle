import { cx } from "@/lib/client/copy";

export function Avatar({ name, me, size = 34 }: { name: string; me?: boolean; size?: number }) {
  return (
    <span
      aria-hidden
      className={cx("flex shrink-0 items-center justify-center rounded-full font-bold", me ? "bg-present text-on-present" : "bg-border text-text")}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}
