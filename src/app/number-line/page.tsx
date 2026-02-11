"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError, playBundle } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

type StepMode = 1 | -1 | 10 | -10;
type UserMode = "plus" | "minus" | "mix";

interface Problem {
  current: number;
  step: StepMode;
  answer: number;
}

/* ─── Scaffolded difficulty system ─── */

function generateProblem(
  difficulty: number,
  mode: UserMode,
  lastProblems: Problem[],
): Problem {
  const maxAttempts = 20;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const p = generateProblemInner(difficulty, mode);
    const isDuplicate = lastProblems.some(
      (prev) => prev.current === p.current && prev.step === p.step,
    );
    if (!isDuplicate) return p;
  }
  return generateProblemInner(difficulty, mode);
}

function generateProblemInner(difficulty: number, mode: UserMode): Problem {
  let step: StepMode;
  let current: number;

  if (mode === "plus") {
    if (difficulty <= 1) { step = 1; current = pickFromArray(NO_CARRY_PLUS1); }
    else if (difficulty <= 3) { step = 1; current = pickFromArray(CARRY_TENS_PLUS1); }
    else if (difficulty === 4) {
      step = 1;
      current = Math.random() < 0.5 ? pickFromArray(CARRY_HUNDREDS_PLUS1) : pickFromArray(CARRY_TENS_PLUS1);
    } else if (difficulty <= 6) {
      if (Math.random() < 0.5) { step = 1; current = pickFromArray([...CARRY_TENS_PLUS1, ...CARRY_HUNDREDS_PLUS1]); }
      else { step = 10; current = difficulty < 6 ? pickFromArray(SIMPLE_PLUS10) : pickFromArray([...SIMPLE_PLUS10, ...CARRY_PLUS10]); }
    } else {
      if (Math.random() < 0.5) { step = 1; current = pickFromArray([...NO_CARRY_PLUS1, ...CARRY_TENS_PLUS1, ...CARRY_HUNDREDS_PLUS1]); }
      else { step = 10; current = pickFromArray([...SIMPLE_PLUS10, ...CARRY_PLUS10]); }
    }
  } else if (mode === "minus") {
    if (difficulty <= 1) { step = -1; current = pickFromArray(NO_BORROW_MINUS1); }
    else if (difficulty <= 3) { step = -1; current = pickFromArray(BORROW_TENS_MINUS1); }
    else if (difficulty === 4) {
      step = -1;
      current = Math.random() < 0.5 ? pickFromArray(BORROW_HUNDREDS_MINUS1) : pickFromArray(BORROW_TENS_MINUS1);
    } else if (difficulty <= 6) {
      if (Math.random() < 0.5) { step = -1; current = pickFromArray([...BORROW_TENS_MINUS1, ...BORROW_HUNDREDS_MINUS1]); }
      else { step = -10; current = difficulty < 6 ? pickFromArray(SIMPLE_MINUS10) : pickFromArray([...SIMPLE_MINUS10, ...BORROW_MINUS10]); }
    } else {
      if (Math.random() < 0.5) { step = -1; current = pickFromArray([...NO_BORROW_MINUS1, ...BORROW_TENS_MINUS1, ...BORROW_HUNDREDS_MINUS1]); }
      else { step = -10; current = pickFromArray([...SIMPLE_MINUS10, ...BORROW_MINUS10]); }
    }
  } else {
    if (difficulty <= 1) {
      step = Math.random() < 0.6 ? 1 : -1;
      current = step === 1 ? pickFromArray(NO_CARRY_PLUS1) : pickFromArray(NO_BORROW_MINUS1);
    } else if (difficulty <= 3) {
      step = Math.random() < 0.5 ? 1 : -1;
      current = step === 1 ? pickFromArray(CARRY_TENS_PLUS1) : pickFromArray(BORROW_TENS_MINUS1);
    } else if (difficulty <= 5) {
      const r = Math.random();
      if (r < 0.3) { step = 1; current = pickFromArray([...CARRY_TENS_PLUS1, ...CARRY_HUNDREDS_PLUS1]); }
      else if (r < 0.6) { step = -1; current = pickFromArray([...BORROW_TENS_MINUS1, ...BORROW_HUNDREDS_MINUS1]); }
      else if (r < 0.8) { step = 10; current = pickFromArray(SIMPLE_PLUS10); }
      else { step = -10; current = pickFromArray(SIMPLE_MINUS10); }
    } else {
      const r = Math.random();
      if (r < 0.25) { step = 1; current = pickFromArray([...CARRY_TENS_PLUS1, ...CARRY_HUNDREDS_PLUS1, ...NO_CARRY_PLUS1]); }
      else if (r < 0.5) { step = -1; current = pickFromArray([...BORROW_TENS_MINUS1, ...BORROW_HUNDREDS_MINUS1, ...NO_BORROW_MINUS1]); }
      else if (r < 0.75) { step = 10; current = pickFromArray([...SIMPLE_PLUS10, ...CARRY_PLUS10]); }
      else { step = -10; current = pickFromArray([...SIMPLE_MINUS10, ...BORROW_MINUS10]); }
    }
  }
  return { current, step, answer: current + step };
}

function pickFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Number pools ───
const NO_CARRY_PLUS1 = [2,5,8,11,14,17,22,25,31,36,42,45,53,57,63,71,84,93,102,115,124,136,141,155,163,172,181];
const CARRY_TENS_PLUS1 = [9,19,29,39,49,59,69,79,89,109,119,129,139,149,159,169,179,189];
const CARRY_HUNDREDS_PLUS1 = [99, 109, 199];
const NO_BORROW_MINUS1 = [3,5,8,12,15,18,23,26,34,37,43,47,55,62,68,75,83,91,103,116,127,134,148,156,165,173,182];
const BORROW_TENS_MINUS1 = [10,20,30,40,50,60,70,80,90,110,120,130,140,150,160,170,180,190];
const BORROW_HUNDREDS_MINUS1 = [100, 110, 200];
const SIMPLE_PLUS10 = [5,12,23,31,42,55,63,71,82,14,25,36,44,53,61,75,83];
const CARRY_PLUS10 = [90,91,92,93,94,95,96,97,98,99,190,191,192,193,194,195];
const SIMPLE_MINUS10 = [15,22,33,41,52,65,73,81,94,115,126,134,143,155,162,174,185];
const BORROW_MINUS10 = [100,101,102,103,104,105,106,107,108,109,200,201,202,203,204,205];

/* ─── Carry type detection ─── */
type CarryType = "carry_tens" | "carry_hundreds" | "borrow_tens" | "borrow_hundreds" | "carry_tens_10" | "borrow_tens_10" | "simple";

function getCarryType(problem: Problem): CarryType {
  const { current, step } = problem;
  if (step === 1) {
    if (current % 10 === 9 && current % 100 === 99) return "carry_hundreds";
    if (current % 10 === 9) return "carry_tens";
    return "simple";
  }
  if (step === -1) {
    if (current % 10 === 0 && current % 100 === 0) return "borrow_hundreds";
    if (current % 10 === 0) return "borrow_tens";
    return "simple";
  }
  if (step === 10) { return current % 100 >= 90 ? "carry_tens_10" : "simple"; }
  if (step === -10) { return current % 100 < 10 ? "borrow_tens_10" : "simple"; }
  return "simple";
}

function isCarryOrBorrow(ct: CarryType): boolean {
  return ct !== "simple";
}

function getSuccessMessage(problem: Problem): string {
  const { current, step, answer } = problem;
  switch (getCarryType(problem)) {
    case "carry_tens": return `すごい！ ${current} → ${answer}！\n一のくらい ${current % 10}→0、十のくらいが 1 ふえたよ！`;
    case "carry_hundreds": return `すごい！ ${current} → ${answer}！\n9→0、9→0、百のくらいが 1 ふえたよ！`;
    case "borrow_tens": return `すごい！ ${current} → ${answer}！\n一のくらい 0→9、十のくらいが 1 へったよ！`;
    case "borrow_hundreds": return `すごい！ ${current} → ${answer}！\n0→9、0→9、百のくらいが 1 へったよ！`;
    case "carry_tens_10": return `すごい！ ${current}＋10＝${answer}！\n十のくらい→0、百のくらいが 1 ふえたよ！`;
    case "borrow_tens_10": return `すごい！ ${current}−10＝${answer}！\n十のくらい→9、百のくらいが 1 へったよ！`;
    default: return `せいかい！ ${current} ${step > 0 ? "+" : ""}${step} = ${answer}`;
  }
}

