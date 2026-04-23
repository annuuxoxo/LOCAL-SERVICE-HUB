import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";
import { optionalAuth } from "../../middleware/auth.js";

function extractJSON(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw.replace(/```json|```/g, "").trim();
}

const router = Router();

const GenerateDescriptionBody = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  priceType: z.enum(["hourly", "fixed", "negotiable"]),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const SuggestPriceBody = z.object({
  category: z.string().min(1),
  location: z.string().optional(),
});

const SmartSearchBody = z.object({
  query: z.string().min(1),
  listings: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      category: z.string(),
      price: z.number(),
      priceType: z.string(),
      location: z.string().optional(),
      providerName: z.string().optional(),
      providerRating: z.number().optional(),
      distance: z.number().optional(),
    })
  ),
});

router.post("/ai/generate-description", optionalAuth, async (req, res) => {
  const parsed = GenerateDescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { title, category, price, priceType, location, tags } = parsed.data;

  const priceLabel =
    priceType === "hourly"
      ? `₹${price}/hr`
      : priceType === "fixed"
      ? `₹${price} fixed`
      : `₹${price} (negotiable)`;

  const locationLine = location ? ` based in ${location}` : " in Mumbai";
  const tagsLine = tags && tags.length > 0 ? ` Key skills: ${tags.join(", ")}.` : "";

  const prompt = `Write a compelling, professional service listing description for a local service provider in Mumbai, India.

Service Title: "${title}"
Category: ${category}
Price: ${priceLabel}
Location: ${locationLine}${tagsLine}

Requirements:
- Write 2–3 short, friendly paragraphs in English
- Highlight the provider's skills, reliability, and local expertise
- Mention the Mumbai/neighbourhood context naturally
- End with a brief call to action
- Keep it under 200 words
- Do NOT include the price or title again — just the body description`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const description = response.choices[0]?.message?.content?.trim() ?? "";
    return res.json({ description });
  } catch (err) {
    console.error("AI generate-description error:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
});

router.post("/ai/suggest-price", optionalAuth, async (req, res) => {
  const parsed = SuggestPriceBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { category, location } = parsed.data;
  const locationStr = location ?? "Mulund, Mumbai";

  const prompt = `You are a pricing expert for hyperlocal services in Mumbai, India.
  
For a "${category}" service provider in ${locationStr}, suggest a competitive price range in Indian Rupees (₹).

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{"min": number, "max": number, "suggested": number, "unit": "per hour" | "per session" | "fixed"}

Base your suggestion on typical Mumbai local service rates for ${category}.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 150,
      messages: [
        {
          role: "system",
          content: "You are a pricing expert. Always respond with valid JSON only, no markdown, no explanation.",
        },
        { role: "user", content: prompt },
      ],
    });
    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    console.log("AI suggest-price response:", JSON.stringify({ raw, finish_reason: response.choices[0]?.finish_reason, usage: response.usage }));
    if (!raw) {
      const fallbackPrices: Record<string, { min: number; max: number; suggested: number; unit: string }> = {
        tutoring: { min: 300, max: 800, suggested: 500, unit: "per hour" },
        tailoring: { min: 200, max: 600, suggested: 400, unit: "per session" },
        homefood: { min: 100, max: 300, suggested: 200, unit: "per meal" },
        repair: { min: 300, max: 1000, suggested: 600, unit: "per session" },
        cleaning: { min: 400, max: 1200, suggested: 700, unit: "per session" },
        beauty: { min: 300, max: 800, suggested: 500, unit: "per session" },
        gardening: { min: 300, max: 700, suggested: 450, unit: "per session" },
        plumbing: { min: 400, max: 1200, suggested: 700, unit: "per session" },
      };
      return res.json(fallbackPrices[category] ?? { min: 300, max: 800, suggested: 500, unit: "per session" });
    }
    const cleaned = extractJSON(raw);
    const priceData = JSON.parse(cleaned);
    return res.json(priceData);
  } catch (err) {
    console.error("AI suggest-price error:", err);
    return res.status(500).json({ error: "AI pricing failed" });
  }
});

router.post("/ai/smart-search", optionalAuth, async (req, res) => {
  const parsed = SmartSearchBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { query, listings } = parsed.data;

  if (listings.length === 0) {
    return res.json({ ids: [], summary: "No listings available to search." });
  }

  const listingsSummary = listings
    .map(
      (l, i) =>
        `[${i}] ID:${l.id} | "${l.title}" | ${l.category} | ₹${l.price} ${l.priceType}${l.location ? ` | ${l.location}` : ""}${l.providerRating != null ? ` | Rating:${l.providerRating.toFixed(1)}` : ""}${l.distance != null ? ` | ${l.distance.toFixed(1)}km away` : ""}`
    )
    .join("\n");

  const prompt = `You are a smart search assistant for LocalLink, a hyperlocal services marketplace in Mumbai.

User query: "${query}"

Available listings:
${listingsSummary}

Instructions:
- Return the IDs of the top matching listings (up to 5) that best match the user's query
- Consider category relevance, price, distance (if mentioned), and rating
- Also provide a 1-sentence friendly summary of what you found
- Respond ONLY with JSON (no markdown): {"ids": ["id1","id2",...], "summary": "..."}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 250,
      messages: [
        {
          role: "system",
          content: "You are a search assistant. Always respond with valid JSON only, no markdown, no explanation.",
        },
        { role: "user", content: prompt },
      ],
    });
    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = extractJSON(raw);
    const result = JSON.parse(cleaned);
    return res.json(result);
  } catch (err) {
    console.error("AI smart-search error:", err);
    return res.status(500).json({ error: "AI search failed" });
  }
});

export default router;
