import { Router } from "express";
import { getFaqAnswer } from "../utils/faqMatcher";
import { generateWithGemini } from "../utils/llm";
import { generateWithOpenAI } from "../utils/openai";
import { KB_DOCS } from "../data/kb";
import { ensureIndex, similaritySearch } from "../utils/vectorStore";

const router = Router();

type ChatRequestBody = {
  message?: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  context?: Record<string, unknown>;
};

router.post("/chat", async (req, res) => {
  const body = req.body as ChatRequestBody;
  const userMessage = (body?.message || "").trim();

  if (!userMessage) {
    return res.status(400).json({ error: "message is required" });
  }

  // Handle simple greetings without requiring LLM/FAQ
  if (/^(hi|hello|hey|hola|namaste|yo)\b/i.test(userMessage)) {
    return res.json({
      reply:
        "Hello! I'm GCET AI. Ask me about campus blocks, exam schedules, registration, library NOC, or faculty info.",
      source: "greeting",
      confidence: 1,
    });
  }

  // First: FAQ high-confidence
  const faq = getFaqAnswer(userMessage);
  if (faq.confidence >= 0.75) {
    return res.json({
      reply: faq.answer,
      source: "faq",
      confidence: faq.confidence,
    });
  }

  // Check for OpenAI or Gemini API keys
  const hasOpenAIKey =
    !!process.env["OPENAI_API_KEY"] &&
    /^sk-[A-Za-z0-9_-]+$/.test(process.env["OPENAI_API_KEY"] as string);

  const hasGeminiKey =
    !!process.env["GEMINI_API_KEY"] ||
    !!process.env["GOOGLE_API_KEY"] ||
    !!process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ||
    (!!process.env["OPENAI_API_KEY"] &&
      /^AIza[0-9A-Za-z_-]{10,}$/.test(process.env["OPENAI_API_KEY"] as string));

  if (hasOpenAIKey || hasGeminiKey) {
    await ensureIndex(KB_DOCS);
    const results = await similaritySearch(userMessage, 4);
    if (results.length > 0) {
      const context = results
        .map(
          (r, i) =>
            `Doc ${i + 1} (score ${r.score.toFixed(2)}): ${r.item.title}\n${
              r.item.content
            }`
        )
        .join("\n\n");
      const prompt = `You are GCET AI. Answer strictly using the provided context. If the answer is not in the context, say you don't know and suggest checking the Notices or relevant dashboard section.\n\nContext:\n${context}\n\nQuestion: ${userMessage}\nAnswer:`;

      // Try OpenAI first if available
      if (hasOpenAIKey) {
        const oai = await generateWithOpenAI(prompt);
        if (oai && oai.text) {
          return res.json({
            reply: oai.text,
            source: "rag-openai",
            model: oai.model,
          });
        }
      }

      // Fall back to Gemini if OpenAI failed or not available
      if (hasGeminiKey) {
        const out = await generateWithGemini(prompt);
        if (out && out.text) {
          return res.json({
            reply: out.text,
            source: "rag-gemini",
            model: out.model,
          });
        }
      }
    }

    // As a last resort, try a direct LLM reply
    if (hasOpenAIKey) {
      const oai = await generateWithOpenAI(userMessage);
      if (oai && oai.text) {
        return res.json({
          reply: oai.text,
          source: "openai",
          model: oai.model,
        });
      }
    }

    if (hasGeminiKey) {
      const out = await generateWithGemini(userMessage);
      if (out && out.text) {
        return res.json({
          reply: out.text,
          source: "gemini",
          model: out.model,
        });
      }
    }
  }

  // If FAQ had some signal, return it even if below threshold
  if (faq.confidence > 0) {
    return res.json({
      reply: faq.answer,
      source: "faq",
      confidence: faq.confidence,
    });
  }

  // Final fallback
  return res.json({
    reply:
      "I'm not sure yet. You can ask about campus blocks, exam schedules, or semester faculty. We'll keep getting smarter!",
    source: "fallback",
    confidence: 0,
  });
});

export default router;
