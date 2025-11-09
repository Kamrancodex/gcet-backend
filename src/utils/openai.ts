export async function generateWithOpenAI(
  prompt: string
): Promise<{ text: string; model: string } | null> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return null;

  const configured = process.env["OPENAI_MODEL"] || "gpt-4o-mini";

  try {
    // Dynamic import to avoid hard dependency if not installed yet
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier)"
    ) as (s: string) => Promise<any>;
    const mod = await dynamicImport("openai");
    const OpenAI = mod.default || mod.OpenAI || mod;
    const client = new OpenAI({ apiKey });

    const res = await client.chat.completions.create({
      model: configured,
      messages: [
        {
          role: "system",
          content:
            "You are GCET AI. Be concise and factual. If unsure, say you don't know and suggest checking Notices or the relevant dashboard section.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const text = res.choices?.[0]?.message?.content || "";
    return { text, model: configured };
  } catch (err) {
    console.error("❌ OpenAI generation failed:", err);
    return null;
  }
}










