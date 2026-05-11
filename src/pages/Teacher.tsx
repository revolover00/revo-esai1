import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { AIChatAssistant } from "@/components/AIChatAssistant";

export default function TeacherPage() {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      <AIChatAssistant onClose={() => navigate("/")} />
    </AnimatePresence>
  );
}
