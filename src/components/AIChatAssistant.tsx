import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowRight,
  Send,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  History,
  StopCircle,
  BookOpen,
  X,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const STUDY_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-ai`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

interface Props {
  onClose: () => void;
}

const STORAGE_KEY = 'revo_esai_chat_sessions';

const SUGGESTIONS = [
  'اشرح لي قانون نيوتن الأول ببساطة',
  'لخّص لي فصل الخلية في الأحياء',
  'كيف أحفظ المفردات الإنجليزية بسرعة؟',
  'حل المعادلة: 2س² + 5س - 3 = 0',
];

export function AIChatAssistant({ onClose }: Props) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ChatSession[]) : [];
    } catch {
      return [];
    }
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  });

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  const newSession = (): ChatSession => ({
    id: Math.random().toString(36).slice(2),
    title: 'محادثة جديدة',
    messages: [],
    updatedAt: Date.now(),
  });

  const startNew = () => {
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setError(null);
    setShowHistory(false);
  };

  const updateSession = (id: string, patch: Partial<ChatSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s))
    );
  };

  const appendToSession = (id: string, msg: ChatMessage) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, messages: [...s.messages, msg], updatedAt: Date.now() } : s
      )
    );
  };

  const patchLastAssistant = (id: string, content: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const copy = [...s.messages];
        const last = copy[copy.length - 1];
        if (last && last.role === 'assistant') {
          copy[copy.length - 1] = { ...last, content };
        }
        return { ...s, messages: copy, updatedAt: Date.now() };
      })
    );
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setError(null);
    setInput('');

    let sessionId = activeId;
    let workingMessages: ChatMessage[] = messages;
    if (!sessionId) {
      const s = newSession();
      s.title = content.slice(0, 30);
      setSessions((prev) => [s, ...prev]);
      sessionId = s.id;
      setActiveId(s.id);
      workingMessages = [];
    } else if (workingMessages.length === 0) {
      updateSession(sessionId, { title: content.slice(0, 30) });
    }

    const userMsg: ChatMessage = { role: 'user', content };
    appendToSession(sessionId, userMsg);
    appendToSession(sessionId, { role: 'assistant', content: '' });

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('سجّل دخولك أولاً للاستخدام.');
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const apiMessages = [...workingMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(STUDY_AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messages: apiMessages, chatOnly: true }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        if (resp.status === 401) throw new Error('انتهت الجلسة. سجّل دخولك مرة أخرى.');
        if (resp.status === 403 && body.code === 'no_quota')
          throw new Error('انتهت محاولاتك المجانية.');
        if (resp.status === 429) throw new Error('الخادم مشغول، حاول بعد قليل.');
        throw new Error(body.error || 'خطأ في الخادم.');
      }

      if (!resp.body) throw new Error('لا يوجد رد من الخادم.');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              patchLastAssistant(sessionId, acc);
            }
          } catch {
            buf = line + '\n' + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        patchLastAssistant(
          sessionId,
          (messages[messages.length - 1]?.content ?? '') + '\n\n_— تم إلغاء العملية._'
        );
      } else {
        setError(e?.message || 'حدث خطأ غير متوقع');
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sessionId) return s;
            const copy = [...s.messages];
            if (copy.length && copy[copy.length - 1].role === 'assistant' && !copy[copy.length - 1].content) {
              copy.pop();
            }
            return { ...s, messages: copy };
          })
        );
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-[#020617] dark:via-[#0b1220] dark:to-[#0f0a1f] flex flex-col"
      dir="rtl"
    >
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Revo Teacher
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-slate-400">
                دردشة دراسية بدون رفع ملفات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNew}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-500/20"
              title="محادثة جديدة"
            >
              <Plus className="w-4 h-4" />
              جديد
            </button>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors relative"
              title="السجل"
            >
              <History className="w-5 h-5" />
              {sessions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] flex items-center justify-center rounded-full">
                  {sessions.length}
                </span>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold transition-colors border border-red-500/20"
              title="خروج"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowHistory(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 bottom-0 left-0 w-80 bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col"
              dir="rtl"
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white">المحادثات السابقة</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {sessions.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">لا توجد محادثات بعد</p>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                        activeId === s.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300'
                      }`}
                      onClick={() => {
                        setActiveId(s.id);
                        setShowHistory(false);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(s.updatedAt).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          • {s.messages.length} رسالة
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-slate-800">
                <button
                  onClick={startNew}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> محادثة جديدة
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 space-y-6"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  أهلاً! أنا مساعدك الدراسي 📚
                </h2>
                <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  اسألني أي شيء عن دروسك، تمارينك، أو طرق المذاكرة. لست بحاجة لرفع أي ملف.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-4">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => sendMessage(s)}
                    className="p-4 text-right text-sm rounded-xl bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all text-gray-700 dark:text-slate-200 flex items-center gap-3"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/30'
                      : 'bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-100 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {m.role === 'assistant' && !m.content && loading ? (
                    <ThinkingAnimation />
                  ) : m.role === 'assistant' ? (
                    <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </motion.div>
            ))
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl p-4">
              {error}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {loading && (
            <div className="flex justify-center mb-3">
              <button
                onClick={cancel}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-colors border border-red-500/30"
              >
                <StopCircle className="w-4 h-4" /> إلغاء العملية
              </button>
            </div>
          )}
          <div className="relative flex items-end gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={1}
              placeholder="اكتب سؤالك الدراسي هنا..."
              disabled={loading}
              className="flex-1 bg-transparent px-4 py-3 outline-none resize-none text-sm dark:text-white placeholder:text-gray-400 max-h-32"
              style={{ direction: 'rtl' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="m-1.5 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20 shrink-0"
              title="إرسال"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Revo Teacher مخصص للمواد الدراسية فقط 📚 • Enter للإرسال • Shift+Enter لسطر جديد
          </p>
        </div>
      </footer>
    </motion.div>
  );
}

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-2 h-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"
            animate={{
              y: [0, -6, 0],
              opacity: [0.4, 1, 0.4],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <motion.span
        className="text-xs text-indigo-500 dark:text-indigo-400 font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        المساعد يفكر...
      </motion.span>
    </div>
  );
}
