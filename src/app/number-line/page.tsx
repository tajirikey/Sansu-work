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

/* ─── Scaffolded difficulty system ───
   The child struggles with:
   - 109→110 transition (carry across tens to hundreds)
   - Confusing place values (70+30=73, reading 60 as じゅうろく)
   - Borrowing across boundaries

   Levels:
   0-1: +1 without carry (build confidence: 12→13, 35→36)
   2-3: +1 WITH carry across tens (9→10, 19→20, 49→50)
   4:   +1 WITH carry across hundreds (99→100, 109→110, 199→200)
   5:   -1 without borrow (15→14, 43→42)
   6:   -1 WITH borrow across tens (10→9, 20→19, 50→49)
   7:   +10 simple, then with carry (25→35, 93→103)
   8:   -10 simple, then with borrow (45→35, 105→95)
   9-10: mixed all types
─── */

function generateProblem(
  difficulty: number,
  mode: UserMode,
  lastProblems: Problem[],
): Problem {
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const p = generateProblemInner(difficulty, mode);
    // Ensure no duplicate of recent problems
    const isDuplicate = lastProblems.some(
      (prev) => prev.current === p.current && prev.step === p.step,
    );
    if (!isDuplicate) return p;
  }
  // Fallback: return whatever we generated
  return generateProblemInner(difficulty, mode);
}

function generateProblemInner(difficulty: number, mode: UserMode): Problem {
  let step: StepMode;
  let current: number;

  if (mode === "plus") {
    // Plus mode: progressive difficulty for + steps
    if (difficulty <= 1) {
      step = 1;
      current = pickFromArray(NO_CARRY_PLUS1);
    } else if (difficulty <= 3) {
      step = 1;
      current = pickFromArray(CARRY_TENS_PLUS1);
    } else if (difficulty === 4) {
      step = 1;
      // Mix carry-tens with carry-hundreds
      current = Math.random() < 0.5
        ? pickFromArray(CARRY_HUNDREDS_PLUS1)
        : pickFromArray(CARRY_TENS_PLUS1);
    } else if (difficulty <= 6) {
      // Introduce +10
      if (Math.random() < 0.5) {
        step = 1;
        current = pickFromArray([...CARRY_TENS_PLUS1, ...CARRY_HUNDREDS_PLUS1]);
      } else {
        step = 10;
        current = difficulty < 6
          ? pickFromArray(SIMPLE_PLUS10)
          : pickFromArray([...SIMPLE_PLUS10, ...CARRY_PLUS10]);
      }
    } else {
      // High difficulty: any positive step
      if (Math.random() < 0.5) {
        step = 1;
        current = pickFromArray([...NO_CARRY_PLUS1, ...CARRY_TENS_PLUS1, ...CARRY_HUNDREDS_PLUS1]);
      } else {
        step = 10;
        current = pickFromArray([...SIMPLE_PLUS10, ...CARRY_PLUS10]);
      }
    }
  } else if (mode === "minus") {
    // Minus mode: progressive difficulty for - steps
    if (difficulty <= 1) {
      step = -1;
      current = pickFromArray(NO_BORROW_MINUS1);
    } else if (difficulty <= 3) {
      step = -1;
      current = pickFromArray(BORROW_TENS_MINUS1);
    } else if (difficulty === 4) {
      step = -1;
      current = Math.random() < 0.5
        ? pickFromArray(BORROW_HUNDREDS_MINUS1)
        : pickFromArray(BORROW_TENS_MINUS1);
    } else if (difficulty <= 6) {
      if (Math.random() < 0.5) {
        step = -1;
        current = pickFromArray([...BORROW_TENS_MINUS1, ...BORROW_HUNDREDS_MINUS1]);
      } else {
        step = -10;
        current = difficulty < 6
          ? pickFromArray(SIMPLE_MINUS10)
          : pickFromArray([...SIMPLE_MINUS10, ...BORROW_MINUS10]);
      }
    } else {
      if (Math.random() < 0.5) {
        step = -1;
        current = pickFromArray([...NO_BORROW_MINUS1, ...BORROW_TENS_MINUS1, ...BORROW_HUNDREDS_MINUS1]);
      } else {
        step = -10;
        current = pickFromArray([...SIMPLE_MINUS10, ...BORROW_MINUS10]);
      }
    }
  } else {
    // Mix mode: uses difficulty to introduce concepts one by one
    if (difficulty <= 1) {
      step = Math.random() < 0.6 ? 1 : -1;
      current = step === 1 ? pickFromArray(NO_CARRY_PLUS1) : pickFromArray(NO_BORROW_MINUS1);
    } else if (difficulty <= 3) {
      step = Math.random() < 0.5 ? 1 : -1;
      current = step === 1
        ? pickFromArray(CARRY_TENS_PLUS1)
        : pickFromArray(BORROW_TENS_MINUS1);
    } else if (difficulty <= 5) {
      const r = Math.random();
      if (r < 0.3) {
        step = 1;
        current = pickFromArray([...CARRY_TENS_PLUS1, ...CARRY_HUNDREDS_PLUS1]);
      } else if (r < 0.6) {
        step = -1;
        current = pickFromArray([...BORROW_TENS_MINUS1, ...BORROW_HUNDREDS_MINUS1]);
      } else if (r < 0.8) {
        step = 10;
        current = pickFromArray(SIMPLE_PLUS10);
      } else {
        step = -10;
        current = pickFromArray(SIMPLE_MINUS10);
      }
    } else {
      // Full mix
      const r = Math.random();
      if (r < 0.25) {
        step = 1;
        current = pickFromArray([...CARRY_TENS_PLUS1, ...CARRY_HUNDREDS_PLUS1, ...NO_CARRY_PLUS1]);
      } else if (r < 0.5) {
        step = -1;
        current = pickFromArray([...BORROW_TENS_MINUS1, ...BORROW_HUNDREDS_MINUS1, ...NO_BORROW_MINUS1]);
      } else if (r < 0.75) {
        step = 10;
        current = pickFromArray([...SIMPLE_PLUS10, ...CARRY_PLUS10]);
      } else {
        step = -10;
        current = pickFromArray([...SIMPLE_MINUS10, ...BORROW_MINUS10]);
      }
    }
  }

  return { current, step, answer: current + step };
}

function pickFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Number pools for each concept ───

// +1 without carry (ones digit is NOT 9)
const NO_CARRY_PLUS1 = [
  2, 5, 8, 11, 14, 17, 22, 25, 31, 36,
  42, 45, 53, 57, 63, 71, 84, 93, 102, 115,
  124, 136, 141, 155, 163, 172, 181,
];

// +1 WITH carry across tens boundary (ones digit IS 9)
const CARRY_TENS_PLUS1 = [
  9, 19, 29, 39, 49, 59, 69, 79, 89,
  109, 119, 129, 139, 149, 159, 169, 179, 189,
];

// +1 WITH carry across hundreds boundary (99→100, 199→200)
const CARRY_HUNDREDS_PLUS1 = [99, 109, 199];

// -1 without borrow (ones digit is NOT 0)
const NO_BORROW_MINUS1 = [
  3, 5, 8, 12, 15, 18, 23, 26, 34, 37,
  43, 47, 55, 62, 68, 75, 83, 91, 103, 116,
  127, 134, 148, 156, 165, 173, 182,
];

// -1 WITH borrow across tens boundary (ones digit IS 0)
const BORROW_TENS_MINUS1 = [
  10, 20, 30, 40, 50, 60, 70, 80, 90,
  110, 120, 130, 140, 150, 160, 170, 180, 190,
];

// -1 WITH borrow across hundreds (100→99, 200→199)
const BORROW_HUNDREDS_MINUS1 = [100, 110, 200];

// +10 simple (no carry across hundreds)
const SIMPLE_PLUS10 = [
  5, 12, 23, 31, 42, 55, 63, 71, 82, 14,
  25, 36, 44, 53, 61, 75, 83,
];

// +10 WITH carry across hundreds (90s→100s, 190s→200s)
const CARRY_PLUS10 = [
  90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
  190, 191, 192, 193, 194, 195,
];

// -10 simple (no borrow across hundreds)
const SIMPLE_MINUS10 = [
  15, 22, 33, 41, 52, 65, 73, 81, 94,
  115, 126, 134, 143, 155, 162, 174, 185,
];

// -10 WITH borrow across hundreds (100-109→90-99, 200-209→190-199)
const BORROW_MINUS10 = [
  100, 101, 102, 103, 104, 105, 106, 107, 108, 109,
  200, 201, 202, 203, 204, 205,
];

/* ─── Feedback messages that explain the math ─── */
function getCarryType(problem: Problem): "carry_tens" | "carry_hundreds" | "borrow_tens" | "borrow_hundreds" | "carry_tens_10" | "borrow_tens_10" | "simple" {
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
  if (step === 10) {
    if (current % 100 >= 90) return "carry_tens_10";
    return "simple";
  }
  if (step === -10) {
    if (current % 100 < 10) return "borrow_tens_10";
    return "simple";
  }
  return "simple";
}

