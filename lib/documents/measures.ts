/**
 * Unit-aware extraction of durations and money amounts from contract text.
 *
 * Shared by document extraction and Compare so that "sixty (60) days" vs "two (2) months" or
 * "$18,500" vs "INR 4,50,000" are always compared as like-with-like (same unit, same currency),
 * and never rendered with a hardcoded unit or currency symbol.
 */

export type DurationUnit = "day" | "week" | "month" | "year";

export interface Duration {
  value: number;
  unit: DurationUnit;
  /** Approximate length in days, for magnitude comparison only. */
  approxDays: number;
  /** Text as written, e.g. "sixty (60) calendar days". */
  raw: string;
  index: number;
}

export interface MoneyAmount {
  /** ISO-ish currency code: INR, USD, GBP, EUR, or "" when unknown. */
  currency: string;
  amount: number;
  /** Amount text as written in the document, e.g. "$18,500" or "INR 4,50,000". */
  raw: string;
  index: number;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fortyfive: 45, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

function wordToNumber(word: string): number | null {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (WORD_NUMBERS[cleaned] !== undefined) return WORD_NUMBERS[cleaned];
  // "forty-five", "twenty one"
  const parts = word.toLowerCase().split(/[\s-]+/).filter(Boolean);
  if (parts.length === 2 && WORD_NUMBERS[parts[0]] !== undefined && WORD_NUMBERS[parts[1]] !== undefined) {
    return WORD_NUMBERS[parts[0]] + WORD_NUMBERS[parts[1]];
  }
  return null;
}

const UNIT_DAYS: Record<DurationUnit, number> = { day: 1, week: 7, month: 30, year: 365 };

function normalizeUnit(raw: string): DurationUnit {
  const u = raw.toLowerCase();
  if (u.startsWith("day")) return "day";
  if (u.startsWith("week")) return "week";
  if (u.startsWith("month")) return "month";
  return "year";
}

/**
 * Finds every duration in the text: "sixty (60) calendar days", "12 months", "two (2) years",
 * "ninety days'". Written-out numbers are honored; a parenthetical numeral wins over the word.
 */
export function extractDurations(text: string): Duration[] {
  const results: Duration[] = [];
  const re =
    /(?:\b([A-Za-z]+(?:[- ][A-Za-z]+)?)\s*)?(?:\(\s*(\d{1,4})\s*\)|\b(\d{1,4})\b)\s*(?:(?:calendar|business|working|full|continuous|consecutive)\s+)*(days?|weeks?|months?|years?)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const numeral = m[2] ?? m[3];
    let value = numeral !== undefined ? parseInt(numeral, 10) : NaN;
    if (Number.isNaN(value) && m[1]) {
      const w = wordToNumber(m[1]);
      if (w !== null) value = w;
    }
    if (Number.isNaN(value) || value <= 0) continue;
    const unit = normalizeUnit(m[4]);
    results.push({
      value,
      unit,
      approxDays: value * UNIT_DAYS[unit],
      raw: m[0].trim(),
      index: m.index,
    });
  }
  return results;
}

/** Duration nearest to a keyword such as "notice" (within `window` chars), else null. */
export function findDurationNear(text: string, keywordRe: RegExp, window = 140): Duration | null {
  const durations = extractDurations(text);
  if (durations.length === 0) return null;
  const kw = new RegExp(keywordRe.source, keywordRe.flags.includes("g") ? keywordRe.flags : keywordRe.flags + "g");
  let best: { d: Duration; dist: number } | null = null;
  let m: RegExpExecArray | null;
  while ((m = kw.exec(text)) !== null) {
    for (const d of durations) {
      const dist = Math.abs(d.index - m.index);
      if (dist <= window && (!best || dist < best.dist)) best = { d, dist };
    }
  }
  return best ? best.d : null;
}

export function formatDuration(d: Pick<Duration, "value" | "unit">): string {
  return `${d.value} ${d.unit}${d.value === 1 ? "" : "s"}`;
}

const CURRENCY_TOKENS: { re: string; code: string }[] = [
  { re: "US\\$|USD|\\$", code: "USD" },
  { re: "₹|INR|Rs\\.?|Rupees?", code: "INR" },
  { re: "£|GBP", code: "GBP" },
  { re: "€|EUR", code: "EUR" },
  { re: "CAD|C\\$", code: "CAD" },
  { re: "AUD|A\\$", code: "AUD" },
  { re: "SGD|S\\$", code: "SGD" },
  { re: "AED", code: "AED" },
];