function getWrongMessage(problem: Problem): string {
  const { current, step, answer } = problem;
  switch (getCarryType(problem)) {
    case "carry_tens": return `おしい！ こたえは ${answer}！`;
    case "carry_hundreds": return `おしい！ こたえは ${answer}！`;
    case "borrow_tens": return `おしい！ こたえは ${answer}！`;
    case "borrow_hundreds": return `おしい！ こたえは ${answer}！`;
    case "carry_tens_10": return `おしい！ こたえは ${answer}！`;
    case "borrow_tens_10": return `おしい！ こたえは ${answer}！`;
    default: return `おしい！ ${current} ${step > 0 ? "+" : ""}${step} = ${answer} だよ`;
  }
}

function stepLabel(step: StepMode): string {
  if (step === 1) return "つぎ（＋1）";
  if (step === -1) return "まえ（−1）";
  if (step === 10) return "＋10";
  return "−10";
}

const MODE_OPTIONS: { value: UserMode; label: string }[] = [
  { value: "plus", label: "＋ たす" },
  { value: "minus", label: "− ひく" },
  { value: "mix", label: "まぜる" },
];

/* ═══════════════════════════════════════════════
   Place Value Column UI Components
   ═══════════════════════════════════════════════ */

type PlaceType = "hundreds" | "tens" | "ones";

/* ─── Animated digit display ─── */
function AnimatedDigit({ value, animDir }: { value: number; animDir: "up" | "down" | null }) {
  const [display, setDisplay] = useState(value);
  const [anim, setAnim] = useState<string | null>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      // Use explicit direction from parent (not inferred from value change)
      const dir = animDir || "up";
      setAnim(dir === "up" ? "animate-roll-up" : "animate-roll-down");
      const t1 = setTimeout(() => setDisplay(value), 170);
      const t2 = setTimeout(() => setAnim(null), 360);
      prevValue.current = value;
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [value, animDir]);

  return (
    <div className="overflow-hidden relative flex items-center justify-center" style={{ height: 56 }}>
      <span className={`text-5xl font-black tabular-nums ${anim || ""}`}>
        {display}
      </span>
    </div>
  );
}