function getSuccessMessage(problem: Problem): string {
  const { current, step, answer } = problem;
  const carryType = getCarryType(problem);

  switch (carryType) {
    case "carry_tens":
      return `すごい！ ${current} の つぎは ${answer}！\n一のくらい ${current % 10}→0、十のくらいが 1 ふえたよ！`;
    case "carry_hundreds":
      return `すごい！ ${current} の つぎは ${answer}！\n一のくらい 9→0、十のくらい 9→0、百のくらいが 1 ふえたよ！`;
    case "borrow_tens":
      return `すごい！ ${current} の まえは ${answer}！\n一のくらい 0→9、十のくらいが 1 へったよ！`;
    case "borrow_hundreds":
      return `すごい！ ${current} の まえは ${answer}！\n一のくらい 0→9、十のくらい 0→9、百のくらいが 1 へったよ！`;
    case "carry_tens_10":
      return `すごい！ ${current}＋10＝${answer}！\n十のくらい ${Math.floor((current % 100) / 10)}→0、百のくらいが 1 ふえたよ！`;
    case "borrow_tens_10":
      return `すごい！ ${current}−10＝${answer}！\n十のくらい ${Math.floor((current % 100) / 10)}→9、百のくらいが 1 へったよ！`;
    default:
      return `せいかい！ ${current} ${step > 0 ? "+" : ""}${step} = ${answer}`;
  }
}

