export async function generateWithGemini(
  prompt: string
): Promise<{ text: string; model: string } | null> {
  let apiKey =
    process.env["GEMINI_API_KEY"] ||
    process.env["GOOGLE_API_KEY"] ||
    process.env["GOOGLE_GENERATIVE_AI_API_KEY"];

  // Fallback: some environments may mistakenly put the Gemini key into OPENAI_API_KEY.
  // If it "looks" like a Google key (starts with AIza), accept it.
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

  let configuredModel = process.env["GEMINI_MODEL"] || "";

  try {
    // Dynamic import to avoid build-time module resolution when dependency isn't installed yet.
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier)"
    ) as (s: string) => Promise<any>;
    const mod = await dynamicImport("@google/generative-ai");
    const GoogleGenerativeAI = mod.GoogleGenerativeAI;
    const genAI = new GoogleGenerativeAI(apiKey);

    const candidates = [
      configuredModel,
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ].filter(Boolean);

    let lastErr: unknown = null;
    for (const modelId of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        const text = result?.response?.text?.() || "";
        if (text) return { text, model: modelId };
      } catch (e) {
        lastErr = e;
        console.warn(`⚠️ Model ${modelId} failed, trying next...`);
      }
    }
    if (lastErr) throw lastErr;
    return null;
  } catch (err) {
    console.error("❌ Gemini generation failed:", err);
    return null;
  }
}
