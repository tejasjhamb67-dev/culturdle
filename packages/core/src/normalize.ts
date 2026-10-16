const LEADING_ARTICLE = /^(the|a|an)\s+/;

/** Lowercase, strip accents, punctuation and a leading article, collapse spaces. */
export function normalize(input: string): string {
  let s = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
  s = s.replace(LEADING_ARTICLE, "");
  return s;
}

const STOP_WORDS = new Set([
  "the", "and", "of", "a", "an", "in", "on", "to", "for", "with", "by", "at", "from",
  "is", "it", "me", "my", "you", "your", "we", "our", "i", "be", "are", "was", "this", "that",
  "aur", "ka", "ki", "ke", "hai", "ho", "se", "mein", "na", "ne", "tu", "tum", "main", "hum",
  "all", "not", "but", "or", "one", "she", "her", "his", "him", "they", "yeh", "ye",
  "love", "man", "new", "day", "big", "jr", "sr", "mr", "dr", "ii", "iii", "no",
]);

/** Distinctive words of an answer (normalised, 3+ chars, not stop words). */
export function answerWords(answer: string): string[] {
  return [...new Set(normalize(answer).split(" ").filter((w) => w.length >= 3 && !STOP_WORDS.has(w)))];
}
