import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { Helmet } from "react-helmet-async";
import { AIChatAssistant } from "@/components/AIChatAssistant";

export default function TeacherPage() {
  const navigate = useNavigate();
  return (
    <>
      <Helmet>
        <title>Revo Teacher — AI Tutor for Students | Revo ESAI</title>
        <meta name="description" content="Chat with Revo Teacher, an AI tutor that answers your study questions, explains concepts step-by-step, and helps you understand lessons in Arabic and English." />
        <link rel="canonical" href="https://revo-esai.lovable.app/teacher" />
        <meta property="og:title" content="Revo Teacher — AI Tutor for Students" />
        <meta property="og:description" content="An AI teacher that answers your study questions and explains lessons clearly." />
        <meta property="og:url" content="https://revo-esai.lovable.app/teacher" />
        <meta property="og:type" content="website" />
      </Helmet>
      <AnimatePresence>
        <AIChatAssistant onClose={() => navigate("/")} />
      </AnimatePresence>
    </>
  );
}
