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

/* ─── Dot visualization of a number ─── */
function DotNumber({ n, highlight, label }: { n: number; highlight?: "before" | "after"; label?: string }) {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  const DOT = 10;

  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && <p className="text-[10px] font-bold text-gray-500 mb-0.5">{label}</p>}
      <div className="flex items-end gap-1.5 flex-wrap justify-center">
        {/* hundreds */}
        {Array.from({ length: h }).map((_, i) => (
          <div key={`h${i}`} className="flex flex-col p-0.5 rounded bg-red-100 border border-red-300" style={{ gap: 1 }}>
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
        {/* tens */}
        {Array.from({ length: t }).map((_, i) => (
          <div key={`t${i}`} className="flex flex-col p-0.5 rounded bg-blue-100 border border-blue-300" style={{ gap: 1 }}>
            {[0, 1].map(row => (
              <div key={row} className="flex" style={{ gap: 1 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="rounded-full bg-blue-400" style={{ width: DOT, height: DOT }} />
                ))}
              </div>
            ))}
          </div>
        ))}
        {/* ones */}
        {o > 0 && (
          <div className="flex flex-wrap gap-0.5" style={{ maxWidth: 60 }}>
            {Array.from({ length: o }).map((_, i) => (
              <div
                key={`o${i}`}
                className={`rounded-full border ${
                  highlight === "after" && i === o - 1
                    ? "bg-yellow-400 border-yellow-500 animate-pulse"
                    : "bg-green-400 border-green-500"
                }`}
                style={{ width: DOT + 2, height: DOT + 2 }}
              />
            ))}
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-gray-700 mt-0.5">
        <span className="text-red-500">{h > 0 ? `${h}百 ` : ""}</span>
        <span className="text-blue-500">{t > 0 || h > 0 ? `${t}十 ` : ""}</span>
        <span className="text-green-600">{o}一</span>
        <span className="text-gray-500"> ＝ {n}</span>
      </p>
    </div>
  );
}

/* ─── Carry/borrow visual explanation ─── */
function CarryVisual({ problem }: { problem: Problem }) {
  const { current, step, answer } = problem;
  const ct = getCarryType(problem);

  if (ct === "carry_tens") {
    const ones = current % 10;
    const tens = Math.floor(current / 10);
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 text-center">
        <p className="text-sm font-bold text-yellow-700 mb-2">くりあがりの しくみ</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <DotNumber n={current} label={`${current}`} />
          <div className="text-2xl text-yellow-600 font-bold">＋1</div>
        </div>
        <div className="my-2 flex items-center justify-center gap-1">
          <span className="text-green-600 font-bold">一のくらい {ones}こ＋1</span>
          <span className="text-yellow-600 font-bold">＝ 10こ!</span>
        </div>
        <div className="bg-yellow-100 rounded-lg p-2 mb-2 inline-flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`rounded-full ${i < ones ? "bg-green-400 border-green-500" : "bg-yellow-400 border-yellow-500 animate-pulse"} border`} style={{ width: 12, height: 12 }} />
            ))}
          </div>
          <span className="text-lg">→</span>
          <div className="flex flex-col p-0.5 rounded bg-blue-100 border-2 border-blue-400 animate-bounce" style={{ gap: 1 }}>
            {[0, 1].map(row => (
              <div key={row} className="flex" style={{ gap: 1 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="rounded-full bg-blue-400" style={{ width: 10, height: 10 }} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm font-bold text-gray-700">
          10こ まとめて <span className="text-blue-600">十のたば</span> に！
        </p>
        <div className="mt-2">
          <DotNumber n={answer} label={`→ ${answer}`} />
        </div>
      </div>
    );
  }

  if (ct === "borrow_tens") {
    const tens = Math.floor(current / 10);
    return (
      <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-3 text-center">
        <p className="text-sm font-bold text-purple-700 mb-2">くりさがりの しくみ</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <DotNumber n={current} label={`${current}`} />
          <div className="text-2xl text-purple-600 font-bold">−1</div>
        </div>
        <div className="my-2 flex items-center justify-center gap-1">
          <span className="text-green-600 font-bold">一のくらいが 0こ…</span>
          <span className="text-purple-600 font-bold">ひけない!</span>
        </div>
        <div className="bg-purple-100 rounded-lg p-2 mb-2 inline-flex items-center gap-2">
          <div className="flex flex-col p-0.5 rounded bg-blue-100 border-2 border-blue-400" style={{ gap: 1 }}>
            {[0, 1].map(row => (
              <div key={row} className="flex" style={{ gap: 1 }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="rounded-full bg-blue-400" style={{ width: 10, height: 10 }} />
                ))}
              </div>
            ))}
          </div>
          <span className="text-lg">→</span>
          <div className="flex gap-0.5 flex-wrap" style={{ maxWidth: 80 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`rounded-full bg-green-400 border border-green-500 ${i === 9 ? "animate-pulse" : ""}`} style={{ width: 12, height: 12 }} />
            ))}
          </div>
        </div>
        <p className="text-sm font-bold text-gray-700">
          <span className="text-blue-600">十のたば</span> をバラして <span className="text-green-600">10こ</span> に！
        </p>
        <p className="text-sm text-gray-600 mt-1">そこから 1こ とると <span className="text-green-600 font-bold">9こ</span></p>
        <div className="mt-2">
          <DotNumber n={answer} label={`→ ${answer}`} />
        </div>
      </div>
    );
  }

  // Generic for other carry/borrow types
  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3 text-center">
      <p className="text-sm font-bold text-orange-700 mb-2">かずの かたち</p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <DotNumber n={current} label={`${current}`} />
        <div className="text-xl text-orange-600 font-bold">{step > 0 ? `＋${step}` : `${step}`}</div>
        <DotNumber n={answer} label={`${answer}`} />
      </div>
    </div>
  );
}

