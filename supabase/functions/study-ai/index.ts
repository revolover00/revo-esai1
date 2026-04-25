import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// supabase client no longer needed — open access

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

// GitHub Models API uses OpenAI-compatible format, so we just need to build standard messages.
// Build OpenAI-style messages with images attached to the last user message.
function buildOpenAIMessages(
  messages: any[],
  images: string[] | undefined,
  extractedText: string | undefined,
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
    // Auth & quota removed — open access
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

    // 1️⃣ FIRST: try GitHub Models API keys with gpt-4o (works for both text and images)
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
