import { useState } from "react";
import { Loader2, Ticket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RedeemCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
  activeCode?: string | null;
  freeRemaining?: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  empty_code: "من فضلك أدخل الكود",
  invalid_code: "الكود غير صحيح",
  already_used: "هذا الكود تم استخدامه من قبل",
};

export function RedeemCodeDialog({ open, onOpenChange, onSuccess, subscriptionStartedAt, subscriptionExpiresAt, activeCode, freeRemaining }: RedeemCodeDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.rpc("redeem_code", {
        _user_id: userData.user.id,
        _code: code.trim(),
      });
      if (error) {
        toast({ title: "حدث خطأ", description: error.message, variant: "destructive" });
        return;
      }
      const result = data as { success: boolean; error?: string; duration_days?: number; subscription_expires_at?: string };
      if (!result?.success) {
        toast({
          title: "تعذر تفعيل الكود",
          description: ERROR_MESSAGES[result?.error || ""] || "كود غير صالح",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "✅ تم تفعيل الاشتراك",
        description: `تم تفعيل ${result.duration_days} يوم. ينتهي في ${new Date(result.subscription_expires_at!).toLocaleDateString("ar-EG")}`,
      });
      setCode("");
      onSuccess();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isActive = !!subscriptionExpiresAt && new Date(subscriptionExpiresAt) > new Date();
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const daysLeft = subscriptionExpiresAt
    ? Math.max(0, Math.ceil((new Date(subscriptionExpiresAt).getTime() - Date.now()) / 86400000))
    : 0;
  const totalDays =
    subscriptionStartedAt && subscriptionExpiresAt
      ? Math.max(
          1,
          Math.round(
            (new Date(subscriptionExpiresAt).getTime() - new Date(subscriptionStartedAt).getTime()) / 86400000
          )
        )
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            {isActive ? "تفاصيل الاشتراك" : "تفعيل كود اشتراك"}
          </DialogTitle>
          <DialogDescription>
            {isActive
              ? "تفاصيل اشتراكك الحالي. يمكنك تفعيل كود إضافي لتمديد المدة."
              : "أدخل كود التفعيل للحصول على استخدام غير محدود لمدة محددة. كل كود يُستخدم مرة واحدة فقط."}
          </DialogDescription>
        </DialogHeader>

        {isActive && (
          <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            {activeCode && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الكود المُفعّل</span>
                <span className="font-mono font-bold tracking-widest">{activeCode}</span>
              </div>
            )}
            {subscriptionStartedAt && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">تاريخ بدء الاشتراك</span>
                <span className="font-semibold text-right">{fmt(subscriptionStartedAt)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">تاريخ انتهاء الاشتراك</span>
              <span className="font-semibold text-right">{fmt(subscriptionExpiresAt!)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-primary/20 pt-3">
              <span className="text-muted-foreground">المدة الإجمالية</span>
              <span className="font-bold">{totalDays} يوم</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">المتبقي</span>
              <span className="font-bold text-primary">{daysLeft} يوم</span>
            </div>
          </div>
        )}

        {!isActive && typeof freeRemaining === "number" && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-center">
            الاستخدامات المجانية المتبقية: <span className="font-bold">{freeRemaining}/4</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            {isActive ? "تمديد بكود إضافي (اختياري)" : "أدخل الكود"}
          </label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="مثال: TXA3UEFTH"
            className="text-center font-mono tracking-widest"
            maxLength={32}
            onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إغلاق
          </Button>
          <Button onClick={handleRedeem} disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isActive ? "تمديد" : "تفعيل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