/* ─── Hint: place value decomposition ─── */
function HintDecomposition({ problem }: { problem: Problem }) {
  const { current, step } = problem;
  const h = Math.floor(current / 100);
  const t = Math.floor((current % 100) / 10);
  const o = current % 10;

  const ct = getCarryType(problem);

  if (ct === "carry_tens") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center text-sm">
        <p className="font-bold text-blue-700 mb-1">ヒント</p>
        <p className="text-gray-700">
          {current} ＝ <span className="text-blue-600">{t}0</span> ＋ <span className="text-green-600">{o}</span>
        </p>
        <p className="text-gray-700">
          <span className="text-green-600">{o}</span> ＋ 1 ＝ <span className="text-yellow-600 font-bold">10!</span>
          → 十のくらいが <span className="text-blue-600 font-bold">1ふえる</span>
        </p>
      </div>
    );
  }
  if (ct === "borrow_tens") {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center text-sm">
        <p className="font-bold text-purple-700 mb-1">ヒント</p>
        <p className="text-gray-700">
          一のくらいが <span className="text-green-600 font-bold">0</span> → ひけない！
        </p>
        <p className="text-gray-700">
          <span className="text-blue-600">十のたば</span> を 1こ バラすと <span className="text-green-600 font-bold">10</span>
          → そこから 1ひくと <span className="text-green-600 font-bold">9</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center text-sm">
      <p className="font-bold text-gray-600 mb-1">ヒント</p>
      <p className="text-gray-700">
        {current} ＝
        {h > 0 && <span className="text-red-500"> {h}百</span>}
        <span className="text-blue-500"> {t}十</span>
        <span className="text-green-600"> {o}一</span>
      </p>
      <p className="text-gray-600">{step > 0 ? `＋${step}` : `${step}`} すると…？</p>
    </div>
  );
}

