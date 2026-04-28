import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_DIRECT_KEYS: string[] = [
  "AIzaSyDmugOwEz6nsb_asVfy3Ihcke0YE3o5QtE",
  "AIzaSyCkUx2QS0saAVavVELUNxaoZab0xYywp7M",
  "AIzaSyCcCh0vXvWoYDQ_nJhrYDxVL-l_8NattuI",
  "AIzaSyAa6-Upvu37fstjYCz5fzpEPPU7BtDstSg",
  "AIzaSyCRi2aOZUU8XqHgpvYK5x8Nv8V8_guMfUo",
];

const FAKE_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Normalize browser mime types to ones Gemini explicitly supports.
// Gemini supports: audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac
// `audio/webm` and `audio/mp4` are usually handled too, but we coerce some
// edge cases (codecs= suffixes, missing prefixes) for safety.
function normalizeMime(mt: string): string {
  if (!mt) return "audio/webm";
  const base = mt.split(";")[0].trim().toLowerCase();
  if (base === "audio/mpeg") return "audio/mp3";
  if (base === "audio/x-m4a" || base === "audio/m4a") return "audio/mp4";
  if (base === "audio/wave") return "audio/wav";
  return base || "audio/webm";
}

async function transcribeWithGemini(
  apiKey: string,
  audioBase64: string,
  mimeType: string,
): Promise<{ text: string | null; status: number; rawError?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "أنت محرّك تفريغ صوتي (Speech-to-Text). فرّغ هذا التسجيل الصوتي إلى نص بدقة عالية. " +
              "اكتب فقط النص المنطوق حرفياً بدون أي إضافات، تعليقات، أو علامات اقتباس. " +
              "إذا كان التسجيل بالعربية، اكتبه بالعربية الفصحى. إذا كان بلغة أخرى، فرّغه بنفس اللغة. " +
              "إذا لم تستطع سماع أي كلام واضح، أعد كلمة EMPTY فقط.",
          },
          { inlineData: { mimeType, data: audioBase64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.0, maxOutputTokens: 2048 },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": pickRandom(FAKE_USER_AGENTS),
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    console.warn(`Gemini ${resp.status}:`, errText.slice(0, 300));
    return { text: null, status: resp.status, rawError: errText.slice(0, 300) };
  }
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p.text)
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!text || text === "EMPTY") {
    return { text: null, status: 200, rawError: "empty_transcript" };
  }
  return { text, status: 200 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { audio, mimeType } = await req.json();
    if (!audio || typeof audio !== "string" || audio.length < 200) {
      return new Response(
        JSON.stringify({ error: "تسجيل قصير جداً أو فارغ، حاول التحدث لمدة أطول." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const mt = normalizeMime(typeof mimeType === "string" ? mimeType : "audio/webm");

    const order = [...GEMINI_DIRECT_KEYS].sort(() => Math.random() - 0.5);
    let lastError = "unknown";
    let lastStatus = 502;
    for (const key of order) {
      try {
        const result = await transcribeWithGemini(key, audio, mt);
        if (result.text) {
          return new Response(JSON.stringify({ text: result.text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        lastError = result.rawError || "no_text";
        lastStatus = result.status;
        // If it's a quota / rate limit, try the next key. Otherwise (e.g. 400 invalid audio), no point retrying.
        if (result.status !== 429 && result.status !== 403 && result.status !== 500 && result.status !== 503) {
          break;
        }
      } catch (e) {
        console.warn("transcribe key failed", e);
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    const userMsg =
      lastError === "empty_transcript"
        ? "لم أسمع أي كلام واضح في التسجيل، حاول التحدث بصوت أعلى."
        : lastStatus === 400
          ? "صيغة الصوت غير مدعومة، جرّب من متصفح آخر."
          : "تعذر تفريغ الصوت، حاول مرة أخرى.";

    return new Response(
      JSON.stringify({ error: userMsg, debug: lastError, status: lastStatus }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
