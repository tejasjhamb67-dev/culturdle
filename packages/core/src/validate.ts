import { answerWords, normalize } from "./normalize";

export interface RowToValidate {
  answer: string;
  hints: (string | null | undefined)[];
  wrongOptions: (string | null | undefined)[];
}

/** Hint words that leak the answer (words already masked as ____ are fine). */
export function leakedWords(answer: string, hint: string): string[] {
  const words = answerWords(answer);
  if (words.length === 0) return [];
  const hintWords = new Set(normalize(hint).split(" "));
  return words.filter((w) => hintWords.has(w));
}

export function validateRow(row: RowToValidate): string[] {
  const errors: string[] = [];
  const hints = row.hints.map((h) => (h ?? "").toString().trim());
  if (hints.filter(Boolean).length < 6) errors.push("fewer than 6 hints");
  const opts = row.wrongOptions.map((o) => (o ?? "").toString().trim()).filter(Boolean);
  if (opts.length < 3) errors.push("fewer than 3 wrong options");
  const na = normalize(row.answer);
  if (opts.some((o) => normalize(o) === na)) errors.push("wrong option equals the answer");
  hints.forEach((h, i) => {
    const leaks = leakedWords(row.answer, h);
    if (leaks.length) errors.push(`hint ${i + 1} contains answer word(s): ${leaks.join(", ")}`);
  });
  return errors;
}