/* ─── Dot visualization within a column ─── */
function ColumnDots({ count, type, animating }: { count: number; type: PlaceType; animating?: "gather" | "scatter" | null }) {
  const DOT = 8;

  if (type === "ones") {
    return (
      <div className="flex flex-wrap gap-1 justify-center items-center min-h-[52px] px-1">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full bg-green-500 shadow-sm ${
              animating === "scatter" && i === count - 1 ? "animate-pop-in" : ""
            } ${animating === "gather" ? "animate-gather-dots" : ""}`}
            style={{ width: DOT + 4, height: DOT + 4 }}
          />
        ))}
      </div>
    );
  }

  if (type === "tens") {
    return (
      <div className="flex flex-wrap gap-1 justify-center items-center min-h-[52px] px-1">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`inline-flex flex-col p-0.5 rounded bg-blue-50 border border-blue-300 ${
              animating === "scatter" && i === count - 1 ? "animate-pop-in" : ""
            } ${animating === "gather" ? "animate-gather-dots" : ""}`}
            style={{ gap: 1 }}
          >
            {[0, 1].map(row => (
              <div key={row} className="flex" style={{ gap: 1 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="rounded-full bg-green-500" style={{ width: DOT - 2, height: DOT - 2 }} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // hundreds
  return (
    <div className="flex flex-wrap gap-1 justify-center items-center min-h-[52px] px-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`inline-flex flex-col p-0.5 rounded bg-red-50 border border-red-300 ${
            animating === "scatter" && i === count - 1 ? "animate-pop-in" : ""
          } ${animating === "gather" ? "animate-gather-dots" : ""}`}
          style={{ gap: 1 }}
        >
          {[0, 1].map(row => (
            <div key={row} className="flex" style={{ gap: 1 }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex flex-col" style={{ gap: 1 }}>
                  <div className="rounded-full bg-red-400" style={{ width: DOT - 3, height: DOT - 3 }} />
                  <div className="rounded-full bg-red-400" style={{ width: DOT - 3, height: DOT - 3 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Carry/Borrow animation overlay ─── */
type CarryAnimInfo = {
  type: "carry" | "borrow";
  from: PlaceType;
  to: PlaceType;
  phase: number; // 0=announce, 1=transfer, 2=complete
} | null;

function CarryOverlay({ anim }: { anim: CarryAnimInfo }) {
  if (!anim) return null;

  const isCarry = anim.type === "carry";
  const fromOnes = anim.from === "ones";

  if (anim.phase === 0) {
    // Announcement phase
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className={`rounded-2xl px-4 py-3 shadow-lg animate-bounce-in ${
          isCarry ? "bg-yellow-100 border-2 border-yellow-400" : "bg-purple-100 border-2 border-purple-400"
        }`}>
          <p className={`text-lg font-black ${isCarry ? "text-yellow-700" : "text-purple-700"}`}>
            {isCarry ? "10こ！ くりあがり！" : "たりない！ くりさがり！"}
          </p>
        </div>
      </div>
    );
  }

  if (anim.phase === 1) {
    // Transfer phase - animated bundle flying between columns
    return (
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className={`${isCarry ? (fromOnes ? "animate-carry-fly" : "animate-carry-fly") : (fromOnes ? "animate-borrow-fly" : "animate-borrow-fly")}`}>
          <div className={`rounded-lg px-3 py-2 shadow-lg ${
            isCarry ? "bg-yellow-300 border-2 border-yellow-500" : "bg-purple-300 border-2 border-purple-500"
          }`}>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-full bg-green-500" style={{ width: 6, height: 6 }} />
              ))}
            </div>
            <p className={`text-xs font-black text-center mt-0.5 ${isCarry ? "text-yellow-800" : "text-purple-800"}`}>
              {isCarry ? "→ たば！" : "→ バラす！"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Single Place Value Column ─── */
function PlaceValueColumn({
  label, value, onIncrement, onDecrement, type, disabled, dotAnim, animDir,
}: {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  type: PlaceType;
  disabled: boolean;
  dotAnim?: "gather" | "scatter" | null;
  animDir: "up" | "down" | null;
}) {
  const colors = {
    hundreds: {
      bg: "bg-red-50/80", border: "border-red-200", text: "text-red-600",
      btnPlus: "bg-red-100 active:bg-red-200 border-red-200",
      btnMinus: "bg-red-50 active:bg-red-100 border-red-200",
      btnTextPlus: "text-red-700", btnTextMinus: "text-red-400",
    },
    tens: {
      bg: "bg-blue-50/80", border: "border-blue-200", text: "text-blue-600",
      btnPlus: "bg-blue-100 active:bg-blue-200 border-blue-200",
      btnMinus: "bg-blue-50 active:bg-blue-100 border-blue-200",
      btnTextPlus: "text-blue-700", btnTextMinus: "text-blue-400",
    },
    ones: {
      bg: "bg-green-50/80", border: "border-green-200", text: "text-green-600",
      btnPlus: "bg-green-100 active:bg-green-200 border-green-200",
      btnMinus: "bg-green-50 active:bg-green-100 border-green-200",
      btnTextPlus: "text-green-700", btnTextMinus: "text-green-400",
    },
  }[type];

  // Long-press repeat
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const handlePointerDown = (action: () => void) => {
    action();
    repeatTimer.current = setInterval(action, 180);
  };
  const handlePointerUp = () => {
    if (repeatTimer.current) { clearInterval(repeatTimer.current); repeatTimer.current = null; }
  };

  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl flex flex-col items-center py-2 px-1 gap-1 relative overflow-hidden`}>
      {/* Label */}
      <span className={`text-sm font-bold ${colors.text}`}>{label}</span>

      {/* Animated digit */}
      <AnimatedDigit value={value} animDir={animDir} />

      {/* Dots area */}
      <div className="flex-1 flex items-start justify-center w-full">
        <ColumnDots count={value} type={type} animating={dotAnim} />
      </div>

      {/* +/- buttons */}
      <div className="flex gap-2 w-full px-1 mt-auto">
        <button
          onPointerDown={() => !disabled && handlePointerDown(onDecrement)}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          disabled={disabled}
          className={`flex-1 py-2.5 rounded-xl border-2 ${colors.btnMinus} text-2xl font-black ${colors.btnTextMinus} transition-all active:scale-95 disabled:opacity-30 select-none touch-manipulation`}
        >
          −
        </button>
        <button
          onPointerDown={() => !disabled && handlePointerDown(onIncrement)}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          disabled={disabled}
          className={`flex-1 py-2.5 rounded-xl border-2 ${colors.btnPlus} text-2xl font-black ${colors.btnTextPlus} transition-all active:scale-95 disabled:opacity-30 select-none touch-manipulation`}
        >
          ＋
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════ */

export default function NumberLinePage() {
  const [mode, setMode] = useState<UserMode>("plus");
  const [problem, setProblem] = useState<Problem>(() => generateProblem(0, "plus", []));
  const [showReward, setShowReward] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [message, setMessage] = useState("");
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const correctCount = useRef(0);
  const totalCount = useRef(0);
  const lastProblems = useRef<Problem[]>([]);

  // Place value input state
  const [inputH, setInputH] = useState(0);
  const [inputT, setInputT] = useState(0);
  const [inputO, setInputO] = useState(0);
  const [carryAnim, setCarryAnim] = useState<CarryAnimInfo>(null);
  const [dotAnimH, setDotAnimH] = useState<"gather" | "scatter" | null>(null);
  const [dotAnimT, setDotAnimT] = useState<"gather" | "scatter" | null>(null);
  const [dotAnimO, setDotAnimO] = useState<"gather" | "scatter" | null>(null);
  // Explicit animation direction: "up" for +, "down" for -
  const [dirH, setDirH] = useState<"up" | "down" | null>(null);
  const [dirT, setDirT] = useState<"up" | "down" | null>(null);
  const [dirO, setDirO] = useState<"up" | "down" | null>(null);
  const animLock = useRef(false);

  const composedAnswer = inputH * 100 + inputT * 10 + inputO;

  /* ─── Carry/Borrow Animation Sequence ─── */
  const runCarryAnimation = useCallback((from: PlaceType, to: PlaceType, type: "carry" | "borrow") => {
    animLock.current = true;
    playBundle();

    // Phase 0: Announce
    setCarryAnim({ type, from, to, phase: 0 });

    setTimeout(() => {
      // Phase 1: Transfer visual
      setCarryAnim({ type, from, to, phase: 1 });

      if (type === "carry") {
        // Dots gather in source column
        if (from === "ones") setDotAnimO("gather");
        else setDotAnimT("gather");
      } else {
        // Dots scatter from source
        if (to === "ones") setDotAnimT("gather");
        else setDotAnimH("gather");
      }

      setTimeout(() => {
        // Phase 2: Update digits
        if (type === "carry") {
          if (from === "ones") {
            // ones 9→0 (rolls UP), tens +1 (rolls UP)
            setDirO("up");
            setDirT("up");
            setInputO(0);
            setDotAnimO(null);
            // Check cascade: tens might also carry
            setInputT(prev => {
              if (prev === 9) {
                // Cascade carry tens→hundreds
                setTimeout(() => {
                  setDirT("up");
                  setDirH("up");
                  setInputT(0);
                  setInputH(ph => Math.min(9, ph + 1));
                  setDotAnimH("scatter");
                  setTimeout(() => setDotAnimH(null), 400);
                }, 100);
                return prev; // will be reset by the timeout
              }
              return prev + 1;
            });
            setDotAnimT("scatter");
            setTimeout(() => setDotAnimT(null), 400);
          } else {
            // tens 9→0 (rolls UP), hundreds +1 (rolls UP)
            setDirT("up");
            setDirH("up");
            setInputT(0);
            setInputH(prev => Math.min(9, prev + 1));
            setDotAnimT(null);
            setDotAnimH("scatter");
            setTimeout(() => setDotAnimH(null), 400);
          }
        } else {
          // Borrow
          if (from === "tens") {
            // tens -1 (rolls DOWN), ones 0→9 (rolls DOWN)
            setDirT("down");
            setDirO("down");
            setInputT(prev => {
              if (prev === 0) {
                // Cascade borrow from hundreds
                setTimeout(() => {
                  setDirH("down");
                  setDirT("down");
                  setInputH(ph => Math.max(0, ph - 1));
                  setInputT(9);
                  setDotAnimT("scatter");
                  setTimeout(() => setDotAnimT(null), 400);
                }, 100);
                return prev; // will be reset by the timeout
              }
              return prev - 1;
            });
            setDotAnimT(null);
            setInputO(9);
            setDotAnimO("scatter");
            setTimeout(() => setDotAnimO(null), 400);
          } else {
            // hundreds -1 (rolls DOWN), tens 0→9 (rolls DOWN)
            setDirH("down");
            setDirT("down");
            setInputH(prev => Math.max(0, prev - 1));
            setDotAnimH(null);
            setInputT(9);
            setDotAnimT("scatter");
            setTimeout(() => setDotAnimT(null), 400);
          }
        }

        setCarryAnim(null);
        setTimeout(() => { animLock.current = false; }, 200);
      }, 600);
    }, 500);
  }, []);

  /* ─── Increment/Decrement handlers ─── */
  const handleIncrement = useCallback((place: PlaceType) => {
    if (animLock.current || cleared || showCorrectAnswer) return;
    playPop();

    if (place === "ones") {
      if (inputO < 9) {
        setDirO("up");
        setInputO(prev => prev + 1);
        setDotAnimO("scatter");
        setTimeout(() => setDotAnimO(null), 300);
      } else {
        runCarryAnimation("ones", "tens", "carry");
      }
    } else if (place === "tens") {
      if (inputT < 9) {
        setDirT("up");
        setInputT(prev => prev + 1);
        setDotAnimT("scatter");
        setTimeout(() => setDotAnimT(null), 300);
      } else {
        runCarryAnimation("tens", "hundreds", "carry");
      }
    } else {
      if (inputH < 9) {
        setDirH("up");
        setInputH(prev => prev + 1);
        setDotAnimH("scatter");
        setTimeout(() => setDotAnimH(null), 300);
      }
    }
  }, [inputO, inputT, inputH, cleared, showCorrectAnswer, runCarryAnimation]);

  const handleDecrement = useCallback((place: PlaceType) => {
    if (animLock.current || cleared || showCorrectAnswer) return;
    playPop();

    if (place === "ones") {
      if (inputO > 0) {
        setDirO("down");
        setInputO(prev => prev - 1);
      } else if (inputT > 0 || inputH > 0) {
        runCarryAnimation("tens", "ones", "borrow");
      }
    } else if (place === "tens") {
      if (inputT > 0) {
        setDirT("down");
        setInputT(prev => prev - 1);
      } else if (inputH > 0) {
        runCarryAnimation("hundreds", "tens", "borrow");
      }
    } else {
      if (inputH > 0) {
        setDirH("down");
        setInputH(prev => prev - 1);
      }
    }
  }, [inputO, inputT, inputH, cleared, showCorrectAnswer, runCarryAnimation]);

  /* ─── Submit answer ─── */
  const handleSubmit = useCallback(() => {
    if (animLock.current) return;
    totalCount.current += 1;

    if (composedAnswer === problem.answer) {
      correctCount.current += 1;
      setStreak(s => s + 1);
      setCleared(true);
      const ct = getCarryType(problem);
      if (isCarryOrBorrow(ct)) { playBundle(); } else { playSuccess(); }
      setMessage(getSuccessMessage(problem));
      setTimeout(() => setShowReward(true), 800);
      setDifficulty(d => Math.min(10, d + 1));
    } else {
      playError();
      setStreak(0);
      setShowCorrectAnswer(true);
      setMessage(getWrongMessage(problem));
      setDifficulty(d => Math.max(0, d - 1));
    }
  }, [composedAnswer, problem]);

  /* ─── Next problem ─── */
  const nextProblem = () => {
    lastProblems.current = [...lastProblems.current.slice(-4), problem];
    setProblem(generateProblem(difficulty, mode, lastProblems.current));
    setInputH(0);
    setInputT(0);
    setInputO(0);
    setCleared(false);
    setShowCorrectAnswer(false);
    setMessage("");
    setCarryAnim(null);
    setDotAnimH(null);
    setDotAnimT(null);
    setDotAnimO(null);
  };

  const switchMode = (newMode: UserMode) => {
    setMode(newMode);
    setProblem(generateProblem(difficulty, newMode, lastProblems.current));
    setInputH(0);
    setInputT(0);
    setInputO(0);
    setCleared(false);
    setShowCorrectAnswer(false);
    setMessage("");
    setCarryAnim(null);
  };

  const levelName = difficulty <= 1 ? "きほん" : difficulty <= 4 ? "ふつう" : difficulty <= 7 ? "むずかしい" : "マスター";
  const pct = totalCount.current > 0 ? Math.round((correctCount.current / totalCount.current) * 100) : 0;
  const ct = getCarryType(problem);

  // Show answer decomposition when wrong
  const ansH = Math.floor(problem.answer / 100);
  const ansT = Math.floor((problem.answer % 100) / 10);
  const ansO = problem.answer % 10;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-purple-50 to-amber-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-green-700 text-sm hover:underline">← もどる</Link>
          <span className="text-purple-600 text-sm font-bold">かぞえよう</span>
        </div>

        {/* ─── Big stats bar ─── */}
        <div className="bg-white/90 border border-purple-200 rounded-2xl p-3 mb-2 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{difficulty <= 1 ? "⭐" : difficulty <= 4 ? "⭐⭐" : difficulty <= 7 ? "⭐⭐⭐" : "👑"}</span>
              <div>
                <p className="text-purple-700 font-bold text-sm leading-tight">{levelName}</p>
                <p className="text-gray-400 text-[10px]">Lv.{difficulty}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-orange-500 font-bold text-lg leading-tight">{streak}🔥</p>
              <p className="text-gray-400 text-[10px]">れんぞく</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-400 to-purple-600"
                style={{ width: `${Math.min(100, (difficulty / 10) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 font-bold w-16 text-right">
              {totalCount.current > 0 ? `${pct}% (${correctCount.current}/${totalCount.current})` : "—"}
            </span>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center gap-1 mb-2">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => switchMode(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                mode === opt.value
                  ? "bg-purple-500 text-white border-2 border-purple-400 shadow-md"
                  : "bg-white text-gray-500 border-2 border-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Question */}
        <div className="text-center mb-2">
          <span className="text-purple-700 text-3xl font-bold">{problem.current}</span>
          <span className="text-gray-500 mx-2 text-base">の {stepLabel(problem.step)} は？</span>
        </div>

        {/* Composed answer display */}
        <div className="text-center mb-2">
          <div className={`inline-block rounded-xl px-5 py-1.5 border-2 transition-all ${
            cleared ? "bg-green-50 border-green-400" :
            showCorrectAnswer ? "bg-red-50 border-red-300" :
            "bg-white/80 border-gray-200"
          }`}>
            <span className={`text-3xl font-black tabular-nums ${
              cleared ? "text-green-600" :
              showCorrectAnswer ? "text-red-500" :
              composedAnswer > 0 ? "text-gray-800" : "text-gray-300"
            }`}>
              {composedAnswer > 0 || cleared || showCorrectAnswer ? composedAnswer : "？？？"}
            </span>
          </div>
        </div>

        {/* ═══ Place Value Columns ═══ */}
        <div className="relative flex-1 flex flex-col">
          {!cleared && !showCorrectAnswer ? (
            <div className="grid grid-cols-3 gap-2 flex-1 relative">
              <PlaceValueColumn
                label="百のくらい"
                value={inputH}
                onIncrement={() => handleIncrement("hundreds")}
                onDecrement={() => handleDecrement("hundreds")}
                type="hundreds"
                disabled={animLock.current}
                dotAnim={dotAnimH}
                animDir={dirH}
              />
              <PlaceValueColumn
                label="十のくらい"
                value={inputT}
                onIncrement={() => handleIncrement("tens")}
                onDecrement={() => handleDecrement("tens")}
                type="tens"
                disabled={animLock.current}
                dotAnim={dotAnimT}
                animDir={dirT}
              />
              <PlaceValueColumn
                label="一のくらい"
                value={inputO}
                onIncrement={() => handleIncrement("ones")}
                onDecrement={() => handleDecrement("ones")}
                type="ones"
                disabled={animLock.current}
                dotAnim={dotAnimO}
                animDir={dirO}
              />

              {/* Carry/Borrow overlay */}
              <CarryOverlay anim={carryAnim} />
            </div>
          ) : (
            /* ─── Result display ─── */
            <div className="flex flex-col gap-2 flex-1">
              {/* Message */}
              {message && (
                <div className={`rounded-xl p-3 text-center ${
                  cleared ? "bg-green-50 border-2 border-green-200" : "bg-red-50 border-2 border-red-200"
                }`}>
                  <p className="text-gray-700 text-sm whitespace-pre-line font-bold">{message}</p>
                </div>
              )}

              {/* Show correct answer decomposition on wrong answer */}
              {showCorrectAnswer && (
                <div className="grid grid-cols-3 gap-2 animate-slide-up">
                  <div className="bg-red-50/60 border border-red-200 rounded-xl p-2 text-center">
                    <p className="text-red-500 text-xs font-bold">百のくらい</p>
                    <p className="text-2xl font-black text-red-600">{ansH}</p>
                  </div>
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-2 text-center">
                    <p className="text-blue-500 text-xs font-bold">十のくらい</p>
                    <p className="text-2xl font-black text-blue-600">{ansT}</p>
                  </div>
                  <div className="bg-green-50/60 border border-green-200 rounded-xl p-2 text-center">
                    <p className="text-green-500 text-xs font-bold">一のくらい</p>
                    <p className="text-2xl font-black text-green-600">{ansO}</p>
                  </div>
                </div>
              )}

              {/* Carry/borrow explanation for carry/borrow problems */}
              {isCarryOrBorrow(ct) && (
                <div className={`rounded-xl p-3 text-center animate-slide-up ${
                  cleared ? "bg-yellow-50 border-2 border-yellow-300" : "bg-purple-50 border-2 border-purple-300"
                }`}>
                  <CarryExplanation problem={problem} />
                </div>
              )}

              {/* Next button */}
              <div className="text-center mt-auto pt-2">
                <button onClick={nextProblem} className="mc-btn text-lg px-8 py-3">
                  つぎのもんだい →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit button (when not yet answered) */}
        {!cleared && !showCorrectAnswer && (
          <div className="text-center py-2">
            <button
              onClick={handleSubmit}
              disabled={composedAnswer === 0 || animLock.current}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold text-lg px-8 py-3 rounded-xl shadow-md transition-all active:scale-95 disabled:active:scale-100"
            >
              こたえあわせ ✓
            </button>
          </div>
        )}
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}

/* ─── Carry/Borrow explanation (shown after answering) ─── */
function CarryExplanation({ problem }: { problem: Problem }) {
  const { current, step, answer } = problem;
  const ct = getCarryType(problem);

  if (ct === "carry_tens" || ct === "carry_hundreds") {
    const ones = current % 10;
    return (
      <>
        <p className="text-sm font-bold text-yellow-700 mb-1">くりあがりの しくみ</p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-green-600 font-bold">一のくらい {ones}＋1＝10</span>
          <span className="text-yellow-600">→</span>
          <span className="text-blue-600 font-bold">十のくらい＋1</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`rounded-full border ${i < ones ? "bg-green-400 border-green-500" : "bg-yellow-400 border-yellow-500"}`} style={{ width: 10, height: 10 }} />
            ))}
          </div>
          <span className="mx-1">→</span>
          <div className="inline-flex flex-col p-0.5 rounded bg-blue-100 border-2 border-blue-400" style={{ gap: 1 }}>
            {[0, 1].map(row => (
              <div key={row} className="flex" style={{ gap: 1 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="rounded-full bg-blue-400" style={{ width: 8, height: 8 }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (ct === "borrow_tens" || ct === "borrow_hundreds") {
    return (
      <>
        <p className="text-sm font-bold text-purple-700 mb-1">くりさがりの しくみ</p>
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-green-600 font-bold">一のくらい 0−1 → たりない!</span>
        </div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <div className="inline-flex flex-col p-0.5 rounded bg-blue-100 border-2 border-blue-400" style={{ gap: 1 }}>
            {[0, 1].map(row => (
              <div key={row} className="flex" style={{ gap: 1 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="rounded-full bg-blue-400" style={{ width: 8, height: 8 }} />
                ))}
              </div>
            ))}
          </div>
          <span className="mx-1">→</span>
          <div className="flex gap-0.5 flex-wrap" style={{ maxWidth: 70 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-full bg-green-400 border border-green-500" style={{ width: 10, height: 10 }} />
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">十のたば→10こにバラして、1こひく→<span className="font-bold text-green-600">9こ</span></p>
      </>
    );
  }

  // Generic carry/borrow for +10/-10 cases
  return (
    <>
      <p className="text-sm font-bold text-orange-700 mb-1">くらいが かわったよ</p>
      <p className="text-sm text-gray-700">
        {current} {step > 0 ? `＋${step}` : `${step}`} ＝ <span className="font-bold">{answer}</span>
      </p>
    </>
  );
}
