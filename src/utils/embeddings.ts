// Embeddings via Gemini (Google) using dynamic import to avoid hard dependency issues.

export type Vector = number[];

export async function embedTextWithGemini(
  text: string
): Promise<Vector | null> {
  let apiKey =
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"] ||
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"];

  // Accept mis-set Google key in OPENAI_API_KEY if it matches AIza pattern
  if (!apiKey) {
    const maybeGoogleInOpenAI = process.env["OPENAI_API_KEY"];
    if (
      maybeGoogleInOpenAI &&
      /^AIza[0-9A-Za-z_-]{10,}$/.test(maybeGoogleInOpenAI)
    ) {
      apiKey = maybeGoogleInOpenAI;
    }
  }

  if (!apiKey) return null;

  const modelId = process.env["GEMINI_EMBED_MODEL"] || "text-embedding-004";

  try {
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier)"
    ) as (s: string) => Promise<any>;
    const mod = await dynamicImport("@google/generative-ai");
    const GoogleGenerativeAI = mod.GoogleGenerativeAI;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    // Gemini embeddings expect a Content object; pass role+parts with text
    const result = await model.embedContent({
      content: { role: "user", parts: [{ text }] },
    });
    const vector: number[] | undefined = result?.embedding?.values;
    if (!vector || !Array.isArray(vector)) return null;
    return vector;
  } catch (err) {
    console.error("❌ Gemini embeddings failed:", err);
    return null;
  }
}

export function cosineSimilarity(a: Vector, b: Vector): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}
