import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogIn, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [checking, setChecking] = useState(true);
  const redirect = params.get("redirect") || "/";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) navigate(redirect, { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate(redirect, { replace: true });
      setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate, redirect]);

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/login",
    });
    if (result.error) console.error("Google sign-in error:", result.error);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted" dir="rtl">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">مرحباً بك في Revo ESAI</h1>
          <p className="text-muted-foreground">
            سجّل دخولك للحصول على <strong>4 استخدامات مجانية</strong> للذكاء الاصطناعي،
            ثم استخدم كود تفعيل لاستخدام غير محدود لمدة محددة.
          </p>
        </div>
        <Button onClick={handleGoogleSignIn} size="lg" className="w-full gap-2">
          <LogIn className="w-5 h-5" />
          تسجيل الدخول بـ Google
        </Button>
        <button
          onClick={() => navigate("/")}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mx-auto"
        >
          <ArrowRight className="w-3 h-3" />
          العودة للرئيسية
        </button>
      </Card>
    </div>
  );
}
