import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

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
   1) CREATIVE — Hand-drawn burst star + colorful cloud bubbles
   Inspired by the "Mind Mapping" sketch reference (images_7.jpeg)
   ============================================================ */
export function CreativeMindMap({ data }: { data: MindMapData }) {
  // sketch palette (rotates if branches > palette length)
  const palette = ['#fce7f3', '#dbeafe', '#fef3c7', '#dcfce7', '#ede9fe', '#fee2e2'];
  const inkColor = '#1f2937';

  return (
    <div className="relative py-12 px-4 bg-[#fdfcf7] dark:bg-slate-900 rounded-3xl overflow-hidden transition-colors">
      {/* paper texture */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, #000 1px, transparent 1px), radial-gradient(circle at 70% 80%, #000 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Central burst */}
      <div className="flex justify-center mb-12 relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          className="relative"
        >
          <svg width="220" height="180" viewBox="0 0 220 180">
            <polygon
              points="110,15 130,55 175,50 145,85 170,130 115,110 65,135 85,90 45,55 90,55"
              fill="#ef4444"
              stroke={inkColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-center px-8">
            <p className="text-white font-black text-xl leading-tight" style={{ fontFamily: 'cursive' }}>
              {data.title}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Branches as hand-drawn cloud bubbles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {data.branches.map((branch, idx) => {
          const bg = palette[idx % palette.length];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.85, rotate: idx % 2 === 0 ? -3 : 3 }}
              animate={{ opacity: 1, scale: 1, rotate: idx % 2 === 0 ? -1.5 : 1.5 }}
              transition={{ delay: idx * 0.12, type: 'spring' }}
              className="relative p-5 border-2 border-slate-800 dark:border-slate-200 shadow-[4px_4px_0_0_rgba(0,0,0,0.85)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.4)]"
              style={{
                background: bg,
                borderRadius: '20px 32px 18px 26px',
              }}
            >
              {/* squiggle underline as title */}
              <div className="mb-3">
                <h3 className="text-lg font-black text-slate-900" style={{ fontFamily: 'cursive' }}>
                  {branch.label}
                </h3>
                <svg height="6" width="100%" className="mt-1">
                  <path
                    d="M0 3 Q 10 0, 20 3 T 40 3 T 60 3 T 80 3 T 100 3 T 120 3 T 140 3 T 160 3 T 180 3 T 200 3"
                    stroke={branch.color}
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>

              {/* hand-drawn bullet list */}
              <ul className="space-y-2">
                {branch.children.map((child, cIdx) => (
                  <motion.li
                    key={cIdx}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 + cIdx * 0.06 }}
                    className="flex items-start gap-2 text-sm text-slate-800 leading-relaxed"
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                      style={{ background: inkColor }}
                    />
                    <span style={{ fontFamily: 'cursive' }}>{child}</span>
                  </motion.li>
                ))}
              </ul>

              {/* doodle accent in corner */}
              <svg
                className="absolute -top-3 -left-3 opacity-80"
                width="34"
                height="34"
                viewBox="0 0 34 34"
              >
                <path
                  d="M5 17 Q 17 5, 29 17 T 5 17"
                  fill="none"
                  stroke={inkColor}
                  strokeWidth="1.5"
                />
                <circle cx="17" cy="17" r="2" fill={branch.color} />
              </svg>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   2) NOTES — Sticky notes with tape strips and curvy arrows
   Inspired by images_6.jpeg
   ============================================================ */
export function NotesMindMap({ data }: { data: MindMapData }) {
  const tapeColors = ['#a78bfa', '#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#fb7185'];
  const noteColors = ['#fef3c7', '#e9d5ff', '#fef3c7', '#fce7f3', '#dbeafe', '#fef3c7'];
  const rotations = [-2.5, 2, -1.5, 3, -2, 1.5];

  return (
    <div
      className="relative py-12 px-4 rounded-3xl overflow-hidden transition-colors"
      style={{
        background:
          'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(99,102,241,0.04) 28px, rgba(99,102,241,0.04) 29px)',
      }}
    >
      {/* Center note */}
      <div className="flex justify-center mb-14 relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="relative bg-[#faf3e0] dark:bg-amber-50 px-12 py-8 shadow-2xl border border-amber-900/10"
          style={{ minWidth: '240px' }}
        >
          {/* paperclip */}
          <svg
            className="absolute -top-6 left-1/2 -translate-x-1/2"
            width="22"
            height="40"
            viewBox="0 0 22 40"
          >
            <path
              d="M11 2 C 17 2, 20 6, 20 14 L 20 32 C 20 36, 17 38, 13 38 C 9 38, 6 36, 6 32 L 6 14 C 6 11, 8 9, 11 9 C 14 9, 15 11, 15 14 L 15 30"
              stroke="#64748b"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-2xl font-black text-slate-900 tracking-wide text-center uppercase">
            {data.title}
          </p>
        </motion.div>
      </div>

      {/* Sticky note grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 relative z-10">
        {data.branches.map((branch, idx) => {
          const noteBg = noteColors[idx % noteColors.length];
          const tape = tapeColors[idx % tapeColors.length];
          const rot = rotations[idx % rotations.length];

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: rot }}
              transition={{ delay: idx * 0.1, type: 'spring' }}
              className="relative shadow-lg"
              style={{ background: noteBg }}
            >
              {/* tape strip */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 opacity-80"
                style={{
                  background: tape,
                  transform: `translateX(-50%) rotate(${idx % 2 === 0 ? -3 : 3}deg)`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />

              <div className="p-5">
                <h3
                  className="text-lg font-black text-slate-900 mb-2 uppercase tracking-wider inline-block px-2 py-0.5"
                  style={{ background: tape, color: 'white' }}
                >
                  {branch.label}
                </h3>
                <ul className="space-y-1.5 mt-3">
                  {branch.children.map((child, cIdx) => (
                    <li
                      key={cIdx}
                      className="text-sm text-slate-700 leading-relaxed flex gap-2"
                    >
                      <span className="text-slate-500">•</span>
                      <span>{child}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   3) BUSINESS — Star burst center + cloud/card branches
   Inspired by images_3.jpeg
   ============================================================ */
export function BusinessMindMap({ data }: { data: MindMapData }) {
  const cardStyles = [
    { bg: '#bbf7d0', shape: 'cloud' },
    { bg: '#bfdbfe', shape: 'rect' },
    { bg: '#fde68a', shape: 'rect' },
    { bg: '#fecaca', shape: 'rect' },
    { bg: '#bbf7d0', shape: 'cloud' },
    { bg: '#fbcfe8', shape: 'rect' },
    { bg: '#ddd6fe', shape: 'rect' },
    { bg: '#fed7aa', shape: 'cloud' },
  ];

  return (
    <div className="relative py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-3xl overflow-hidden">
      {/* faint icons in background */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none">
        <svg width="100%" height="100%">
          <text x="10%" y="20%" fontSize="32">
            💡
          </text>
          <text x="85%" y="30%" fontSize="32">
            📊
          </text>
          <text x="15%" y="80%" fontSize="32">
            ⚙️
          </text>
          <text x="80%" y="85%" fontSize="32">
            🎯
          </text>
        </svg>
      </div>

      {/* Center star burst */}
      <div className="flex justify-center mb-14 relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="relative"
        >
          <svg width="240" height="200" viewBox="0 0 240 200">
            <polygon
              points="120,10 140,55 195,45 165,90 200,140 130,120 90,170 100,115 35,120 80,80 30,40 90,55"
              fill="#f87171"
              stroke="#1f2937"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-center px-10">
            <p className="text-white font-black text-lg leading-tight">{data.title}</p>
          </div>
        </motion.div>
      </div>

      {/* Branches with arrows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 relative z-10">
        {data.branches.map((branch, idx) => {
          const style = cardStyles[idx % cardStyles.length];
          const isCloud = style.shape === 'cloud';

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.12, type: 'spring' }}
              className="relative"
            >
              {/* curved arrow indicator */}
              <svg
                className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-60"
                width="40"
                height="32"
                viewBox="0 0 40 32"
              >
                <path
                  d="M20 2 Q 30 12, 20 28"
                  stroke="#475569"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="3,2"
                  markerEnd="url(#arrowB)"
                />
                <defs>
                  <marker id="arrowB" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#475569" />
                  </marker>
                </defs>
              </svg>

              <div
                className="p-5 border-2 border-slate-800 dark:border-slate-300 shadow-[3px_3px_0_0_rgba(0,0,0,0.7)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.3)]"
                style={{
                  background: style.bg,
                  borderRadius: isCloud ? '50% 40% 50% 40% / 60% 50% 50% 40%' : '4px',
                }}
              >
                <h3 className="text-lg font-black text-slate-900 mb-2 italic">
                  {branch.label}
                </h3>
                <p className="text-sm text-slate-800 leading-relaxed">
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
