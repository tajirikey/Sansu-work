"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError, playBundle } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

/* ═══════════════════════════════════════════════
   Types & Problem Generation
   ═══════════════════════════════════════════════ */

type Mode = "addition" | "subtraction" | "mix";

interface SakuranboProblem {
  a: number;
  b: number;
  op: "+" | "-";
  answer: number;
  cherryLeft: number;
  cherryRight: number;
  cherryTarget: "a" | "b"; // which operand gets the cherry
}

/* ─── Addition problem pools by difficulty ─── */
const ADD_EASY: [number, number][] = [
  [9,2],[9,3],[9,4],[8,3],[8,4],[9,5],[8,5],
];
const ADD_MED: [number, number][] = [
  [7,4],[7,5],[7,6],[6,5],[6,6],[6,7],[8,6],[8,7],[9,6],[9,7],
];
const ADD_HARD: [number, number][] = [
  [2,9],[3,8],[3,9],[4,7],[4,8],[4,9],[5,6],[5,7],[5,8],[5,9],
  [6,8],[6,9],[7,7],[7,8],[7,9],[8,8],[8,9],[9,8],[9,9],
];

/* ─── Subtraction problem pools by difficulty ─── */
const SUB_EASY: [number, number][] = [
  [11,2],[11,3],[12,3],[12,4],[11,4],[11,5],[12,5],
];
const SUB_MED: [number, number][] = [
  [13,4],[13,5],[13,6],[14,5],[14,6],[14,7],[15,6],[15,7],[15,8],[12,6],[12,7],
];
const SUB_HARD: [number, number][] = [
  [11,6],[11,7],[11,8],[11,9],[12,8],[12,9],[13,7],[13,8],[13,9],
  [14,8],[14,9],[15,9],[16,7],[16,8],[16,9],[17,8],[17,9],[18,9],
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeProblem(a: number, b: number, op: "+" | "-"): SakuranboProblem {
  if (op === "+") {
    const cherryLeft = 10 - a;
    const cherryRight = b - cherryLeft;
    return { a, b, op, answer: a + b, cherryLeft, cherryRight, cherryTarget: "b" };
  } else {
    const cherryLeft = 10;
    const cherryRight = a - 10;
    return { a, b, op, answer: a - b, cherryLeft, cherryRight, cherryTarget: "a" };
  }
}

function generateProblem(
  difficulty: number,
  mode: Mode,
  lastProblems: SakuranboProblem[],
): SakuranboProblem {
  for (let attempt = 0; attempt < 20; attempt++) {
    const p = generateProblemInner(difficulty, mode);
    const isDuplicate = lastProblems.some(
      (prev) => prev.a === p.a && prev.b === p.b && prev.op === p.op,
    );
    if (!isDuplicate) return p;
  }
  return generateProblemInner(difficulty, mode);
}

function generateProblemInner(difficulty: number, mode: Mode): SakuranboProblem {
  let useAddition: boolean;
  if (mode === "addition") useAddition = true;
  else if (mode === "subtraction") useAddition = false;
  else useAddition = Math.random() < 0.5;

  if (useAddition) {
    let pool: [number, number][];
    if (difficulty <= 1) pool = ADD_EASY;
    else if (difficulty <= 3) pool = [...ADD_EASY, ...ADD_MED];
    else pool = [...ADD_EASY, ...ADD_MED, ...ADD_HARD];
    const [a, b] = pickRandom(pool);
    return makeProblem(a, b, "+");
  } else {
    let pool: [number, number][];
    if (difficulty <= 1) pool = SUB_EASY;
    else if (difficulty <= 3) pool = [...SUB_EASY, ...SUB_MED];
    else pool = [...SUB_EASY, ...SUB_MED, ...SUB_HARD];
    const [a, b] = pickRandom(pool);
    return makeProblem(a, b, "-");
  }
}

/* ─── Messages ─── */
function getSuccessMessage(p: SakuranboProblem): string {
  if (p.op === "+") {
    return `すごい！ ${p.a} + ${p.b} = ${p.answer}！\n${p.a} + ${p.cherryLeft} = 10、10 + ${p.cherryRight} = ${p.answer}`;
  }
  const remainder = p.cherryLeft - p.b;
  return `すごい！ ${p.a} - ${p.b} = ${p.answer}！\n${p.cherryLeft} - ${p.b} = ${remainder}、${remainder} + ${p.cherryRight} = ${p.answer}`;
}

function getHintMessage(
  p: SakuranboProblem,
  wrong: Set<string>,
  attemptCount: number,
): string {
  if (p.op === "+") {
    if (wrong.has("cl")) {
      return attemptCount >= 2
        ? `ヒント: ${p.a} と あわせて 10 にする → ${p.cherryLeft}`
        : `${p.a} と あわせて 10 になる かずは？`;
    }
    if (wrong.has("cr")) return `ふたつの さくらんぼを あわせると ${p.b} だよ！`;
    if (wrong.has("ans")) return `さくらんぼは あってるよ！ 10 + ${p.cherryRight} は？`;
  } else {
    if (wrong.has("cl")) {
      return attemptCount >= 2
        ? `ヒント: ${p.a} を 10 と ${p.cherryRight} に わけよう`
        : `${p.a} を 10 と いくつに わけられる？`;
    }
    if (wrong.has("cr")) return `${p.a} は 10 と あと いくつ？`;
    if (wrong.has("ans")) {
      const rem = p.cherryLeft - p.b;
      return `さくらんぼは あってるよ！ ${rem} + ${p.cherryRight} は？`;
    }
  }
  return "もういちど かんがえてみよう！";
}

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "addition", label: "たしざん" },
  { value: "subtraction", label: "ひきざん" },
  { value: "mix", label: "まぜる" },
];

