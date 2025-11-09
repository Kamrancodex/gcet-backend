import { KBItem } from "../data/kb";
import { Vector, cosineSimilarity, embedTextWithGemini } from "./embeddings";

export type KBNode = KBItem & { embedding?: Vector };

let INDEX: KBNode[] = [];

export async function buildIndex(docs: KBItem[]): Promise<void> {
  const nodes: KBNode[] = [];
  for (const d of docs) {
    const emb = await embedTextWithGemini(`${d.title}\n\n${d.content}`);
    if (emb) {
      nodes.push({ ...d, embedding: emb });
    } else {
      nodes.push({ ...d });
    }
  }
  INDEX = nodes;
}

export async function ensureIndex(docs: KBItem[]): Promise<void> {
  if (!INDEX.length) {
    await buildIndex(docs);
  }
}

export async function similaritySearch(query: string, k = 3): Promise<Array<{ item: KBItem; score: number }>> {
  if (!INDEX.length) return [];
  const qv = await embedTextWithGemini(query);
  if (!qv) return [];
  const scored: Array<{ item: KBItem; score: number }> = [];
  for (const node of INDEX) {
    if (!node.embedding) continue;
    const score = cosineSimilarity(qv, node.embedding);
    scored.push({ item: node, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}










