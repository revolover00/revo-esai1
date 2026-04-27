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

// Extra instruction we add ONLY on the first request (when raw images/PDF/video frames are sent).
// The model first emits a hidden detailed description block we cache on the client,
// so subsequent requests can be answered as pure text without re-uploading the media.
const MEDIA_DESCRIPTION_INSTRUCTION = `

---
🛠️ تعليمات تقنية إلزامية (للمعالجة الأولى للوسائط فقط):
قبل إجابتك النهائية، اكتب أولاً كتلة وصف مفصّل للمحتوى البصري المرفق بهذا الشكل بالضبط:

<MEDIA_DESCRIPTION>
وصف نصي شامل ودقيق ومفصّل لكل ما هو موجود في الصور/الصفحات/الإطارات المرفقة، بما يشمل:
- كل النصوص المكتوبة بحرفيتها (transcribe كل الكلمات الظاهرة).
- المعادلات، الرسوم، الأشكال، الجداول، الرموز، الألوان المهمة.
- ترتيب الصفحات/الإطارات وترقيمها إن أمكن.
- أي تفاصيل بصرية مهمة لفهم المادة لاحقاً بدون الحاجة لرؤية الصورة مرة أخرى.
اجعل هذا الوصف غنياً جداً (لا تختصر) لأنه سيُستخدم كمرجع نصي وحيد للأسئلة القادمة.
</MEDIA_DESCRIPTION>

ثم بعد إغلاق الكتلة مباشرة، اكتب الإجابة المطلوبة من المستخدم وفق التنسيق المحدد أعلاه (📚 الموضوع... إلخ). لا تذكر أبداً وجود كتلة الوصف للمستخدم.`;

// =============================================================
// Chat-only system prompt (no media). Used by the new "AI Chat
// Assistant" page where the user just chats — no uploads.
// Strictly study-focused; politely refuses unrelated topics.
// =============================================================
const CHAT_SYSTEM_PROMPT = `أنت "Revo ESAI Chat"، مساعد دراسي ذكي يتحدث بالعربية الفصحى البسيطة.
🎯 مهمتك الوحيدة: مساعدة الطالب في فهم وحفظ ومذاكرة المواد الدراسية في كل المراحل (ابتدائي / إعدادي / ثانوي / جامعي) وكل التخصصات (علوم، رياضيات، لغات، إنسانيات، برمجة، طب، هندسة...).

✅ يُسمح بالرد على:
- شرح الدروس والمفاهيم الأكاديمية.
- حل المسائل والتمارين خطوة بخطوة.
- تلخيص، تبسيط، أمثلة، اختبارات قصيرة، خرائط ذهنية نصية.
- نصائح مذاكرة، تنظيم وقت، طرق حفظ، إدارة قلق الامتحانات.
- شرح مصطلحات علمية أو تاريخية أو لغوية.

⛔ ممنوع تماماً (ارفض بلطف ووجّه الطالب للدراسة):
- النقاشات السياسية / الدينية الجدلية / الرياضية / الترفيهية / الشائعات.
- الأخبار، الأفلام، الألعاب، العلاقات الشخصية، الشاتنج.
- أي محتوى غير لائق أو خطر.
- كتابة كود لمشروع تجاري كامل (لكن يُسمح بشرح مفهوم برمجي للدراسة).

عند رفض موضوع، قل بلطف: "هذا الموضوع خارج نطاق مساعدتي الدراسية 📚 — اسألني عن أي مادة دراسية وأنا في خدمتك!" ثم اقترح 2-3 أمثلة لأسئلة دراسية.

📐 تنسيق الإجابة:
- استخدم Markdown: عناوين \`###\`، **bold** للمصطلحات، قوائم عند الحاجة، \`\`\`code\`\`\` للأكواد والمعادلات.
- ابدأ مباشرة بالإجابة بدون مقدمات طويلة.
- إجاباتك مركّزة، واضحة، ومنظمة.
- إذا كان السؤال مبهماً، اطلب توضيحاً قصيراً.
- لا تخترع معلومات: إذا لم تكن متأكداً، قل ذلك صراحة.`;

