import { Suspense } from "react";
import { notFound } from "next/navigation";
import { editionFromSlug, modeFromSlug } from "@/lib/client/copy";
import { Play } from "./Play";

export default async function PlayPage({ params }: { params: Promise<{ edition: string; mode: string }> }) {
  const p = await params;
  const edition = editionFromSlug(p.edition);
  const mode = modeFromSlug(p.mode);
  if (!edition || !mode) notFound();
  return (
    <Suspense>
      <Play edition={edition} mode={mode} />
    </Suspense>
  );
}
