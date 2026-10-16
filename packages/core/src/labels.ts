import type { Mode } from "./types";

/** Coarse answer group used for autocomplete pools ("Guess the artist" covers singers too). */
export function answerGroup(mode: Mode, answerType: string): string {
  if (mode === "movie") return "Film";
  if (mode === "music") return /artist|band/i.test(answerType) ? "Artist" : "Song";
  if (/brand/i.test(answerType)) return "Brand";
  if (/band/i.test(answerType)) return "Band";
  return "Person";
}

export function promptFor(mode: Mode, answerType: string): string {
  const g = answerGroup(mode, answerType);
  switch (g) {
    case "Film": return "Guess the film";
    case "Song": return "Guess the song";
    case "Artist":
      if (/composer/i.test(answerType)) return "Guess the composer";
      if (/singer/i.test(answerType)) return "Guess the singer";
      return "Guess the artist";
    case "Brand": return "Guess the brand";
    case "Band": return "Guess the band";
    default: return "Guess the person";
  }
}

export const MODE_LABEL: Record<Mode, string> = { movie: "Movie", music: "Music", icon: "Icon" };
