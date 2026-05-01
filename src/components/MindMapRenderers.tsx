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

  // Positions matching the uploaded reference image (percent-based on a 794x1123 frame)
  // Order: top, left-upper, right-upper, left-lower, right-lower, bottom
  const slots = [
    { top: '11%', left: '50%', tx: '-50%', ty: '0%', titleColor: '#9f1239' },     // pink - top
    { top: '32%', left: '17%', tx: '0%',   ty: '0%', titleColor: '#15803d' },     // green - left upper
    { top: '32%', left: '83%', tx: '-100%',ty: '0%', titleColor: '#0369a1' },     // blue - right upper
    { top: '63%', left: '17%', tx: '0%',   ty: '0%', titleColor: '#9a3412' },     // orange - left lower
    { top: '63%', left: '83%', tx: '-100%',ty: '0%', titleColor: '#6d28d9' },     // purple - right lower
    { top: '85%', left: '50%', tx: '-50%', ty: '-100%', titleColor: '#0f766e' },  // teal - bottom
  ];

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden bg-white"
      style={{ aspectRatio: '794 / 1123' }}
    >
      {/* Reference background image */}
      <img
        src={creativeBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        draggable={false}
      />

      {/* Central title inside the pink burst */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
        className="absolute z-10 flex items-center justify-center text-center"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '22%',
          height: '14%',
        }}
      >
        <p
          className="font-black text-slate-900 leading-tight px-2"
          style={{
            fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
            fontSize: 'clamp(11px, 1.6vw, 20px)',
          }}
        >
          {data.title}
        </p>
      </motion.div>

      {/* Branch content laid over each colored box */}
      {branches.map((branch, idx) => {
        const slot = slots[idx];
        if (!slot) return null;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, type: 'spring' }}
            className="absolute z-10 flex flex-col items-center justify-center text-center px-3"
            style={{
              top: slot.top,
              left: slot.left,
              transform: `translate(${slot.tx}, ${slot.ty})`,
              width: '24%',
              height: '14%',
            }}
          >
            <h3
              className="font-black mb-1 leading-tight"
              style={{
                color: slot.titleColor,
                fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
                fontSize: 'clamp(10px, 1.4vw, 16px)',
              }}
            >
              {branch.label}
            </h3>
            <p
              className="text-slate-800 leading-snug overflow-hidden"
              style={{
                fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
                fontSize: 'clamp(8px, 1vw, 12px)',
              }}
            >
              {branch.children.slice(0, 3).join(' • ')}
            </p>
          </motion.div>
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

  // Positions for the 4 corner sticky notes (matches reference image)
  const slots = [
    { top: '11%', left: '20%', tx: '-50%', ty: '0%' },   // top-left
    { top: '11%', left: '80%', tx: '-50%', ty: '0%' },   // top-right
    { top: '78%', left: '20%', tx: '-50%', ty: '0%' },   // bottom-left
    { top: '78%', left: '80%', tx: '-50%', ty: '0%' },   // bottom-right
  ];

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden bg-white"
      style={{ aspectRatio: '1280 / 853' }}
    >
      {/* Reference background image */}
      <img
        src={notesBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        draggable={false}
      />

      {/* Central title on the paper-clipped card */}
      <motion.div
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 120 }}
        className="absolute z-10 flex items-center justify-center text-center px-4"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-2deg)',
          width: '28%',
          height: '20%',
        }}
      >
        <p
          className="font-black text-slate-900 leading-tight"
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(14px, 2.2vw, 28px)',
          }}
        >
          {data.title}
        </p>
      </motion.div>

      {/* Branch content placed on each corner sticky note */}
      {branches.map((branch, idx) => {
        const slot = slots[idx];
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, type: 'spring' }}
            className="absolute z-10 flex flex-col items-center justify-center text-center px-3"
            style={{
              top: slot.top,
              left: slot.left,
              transform: `translate(${slot.tx}, ${slot.ty})`,
              width: '22%',
              height: '14%',
            }}
          >
            <h3
              className="font-black text-slate-900 mb-1 uppercase tracking-wide leading-tight"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(10px, 1.3vw, 16px)',
              }}
            >
              {branch.label}
            </h3>
            <p
              className="text-slate-700 leading-snug overflow-hidden"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(8px, 1vw, 12px)',
              }}
            >
              {branch.children.slice(0, 2).join(' • ')}
            </p>
          </motion.div>
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