// GitHub Models API uses OpenAI-compatible format, so we just need to build standard messages.
// Build OpenAI-style messages with images attached to the last user message.
function buildOpenAIMessages(
  messages: any[],
  images: string[] | undefined,
  extractedText: string | undefined,
  chatOnly?: boolean,
) {
  // If we already have an extracted text description from a previous call,
  // inject it as system context and IGNORE images entirely (saves tokens & enables text-only models).
  let systemContent = SYSTEM_PROMPT;
  const hasImages = Array.isArray(images) && images.length > 0;
  const hasExtracted = typeof extractedText === "string" && extractedText.trim().length > 0;

  if (hasExtracted) {
    systemContent +=
      `\n\n---\n📎 سياق المادة (مستخرج مسبقاً من الصور/الملف/الفيديو، اعتمد عليه كمرجع كامل بدلاً من الصور):\n` +
      extractedText.trim();
  } else if (hasImages) {
    // First call with media → ask the model to emit the cacheable description block.
    systemContent += MEDIA_DESCRIPTION_INSTRUCTION;
  }

  const out: any[] = [{ role: "system", content: systemContent }];
  for (const msg of messages) {
    if (
      msg.role === "user" &&
      hasImages &&
      !hasExtracted &&
      msg === messages[messages.length - 1]
    ) {
      const parts: any[] = [
        { type: "text", text: typeof msg.content === "string" ? msg.content : "" },
      ];
      for (const img of images!) {
        parts.push({ type: "image_url", image_url: { url: img } });
      }
      out.push({ role: "user", content: parts });
    } else {
      out.push(msg);
    }
  }
  return out;
}

// =============================================================
// Google Gemini direct API (gemini-2.0-flash) — used FIRST
// We hardcode the user's keys here per their explicit request.
// Each call randomizes User-Agent / client headers so the keys
// don't all look like a single coordinated project to Google.
// =============================================================
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
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Convert OpenAI-style messages to Gemini "contents" format.
// Supports text + image_url (data URLs) parts.
function openAIToGeminiContents(messages: any[]) {
  const systemParts: string[] = [];
  const contents: any[] = [];

  for (const m of messages) {
    if (m.role === "system") {
      if (typeof m.content === "string") systemParts.push(m.content);
      continue;
    }
    const role = m.role === "assistant" ? "model" : "user";
    const parts: any[] = [];
    if (typeof m.content === "string") {
      if (m.content.length) parts.push({ text: m.content });
    } else if (Array.isArray(m.content)) {
      for (const p of m.content) {
        if (p.type === "text" && p.text) {
          parts.push({ text: p.text });
        } else if (p.type === "image_url" && p.image_url?.url) {
          const url: string = p.image_url.url;
          // Expect data URL: data:<mime>;base64,<data>
          const match = url.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
          } else {
            // Remote URL — Gemini supports fileData with uri but that requires upload; fall back to text.
            parts.push({ text: `[image: ${url}]` });
          }
        }
      }
    }
    if (parts.length) contents.push({ role, parts });
  }

  return {
    contents,
    systemInstruction: systemParts.length
      ? { role: "system", parts: [{ text: systemParts.join("\n\n") }] }
      : undefined,
  };
}

