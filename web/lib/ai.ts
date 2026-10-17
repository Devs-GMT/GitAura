import "server-only";
import { z } from "zod";
import { fallbackAura, FRESH_AURA, type AuraText } from "./fallback";

// Provider: Google Gemini API, REST generateContent (API_SPEC §AI prompt). Semua detail provider
// ada di file ini — route lain (ChefBOT/PocketLM) cukup memakai `callJson`.

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
export const AI_TIMEOUT_MS = 8000;

export class AiError extends Error {}

type JsonCallOptions = {
  /** Schema OpenAPI-subset untuk `responseSchema` Gemini (opsional, membantu model). */
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
};

/** Ambil blok `{...}` pertama dari teks lalu JSON.parse; null jika gagal. */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Panggil LLM dan kembalikan JSON yang lolos `schema`. Lempar `AiError` jika key kosong,
 * timeout, HTTP error (termasuk 429 kuota free tier), atau output tidak valid.
 */
export async function callJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  timeoutMs = AI_TIMEOUT_MS,
  opts: JsonCallOptions = {},
): Promise<T> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new AiError("GEMINI_API_KEY not set");
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(`${GEMINI_URL}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          ...(opts.responseSchema ? { responseSchema: opts.responseSchema } : {}),
          temperature: opts.temperature ?? 0.9,
          maxOutputTokens: opts.maxOutputTokens ?? 400,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new AiError(timedOut ? "timeout" : "network error");
  }
  if (!res.ok) throw new AiError(`gemini http ${res.status}`);

  const data = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  } | null;
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");

  const parsed = schema.safeParse(extractJson(text));
  if (!parsed.success) throw new AiError("invalid model output");
  return parsed.data;
}

// ---------- Aura ----------

export const AURA_SYSTEM =
  "You write playful, kind developer personality cards from GitHub stats. Never insult, never mention numbers being low, never reference real-world identity traits. Reply with ONLY minified JSON: {\"title\":string<=80,\"vibe\":string<=160,\"traits\":[3 strings<=24]}. Title format like 'The {Adjective} {Language} {Archetype}'.";

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

export const auraOutputSchema = z.object({
  title: trimmed(1, 80),
  vibe: trimmed(1, 160),
  traits: z.tuple([trimmed(1, 24), trimmed(1, 24), trimmed(1, 24)]),
});

const AURA_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    vibe: { type: "STRING" },
    traits: { type: "ARRAY", items: { type: "STRING" }, minItems: 3, maxItems: 3 },
  },
  required: ["title", "vibe", "traits"],
  propertyOrdering: ["title", "vibe", "traits"],
};

export type AuraStatsInput = {
  login: string;
  name?: string;
  publicRepos: number;
  followers: number;
  accountAgeYears: number;
  totalStars: number;
  topLanguages: { name: string; share: number }[];
  mostStarred: { name: string; stars: number } | null;
  recentActivity: "active" | "quiet" | "dormant";
};

export type AuraResult = AuraText & { source: "ai" | "fallback" | "fresh" };

/** AI → aura; gagal apa pun → template (`source: "fallback"`). 0 repo → Fresh account tanpa memanggil AI. */
export async function generateAura(stats: AuraStatsInput): Promise<AuraResult> {
  if (stats.publicRepos === 0) return { ...FRESH_AURA, source: "fresh" };
  try {
    const out = await callJson(AURA_SYSTEM, JSON.stringify(stats), auraOutputSchema, AI_TIMEOUT_MS, {
      responseSchema: AURA_RESPONSE_SCHEMA,
    });
    return { ...out, source: "ai" };
  } catch (err) {
    console.warn("[ai] aura fallback:", err instanceof AiError ? err.message : "unexpected error");
    return { ...fallbackAura(stats), source: "fallback" };
  }
}
