import { motion, AnimatePresence } from 'motion/react';
import { X, Network, Sparkles, StickyNote, Briefcase } from 'lucide-react';

export type MindMapStyle = 'modern' | 'creative' | 'notes' | 'business';

interface StyleOption {
  id: MindMapStyle;
  label: string;
  description: string;
  icon: React.ReactNode;
  preview: React.ReactNode;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'modern',
    label: 'العصري الأنيق',
    description: 'تصميم حديث بفروع منظمة وألوان تدريجية',
    icon: <Network className="w-5 h-5" />,
    preview: (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        <rect x="75" y="10" width="50" height="22" rx="6" fill="#6366f1" />
        <line x1="100" y1="32" x2="40" y2="60" stroke="#6366f1" strokeWidth="2" />
        <line x1="100" y1="32" x2="100" y2="60" stroke="#10b981" strokeWidth="2" />
        <line x1="100" y1="32" x2="160" y2="60" stroke="#f59e0b" strokeWidth="2" />
        <rect x="15" y="60" width="50" height="20" rx="5" fill="#fff" stroke="#6366f1" strokeWidth="2" />
        <rect x="75" y="60" width="50" height="20" rx="5" fill="#fff" stroke="#10b981" strokeWidth="2" />
        <rect x="135" y="60" width="50" height="20" rx="5" fill="#fff" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="40" cy="100" r="8" fill="#6366f1" opacity="0.3" />
        <circle cx="100" cy="100" r="8" fill="#10b981" opacity="0.3" />
        <circle cx="160" cy="100" r="8" fill="#f59e0b" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: 'creative',
    label: 'الإبداعي المرسوم',
    description: 'أسلوب رسم يدوي مع نجمة مركزية وفقاعات ملونة',
    icon: <Sparkles className="w-5 h-5" />,
    preview: (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* center burst */}
        <polygon
          points="100,30 110,50 130,50 115,65 122,85 100,75 78,85 85,65 70,50 90,50"
          fill="#ef4444"
          stroke="#1f2937"
          strokeWidth="1.5"
        />
        <text x="100" y="62" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">
          IDEA
        </text>
        {/* squiggly lines */}
        <path d="M70 55 Q 50 45, 35 30" stroke="#1f2937" strokeWidth="1.5" fill="none" strokeDasharray="2,2" />
        <path d="M130 55 Q 150 45, 165 30" stroke="#1f2937" strokeWidth="1.5" fill="none" strokeDasharray="2,2" />
        <path d="M75 80 Q 55 95, 35 105" stroke="#1f2937" strokeWidth="1.5" fill="none" strokeDasharray="2,2" />
        <path d="M125 80 Q 145 95, 165 105" stroke="#1f2937" strokeWidth="1.5" fill="none" strokeDasharray="2,2" />
        {/* bubbles */}
        <ellipse cx="25" cy="25" rx="22" ry="14" fill="#fce7f3" stroke="#1f2937" strokeWidth="1.2" />
        <ellipse cx="175" cy="25" rx="22" ry="14" fill="#dbeafe" stroke="#1f2937" strokeWidth="1.2" />
        <ellipse cx="25" cy="110" rx="22" ry="14" fill="#fef3c7" stroke="#1f2937" strokeWidth="1.2" />
        <ellipse cx="175" cy="110" rx="22" ry="14" fill="#dcfce7" stroke="#1f2937" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'notes',
    label: 'الملاحظات اللاصقة',
    description: 'بطاقات ورقية ملصقة بأشرطة ملونة وأسهم منحنية',
    icon: <StickyNote className="w-5 h-5" />,
    preview: (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* center card */}
        <rect x="75" y="50" width="55" height="35" fill="#fef3c7" stroke="#1f2937" strokeWidth="1" transform="rotate(-2 102 67)" />
        <text x="102" y="72" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1f2937">
          MIND MAP
        </text>
        {/* sticky notes */}
        <rect x="10" y="10" width="45" height="28" fill="#fef3c7" stroke="#1f2937" strokeWidth="0.8" transform="rotate(-3 32 24)" />
        <rect x="135" y="10" width="45" height="28" fill="#e9d5ff" stroke="#1f2937" strokeWidth="0.8" transform="rotate(2 157 24)" />
        <rect x="10" y="92" width="45" height="28" fill="#fef3c7" stroke="#1f2937" strokeWidth="0.8" transform="rotate(2 32 106)" />
        <rect x="135" y="92" width="45" height="28" fill="#e9d5ff" stroke="#1f2937" strokeWidth="0.8" transform="rotate(-2 157 106)" />
        {/* tape strips */}
        <rect x="20" y="6" width="20" height="6" fill="#a78bfa" opacity="0.7" />
        <rect x="145" y="6" width="20" height="6" fill="#fbbf24" opacity="0.7" />
        {/* curvy arrows */}
        <path d="M55 25 Q 70 35, 80 55" stroke="#1f2937" strokeWidth="1" fill="none" markerEnd="url(#a1)" />
        <path d="M145 25 Q 130 35, 125 55" stroke="#1f2937" strokeWidth="1" fill="none" />
        <defs>
          <marker id="a1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#1f2937" />
          </marker>
        </defs>
      </svg>
    ),
  },
  {
    id: 'business',
    label: 'الأعمال والمخططات',
    description: 'نمط احترافي بنجمة مركزية وبطاقات بألوان متنوعة',
    icon: <Briefcase className="w-5 h-5" />,
    preview: (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* Star burst */}
        <polygon
          points="100,40 108,55 125,52 115,65 125,78 108,75 100,90 92,75 75,78 85,65 75,52 92,55"
          fill="#f87171"
          stroke="#1f2937"
          strokeWidth="1"
        />
        <text x="100" y="68" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">
          BIZ MODEL
        </text>
        {/* clouds & cards */}
        <ellipse cx="30" cy="30" rx="25" ry="14" fill="#bbf7d0" stroke="#1f2937" strokeWidth="0.8" />
        <rect x="80" y="8" width="40" height="20" fill="#bfdbfe" stroke="#1f2937" strokeWidth="0.8" />
        <rect x="150" y="20" width="40" height="22" fill="#fde68a" stroke="#1f2937" strokeWidth="0.8" />
        <rect x="10" y="95" width="40" height="22" fill="#fecaca" stroke="#1f2937" strokeWidth="0.8" />
        <ellipse cx="100" cy="110" rx="25" ry="13" fill="#bbf7d0" stroke="#1f2937" strokeWidth="0.8" />
        <rect x="155" y="90" width="40" height="22" fill="#fbcfe8" stroke="#1f2937" strokeWidth="0.8" />
        {/* arrows */}
        <path d="M55 35 L 78 50" stroke="#1f2937" strokeWidth="0.8" fill="none" markerEnd="url(#b1)" />
        <path d="M100 28 L 100 42" stroke="#1f2937" strokeWidth="0.8" fill="none" markerEnd="url(#b1)" />
        <path d="M150 35 L 122 50" stroke="#1f2937" strokeWidth="0.8" fill="none" markerEnd="url(#b1)" />
        <defs>
          <marker id="b1" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#1f2937" />
          </marker>
        </defs>
      </svg>
    ),
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (style: MindMapStyle) => void;
}

export function MindMapStylePicker({ open, onClose, onSelect }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-slate-300" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl mb-3">
                <Network className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                اختر شكل الخريطة الذهنية
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                كل شكل له طابع بصري مختلف يناسب نوعاً معيناً من المحتوى
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STYLE_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onSelect(opt.id);
                    onClose();
                  }}
                  className="group text-right bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border-2 border-gray-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-4 transition-all shadow-sm hover:shadow-xl"
                >
                  <div className="aspect-[2/1.3] bg-white dark:bg-slate-950/50 rounded-xl border border-gray-100 dark:border-slate-800 mb-3 overflow-hidden flex items-center justify-center p-2">
                    {opt.preview}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-indigo-600 dark:text-indigo-400">{opt.icon}</div>
                    <h3 className="font-black text-gray-900 dark:text-white">{opt.label}</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                    {opt.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
