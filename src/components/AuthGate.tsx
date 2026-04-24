import { LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { lovable } from "@/integrations/lovable";

export function AuthGate() {
  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) console.error("Google sign-in error:", result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
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
      </Card>
    </div>
  );
}