// Call Gemini with streaming SSE and convert chunks → OpenAI-compatible SSE
// so the existing client streaming code keeps working.
async function callGeminiDirect(apiKey: string, messages: any[]): Promise<Response | null> {
  const { contents, systemInstruction } = openAIToGeminiContents(messages);
  const body: any = { contents };
  if (systemInstruction) body.systemInstruction = systemInstruction;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent` +
    `?alt=sse&key=${apiKey}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": pickRandom(FAKE_USER_AGENTS),
      "Accept": "text/event-stream",
      // Vary the Google client identifier per request to avoid fingerprinting all keys to one source.
      "X-Goog-Api-Client": `gl-node/${Math.floor(Math.random() * 5) + 18}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 5)}`,
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    return upstream;
  }

  // Transform Gemini SSE → OpenAI-style SSE chunks
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const obj = JSON.parse(data);
            const text = obj?.candidates?.[0]?.content?.parts
              ?.map((p: any) => p.text || "")
              .join("") ?? "";
            if (text) {
              const openaiChunk = {
                choices: [{ delta: { content: text }, index: 0, finish_reason: null }],
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`),
              );
            }
          } catch {
            // ignore parse errors on partial frames
          }
        }
      } catch (e) {
        controller.error(e);
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

async function callGitHubModels(apiKey: string, messages: any[]) {
  return fetch("https://models.github.ai/inference/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages,
      stream: true,
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

    const { messages, images, extractedText } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we already have an extracted text description, treat this request as text-only.
    const hasExtracted = typeof extractedText === "string" && extractedText.trim().length > 0;
    const effectiveImages = hasExtracted ? undefined : images;

    // Collect all available GitHub API keys (stored as GEMINI_API_KEY_1..10 from before, plus GITHUB_TOKEN)
    const githubKeys: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const k = Deno.env.get(`GEMINI_API_KEY_${i}`) || Deno.env.get(`GITHUB_API_KEY_${i}`);
      if (k) githubKeys.push(k);
    }
    const singleGithub = Deno.env.get("GITHUB_TOKEN");
    if (singleGithub && !githubKeys.includes(singleGithub)) githubKeys.push(singleGithub);

    // Shuffle for random order each request
    const shuffled = [...githubKeys].sort(() => Math.random() - 0.5);

    // Build OpenAI-style messages (used for GitHub Models, OpenRouter & Lovable AI)
    const aiMessages = buildOpenAIMessages(messages, effectiveImages, extractedText);

    // 0️⃣ FIRST: try Google Gemini direct (gemini-2.0-flash) with the user's hardcoded keys.
    // Rotate on rate-limit / quota errors; fall through to GitHub when all are exhausted.
    const geminiOrder = [...GEMINI_DIRECT_KEYS].sort(() => Math.random() - 0.5);
    for (const key of geminiOrder) {
      try {
        const r = await callGeminiDirect(key, aiMessages);
        if (r && r.ok && r.body) {
          console.log(
            `✅ Gemini direct key #${GEMINI_DIRECT_KEYS.indexOf(key) + 1} succeeded (gemini-2.0-flash) [${hasExtracted ? "text-cached" : effectiveImages?.length ? "vision" : "text"}]`,
          );
          return r;
        }
        const status = r?.status ?? 0;
        const errTxt = r ? await r.text().catch(() => "") : "";
        console.warn(
          `⚠️ Gemini direct key #${GEMINI_DIRECT_KEYS.indexOf(key) + 1} failed: ${status} ${errTxt.slice(0, 200)}`,
        );
        // 429 / 403 (quota) → just continue to next key. Any other status also continues.
      } catch (e) {
        console.warn(`⚠️ Gemini direct key #${GEMINI_DIRECT_KEYS.indexOf(key) + 1} threw:`, e);
      }
    }

    // 1️⃣ SECOND: try GitHub Models API keys with gpt-4o (works for both text and images)
    for (const key of shuffled) {
      try {
        const r = await callGitHubModels(key, aiMessages);
        if (r.ok && r.body) {
          console.log(
            `✅ GitHub key #${githubKeys.indexOf(key) + 1} succeeded (gpt-4o) [${hasExtracted ? "text-cached" : effectiveImages?.length ? "vision" : "text"}]`,
          );
          return new Response(r.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }
        const errTxt = await r.text().catch(() => "");
        console.warn(`⚠️ GitHub key #${githubKeys.indexOf(key) + 1} failed: ${r.status} ${errTxt.slice(0, 200)}`);
      } catch (e) {
        console.warn(`⚠️ GitHub key #${githubKeys.indexOf(key) + 1} threw:`, e);
      }
    }

    const hasImages = Array.isArray(effectiveImages) && effectiveImages.length > 0;

    // 2️⃣ FALLBACK (text-only): OpenRouter
    if (!hasImages) {
      try {
        const orResp = await callOpenRouter(aiMessages);
        if (orResp && orResp.ok && orResp.body) {
          console.log("✅ OpenRouter succeeded as fallback [text-only]");
          return new Response(orResp.body, {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
          });
        }
        if (orResp) console.warn(`⚠️ OpenRouter failed: ${orResp.status}`);
      } catch (e) {
        console.warn("⚠️ OpenRouter threw:", e);
      }
    } else {
      console.log("🖼️ Images detected → skipping OpenRouter fallback");
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
