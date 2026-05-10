import { motion } from 'motion/react';
import notesBg from '@/assets/mindmap-style-notes.png';
import creativeBg from '@/assets/mindmap-style-creative.png';

export interface MindMapBranch {
  label: string;
  color: string;
  children: string[];
}

export interface MindMapData {
  title: string;
  branches: MindMapBranch[];
}

const solidDarkTextStyle = {
  fontFamily: '"Noto Kufi Arabic", "Arial Black", "Noto Sans Arabic", Tahoma, sans-serif',
  fontWeight: 900,
  letterSpacing: 0,
  WebkitTextStroke: '0.25px currentColor',
  textShadow: '0 1px 0 rgba(255,255,255,0.45), 0 0 1px currentColor',
};

const solidLightTextStyle = {
  fontFamily: '"Noto Kufi Arabic", "Arial Black", "Noto Sans Arabic", Tahoma, sans-serif',
  fontWeight: 900,
  letterSpacing: 0,
  WebkitTextStroke: '0.3px currentColor',
  textShadow: '1px 1px 0 rgba(15,23,42,0.55), 0 0 1px currentColor',
};

/* ============================================================
   Shared doodles for the Creative style (matches images_7)
   ============================================================ */
const Doodle = {
  Lightbulb: ({ className = '', size = 48 }: { className?: string; size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path
        d="M32 8 C 22 8, 16 16, 16 24 C 16 30, 19 34, 22 38 L 22 44 L 42 44 L 42 38 C 45 34, 48 30, 48 24 C 48 16, 42 8, 32 8 Z"
        stroke="#1f2937" strokeWidth="1.6" fill="#fef9c3" strokeLinejoin="round"
      />
      <line x1="24" y1="48" x2="40" y2="48" stroke="#1f2937" strokeWidth="1.6" />
      <line x1="26" y1="52" x2="38" y2="52" stroke="#1f2937" strokeWidth="1.6" />
      <line x1="28" y1="56" x2="36" y2="56" stroke="#1f2937" strokeWidth="1.6" />
      {/* shine rays */}
      <line x1="32" y1="2" x2="32" y2="6" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="10" y1="14" x2="13" y2="17" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="54" y1="14" x2="51" y2="17" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="28" x2="10" y2="28" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="58" y1="28" x2="54" y2="28" stroke="#1f2937" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Exclaim: ({ className = '', size = 40 }: { className?: string; size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 40 64" fill="none">
      <path d="M14 4 L 26 4 L 22 40 L 18 40 Z" fill="#fde68a" stroke="#1f2937" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="20" cy="50" r="5" fill="#fde68a" stroke="#1f2937" strokeWidth="1.6" />
    </svg>
  ),
  Question: ({ className = '', size = 40 }: { className?: string; size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 40 64" fill="none">
      <path
        d="M10 16 C 10 6, 30 6, 30 16 C 30 24, 20 24, 20 32 L 20 40"
        stroke="#1f2937" strokeWidth="2.2" fill="none" strokeLinecap="round"
      />
      <circle cx="20" cy="50" r="3" fill="#1f2937" />
    </svg>
  ),
  Paper: ({ className = '', size = 50 }: { className?: string; size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 60 70" fill="none">
      <path d="M8 8 L 44 8 L 52 18 L 52 64 L 8 64 Z" fill="#fff" stroke="#1f2937" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M44 8 L 44 18 L 52 18" fill="none" stroke="#1f2937" strokeWidth="1.6" />
      <line x1="14" y1="28" x2="46" y2="28" stroke="#1f2937" strokeWidth="1.2" />
      <line x1="14" y1="36" x2="46" y2="36" stroke="#1f2937" strokeWidth="1.2" />
      <line x1="14" y1="44" x2="40" y2="44" stroke="#1f2937" strokeWidth="1.2" />
      <line x1="14" y1="52" x2="46" y2="52" stroke="#1f2937" strokeWidth="1.2" />
    </svg>
  ),
  Pencil: ({ className = '', size = 50 }: { className?: string; size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M10 70 L 18 50 L 60 8 L 72 20 L 30 62 Z" fill="#fde68a" stroke="#1f2937" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 70 L 18 50 L 30 62 Z" fill="#1f2937" />
      <line x1="55" y1="13" x2="67" y2="25" stroke="#1f2937" strokeWidth="1.6" />
    </svg>
  ),
  Squiggle: ({ className = '', width = 80 }: { className?: string; width?: number }) => (
    <svg className={className} width={width} height="20" viewBox="0 0 80 20" fill="none">
      <path d="M2 10 Q 8 2, 14 10 T 26 10 T 38 10 T 50 10 T 62 10 T 74 10" stroke="#1f2937" strokeWidth="1.4" fill="none" />
    </svg>
  ),
};

/* ============================================================
   1) CREATIVE — Hand-drawn star burst + cloud bubbles
   Matches images_7-2.jpeg exactly
   ============================================================ */
export function CreativeMindMap({ data }: { data: MindMapData }) {
  const branches = data.branches.slice(0, 6);

  // Slots are CENTERS of each colored card (percent of 840x1188 frame)
  const slots = [
    { cx: '51%', cy: '16%', w: '32%', h: '14%', titleColor: '#b91c1c' }, // pink top
    { cx: '21%', cy: '32%', w: '32%', h: '14%', titleColor: '#15803d' }, // green left-upper
    { cx: '79%', cy: '32%', w: '32%', h: '14%', titleColor: '#0369a1' }, // blue right-upper
    { cx: '21%', cy: '68%', w: '32%', h: '14%', titleColor: '#9a3412' }, // orange left-lower
    { cx: '79%', cy: '68%', w: '32%', h: '14%', titleColor: '#6d28d9' }, // purple right-lower
    { cx: '51%', cy: '84%', w: '32%', h: '14%', titleColor: '#0f766e' }, // teal bottom
  ];

  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: '840 / 1188' }}
    >
      {/* Reference background image (transparent) */}
      <img
        src={creativeBg}
        alt=""
        className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
      />

      {/* Central title inside the pink burst */}
      <div
        className="absolute z-10"
        style={{
          top: '50%',
          left: '49%',
          transform: 'translate(-50%, -50%)',
          width: '22%',
          height: '12%',
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          className="flex h-full w-full items-center justify-center text-center"
        >
          <p
            className="font-black text-slate-900 leading-tight px-1"
            style={{
              ...solidDarkTextStyle,
              fontSize: 'clamp(10px, 1.4vw, 17px)',
            }}
          >
            {data.title}
          </p>
        </motion.div>
      </div>

      {/* Branch content laid over each colored box */}
      {branches.map((branch, idx) => {
        const slot = slots[idx];
        if (!slot) return null;
        return (
          <div
            key={idx}
            className="absolute z-10"
            style={{
              top: slot.cy,
              left: slot.cx,
              transform: 'translate(-50%, -50%)',
              width: slot.w,
              height: slot.h,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, type: 'spring' }}
              className="flex h-full w-full flex-col items-center justify-center text-center px-2"
            >
              <h3
                className="font-black mb-0.5 leading-tight"
                style={{
                  ...solidDarkTextStyle,
                  color: slot.titleColor,
                  fontSize: 'clamp(9px, 1.25vw, 15px)',
                }}
              >
                {branch.label}
              </h3>
              <p
                className="text-slate-800 leading-snug overflow-hidden"
                style={{
                  ...solidDarkTextStyle,
                  fontSize: 'clamp(7px, 0.9vw, 11px)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {branch.children.slice(0, 3).join(' • ')}
              </p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   2) NOTES — Sticky paper notes with tape strips & curvy arrows
   Matches images_6-2.jpeg exactly
   ============================================================ */
export function NotesMindMap({ data }: { data: MindMapData }) {
  const branches = data.branches.slice(0, 4);

  // Centers of each corner sticky-note strip in the 1536x1024 background
  const slots = [
    { cx: '24.5%', cy: '14.8%', w: '24%', h: '10%' }, // top-left strip
    { cx: '74.5%', cy: '15%', w: '24%', h: '10%' }, // top-right strip
    { cx: '22.7%', cy: '76%', w: '23%', h: '11%' }, // bottom-left strip
    { cx: '75.1%', cy: '76%', w: '24%', h: '11%' }, // bottom-right strip
  ];

  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: '1536 / 1024' }}
    >
      {/* Reference background image (transparent) */}
      <img
        src={notesBg}
        alt=""
        className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
      />

      {/* Central title on the paper-clipped card */}
      <div
        className="absolute z-10"
        style={{
          top: '48%',
          left: '49%',
          transform: 'translate(-50%, -50%) rotate(-2deg)',
          width: '28%',
          height: '18%',
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="flex h-full w-full items-center justify-center text-center px-4"
        >
          <p
            className="font-black text-slate-900 leading-tight"
            style={{
              ...solidDarkTextStyle,
              fontSize: 'clamp(12px, 1.8vw, 24px)',
            }}
          >
            {data.title}
          </p>
        </motion.div>
      </div>

      {/* Branch content placed on each corner sticky note */}
      {branches.map((branch, idx) => {
        const slot = slots[idx];
        return (
          <div
            key={idx}
            className="absolute z-10"
            style={{
              top: slot.cy,
              left: slot.cx,
              transform: 'translate(-50%, -50%)',
              width: slot.w,
              height: slot.h,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, type: 'spring' }}
              className="flex h-full w-full flex-col items-center justify-center text-center px-2"
            >
              <h3
                className="font-black text-slate-900 mb-0.5 uppercase tracking-wide leading-tight"
                style={{
                  ...solidDarkTextStyle,
                  fontSize: 'clamp(9px, 1.15vw, 15px)',
                }}
              >
                {branch.label}
              </h3>
              <p
                className="text-slate-700 leading-snug overflow-hidden"
                style={{
                  ...solidDarkTextStyle,
                  fontSize: 'clamp(7px, 0.9vw, 11px)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {branch.children.slice(0, 2).join(' • ')}
              </p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   3) BUSINESS — Star burst + mixed cloud/cards + curvy arrows
   Matches images_3-2.jpeg exactly
   ============================================================ */
export function BusinessMindMap({ data }: { data: MindMapData }) {
  // Reference uses these specific colors in this rough order:
  // green-cloud, blue-card, orange-card, red-card, green-cloud, pink-card
  const cardStyles = [
    { bg: '#bbf7d0', shape: 'cloud', titleColor: '#15803d' },
    { bg: '#bfdbfe', shape: 'rect', titleColor: '#1e40af' },
    { bg: '#fde68a', shape: 'rect', titleColor: '#a16207' },
    { bg: '#fecaca', shape: 'rect', titleColor: '#b91c1c' },
    { bg: '#bbf7d0', shape: 'cloud', titleColor: '#15803d' },
    { bg: '#fbcfe8', shape: 'rect', titleColor: '#be185d' },
  ];

  const branches = data.branches.slice(0, 6);

  // Faint business icons in background (calculator, dollar sign, etc.)
  const BgIcons = () => (
    <div className="absolute inset-0 opacity-[0.18] dark:opacity-[0.1] pointer-events-none select-none">
      <svg width="100%" height="100%" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
        {/* dollar sign */}
        <text x="20" y="40" fontSize="24" fill="#3b82f6" fontWeight="bold">$</text>
        <text x="560" y="50" fontSize="22" fill="#3b82f6">📊</text>
        <text x="30" y="370" fontSize="22" fill="#3b82f6">📊</text>
        <text x="565" y="380" fontSize="22" fill="#3b82f6">💡</text>
        <text x="20" y="200" fontSize="20" fill="#3b82f6">📈</text>
        <text x="570" y="200" fontSize="20" fill="#3b82f6">⚙️</text>
        <text x="300" y="20" fontSize="16" fill="#3b82f6">♥</text>
        <text x="100" y="380" fontSize="18" fill="#3b82f6">📅</text>
        <text x="450" y="380" fontSize="18" fill="#3b82f6">🎯</text>
        {/* heart shapes scattered */}
        {Array.from({ length: 8 }).map((_, i) => (
          <text key={i} x={50 + i * 70} y={i % 2 === 0 ? 30 : 380} fontSize="12" fill="#60a5fa">♥</text>
        ))}
      </svg>
    </div>
  );

  // White curvy arrow component
  const Arrow = ({ rotation = 0, className = '' }: { rotation?: number; className?: string }) => (
    <svg
      className={className}
      width="60" height="40" viewBox="0 0 60 40"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M5 20 Q 30 5, 55 20"
        stroke="#1f2937" strokeWidth="2" fill="white"
        strokeLinejoin="round"
      />
      <path
        d="M5 20 Q 30 35, 55 20"
        stroke="#1f2937" strokeWidth="2" fill="white"
        strokeLinejoin="round"
      />
      <polygon
        points="50,12 60,20 50,28"
        fill="white" stroke="#1f2937" strokeWidth="2" strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="relative py-10 px-4 bg-[#eff6ff] dark:bg-slate-900 rounded-3xl overflow-hidden min-h-[700px]">
      <BgIcons />

      {/* TOP row: 3 cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {branches.slice(0, 3).map((branch, idx) => {
          const style = cardStyles[idx];
          const isCloud = style.shape === 'cloud';
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0, rotate: idx === 0 ? -2 : idx === 2 ? 2 : 0 }}
              transition={{ delay: idx * 0.1, type: 'spring' }}
              className="relative"
            >
              <div
                className="p-4 border-2 border-slate-800 dark:border-slate-300 shadow-[3px_3px_0_0_rgba(0,0,0,0.6)]"
                style={{
                  background: style.bg,
                  borderRadius: isCloud ? '55% 45% 50% 50% / 60% 50% 50% 40%' : '4px',
                }}
              >
                <h3
                  className="text-base font-black mb-2 italic"
                  style={{ color: style.titleColor, fontFamily: '"Comic Sans MS", cursive' }}
                >
                  {branch.label}
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {branch.children.join('، ')}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CENTER star with arrows around */}
      <div className="relative z-10 flex justify-center my-6">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="relative"
        >
          {/* Arrows pointing outward from star */}
          <div className="absolute -top-2 -left-16">
            <Arrow rotation={-30} />
          </div>
          <div className="absolute -top-2 -right-16">
            <Arrow rotation={30} />
          </div>
          <div className="absolute -bottom-2 -left-16">
            <Arrow rotation={210} />
          </div>
          <div className="absolute -bottom-2 -right-16">
            <Arrow rotation={150} />
          </div>

          <svg width="260" height="200" viewBox="0 0 260 200">
            <polygon
              points="130,10 150,55 200,40 175,80 220,95 180,120 215,165 160,150 145,195 120,160 80,195 90,150 35,165 70,120 30,95 75,80 50,40 100,55"
              fill="#f87171"
              stroke="#1f2937"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-center px-12">
            <p
              className="text-white font-black text-lg leading-tight"
              style={{ fontFamily: '"Comic Sans MS", cursive', textShadow: '1px 1px 0 rgba(0,0,0,0.3)' }}
            >
              {data.title}
            </p>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM row: 3 cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {branches.slice(3, 6).map((branch, idx) => {
          const realIdx = idx + 3;
          const style = cardStyles[realIdx];
          const isCloud = style.shape === 'cloud';
          return (
            <motion.div
              key={realIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, rotate: idx === 0 ? -2 : idx === 2 ? 2 : 0 }}
              transition={{ delay: realIdx * 0.1, type: 'spring' }}
              className="relative"
            >
              <div
                className="p-4 border-2 border-slate-800 dark:border-slate-300 shadow-[3px_3px_0_0_rgba(0,0,0,0.6)]"
                style={{
                  background: style.bg,
                  borderRadius: isCloud ? '55% 45% 50% 50% / 60% 50% 50% 40%' : '4px',
                }}
              >
                <h3
                  className="text-base font-black mb-2 italic"
                  style={{ color: style.titleColor, fontFamily: '"Comic Sans MS", cursive' }}
                >
                  {branch.label}
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {branch.children.join('، ')}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
