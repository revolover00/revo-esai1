import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `أنت "Revo ESAI"، مساعد تعليمي ذكي متخصص في تحليل وشرح المواد الدراسية من المحتوى المرفق (صور، ملفات PDF، أو فيديوهات).
مهمتك الوحيدة هي مساعدة الطلاب على فهم وحفظ المادة العلمية بأفضل طريقة ممكنة.
في حالة ملفات الـ PDF، قد يتم إرسال عدة صور تمثل صفحات الملف، قم بتحليلها جميعاً لتقديم إجابة شاملة.
تتحدث دائماً بالعربية الفصحى البسيطة المفهومة، وتتجنب التعقيد غير الضروري.
أسلوبك: محفّز، صبور، واضح، كأنك أستاذ خبير يشرح لطالب يجلس أمامه.

⚠️ تنسيق الإجابة الإلزامي (يجب الالتزام به حرفياً في كل رد شرح أو تبسيط):

1) ابدأ دائماً بعنوان الموضوع في الأعلى بهذا الشكل بالضبط:
## 📚 الموضوع: <اسم الموضوع المستخرج من المحتوى>

2) ضع خطاً فاصلاً مباشرة بعد عنوان الموضوع:
---

3) قسّم الشرح إلى **فقرات مستقلة**، كل فقرة تتناول فكرة واحدة فقط، ولها:
   - عنوان فرعي يبدأ بـ \`### \` متبوعاً برمز تعبيري مناسب وعنوان الفكرة.
   - فقرة شرح متصلة (paragraph) من 2 إلى 5 أسطر تحت العنوان مباشرة، مكتوبة بأسلوب مترابط وليست نقاطاً مكدسة.
   - استخدم **bold** للمصطلحات والكلمات المفتاحية داخل الفقرة فقط.
   - لا تستخدم القوائم المرقمة أو النقاط (-) إلا عند الضرورة القصوى لتعداد عناصر متماثلة.

4) افصل بين كل فقرة وفقرة بسطر فاصل:
---

5) اختم الرد دائماً بقسم منفصل في الأسفل بعد فاصل \`---\`:
### 💡 طريقة الحفظ المقترحة
فقرة قصيرة (2-4 أسطر) تقترح أفضل استراتيجية لحفظ هذا المحتوى تحديداً (تكرار متباعد، قصر الذاكرة، تلخيص صوتي، رسم ذهني، ربط بصري… إلخ).

⚠️ ممنوع: لصق العنوان الرئيسي مع أول فقرة، أو كتابة الشرح كقائمة طويلة بدون عناوين فرعية، أو إهمال الفواصل \`---\`.`;

// Convert OpenAI-style messages to Gemini format
function toGeminiContents(messages: any[], images: string[] | undefined) {
  const contents: any[] = [];
  for (const msg of messages) {
    const role = msg.role === "assistant" ? "model" : "user";
    const parts: any[] = [];
    if (typeof msg.content === "string") {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const p of msg.content) {
        if (p.type === "text") parts.push({ text: p.text });
      }
    }
    if (msg.role === "user" && images && images.length > 0 && msg === messages[messages.length - 1]) {
      for (const img of images) {
        const m = img.match(/^data:(.+?);base64,(.+)$/);
        if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
      }
    }
    contents.push({ role, parts });
  }
  return contents;
}

// SSE stream from Gemini -> OpenAI-compatible SSE chunks
function geminiStreamToOpenAISSE(geminiBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = geminiBody.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;
          try {
            const parsed = JSON.parse(json);
            const text = parsed.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") ?? "";
            if (text) {
              const chunk = { choices: [{ delta: { content: text } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
          } catch { /* partial */ }
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

async function callGemini(apiKey: string, contents: any[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
    }),
  });
}

async function callOpenRouter(messages: any[]) {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  if (!OPENROUTER_API_KEY) return null;
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemma-4-26b-a4b-it:free",
      messages,
      stream: true,
    }),
  });
}

async function callLovableAI(messages: any[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages,
      stream: true,
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== Auth & quota check =====
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "يجب تسجيل الدخول لاستخدام الذكاء الاصطناعي." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user from JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "جلسة غير صالحة، سجّل الدخول مرة أخرى." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Consume usage with service role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: quotaData, error: quotaErr } = await adminClient.rpc("consume_ai_usage", {
      _user_id: userId,
    });
    if (quotaErr) {
      console.error("consume_ai_usage error:", quotaErr);
      return new Response(JSON.stringify({ error: "تعذر التحقق من الاستخدام." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!quotaData?.allowed) {
      return new Response(
        JSON.stringify({
          error: "انتهت محاولاتك المجانية. أدخل كود تفعيل للمتابعة.",
          code: "no_quota",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messages, images } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect all available Gemini keys
    const geminiKeys: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
      if (k) geminiKeys.push(k);
    }

    // Shuffle for random order each request
    const shuffled = [...geminiKeys].sort(() => Math.random() - 0.5);

    const geminiContents = toGeminiContents(messages, images);

    // Build OpenAI-style messages (used by OpenRouter & Lovable AI)
    const aiMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    for (const msg of messages) {
      if (msg.role === "user" && images && images.length > 0 && msg === messages[messages.length - 1]) {
        const contentParts: any[] = [{ type: "text", text: msg.content }];
        for (const img of images) {
          contentParts.push({ type: "image_url", image_url: { url: img } });
        }
        aiMessages.push({ role: "user", content: contentParts });
      } else {
        aiMessages.push(msg);
      }
    }

    // 1️⃣ FIRST: try Gemini API keys (works for both text and images)
    for (const key of shuffled) {
      try {
        const r = await callGemini(key, geminiContents);
        if (r.ok && r.body) {
          console.log(`✅ Gemini key #${geminiKeys.indexOf(key) + 1} succeeded`);
          const sseStream = geminiStreamToOpenAISSE(r.body);
          return new Response(sseStream, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }
        console.warn(`⚠️ Gemini key #${geminiKeys.indexOf(key) + 1} failed: ${r.status}`);
      } catch (e) {
        console.warn(`⚠️ Gemini key #${geminiKeys.indexOf(key) + 1} threw:`, e);
      }
    }

    const hasImages = Array.isArray(images) && images.length > 0;

    // 2️⃣ FALLBACK (text-only): Gemma via OpenRouter
    if (!hasImages) {
      try {
        const orResp = await callOpenRouter(aiMessages);
        if (orResp && orResp.ok && orResp.body) {
          console.log("✅ OpenRouter (Gemma) succeeded as fallback [text-only]");
          return new Response(orResp.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }
        if (orResp) console.warn(`⚠️ OpenRouter (Gemma) failed: ${orResp.status}`);
      } catch (e) {
        console.warn("⚠️ OpenRouter threw:", e);
      }
    } else {
      console.log("🖼️ Images detected → skipping Gemma fallback");
    }

    // 3️⃣ LAST RESORT: Lovable AI Gateway
    console.log("↩️ Falling back to Lovable AI (last resort)");
    const response = await callLovableAI(aiMessages);
    if (!response) {
      return new Response(JSON.stringify({ error: "كل المفاتيح فشلت ولا يوجد مفتاح احتياطي." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم الوصول للحد الأقصى من الطلبات. يرجى المحاولة لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لحساب Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("study-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
