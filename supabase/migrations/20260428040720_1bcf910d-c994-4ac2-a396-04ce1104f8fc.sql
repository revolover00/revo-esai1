
-- Cloud storage for Revo Teacher chat sessions and StudyAI history per user
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'محادثة جديدة',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id, updated_at DESC);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own chat sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own chat sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own chat sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own chat sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.study_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mode TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_history_user ON public.study_history(user_id, created_at DESC);

ALTER TABLE public.study_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own history" ON public.study_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own history" ON public.study_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own history" ON public.study_history FOR DELETE USING (auth.uid() = user_id);
