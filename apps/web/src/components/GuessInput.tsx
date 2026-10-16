"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Edition, Mode } from "@culturdle/core";
import { cx } from "@/lib/client/ui";

export function GuessInput(props: {
  edition: Edition;
  mode: Mode;
  answerType: string;
  color: string;
  disabled?: boolean;
  onGuess: (text: string) => Promise<{ error?: string; candidates?: string[] } | void>;
  onSkip: () => void;
}) {
  const [value, setValue] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const sp = new URLSearchParams({ edition: props.edition, mode: props.mode, answer_type: props.answerType, q });
      try {
        const r = await fetch(`/api/suggest?${sp}`).then((r) => r.json());
        if (id === reqId.current) {
          setItems(r.suggestions ?? []);
          setActive(-1);
        }
      } catch {}
    }, 120);
    return () => clearTimeout(t);
  }, [value, props.edition, props.mode, props.answerType]);

  const submit = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await props.onGuess(text.trim());
    setBusy(false);
    if (res && res.error) {
      setError(res.error);
      setShake(true);
      setTimeout(() => setShake(false), 420);
      if (res.candidates?.length) setItems(res.candidates);
      inputRef.current?.focus();
      return;
    }
    setValue("");
    setItems([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {items.length > 0 && (
        <ul id={listId} role="listbox" className="absolute bottom-full z-20 mb-2 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          {items.map((it, i) => (
            <li
              key={it}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                void submit(it);
              }}
              className={cx("tap flex cursor-pointer items-center px-4 py-2.5 text-[16px]", i === active ? "bg-surface-2" : "", i > 0 && "border-t border-line")}
            >
              {it}
            </li>
          ))}
        </ul>
      )}
      <form
        className={cx("flex gap-2", shake && "shake")}
        onSubmit={(e) => {
          e.preventDefault();
          void submit(active >= 0 ? items[active] : value);
        }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === "Escape") setItems([]);
          }}
          disabled={props.disabled || busy}
          placeholder="Type a guess…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Your guess"
          className="tap min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-[17px] outline-none placeholder:text-muted focus:border-[color:var(--icon)]"
        />
        <button
          type="submit"
          disabled={props.disabled || busy || !value.trim()}
          className="tap rounded-2xl px-5 font-semibold text-white disabled:opacity-40"
          style={{ background: props.color }}
        >
          Guess
        </button>
      </form>
      <div className="mt-2 flex min-h-6 items-center justify-between text-sm">
        <span role="status" aria-live="polite" className={cx(error ? "text-movie" : "text-muted")}>
          {error ?? "Pick from the list — typos never cost a guess."}
        </span>
        <button type="button" onClick={props.onSkip} disabled={props.disabled || busy} className="tap px-2 text-muted underline underline-offset-4">
          Skip
        </button>
      </div>
    </div>
  );
}
