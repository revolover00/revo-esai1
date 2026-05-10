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

export function RedeemCodeDialog({ open, onOpenChange, onSuccess }: RedeemCodeDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            تفعيل كود اشتراك
          </DialogTitle>
          <DialogDescription>
            أدخل كود التفعيل للحصول على استخدام غير محدود لمدة محددة. كل كود يُستخدم مرة واحدة فقط.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="مثال: TXA3UEFTH"
          className="text-center font-mono tracking-widest"
          maxLength={32}
          onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleRedeem} disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تفعيل"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