function getWrongMessage(problem: Problem): string {
  const { current, step, answer } = problem;
  const carryType = getCarryType(problem);

  switch (carryType) {
    case "carry_tens":
      return `おしい！ こたえは ${answer}！\n一のくらいが 9 のとき、＋1 すると 十のくらいが 1 ふえるよ`;
    case "carry_hundreds":
      return `おしい！ こたえは ${answer}！\n99＋1＝100！ 百のくらいが 1 ふえるよ`;
    case "borrow_tens":
      return `おしい！ こたえは ${answer}！\n一のくらいが 0 のとき、−1 すると 十のくらいが 1 へるよ`;
    case "borrow_hundreds":
      return `おしい！ こたえは ${answer}！\n100−1＝99！ 百のくらいが 1 へるよ`;
    case "carry_tens_10":
      return `おしい！ こたえは ${answer}！\n十のくらい ${Math.floor((current % 100) / 10)}＋1 で百のくらいが 1 ふえるよ`;
    case "borrow_tens_10":
      return `おしい！ こたえは ${answer}！\n十のくらいが ${Math.floor((current % 100) / 10)} のとき −10 すると 百のくらいが 1 へるよ`;
    default:
      return `おしい！ ${current} ${step > 0 ? "+" : ""}${step} = ${answer} だよ`;
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
    for (let i = start; i <= end; i += absStep) {
      nums.push(i);
    }
    setNumbersOnLine(nums);
  }, [problem]);

  const switchMode = (newMode: UserMode) => {
    setMode(newMode);
    setProblem(generateProblem(difficulty, newMode, lastProblems.current));
    setUserAnswer("");
    setCleared(false);
    setShowCorrectAnswer(false);
    setMessage("");
  };

  const handleSubmit = useCallback(() => {
    const parsed = parseInt(userAnswer, 10);
    if (isNaN(parsed)) return;

    totalCount.current += 1;

    if (parsed === problem.answer) {
      correctCount.current += 1;
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCleared(true);

      const carryType = getCarryType(problem);
      if (carryType !== "simple") {
        playBundle();
      } else {
        playSuccess();
      }
      setMessage(getSuccessMessage(problem));

      setTimeout(() => setShowReward(true), 800);
      setDifficulty(Math.min(10, difficulty + 1));
    } else {
      playError();
      setStreak(0);
      setShowCorrectAnswer(true);
      setMessage(getWrongMessage(problem));
      // On wrong answer, decrease difficulty slightly
      setDifficulty(Math.max(0, difficulty - 1));
    }
  }, [userAnswer, problem, streak, difficulty]);

  const nextProblem = () => {
    // Track last problems to avoid duplicates
    lastProblems.current = [...lastProblems.current.slice(-4), problem];

    const newProblem = generateProblem(difficulty, mode, lastProblems.current);
    setProblem(newProblem);
    setUserAnswer("");
    setCleared(false);
    setShowCorrectAnswer(false);
    setMessage("");
  };

  const handleNumberPad = (val: string) => {
    if (cleared || showCorrectAnswer) return;
    if (val === "del") {
      setUserAnswer((prev) => prev.slice(0, -1));
    } else if (val === "ok") {
      if (userAnswer.length > 0) handleSubmit();
    } else {
      if (userAnswer.length < 3) {
        setUserAnswer((prev) => prev + val);
      }
    }
    playPop();
  };

  /* ─── Level indicator ─── */
  const levelName = difficulty <= 1 ? "きほん" : difficulty <= 4 ? "ふつう" : difficulty <= 7 ? "むずかしい" : "マスター";
  const levelStars = difficulty <= 1 ? "⭐" : difficulty <= 4 ? "⭐⭐" : difficulty <= 7 ? "⭐⭐⭐" : "👑";

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-purple-50 to-amber-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-green-700 text-sm hover:underline">← もどる</Link>
          <div className="flex items-center gap-3">
            <span className="text-purple-600 text-sm font-bold">かぞえよう</span>
            <span className="text-orange-500 text-xs">{streak}🔥</span>
          </div>
        </div>

        {/* level indicator */}
        <div className="text-center mb-1">
          <span className="text-xs text-purple-400">
            {levelStars} {levelName} Lv.{difficulty}
          </span>
        </div>

        {/* mode toggle */}
        <div className="flex justify-center gap-1 mb-3">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => switchMode(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                mode === opt.value
                  ? "bg-purple-500 text-white border-2 border-purple-400 shadow-md"
                  : "bg-white text-gray-500 border-2 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* number line */}
        <div className="bg-white/80 border border-gray-200 shadow-sm rounded-xl p-3 mb-3 overflow-x-auto">
          <div className="flex items-end justify-center gap-0 min-w-max mx-auto">
            {numbersOnLine.map((num, i) => {
              const isCurrent = num === problem.current;
              const isAnswer = num === problem.answer && (cleared || showCorrectAnswer);
              const isNextUnknown = num === problem.answer && !cleared && !showCorrectAnswer;

              return (
                <div key={`${num}-${i}`} className="flex flex-col items-center" style={{ minWidth: 38 }}>
                  {isCurrent && <div className="text-xl mb-1 animate-bounce">🧱</div>}
                  {isAnswer && <div className="text-xl mb-1 animate-bounce-in">⭐</div>}
                  {isNextUnknown && <div className="text-xl mb-1 text-yellow-300 animate-pulse">❓</div>}

                  <span
                    className={`text-xs font-bold mb-1 ${
                      isCurrent ? "text-purple-600 text-sm" : isAnswer ? "text-green-400 text-sm" : isNextUnknown ? "text-orange-500" : "text-gray-400"
                    }`}
                  >
                    {isNextUnknown ? "？" : num}
                  </span>

                  <div className={`w-0.5 ${isCurrent || isAnswer ? "h-5 bg-yellow-400" : "h-3 bg-gray-300"}`} />
                </div>
              );
            })}
          </div>
          <div className="h-0.5 bg-gray-300 -mt-0.5 mx-4" />
        </div>

        {/* question */}
        <div className="text-center mb-3">
          <span className="text-purple-700 text-3xl font-bold">{problem.current}</span>
          <span className="text-gray-500 mx-2 text-base">の {stepLabel(problem.step)} は？</span>
        </div>

        {/* answer display */}
        <div className="text-center mb-3">
          <div className="inline-block bg-white border-2 border-gray-300 shadow-sm rounded-xl px-6 py-2 min-w-[140px]">
            <span className={`text-3xl font-bold ${userAnswer ? "text-gray-800" : "text-gray-300"}`}>
              {userAnswer || "???"}
            </span>
          </div>
        </div>

        {/* message */}
        {message && (
          <div
            className={`rounded-lg p-2 mb-3 text-center ${
              cleared ? "bg-green-50 border border-green-200" : showCorrectAnswer ? "bg-red-50 border border-red-200" : "bg-white/80"
            }`}
          >
            <p className="text-gray-700 text-sm whitespace-pre-line">{message}</p>
          </div>
        )}

        {/* number pad / next */}
        <div className="flex-1 flex flex-col justify-end">
          {!cleared && !showCorrectAnswer ? (
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"].map((val) => (
                <button
                  key={val}
                  onClick={() => handleNumberPad(val)}
                  className={`py-3.5 rounded-xl text-xl font-bold transition-all active:scale-95 ${
                    val === "ok"
                      ? "bg-green-500 hover:bg-green-600 text-white text-base"
                      : val === "del"
                      ? "bg-red-100 hover:bg-red-200 text-red-700 text-sm"
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

        {/* progress */}
        <div className="text-center text-gray-400 text-xs mt-2 pb-2">
          {totalCount.current > 0 && (
            <span>
              せいかいりつ: {correctCount.current}/{totalCount.current} (
              {Math.round((correctCount.current / totalCount.current) * 100)}%)
            </span>
          )}
        </div>
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
