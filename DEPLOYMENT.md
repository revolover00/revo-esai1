# دليل النشر (AI Studio → GitHub → Vercel)

## 1) من Lovable إلى GitHub
- من Lovable: اضغط على **GitHub → Connect to GitHub** ثم **Create Repository**.
- هيتعمل Repo فيه كل الكود تلقائياً (متضمن `.env` لأنه مش في `.gitignore`).

## 2) من GitHub إلى Vercel
1. ادخل على [vercel.com/new](https://vercel.com/new) واختار الـ Repo.
2. Vercel هيكتشف Vite تلقائياً. سيب الإعدادات الافتراضية:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (أو `bun run build`)
   - **Output Directory:** `dist`
3. اضغط **Deploy**.

## 3) Environment Variables على Vercel
الـ `.env` بيتنقل مع الكود، بس الأفضل تضيفهم في Vercel:
**Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://rgoolqnygckruvhhymht.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | (نفس قيمة `.env`) |
| `VITE_SUPABASE_PROJECT_ID` | `rgoolqnygckruvhhymht` |

> ملحوظة: دي **publishable keys** (مش سرية) فآمن وجودها في الكود.

## 4) Backend (Lovable Cloud / Supabase)
- الـ Edge Functions و الـ Secrets (`GEMINI_API_KEY_*`, `OPENROUTER_API_KEY`, `LOVABLE_API_KEY`) كلها مستضافة على Lovable Cloud وبتشتغل تلقائي. **مش محتاج تعمل أي حاجة في Vercel ليهم.**

## 5) Google OAuth Redirect
بعد ما يبقى عندك دومين Vercel (مثلاً `revo-esai.vercel.app`):
- روح Lovable Cloud → Authentication → URL Configuration وضيف الدومين في **Redirect URLs**.

## 6) SPA Routing
`vercel.json` موجود بالفعل وبيعمل rewrite لكل المسارات على `index.html` (مهم لـ React Router).

## ✅ خلاص
بعد أول Deploy، أي push على GitHub هيعمل deploy جديد على Vercel تلقائياً.