/* ═══════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════ */

/* ─── Stepper input (cherry circle or answer) ─── */
function CherryInput({
  value,
  onChange,
  max = 9,
  wrong,
  correct,
  disabled,
  size = "md",
  prefill,
}: {
  value: number | null;
  onChange: (v: number) => void;
  max?: number;
  wrong: boolean;
  correct: boolean;
  disabled: boolean;
  size?: "md" | "lg";
  prefill?: number;
}) {
  const inc = () => {
    if (disabled) return;
    playPop();
    const next = value === null ? 1 : value >= max ? 0 : value + 1;
    onChange(next);
  };
  const dec = () => {
    if (disabled) return;
    playPop();
    const next = value === null ? max : value <= 0 ? max : value - 1;
    onChange(next);
  };

  const isPrefilled = prefill !== undefined;
  const displayVal = isPrefilled ? prefill : value;

  const sizeClasses = size === "lg"
    ? "w-16 h-16 text-3xl"
    : "w-14 h-14 text-2xl";

  const btnClasses = size === "lg"
    ? "text-2xl w-12 h-10"
    : "text-2xl w-10 h-9";

  return (
    <div className="flex flex-col items-center gap-1">
      {!isPrefilled && (
        <button
          onClick={inc}
          disabled={disabled}
          className={`${btnClasses} flex items-center justify-center rounded-lg bg-pink-100 text-pink-500 font-bold active:bg-pink-200 active:scale-90 transition-all disabled:opacity-30 select-none touch-manipulation`}
        >
          +
        </button>
      )}
      <div
        onClick={!isPrefilled && !disabled ? inc : undefined}
        className={`${sizeClasses} rounded-full flex items-center justify-center
          font-bold transition-all select-none
          ${wrong
            ? "bg-red-100 border-[3px] border-red-400 text-red-600 animate-shake"
            : correct
              ? "bg-green-100 border-[3px] border-green-400 text-green-600 animate-pop-in"
              : isPrefilled
                ? "bg-pink-100 border-[3px] border-pink-300 text-pink-500"
                : "bg-pink-50 border-[3px] border-pink-300 text-pink-700 shadow-md active:scale-95"
          }
          ${disabled && !isPrefilled ? "opacity-60" : ""}
          ${!isPrefilled && !disabled ? "cursor-pointer" : ""}
        `}
      >
        {displayVal !== null && displayVal !== undefined ? (
          displayVal
        ) : (
          <span className="text-pink-300 text-lg">?</span>
        )}
      </div>
      {!isPrefilled && (
        <button
          onClick={dec}
          disabled={disabled}
          className={`${btnClasses} flex items-center justify-center rounded-lg bg-pink-100 text-pink-500 font-bold active:bg-pink-200 active:scale-90 transition-all disabled:opacity-30 select-none touch-manipulation`}
        >
          -
        </button>
      )}
    </div>
  );
}

