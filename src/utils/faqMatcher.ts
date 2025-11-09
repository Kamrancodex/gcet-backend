import { faqItems } from "../data/faq";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  keywords: string[]; // lowercase keywords used for quick scoring
};

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function scoreMatch(query: string, item: FaqItem): number {
  const q = normalize(query);
  let score = 0;

  for (const kw of item.keywords) {
    if (q.includes(kw)) score += 1;
  }

  // boost if question substrings match strongly
  const nq = normalize(item.question);
  if (q && nq && (nq.includes(q) || q.includes(nq))) {
    score += 2;
  }

  // soft boost for shared words
  const qWords = new Set(q.split(" "));
  const aWords = new Set(normalize(item.answer).split(" "));
  let overlap = 0;
  for (const w of qWords) {
    if (aWords.has(w)) overlap += 1;
  }
  score += Math.min(2, overlap * 0.1);

  return score;
}

export function getFaqAnswer(query: string): { answer: string; confidence: number; item?: FaqItem } {
  let best: { item: FaqItem; score: number } | null = null;
  for (const item of faqItems) {
    const s = scoreMatch(query, item);
    if (!best || s > best.score) best = { item, score: s };
  }

  if (!best || best.score <= 0) {
    return { answer: "", confidence: 0 };
  }

  // Normalize confidence to 0..1 range roughly by dividing by a small constant
  // Typical max score ~ 4-6 for strong matches in this simple heuristic
  const confidence = Math.max(0, Math.min(1, best.score / 5));
  return { answer: best.item.answer, confidence, item: best.item };
}










