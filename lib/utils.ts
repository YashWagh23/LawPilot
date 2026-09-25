import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

const NON_TERMINAL_ABBREVIATIONS = [
  "v", "vs", "no", "nos", "inc", "ltd", "pvt", "co", "corp", "llc", "llp", "dr", "mr", "mrs", "ms", "st", "sec",
  "art", "cl", "para", "e.g", "i.e", "etc", "cf", "approx", "dept", "est", "u.s", "u.k", "u.s.a", "a.m", "p.m",
  "jr", "sr", "hon", "rs", "del", "c",
];

/**
 * Splits text into sentences without breaking on legal abbreviations, so "Kailash Nath Associates
 * v. Delhi Development Authority" or "Aegis Cloud Dynamics Inc. shall pay" stay intact.
 */
export function splitSentences(text: string): string[] {
  const parts = text.replace(/\s+/g, " ").trim().split(/(?<=[.?!])\s+(?=[A-Z0-9"“(])/);
  const sentences: string[] = [];
  for (const part of parts) {
    const prev = sentences[sentences.length - 1];
    if (prev) {
      const lastWord = prev.replace(/[.?!]+$/, "").split(" ").pop()?.toLowerCase() ?? "";
      // Merge when the previous chunk ended on an abbreviation or a single initial ("J. Smith").
      if (
        prev.endsWith(".") &&
        (NON_TERMINAL_ABBREVIATIONS.includes(lastWord.replace(/^[("“]+/, "")) || /^[a-z]$/i.test(lastWord))
      ) {
        sentences[sentences.length - 1] = `${prev} ${part}`;
        continue;
      }
    }
    sentences.push(part);
  }
  return sentences.filter(Boolean);
}

/** First sentence of the text (abbreviation-aware), always ending with terminal punctuation. */
export function firstSentence(text: string): string {
  const [first] = splitSentences(text);
  if (!first) return "";
  return /[.?!]$/.test(first) ? first : `${first}.`;
}