const MULTIPLIERS: Record<string, number> = {
  lakh: 100_000, lakhs: 100_000, lac: 100_000, lacs: 100_000,
  crore: 10_000_000, crores: 10_000_000,
  thousand: 1_000, k: 1_000, million: 1_000_000, mn: 1_000_000, billion: 1_000_000_000,
};

/**
 * Finds every currency amount: "$145,000", "INR 4,50,000", "₹4.5 lakh", "USD 18,500",
 * "Rs. 25,000/-". Amount text keeps the document's own notation.
 */
export function extractMoneyAmounts(text: string): MoneyAmount[] {
  const results: MoneyAmount[] = [];
  const seen = new Set<string>();

  for (const { re, code } of CURRENCY_TOKENS) {
    // Tokens like USD / Rs must not sit inside another word ("hours 5" is not "Rs 5").
    const pattern = new RegExp(
      `(?<![A-Za-z0-9])(?:${re})\\s?(\\d[\\d,]*(?:\\.\\d+)?)(?:\\s*(lakhs?|lacs?|crores?|thousand|million|billion|mn|k)\\b)?`,
      code === "USD" || code === "INR" ? "gi" : "g"
    );
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      // "Rs" must be followed by a digit (handled by pattern), and a bare "k" suffix must be tight.
      const num = parseFloat(m[1].replace(/,/g, ""));
      if (Number.isNaN(num) || num <= 0) continue;
      const mult = m[2] ? MULTIPLIERS[m[2].toLowerCase()] ?? 1 : 1;
      const key = `${m.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        currency: code,
        amount: num * mult,
        raw: m[0].trim().replace(/\s+/g, " ").replace(/[,.]+$/, ""),
        index: m.index,
      });
    }
  }

  // "4,50,000 rupees" / "18,500 USD" (amount before the currency word)
  const trailing = /\b(\d[\d,]*(?:\.\d+)?)\s*(rupees|USD|dollars|INR|GBP|EUR)\b/gi;
  let t: RegExpExecArray | null;
  while ((t = trailing.exec(text)) !== null) {
    const num = parseFloat(t[1].replace(/,/g, ""));
    if (Number.isNaN(num) || num <= 0) continue;
    if (results.some((r) => Math.abs(r.index - t!.index) < 3)) continue;
    const word = t[2].toLowerCase();
    const code = word === "rupees" || word === "inr" ? "INR" : word === "gbp" ? "GBP" : word === "eur" ? "EUR" : "USD";
    results.push({ currency: code, amount: num, raw: t[0].trim(), index: t.index });
  }

  return results.sort((a, b) => a.index - b.index);
}

/** Formats an amount in the currency's own convention (Indian grouping for INR). */
export function formatMoney(currency: string, amount: number): string {
  const symbol: Record<string, string> = { INR: "₹", USD: "$", GBP: "£", EUR: "€" };
  const locale = currency === "INR" ? "en-IN" : "en-US";
  const num = amount.toLocaleString(locale, { maximumFractionDigits: 2 });
  return symbol[currency] ? `${symbol[currency]}${num}` : `${currency ? currency + " " : ""}${num}`;
}

/** "+₹2,50,000 (+125%)" / "-$500 (-10%)" — sign always matches the real direction. */
export function describeMoneyChange(prev: MoneyAmount, curr: MoneyAmount): string {
  const diff = curr.amount - prev.amount;
  const pct = prev.amount > 0 ? Math.round((diff / prev.amount) * 100) : null;
  const sign = diff > 0 ? "+" : "−";
  const abs = formatMoney(curr.currency || prev.currency, Math.abs(diff));
  return `${sign}${abs}${pct !== null ? ` (${diff > 0 ? "+" : "−"}${Math.abs(pct)}%)` : ""}`;
}

/** "+30 days" / "−6 months" — expressed in the shared unit. */
export function describeDurationChange(prev: Duration, curr: Duration): string {
  if (prev.unit === curr.unit) {
    const diff = curr.value - prev.value;
    return `${diff > 0 ? "+" : "−"}${Math.abs(diff)} ${curr.unit}${Math.abs(diff) === 1 ? "" : "s"}`;
  }
  // Different units: express the change in the coarser unit only when it is a clean conversion,
  // otherwise fall back to days so the sign and size stay honest.
  const diffDays = curr.approxDays - prev.approxDays;
  return `${diffDays > 0 ? "+" : "−"}~${Math.abs(diffDays)} days`;
}
