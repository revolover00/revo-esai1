import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Same hardcoded Gemini keys used by study-ai (gemini-2.0-flash supports audio input).
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

async function transcribeWithGemini(apiKey: string, audioBase64: string, mimeType: string): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "فرّغ هذا التسجيل الصوتي إلى نص عربي فصيح بدقة 100%. اكتب فقط النص المنطوق بدون أي إضافات أو تعليقات أو علامات اقتباس. إذا كان التسجيل بلغة أخرى، فرّغه بنفس اللغة.",
          },
          { inlineData: { mimeType, data: audioBase64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.0 },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": pickRandom(FAKE_USER_AGENTS),
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join(" ").trim();
  return text || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { audio, mimeType } = await req.json();
    if (!audio || typeof audio !== "string") {
      return new Response(JSON.stringify({ error: "audio (base64) is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mt = (typeof mimeType === "string" && mimeType) || "audio/webm";

    const order = [...GEMINI_DIRECT_KEYS].sort(() => Math.random() - 0.5);
    for (const key of order) {
      try {
        const text = await transcribeWithGemini(key, audio, mt);
        if (text) {
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.warn("transcribe key failed", e);
      }
    }

    return new Response(JSON.stringify({ error: "تعذر تفريغ الصوت، حاول مرة أخرى." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