/* ─── Tappable operand number ─── */
function OperandButton({
  value,
  selected,
  wrongFlash,
  disabled,
  onClick,
}: {
  value: number;
  selected: boolean;
  wrongFlash: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center px-4 py-2 rounded-2xl transition-all active:scale-95 select-none touch-manipulation
        ${wrongFlash
          ? "bg-red-100 border-3 border-red-300 animate-shake"
          : selected
            ? "bg-pink-100 border-3 border-pink-400 shadow-md"
            : disabled
              ? "bg-transparent border-3 border-transparent"
              : "bg-pink-50/60 border-3 border-pink-200 shadow-sm hover:border-pink-300"
        }
      `}
    >
      <span className="text-4xl font-black text-pink-700">{value}</span>
      {selected && <span className="text-xs text-pink-400 -mt-1">🌸</span>}
      {!selected && !disabled && !wrongFlash && (
        <span className="text-[10px] text-pink-300 -mt-1">タップ</span>
      )}
    </button>
  );
}

/* ─── Dot visualization ─── */
function DotGroup({
  count,
  color = "green",
  animClass = "",
}: {
  count: number;
  color?: "green" | "pink" | "red" | "gray";
  animClass?: string;
}) {
  if (count <= 0) return null;
  const colorMap = {
    green: "bg-green-500",
    pink: "bg-pink-400",
    red: "bg-red-400",
    gray: "bg-gray-300",
  };
  return (
    <div className={`grid grid-cols-5 gap-1 justify-items-center ${animClass}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${colorMap[color]}`}
        />
      ))}
    </div>
  );
}

function DotVisualization({
  problem,
  phase,
  cherryLeftInput,
  cherryRightInput,
}: {
  problem: SakuranboProblem;
  phase: "input" | "correct" | "wrong";
  cherryLeftInput: number | null;
  cherryRightInput: number | null;
}) {
  const isAdd = problem.op === "+";

  if (phase === "correct") {
    if (isAdd) {
      return (
        <div className="flex items-start justify-center gap-4 p-3">
          <div className="flex flex-col items-center">
            <div className="inline-grid grid-cols-5 p-1 rounded-lg bg-blue-50 border-2 border-blue-300 gap-1 justify-items-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < problem.a ? "bg-green-500" : "bg-pink-400"}`} />
              ))}
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5">10</span>
          </div>
          <span className="text-gray-400 text-lg mt-2">+</span>
          <div className="flex flex-col items-center">
            <DotGroup count={problem.cherryRight} color="green" animClass="animate-pop-in" />
            <span className="text-[10px] text-gray-400 mt-0.5">{problem.cherryRight}</span>
          </div>
          <span className="text-gray-400 text-lg mt-2">=</span>
          <span className="text-green-600 font-bold text-xl mt-1">{problem.answer}</span>
        </div>
      );
    } else {
      const remainder = 10 - problem.b;
      return (
        <div className="flex items-start justify-center gap-3 p-3">
          <div className="flex flex-col items-center">
            <div className="inline-grid grid-cols-5 gap-1 justify-items-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < remainder ? "bg-green-500" : "bg-gray-300"}`} />
              ))}
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5">10-{problem.b}={remainder}</span>
          </div>
          <span className="text-gray-400 text-lg mt-2">+</span>
          <div className="flex flex-col items-center">
            <DotGroup count={problem.cherryRight} color="pink" animClass="animate-pop-in" />
            <span className="text-[10px] text-gray-400 mt-0.5">{problem.cherryRight}</span>
          </div>
          <span className="text-gray-400 text-lg mt-2">=</span>
          <span className="text-green-600 font-bold text-xl mt-1">{problem.answer}</span>
        </div>
      );
    }
  }

  // Input / wrong phase: show the two operands as dot groups
  if (isAdd) {
    const hasValidSplit =
      cherryLeftInput !== null &&
      cherryRightInput !== null &&
      cherryLeftInput + cherryRightInput === problem.b &&
      cherryLeftInput >= 0 &&
      cherryRightInput >= 0;

    return (
      <div className="flex items-start justify-center gap-4 p-3">
        <div className="flex flex-col items-center">
          <DotGroup count={problem.a} color="green" />
          <span className="text-[10px] text-gray-400 mt-0.5">{problem.a}</span>
        </div>
        <span className="text-gray-400 text-lg mt-2">+</span>
        {hasValidSplit ? (
          <>
            <div className="flex flex-col items-center">
              <DotGroup count={cherryLeftInput!} color="pink" />
              <span className="text-[10px] text-pink-400 mt-0.5">{cherryLeftInput}</span>
            </div>
            <div className="flex flex-col items-center">
              <DotGroup count={cherryRightInput!} color="green" />
              <span className="text-[10px] text-gray-400 mt-0.5">{cherryRightInput}</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <DotGroup count={problem.b} color="green" />
            <span className="text-[10px] text-gray-400 mt-0.5">{problem.b}</span>
          </div>
        )}
      </div>
    );
  } else {
    const hasValidSplit =
      cherryLeftInput !== null &&
      cherryRightInput !== null &&
      cherryLeftInput + cherryRightInput === problem.a;

    return (
      <div className="flex items-start justify-center gap-4 p-3">
        {hasValidSplit ? (
          <>
            <div className="flex flex-col items-center">
              <DotGroup count={cherryLeftInput!} color="pink" />
              <span className="text-[10px] text-pink-400 mt-0.5">{cherryLeftInput}</span>
            </div>
            <div className="flex flex-col items-center">
              <DotGroup count={cherryRightInput!} color="green" />
              <span className="text-[10px] text-gray-400 mt-0.5">{cherryRightInput}</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <DotGroup count={problem.a} color="green" />
            <span className="text-[10px] text-gray-400 mt-0.5">{problem.a}</span>
          </div>
        )}
        <span className="text-gray-400 text-lg mt-2">-</span>
        <div className="flex flex-col items-center">
          <DotGroup count={problem.b} color="red" />
          <span className="text-[10px] text-gray-400 mt-0.5">{problem.b}</span>
        </div>
      </div>
    );
  }
}

