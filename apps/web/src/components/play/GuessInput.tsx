"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Edition, Mode } from "@culturdle/core";
import { cx } from "@/lib/client/copy";

/** Field + Guess button; autocomplete opens above the field so it stays visible over the keyboard. */
export function GuessInput(props: {
  edition: Edition;
  mode: Mode;
  answerType: string;
  placeholder: string;
  disabled?: boolean;
  candidates?: string[] | null;
  onGuess: (text: string, via: "tap" | "enter") => Promise<boolean>;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const listId = useId();
  const ref = useRef<HTMLInputElement>(null);
  const req = useRef(0);

  useEffect(() => {
    if (props.candidates?.length) {
      setItems(props.candidates.slice(0, 5));
      setActive(0);
    }
  }, [props.candidates]);

  useEffect(() => {
    if (props.autoFocus && matchMedia("(pointer: fine)").matches) ref.current?.focus();
  }, [props.autoFocus]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    const id = ++req.current;
    const t = setTimeout(async () => {
      const sp = new URLSearchParams({ edition: props.edition, mode: props.mode, answer_type: props.answerType, q });
      try {
        const r = await fetch(`/api/suggest?${sp}`).then((r) => r.json());
        if (id === req.current) {
          setItems((r.suggestions ?? []).slice(0, 5));
          setActive(0);
        }
      } catch {}
    }, 100);
    return () => clearTimeout(t);
  }, [value, props.edition, props.mode, props.answerType]);

  const submit = async (text: string, via: "tap" | "enter") => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const ok = await props.onGuess(text.trim(), via);
    setBusy(false);
    if (ok) {
      setValue("");
      setItems([]);
    }
    ref.current?.focus();
  };

  return (
    <div className="relative">
      {items.length > 0 && (
        <ul id={listId} role="listbox" className="absolute bottom-full z-30 mb-2 w-full overflow-hidden rounded-[10px] border border-border bg-bg shadow-[var(--shadow-1)]">
          {items.map((it, i) => (
            <li
              key={it}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                void submit(it, "tap");
              }}
              onMouseEnter={() => setActive(i)}
              className={cx("flex h-11 cursor-pointer items-center px-4 text-[15px]", i === active && "bg-surface font-semibold", i > 0 && "border-t border-border")}
            >
              {it}
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(items.length ? items[active] : value, "enter");
        }}
      >
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            else if (e.key === "Escape") { setItems([]); setValue(""); }
          }}
          disabled={props.disabled || busy}
          placeholder={props.placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Your guess"
          className="h-12 min-w-0 flex-1 rounded-[8px] border-2 border-border bg-bg px-4 text-[16px] outline-none placeholder:text-muted focus:border-border-strong"
        />
        <button
          type="submit"
          disabled={props.disabled || busy || (!value.trim() && !items.length)}
          className="t-button h-12 w-[84px] shrink-0 rounded-[10px] bg-correct text-on-correct disabled:opacity-40"
        >
          Guess
        </button>
      </form>
    </div>
  );
}
