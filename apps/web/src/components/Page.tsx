/** Standard single-column page frame: 16 px gutters on phones, centred on larger screens. */
export function Page({ title, subtitle, children, wide }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto w-full px-4 pb-16 pt-6 md:px-6 lg:pt-10 ${wide ? "max-w-[760px]" : "max-w-[520px]"}`}>
      <h1 className="font-serif text-[30px] font-semibold leading-[36px]">{title}</h1>
      {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </main>
  );
}
