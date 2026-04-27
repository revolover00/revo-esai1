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
  Mic,
  Trash,
  Check,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const STUDY_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-ai`;
const VOICE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`;

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

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(24).fill(4));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

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

  // ===================== Voice recording =====================
  const cleanupRecording = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    rafRef.current = null;
    recordTimerRef.current = null;
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setAudioLevels(Array(24).fill(4));
    setRecordSeconds(0);
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => {
        const result = r.result as string;
        const idx = result.indexOf('base64,');
        resolve(idx >= 0 ? result.slice(idx + 7) : result);
      };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });

  const startRecording = async () => {
    if (loading || isRecording || isTranscribing) return;
    setError(null);
    cancelledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      audioStreamRef.current = stream;

      // Pick best supported mime
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      const mimeType =
        candidates.find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m)) || '';

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = rec;
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const chunks = audioChunksRef.current;
        const usedMime = rec.mimeType || mimeType || 'audio/webm';
        cleanupRecording();
        setIsRecording(false);

        if (cancelledRef.current || chunks.length === 0) return;
        const blob = new Blob(chunks, { type: usedMime });
        if (blob.size < 1000) {
          setError('التسجيل قصير جداً، تحدث لمدة أطول.');
          return;
        }

        setIsTranscribing(true);
        try {
          const base64 = await blobToBase64(blob);
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;
          const resp = await fetch(VOICE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({ audio: base64, mimeType: usedMime }),
          });
          const json = await resp.json().catch(() => ({}));
          if (!resp.ok || !json.text) {
            throw new Error(json.error || 'تعذر تفريغ الصوت');
          }
          // Auto-send the transcribed message
          await sendMessage(json.text);
        } catch (e: any) {
          setError(e?.message || 'خطأ أثناء تفريغ الصوت');
        } finally {
          setIsTranscribing(false);
        }
      };

      // Set up audio analyser for waveform
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const bars = 24;
        const step = Math.floor(data.length / bars);
        const next: number[] = [];
        for (let i = 0; i < bars; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += data[i * step + j];
          const avg = sum / step;
          next.push(Math.max(4, Math.min(40, (avg / 255) * 40)));
        }
        setAudioLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 119) {
            // auto-stop at 2 minutes
            stopRecording(false);
            return s;
          }
          return s + 1;
        });
      }, 1000);

      rec.start(250);
      setIsRecording(true);
    } catch (e: any) {
      cleanupRecording();
      setError(
        e?.name === 'NotAllowedError'
          ? 'يجب السماح باستخدام المايكروفون.'
          : 'تعذر بدء التسجيل.',
      );
    }
  };

  const stopRecording = (cancelIt: boolean) => {
    cancelledRef.current = cancelIt;
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try { rec.stop(); } catch {}
    } else {
      cleanupRecording();
      setIsRecording(false);
    }
  };

  const formatRecTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;


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
                  أهلاً! أنا Revo Teacher — معلمك الذكي 📚
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

          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="relative flex items-center gap-3 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 border border-rose-300/60 dark:border-rose-700/50 rounded-2xl p-3 shadow-lg shadow-rose-500/10"
              >
                <button
                  onClick={() => stopRecording(true)}
                  className="shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
                  title="إلغاء"
                >
                  <Trash className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <motion.span
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-2.5 h-2.5 rounded-full bg-red-500"
                  />
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatRecTime(recordSeconds)}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center gap-[3px] h-10 overflow-hidden">
                  {audioLevels.map((h, i) => (
                    <motion.span
                      key={i}
                      className="w-1 rounded-full bg-gradient-to-t from-rose-500 to-pink-400"
                      animate={{ height: h }}
                      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                      style={{ height: 4 }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => stopRecording(false)}
                  className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105 transition-all"
                  title="إرسال"
                >
                  <Check className="w-4 h-4" />
                </button>
              </motion.div>
            ) : isTranscribing ? (
              <motion.div
                key="transcribing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4"
              >
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">
                  جاري تحويل الصوت إلى نص...
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative flex items-end gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all"
              >
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
                  placeholder="اكتب سؤالك أو اضغط على المايك للتحدث..."
                  disabled={loading}
                  className="flex-1 bg-transparent px-4 py-3 outline-none resize-none text-sm dark:text-white placeholder:text-gray-400 max-h-32"
                  style={{ direction: 'rtl' }}
                />

                {input.trim() ? (
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading}
                    className="m-1.5 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20 shrink-0"
                    title="إرسال"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={loading}
                    className="m-1.5 p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-rose-500/30 shrink-0"
                    title="تسجيل صوتي"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-gray-400 text-center mt-2">
            Revo Teacher مخصص للمواد الدراسية فقط 📚 • Enter للإرسال • 🎙️ يدعم الإدخال الصوتي
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
