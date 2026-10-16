import Link from "next/link";

export function Marquee({ n = 9 }: { n?: number }) {
  return (
    <div className="marquee" aria-hidden>
      {Array.from({ length: n }).map((_, i) => <i key={i} />)}
    </div>
  );
}

export function Header({ streak, right }: { streak?: number; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between py-3">
      <Link href="/" className="flex flex-col items-start">
        <Marquee n={7} />
        <span className="font-display mt-1 text-[34px] leading-none">CULTURDLE</span>
      </Link>
      <div className="flex items-center gap-2">
        {right}
        {streak !== undefined && (
          <span className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold" aria-label={`${streak}-day play streak`}>
            <span aria-hidden>🔥</span>
            <span className="font-display text-xl leading-none">{streak}</span>
          </span>
        )}
      </div>
    </header>
  );
}
