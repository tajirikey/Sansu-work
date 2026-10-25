interface Level {
  label: string;
  desc: string;
}

interface LevelSelectProps {
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
  /** soft tint behind the medallion and level badges */
  tint: string;
  levels: Level[];
  onSelect: (index: number) => void;
}

/** Shared "choose a level" screen used by games with difficulty levels. */
export default function LevelSelect({ emoji, title, subtitle, accent, tint, levels, onSelect }: LevelSelectProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-2">
      <div className="text-center">
        <div
          className="mx-auto mb-4 w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl rotate-[-4deg]"
          style={{ background: tint, boxShadow: `0 10px 24px -10px ${accent}88` }}
        >
          {emoji}
        </div>
        <h2 className="text-3xl font-black tracking-wide" style={{ color: accent }}>{title}</h2>
        <p className="text-ink-soft text-sm mt-1.5">{subtitle}</p>
      </div>

      <div className="w-full max-w-sm">
        <p className="text-ink-faint text-xs font-bold text-center mb-2 tracking-widest">レベルを えらぼう</p>
        <div className="grid grid-cols-2 gap-3">
          {levels.map((lv, i) => (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="surface pressable text-left px-4 py-3.5 flex items-center gap-3"
            >
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
                style={{ background: tint, color: accent }}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-black text-ink text-base leading-tight">{lv.label}</span>
                <span className="block text-[11px] text-ink-soft mt-0.5 leading-tight">{lv.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
