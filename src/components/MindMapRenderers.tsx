import { motion } from 'motion/react';
import notesBg from '@/assets/mindmap-style-notes.webp';
import creativeBg from '@/assets/mindmap-style-creative.webp';

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
  // Pastel cloud colors matching reference
  const cloudColors = [
    { bg: '#fbcfe8', border: '#1f2937' },  // pink
    { bg: '#fed7aa', border: '#1f2937' },  // peach
    { bg: '#bbf7d0', border: '#1f2937' },  // green
    { bg: '#fde68a', border: '#1f2937' },  // yellow
    { bg: '#bfdbfe', border: '#1f2937' },  // blue
    { bg: '#e9d5ff', border: '#1f2937' },  // purple
  ];

  const branches = data.branches.slice(0, 6);

  return (
    <div className="relative py-10 px-6 bg-[#fdfcf7] dark:bg-slate-900 rounded-3xl overflow-hidden transition-colors min-h-[700px]">
      {/* paper grain texture */}
      <div
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, #000 0.5px, transparent 0.5px), radial-gradient(circle at 70% 80%, #000 0.5px, transparent 0.5px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Decorative doodles in corners and sides */}
      <Doodle.Lightbulb className="absolute top-4 left-4 opacity-90" size={56} />
      <Doodle.Lightbulb className="absolute top-1/2 left-2 opacity-80 -translate-y-1/2" size={48} />
      <Doodle.Lightbulb className="absolute bottom-4 left-6 opacity-80" size={50} />
      <Doodle.Exclaim className="absolute top-6 right-1/4 opacity-80" size={36} />
      <Doodle.Exclaim className="absolute bottom-6 right-1/3 opacity-80" size={36} />
      <Doodle.Question className="absolute top-1/3 right-4 opacity-70" size={42} />
      <Doodle.Paper className="absolute top-6 right-6 opacity-90" size={56} />
      <Doodle.Pencil className="absolute bottom-8 right-8 opacity-90" size={56} />

      {/* Central red star burst */}
      <div className="flex justify-center mb-12 relative z-20 pt-4">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          className="relative"
        >
          <svg width="240" height="220" viewBox="0 0 240 220">
            {/* spiky star shape */}
            <polygon
              points="120,8 138,48 178,38 158,78 200,90 165,118 195,160 145,150 130,200 110,160 70,195 80,150 30,158 65,120 25,90 70,82 50,40 95,52"
              fill="#ef4444"
              stroke="#1f2937"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
            <p className="text-white font-black text-2xl leading-tight" style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive', textShadow: '1px 1px 0 rgba(0,0,0,0.3)' }}>
              {data.title}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Cloud bubbles arranged in grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 relative z-10 px-4 md:px-12">
        {branches.map((branch, idx) => {
          const cloud = cloudColors[idx % cloudColors.length];
          const tilt = idx % 2 === 0 ? -1.5 : 1.5;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.85, rotate: tilt * 2 }}
              animate={{ opacity: 1, scale: 1, rotate: tilt }}
              transition={{ delay: idx * 0.12, type: 'spring' }}
              className="relative"
            >
              {/* Title above cloud (like reference) */}
              <h3
                className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1 px-2"
                style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
              >
                {branch.label}
              </h3>

              {/* Cloud-shaped bubble */}
              <div
                className="relative p-5 pt-6"
                style={{
                  background: cloud.bg,
                  border: `2px solid ${cloud.border}`,
                  // wavy cloud border using border-radius mix
                  borderRadius: '40% 50% 45% 55% / 55% 45% 50% 40%',
                  boxShadow: '3px 4px 0 0 rgba(0,0,0,0.2)',
                }}
              >
                <ul className="space-y-2">
                  {branch.children.map((child, cIdx) => (
                    <motion.li
                      key={cIdx}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 + cIdx * 0.06 }}
                      className="flex items-start gap-2 text-[13px] text-slate-900 leading-snug"
                      style={{ fontFamily: '"Comic Sans MS", "Marker Felt", cursive' }}
                    >
                      <span className="text-slate-900 font-bold mt-0.5 shrink-0">•</span>
                      <span>{child}</span>
                    </motion.li>
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
   2) NOTES — Sticky paper notes with tape strips & curvy arrows
   Matches images_6-2.jpeg exactly
   ============================================================ */
export function NotesMindMap({ data }: { data: MindMapData }) {
  // Reference uses cream notes with purple OR cream tape strips
  const items = [
    { tape: '#c4b5fd', tapeIsLabel: true },   // purple full label tape
    { tape: '#c4b5fd', tapeIsLabel: true },
    { tape: '#fef3c7', tapeIsLabel: false },
    { tape: '#fef3c7', tapeIsLabel: false },
    { tape: '#c4b5fd', tapeIsLabel: true },
    { tape: '#fef3c7', tapeIsLabel: false },
  ];
  const noteBg = '#fdf6e3';
  const branches = data.branches.slice(0, 6);

  // Layout: 3 cols x 2 rows around centered card
  // We'll position them around the central card

  const CurvyArrow = ({ d }: { d: string }) => (
    <svg className="absolute pointer-events-none" style={{ overflow: 'visible' }}>
      <defs>
        <marker id="notesArr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#1f2937" />
        </marker>
      </defs>
      <path d={d} stroke="#1f2937" strokeWidth="1.5" fill="none" markerEnd="url(#notesArr)" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="relative py-10 px-4 md:px-8 rounded-3xl overflow-hidden transition-colors bg-[#fafafa] dark:bg-slate-900 min-h-[600px]">
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
        {/* LEFT column */}
        <div className="space-y-8">
          {[0, 1].map((slot) => {
            const idx = slot === 0 ? 0 : 1;
            const branch = branches[idx];
            if (!branch) return <div key={slot} />;
            const cfg = items[idx];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: idx % 2 === 0 ? -1.5 : 1 }}
                transition={{ delay: idx * 0.1, type: 'spring' }}
                className="relative shadow-md"
                style={{ background: noteBg }}
              >
                {/* tape strips at corners */}
                <div
                  className="absolute -top-3 left-2 w-14 h-5 opacity-90 shadow-sm"
                  style={{ background: cfg.tape, transform: 'rotate(-8deg)' }}
                />
                <div
                  className="absolute -top-3 right-2 w-14 h-5 opacity-90 shadow-sm"
                  style={{ background: cfg.tape, transform: 'rotate(6deg)' }}
                />

                <div className="p-5 pt-6">
                  {cfg.tapeIsLabel ? (
                    <div
                      className="inline-block px-3 py-1 mb-2 -ml-3"
                      style={{ background: cfg.tape, transform: 'rotate(-2deg)' }}
                    >
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                        {branch.label}
                      </h3>
                    </div>
                  ) : (
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-2">
                      {branch.label}
                    </h3>
                  )}
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {branch.children.join('. ')}.
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CENTER card */}
        <div className="flex justify-center items-center order-first md:order-none">
          <motion.div
            initial={{ scale: 0, rotate: -8 }}
            animate={{ scale: 1, rotate: -2 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="relative px-10 py-12 shadow-2xl"
            style={{
              background: noteBg,
              minWidth: '220px',
              borderRadius: '4px',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            {/* paperclip on top */}
            <svg
              className="absolute -top-7 left-1/2 -translate-x-1/2"
              width="24" height="44" viewBox="0 0 24 44" fill="none"
            >
              <path
                d="M12 2 C 18 2, 21 6, 21 12 L 21 32 C 21 38, 17 41, 12 41 C 7 41, 4 38, 4 33 L 4 14 C 4 10, 7 8, 11 8 C 15 8, 17 10, 17 14 L 17 30"
                stroke="#64748b" strokeWidth="2.2" fill="none" strokeLinecap="round"
              />
            </svg>
            <p
              className="text-3xl font-black text-slate-900 tracking-wide text-center uppercase"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {data.title}
            </p>
          </motion.div>
        </div>

        {/* RIGHT column */}
        <div className="space-y-8">
          {[0, 1].map((slot) => {
            const idx = slot === 0 ? 2 : 3;
            const branch = branches[idx];
            if (!branch) return <div key={slot} />;
            const cfg = items[idx];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: idx % 2 === 0 ? 1.5 : -1 }}
                transition={{ delay: idx * 0.1, type: 'spring' }}
                className="relative shadow-md"
                style={{ background: noteBg }}
              >
                <div
                  className="absolute -top-3 left-2 w-14 h-5 opacity-90 shadow-sm"
                  style={{ background: cfg.tape, transform: 'rotate(-8deg)' }}
                />
                <div
                  className="absolute -top-3 right-2 w-14 h-5 opacity-90 shadow-sm"
                  style={{ background: cfg.tape, transform: 'rotate(6deg)' }}
                />

                <div className="p-5 pt-6">
                  {cfg.tapeIsLabel ? (
                    <div
                      className="inline-block px-3 py-1 mb-2 -ml-3"
                      style={{ background: cfg.tape, transform: 'rotate(2deg)' }}
                    >
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                        {branch.label}
                      </h3>
                    </div>
                  ) : (
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-2">
                      {branch.label}
                    </h3>
                  )}
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {branch.children.join('. ')}.
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM row spans full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mt-10 px-2 md:px-12">
        {[4, 5].map((idx) => {
          const branch = branches[idx];
          if (!branch) return null;
          const cfg = items[idx];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, rotate: idx === 4 ? -1 : 1 }}
              transition={{ delay: idx * 0.1, type: 'spring' }}
              className="relative shadow-md"
              style={{ background: noteBg }}
            >
              <div
                className="absolute -top-3 left-2 w-14 h-5 opacity-90 shadow-sm"
                style={{ background: cfg.tape, transform: 'rotate(-8deg)' }}
              />
              <div
                className="absolute -top-3 right-2 w-14 h-5 opacity-90 shadow-sm"
                style={{ background: cfg.tape, transform: 'rotate(6deg)' }}
              />
              <div className="p-5 pt-6">
                {cfg.tapeIsLabel ? (
                  <div
                    className="inline-block px-3 py-1 mb-2 -ml-3"
                    style={{ background: cfg.tape, transform: 'rotate(-2deg)' }}
                  >
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                      {branch.label}
                    </h3>
                  </div>
                ) : (
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-2">
                    {branch.label}
                  </h3>
                )}
                <p className="text-xs text-slate-700 leading-relaxed">
                  {branch.children.join('. ')}.
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
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
