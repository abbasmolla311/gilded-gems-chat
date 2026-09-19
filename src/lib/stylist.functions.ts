import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type StylistInput = {
  style: string;
  occasion: string;
  metal: string;
  budget: number;
};

export type StylistResult = {
  note: string;
  picks: { slug: string; reason: string }[];
};

type CatalogRow = {
  slug: string;
  name: string;
  metal: string;
  purity: string;
  price: number;
  net_weight: number;
  description: string;
  stone_details: string;
};

/** Suggests catalogue pieces that match a shopper's described style, occasion, metal and budget. */
export const recommendJewellery = createServerFn({ method: "POST" })
  .inputValidator((input: StylistInput) => input)
  .handler(async ({ data }): Promise<StylistResult> => {
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { data: rows, error } = await supabase
      .from("products")
      .select("slug, name, metal, purity, price, net_weight, description, stone_details")
      .eq("active", true);
    if (error) throw new Error(error.message);

    const catalog = (rows ?? []) as CatalogRow[];
    if (catalog.length === 0) return { note: "The catalogue is empty right now.", picks: [] };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The styling assistant is not configured yet.");

    const catalogText = catalog
      .map(
        (p) =>
          `slug: ${p.slug} | ${p.name} | ${p.metal} ${p.purity} | price ${Math.round(
            Number(p.price),
          )} | ${Number(p.net_weight)}g | stones: ${p.stone_details || "none"} | ${p.description}`,
      )
      .join("\n");

    const prompt = `You are a warm, expert fine-jewellery stylist.
Shopper brief:
- Style preference: ${data.style}
- Occasion: ${data.occasion}
- Preferred metal: ${data.metal || "no preference"}
- Budget (INR): ${data.budget > 0 ? data.budget : "flexible"}

Catalogue (only recommend from these exact slugs):
${catalogText}

Choose the 3 to 4 best matching pieces, ordered best first. Respect the budget where possible; if nothing fits, pick the closest and say so. Write one short warm sentence per piece explaining the match, and a two-sentence overall styling note. Answer in English only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: prompt,
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        text: {
          format: {
            type: "json_schema",
            name: "stylist_recommendations",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                note: { type: "string" },
                picks: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      slug: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["slug", "reason"],
                  },
                },
              },
              required: ["note", "picks"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) {
        throw new Error("The styling assistant is busy. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("The styling assistant is temporarily unavailable. Please try later.");
      }
      throw new Error(`The styling assistant could not answer (${response.status}). ${body.slice(0, 200)}`);
    }

    const raw = await response.text();
    let text = "";
    for (const line of raw.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        } else if (event.type === "response.completed" && event.response?.output_text) {
          if (!text) text = event.response.output_text;
        }
      } catch {
        /* ignore non-JSON keepalive lines */
      }
    }

    let parsed: StylistResult | null = null;
    try {
      parsed = JSON.parse(text) as StylistResult;
    } catch {
      parsed = null;
    }
    if (!parsed || !Array.isArray(parsed.picks)) {
      return {
        note: "We could not put a suggestion together just now — please try describing your style again.",
        picks: [],
      };
    }

    const valid = new Set(catalog.map((p) => p.slug));
    return {
      note: parsed.note ?? "",
      picks: parsed.picks.filter((pick) => pick && valid.has(pick.slug)).slice(0, 4),
    };
  });
