## المشكلة
عند نشر التطبيق على Vercel، أي مسار غير `/` (مثل `/auth` أو عمل refresh لأي صفحة) يرجع خطأ **404: NOT_FOUND**. السبب: Vercel لا يعرف تلقائياً أن المشروع SPA يستخدم React Router، فيبحث عن ملف فعلي بالمسار ولا يجده.

## الحل
إنشاء ملف `vercel.json` في جذر المشروع يخبر Vercel بإعادة توجيه أي طلب لـ `index.html` ليتولى React Router المسارات.

## الملف الذي سيُنشأ

**`vercel.json`** (جذر المشروع):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## خطوات بعد التطبيق (يقوم بها المستخدم)

1. **رفع الملف الجديد على GitHub/Vercel** — Vercel سيعيد النشر تلقائياً.
2. **التأكد من Environment Variables في Vercel** (Settings → Environment Variables):
   - `VITE_SUPABASE_URL` = `https://rgoolqnygckruvhhymht.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = (المفتاح الموجود في `.env`)
   - `VITE_SUPABASE_PROJECT_ID` = `rgoolqnygckruvhhymht`
3. **عمل Redeploy** بعد إضافة المتغيرات.
4. **لتسجيل الدخول بجوجل**: إضافة رابط Vercel في Authorized URLs في إعدادات Lovable Cloud Auth.

## ملاحظة مهمة
الـ Edge Functions (`study-ai`, `voice-transcribe`) ستظل تعمل من Lovable Cloud، لأن الكود يستدعيها مباشرة على رابط Supabase. لا حاجة لنقلها.