/* ─── Page ─── */
export default function NumberLinePage() {
  const [mode, setMode] = useState<UserMode>("plus");
  const [problem, setProblem] = useState<Problem>(() => generateProblem(0, "plus", []));
  const [userAnswer, setUserAnswer] = useState("");
  const [showReward, setShowReward] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [message, setMessage] = useState("");
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showCarryVisual, setShowCarryVisual] = useState(false);
  const [numbersOnLine, setNumbersOnLine] = useState<number[]>([]);
  const correctCount = useRef(0);
  const totalCount = useRef(0);
  const lastProblems = useRef<Problem[]>([]);

  useEffect(() => {
    const center = problem.current;
    const absStep = Math.abs(problem.step);
    const start = Math.max(0, center - 5 * absStep);
    const end = center + 5 * absStep;
    const nums: number[] = [];
    for (let i = start; i <= end; i += absStep) nums.push(i);
    setNumbersOnLine(nums);
  }, [problem]);

  const switchMode = (newMode: UserMode) => {
    setMode(newMode);
    setProblem(generateProblem(difficulty, newMode, lastProblems.current));
    setUserAnswer("");
    setCleared(false);
    setShowCorrectAnswer(false);
    setShowHint(false);
    setShowCarryVisual(false);
    setMessage("");
  };

  const handleSubmit = useCallback(() => {
    const parsed = parseInt(userAnswer, 10);
    if (isNaN(parsed)) return;
    totalCount.current += 1;

    if (parsed === problem.answer) {
      correctCount.current += 1;
      setStreak((s) => s + 1);
      setCleared(true);
      const ct = getCarryType(problem);
      if (isCarryOrBorrow(ct)) { playBundle(); } else { playSuccess(); }
      setMessage(getSuccessMessage(problem));
      // Show carry visual on correct carry/borrow answers too (reinforcement)
      if (isCarryOrBorrow(ct)) setShowCarryVisual(true);
      setTimeout(() => setShowReward(true), 800);
      setDifficulty((d) => Math.min(10, d + 1));
    } else {
      playError();
      setStreak(0);
      setShowCorrectAnswer(true);
      setShowCarryVisual(true);
      setMessage(getWrongMessage(problem));
      setDifficulty((d) => Math.max(0, d - 1));
    }
  }, [userAnswer, problem]);

  const nextProblem = () => {
    lastProblems.current = [...lastProblems.current.slice(-4), problem];
    setProblem(generateProblem(difficulty, mode, lastProblems.current));
    setUserAnswer("");
    setCleared(false);
    setShowCorrectAnswer(false);
    setShowHint(false);
    setShowCarryVisual(false);
    setMessage("");
  };

  const handleNumberPad = (val: string) => {
    if (cleared || showCorrectAnswer) return;
    if (val === "del") { setUserAnswer((prev) => prev.slice(0, -1)); }
    else if (val === "ok") { if (userAnswer.length > 0) handleSubmit(); }
    else { if (userAnswer.length < 3) setUserAnswer((prev) => prev + val); }
    playPop();
  };

  const levelName = difficulty <= 1 ? "きほん" : difficulty <= 4 ? "ふつう" : difficulty <= 7 ? "むずかしい" : "マスター";
  const pct = totalCount.current > 0 ? Math.round((correctCount.current / totalCount.current) * 100) : 0;
  const ct = getCarryType(problem);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-purple-50 to-amber-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-green-700 text-sm hover:underline">← もどる</Link>
          <span className="text-purple-600 text-sm font-bold">かぞえよう</span>
        </div>

        {/* ─── Big stats bar ─── */}
        <div className="bg-white/90 border border-purple-200 rounded-2xl p-3 mb-3 shadow-sm">
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
          {/* progress bar */}
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

        {/* Number line */}
        <div className="bg-white/80 border border-gray-200 shadow-sm rounded-xl p-3 mb-2 overflow-x-auto">
          <div className="flex items-end justify-center gap-0 min-w-max mx-auto">
            {numbersOnLine.map((num, i) => {
              const isCurrent = num === problem.current;
              const isAnswer = num === problem.answer && (cleared || showCorrectAnswer);
              const isNextUnknown = num === problem.answer && !cleared && !showCorrectAnswer;
              return (
                <div key={`${num}-${i}`} className="flex flex-col items-center" style={{ minWidth: 38 }}>
                  {isCurrent && <div className="text-xl mb-1 animate-bounce">🧱</div>}
                  {isAnswer && <div className="text-xl mb-1">⭐</div>}
                  {isNextUnknown && <div className="text-xl mb-1 text-yellow-300 animate-pulse">❓</div>}
                  <span className={`text-xs font-bold mb-1 ${
                    isCurrent ? "text-purple-600 text-sm" : isAnswer ? "text-green-500 text-sm" : isNextUnknown ? "text-orange-500" : "text-gray-400"
                  }`}>
                    {isNextUnknown ? "？" : num}
                  </span>
                  <div className={`w-0.5 ${isCurrent || isAnswer ? "h-5 bg-yellow-400" : "h-3 bg-gray-300"}`} />
                </div>
              );
            })}
          </div>
          <div className="h-0.5 bg-gray-300 -mt-0.5 mx-4" />
        </div>

        {/* Question */}
        <div className="text-center mb-2">
          <span className="text-purple-700 text-3xl font-bold">{problem.current}</span>
          <span className="text-gray-500 mx-2 text-base">の {stepLabel(problem.step)} は？</span>
        </div>

        {/* Answer display */}
        <div className="text-center mb-2">
          <div className="inline-block bg-white border-2 border-gray-300 shadow-sm rounded-xl px-6 py-2 min-w-[140px]">
            <span className={`text-3xl font-bold ${userAnswer ? "text-gray-800" : "text-gray-300"}`}>
              {userAnswer || "???"}
            </span>
          </div>
        </div>

        {/* Hint button (before answering) */}
        {!cleared && !showCorrectAnswer && !showHint && isCarryOrBorrow(ct) && (
          <div className="text-center mb-2">
            <button
              onClick={() => { setShowHint(true); playPop(); }}
              className="text-purple-400 text-xs underline hover:text-purple-600"
            >
              💡 ヒントをみる
            </button>
          </div>
        )}

        {/* Hint display */}
        {showHint && !cleared && !showCorrectAnswer && (
          <div className="mb-2">
            <HintDecomposition problem={problem} />
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`rounded-lg p-2 mb-2 text-center ${
            cleared ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}>
            <p className="text-gray-700 text-sm whitespace-pre-line">{message}</p>
          </div>
        )}

        {/* Carry visual (on wrong answer or correct carry answer) */}
        {showCarryVisual && isCarryOrBorrow(ct) && (
          <div className="mb-2 animate-slide-up">
            <CarryVisual problem={problem} />
          </div>
        )}

        {/* Number pad / Next */}
        <div className="flex-1 flex flex-col justify-end">
          {!cleared && !showCorrectAnswer ? (
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
              {["1","2","3","4","5","6","7","8","9","del","0","ok"].map((val) => (
                <button
                  key={val}
                  onClick={() => handleNumberPad(val)}
                  className={`py-3 rounded-xl text-xl font-bold transition-all active:scale-95 ${
                    val === "ok" ? "bg-green-500 hover:bg-green-600 text-white text-base"
                    : val === "del" ? "bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                    : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 shadow-sm"
                  }`}
                >
                  {val === "del" ? "けす" : val === "ok" ? "こたえあわせ ✓" : val}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center animate-slide-up">
              <button onClick={nextProblem} className="mc-btn text-lg px-8 py-3">
                つぎのもんだい →
              </button>
            </div>
          )}
        </div>
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