/* ─── Intermediate calculation display ─── */
function IntermediateCalc({
  problem,
  cherryLeft,
  cherryRight,
}: {
  problem: SakuranboProblem;
  cherryLeft: number | null;
  cherryRight: number | null;
}) {
  if (cherryLeft === null || cherryRight === null) return null;

  if (problem.op === "+") {
    const step1 = problem.a + cherryLeft;
    const step2 = step1 + cherryRight;
    return (
      <div className="bg-pink-50/80 border border-pink-200 rounded-lg p-2 text-center text-sm animate-slide-up">
        <p className="text-gray-700">
          <span className="font-bold text-pink-600">{problem.a}</span>
          <span className="text-gray-400"> + </span>
          <span className="font-bold text-pink-500">{cherryLeft}</span>
          <span className="text-gray-400"> = </span>
          <span className="font-bold text-blue-600">{step1}</span>
        </p>
        <p className="text-gray-700">
          <span className="font-bold text-blue-600">{step1}</span>
          <span className="text-gray-400"> + </span>
          <span className="font-bold text-pink-500">{cherryRight}</span>
          <span className="text-gray-400"> = </span>
          <span className="font-bold text-green-600">{step2}</span>
        </p>
      </div>
    );
  } else {
    const step1 = cherryLeft - problem.b;
    const step2 = step1 + cherryRight;
    return (
      <div className="bg-pink-50/80 border border-pink-200 rounded-lg p-2 text-center text-sm animate-slide-up">
        <p className="text-gray-700">
          <span className="font-bold text-pink-500">{cherryLeft}</span>
          <span className="text-gray-400"> - </span>
          <span className="font-bold text-red-500">{problem.b}</span>
          <span className="text-gray-400"> = </span>
          <span className="font-bold text-blue-600">{step1}</span>
        </p>
        <p className="text-gray-700">
          <span className="font-bold text-blue-600">{step1}</span>
          <span className="text-gray-400"> + </span>
          <span className="font-bold text-pink-500">{cherryRight}</span>
          <span className="text-gray-400"> = </span>
          <span className="font-bold text-green-600">{step2}</span>
        </p>
      </div>
    );
  }
}

/* ═══════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════ */

export default function SakuranboPage() {
  const [mode, setMode] = useState<Mode>("addition");
  const [problem, setProblem] = useState<SakuranboProblem>(() =>
    generateProblem(0, "addition", []),
  );
  const [showReward, setShowReward] = useState(false);
  const [message, setMessage] = useState("どちらの かずを わける？ タップしてね！");

  // Target selection: user must pick which operand to split
  const [selectedTarget, setSelectedTarget] = useState<"a" | "b" | null>(null);
  const [wrongTargetFlash, setWrongTargetFlash] = useState<"a" | "b" | null>(null);

  // Inputs (only active after correct target is selected)
  const [clInput, setClInput] = useState<number | null>(null);
  const [crInput, setCrInput] = useState<number | null>(null);
  const [ansInput, setAnsInput] = useState<number | null>(null);

  // Validation state
  const [phase, setPhase] = useState<"select" | "input" | "correct" | "wrong">("select");
  const [wrongFields, setWrongFields] = useState<Set<string>>(new Set());
  const [correctFields, setCorrectFields] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);

  // Stats
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const correctCount = useRef(0);
  const totalCount = useRef(0);
  const lastProblems = useRef<SakuranboProblem[]>([]);

  // For subtraction at higher difficulty, pre-fill cherry left = 10
  const subPrefillCL = problem.op === "-" && difficulty >= 4;

  /* ─── Handle operand tap (target selection) ─── */
  const handleTargetSelect = useCallback((target: "a" | "b") => {
    if (phase !== "select") return;

    if (target === problem.cherryTarget) {
      // Correct! Show cherry UI
      playBundle();
      setSelectedTarget(target);
      setPhase("input");
      setMessage("さくらんぼに わけてみよう！");
      setWrongTargetFlash(null);
    } else {
      // Wrong target
      playError();
      setWrongTargetFlash(target);
      if (problem.op === "+") {
        setMessage("たしざんでは うしろの かずを わけるよ！");
      } else {
        setMessage("ひきざんでは まえの かずを わけるよ！");
      }
      setTimeout(() => setWrongTargetFlash(null), 600);
    }
  }, [phase, problem]);

  /* ─── Handle answer check ─── */
  const handleCheck = useCallback(() => {
    const effectiveCL = subPrefillCL ? 10 : clInput;
    if (effectiveCL === null || crInput === null || ansInput === null) {
      playError();
      setMessage("ぜんぶの まるに かずを いれてね！");
      return;
    }

    totalCount.current += 1;
    const wrong = new Set<string>();
    const correct = new Set<string>();

    if (effectiveCL === problem.cherryLeft) correct.add("cl");
    else wrong.add("cl");
    if (crInput === problem.cherryRight) correct.add("cr");
    else wrong.add("cr");
    if (ansInput === problem.answer) correct.add("ans");
    else wrong.add("ans");

    if (wrong.size === 0) {
      correctCount.current += 1;
      setStreak((s) => s + 1);
      setDifficulty((d) => Math.min(10, d + 1));
      setPhase("correct");
      setCorrectFields(correct);
      setWrongFields(new Set());
      playSuccess();
      setMessage(getSuccessMessage(problem));
      setTimeout(() => setShowReward(true), 800);
      setAttempts(0);
    } else {
      setStreak(0);
      setDifficulty((d) => Math.max(0, d - 1));
      setPhase("wrong");
      setWrongFields(wrong);
      setCorrectFields(correct);
      playError();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        setClInput(problem.cherryLeft);
        setCrInput(problem.cherryRight);
        setAnsInput(problem.answer);
        setPhase("correct");
        setCorrectFields(new Set(["cl", "cr", "ans"]));
        setWrongFields(new Set());
        setMessage(
          `こたえは ${problem.answer} だよ。\n${problem.op === "+" ? `${problem.a}+${problem.cherryLeft}=10、10+${problem.cherryRight}=${problem.answer}` : `10-${problem.b}=${10 - problem.b}、${10 - problem.b}+${problem.cherryRight}=${problem.answer}`}`,
        );
      } else {
        setMessage(getHintMessage(problem, wrong, newAttempts));
      }
    }
  }, [clInput, crInput, ansInput, problem, attempts, subPrefillCL]);

  const nextProblem = () => {
    lastProblems.current = [...lastProblems.current.slice(-4), problem];
    setProblem(generateProblem(difficulty, mode, lastProblems.current));
    setSelectedTarget(null);
    setWrongTargetFlash(null);
    setClInput(null);
    setCrInput(null);
    setAnsInput(null);
    setPhase("select");
    setWrongFields(new Set());
    setCorrectFields(new Set());
    setMessage("どちらの かずを わける？ タップしてね！");
    setAttempts(0);
    setShowReward(false);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    lastProblems.current = [];
    setProblem(generateProblem(difficulty, newMode, []));
    setSelectedTarget(null);
    setWrongTargetFlash(null);
    setClInput(null);
    setCrInput(null);
    setAnsInput(null);
    setPhase("select");
    setWrongFields(new Set());
    setCorrectFields(new Set());
    setMessage("どちらの かずを わける？ タップしてね！");
    setAttempts(0);
  };

  const levelName =
    difficulty <= 1
      ? "きほん"
      : difficulty <= 4
        ? "ふつう"
        : difficulty <= 7
          ? "むずかしい"
          : "マスター";
  const pct =
    totalCount.current > 0
      ? Math.round((correctCount.current / totalCount.current) * 100)
      : 0;
  const cherryVisible = selectedTarget !== null; // cherry UI only after correct target selection
  const inputDisabled = phase === "correct";

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-pink-50 to-amber-50 p-3 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-pink-700 text-sm hover:underline">
            &larr; もどる
          </Link>
          <span className="text-pink-600 text-sm font-bold">
            さくらんぼけいさん
          </span>
        </div>

        {/* Stats bar */}
        <div className="bg-white/90 border border-pink-200 rounded-2xl p-3 mb-2 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {difficulty <= 1
                  ? "⭐"
                  : difficulty <= 4
                    ? "⭐⭐"
                    : difficulty <= 7
                      ? "⭐⭐⭐"
                      : "👑"}
              </span>
              <div>
                <p className="text-pink-700 font-bold text-sm leading-tight">
                  {levelName}
                </p>
                <p className="text-gray-400 text-[10px]">Lv.{difficulty}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-orange-500 font-bold text-lg leading-tight">
                {streak}🔥
              </p>
              <p className="text-gray-400 text-[10px]">れんぞく</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-pink-400 to-pink-600"
                style={{
                  width: `${Math.min(100, (difficulty / 10) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 font-bold w-16 text-right">
              {totalCount.current > 0
                ? `${pct}% (${correctCount.current}/${totalCount.current})`
                : "—"}
            </span>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center gap-1 mb-3">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => switchMode(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                mode === opt.value
                  ? "bg-pink-500 text-white border-2 border-pink-400 shadow-md"
                  : "bg-white text-gray-500 border-2 border-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ═══ Problem + Cherry Branch ═══ */}
        <div className="bg-white/80 border-2 border-pink-200 rounded-2xl p-4 shadow-sm flex-1 flex flex-col gap-3">
          {/* Problem row: tappable operands */}
          <div className="flex items-center justify-center gap-2">
            {/* Number A */}
            <OperandButton
              value={problem.a}
              selected={selectedTarget === "a"}
              wrongFlash={wrongTargetFlash === "a"}
              disabled={cherryVisible || inputDisabled}
              onClick={() => handleTargetSelect("a")}
            />

            {/* Operator */}
            <span className="text-2xl font-bold text-gray-400">
              {problem.op === "+" ? "＋" : "−"}
            </span>

            {/* Number B */}
            <OperandButton
              value={problem.b}
              selected={selectedTarget === "b"}
              wrongFlash={wrongTargetFlash === "b"}
              disabled={cherryVisible || inputDisabled}
              onClick={() => handleTargetSelect("b")}
            />

            {/* Equals */}
            <span className="text-2xl font-bold text-gray-400">=</span>

            {/* Answer input - only after cherry target selected */}
            {cherryVisible ? (
              <CherryInput
                value={ansInput}
                onChange={setAnsInput}
                max={18}
                wrong={wrongFields.has("ans")}
                correct={correctFields.has("ans")}
                disabled={inputDisabled}
                size="lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-50 border-[3px] border-gray-200">
                <span className="text-gray-300 text-lg">?</span>
              </div>
            )}
          </div>

          {/* Cherry branch SVG + inputs (only visible after correct target selection) */}
          {cherryVisible && (
            <div className="flex flex-col items-center animate-slide-up">
              {/* SVG branches */}
              <svg
                width="160"
                height="40"
                viewBox="0 0 160 40"
                className="block"
              >
                <path
                  d="M80 0 L80 12 Q80 18 55 30 L35 40"
                  stroke="#EC4899"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  className={
                    phase === "correct" ? "animate-[cherry-pulse_0.6s_ease-in-out]" : ""
                  }
                />
                <path
                  d="M80 12 Q80 18 105 30 L125 40"
                  stroke="#EC4899"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  className={
                    phase === "correct" ? "animate-[cherry-pulse_0.6s_ease-in-out]" : ""
                  }
                />
              </svg>

              {/* Cherry inputs */}
              <div className="flex gap-8 -mt-1">
                <CherryInput
                  value={clInput}
                  onChange={setClInput}
                  max={problem.op === "-" ? 18 : 9}
                  wrong={wrongFields.has("cl")}
                  correct={correctFields.has("cl")}
                  disabled={inputDisabled}
                  prefill={subPrefillCL ? 10 : undefined}
                />
                <CherryInput
                  value={crInput}
                  onChange={setCrInput}
                  max={9}
                  wrong={wrongFields.has("cr")}
                  correct={correctFields.has("cr")}
                  disabled={inputDisabled}
                />
              </div>
            </div>
          )}

          {/* Intermediate calculation display */}
          {cherryVisible && (clInput !== null || subPrefillCL) && crInput !== null && (
            <IntermediateCalc
              problem={problem}
              cherryLeft={subPrefillCL ? 10 : clInput}
              cherryRight={crInput}
            />
          )}

          {/* Dot visualization */}
          <div className="border-t border-pink-100 pt-2">
            <DotVisualization
              problem={problem}
              phase={phase === "correct" ? "correct" : phase === "wrong" ? "wrong" : "input"}
              cherryLeftInput={cherryVisible ? (subPrefillCL ? 10 : clInput) : null}
              cherryRightInput={cherryVisible ? crInput : null}
            />
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-xl p-3 text-center ${
                phase === "correct"
                  ? "bg-green-50 border-2 border-green-200"
                  : phase === "wrong" || wrongTargetFlash
                    ? "bg-red-50 border-2 border-red-200"
                    : phase === "select"
                      ? "bg-amber-50 border-2 border-amber-200"
                      : "bg-pink-50 border border-pink-200"
              }`}
            >
              <p className="text-gray-700 text-sm whitespace-pre-line font-bold">
                {message}
              </p>
            </div>
          )}
        </div>

        {/* Action button */}
        <div className="text-center py-3">
          {phase === "correct" ? (
            <button
              onClick={nextProblem}
              className="mc-btn text-lg px-8 py-3"
            >
              つぎのもんだい →
            </button>
          ) : phase === "select" ? (
            <div className="text-pink-400 text-sm font-bold py-3">
              ↑ わける かずを えらんでね
            </div>
          ) : (
            <button
              onClick={handleCheck}
              className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white font-bold text-lg px-8 py-3 rounded-xl shadow-md transition-all active:scale-95"
            >
              こたえあわせ ✓
            </button>
          )}
        </div>
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
