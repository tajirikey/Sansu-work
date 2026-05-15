"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError, playBundle } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

/* ═══════════════════════════════════════════════
   ひっさんビルダー - Learn to write vertical arithmetic
   ═══════════════════════════════════════════════ */

interface HissanProblem {
  a: number;
  b: number;
  op: "+" | "-";
  answer: number;
}

interface LevelDef {
  label: string;
  desc: string;
  generate: () => HissanProblem;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const LEVELS: LevelDef[] = [
  {
    label: "かんたん",
    desc: "2けた + 1けた",
    generate: () => {
      const a = rand(11, 49);
      const b = rand(1, 9 - (a % 10)); // no carry
      return { a, b, op: "+", answer: a + b };
    },
  },
  {
    label: "ふつう",
    desc: "2けた + 2けた",
    generate: () => {
      const a = rand(11, 49);
      const b = rand(10, 50 - a > 10 ? 50 - a : 30);
      // Ensure no carry for this level
      const ao = a % 10, bo = b % 10;
      const b2 = ao + bo >= 10 ? b - bo + Math.max(0, 9 - ao) : b;
      const fb = Math.max(10, b2);
      return { a, b: fb, op: "+", answer: a + fb };
    },
  },
  {
    label: "くりあがり",
    desc: "くりあがりあり",
    generate: () => {
      const a = rand(15, 67);
      const ao = a % 10;
      const bo = rand(10 - ao, 9); // force carry in ones
      const bt = rand(0, Math.min(9, 9 - Math.floor(a / 10)));
      const b = bt * 10 + bo;
      const fb = Math.max(1, b);
      return { a, b: fb, op: "+", answer: a + fb };
    },
  },
  {
    label: "ひきざん",
    desc: "2けた − 2けた",
    generate: () => {
      const a = rand(30, 99);
      const b = rand(11, a - 1);
      return { a, b, op: "-", answer: a - b };
    },
  },
];

// Decompose number into digit array (hundreds, tens, ones) - right aligned
function digits(n: number, width: number): (number | null)[] {
  const s = String(Math.abs(n));
  const result: (number | null)[] = [];
  for (let i = 0; i < width - s.length; i++) result.push(null);
  for (const ch of s) result.push(parseInt(ch));
  return result;
}

// Expected grid layout (cols = max digits + 1 for operator)
// Row 0: [blank, ...digits of a]
// Row 1: [op,    ...digits of b]
// Row 2: [line across all]
// Row 3: [blank, ...digits of answer]
function buildExpected(p: HissanProblem) {
  const maxLen = Math.max(String(p.a).length, String(p.b).length, String(p.answer).length);
  const cols = maxLen + 1; // +1 for operator column

  const dA = digits(p.a, maxLen);
  const dB = digits(p.b, maxLen);
  const dAns = digits(p.answer, maxLen);

  // cells[row][col] = expected value
  const cells: (string | null)[][] = [];

  // Row 0: upper number
  const row0: (string | null)[] = [null]; // operator column blank
  for (const d of dA) row0.push(d !== null ? String(d) : null);
  cells.push(row0);

  // Row 1: operator + lower number
  const row1: (string | null)[] = [p.op];
  for (const d of dB) row1.push(d !== null ? String(d) : null);
  cells.push(row1);

  // Row 2: answer
  const row2: (string | null)[] = [null];
  for (const d of dAns) row2.push(d !== null ? String(d) : null);
  cells.push(row2);

  return { cells, cols, rows: 3 };
}

type Phase = "build" | "answer" | "correct" | "wrong";

// Which cells are "buildable" vs auto-filled depending on step
// Phase "build": user fills rows 0 and 1
// Phase "answer": rows 0,1 locked, user fills row 2
function getCellState(
  row: number,
  col: number,
  phase: Phase,
  expected: (string | null)[][],
  userGrid: (string | null)[][],
  showGuide: boolean,
): {
  editable: boolean;
  expected: string | null;
  current: string | null;
  guide: string | null;
} {
  const exp = expected[row]?.[col] ?? null;
  const cur = userGrid[row]?.[col] ?? null;

  if (exp === null) {
    return { editable: false, expected: null, current: null, guide: null };
  }

  if (phase === "build") {
    if (row <= 1) {
      return { editable: true, expected: exp, current: cur, guide: showGuide ? exp : null };
    }
    return { editable: false, expected: exp, current: null, guide: null };
  }

  if (phase === "answer") {
    if (row <= 1) {
      return { editable: false, expected: exp, current: exp, guide: null };
    }
    return { editable: true, expected: exp, current: cur, guide: null };
  }

  // correct / wrong
  return { editable: false, expected: exp, current: cur ?? exp, guide: null };
}

export default function HissanPage() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [problem, setProblem] = useState<HissanProblem | null>(null);
  const [phase, setPhase] = useState<"select" | Phase>("select");
  const [userGrid, setUserGrid] = useState<(string | null)[][]>([]);
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [message, setMessage] = useState("");
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const wrongCount = useRef(0);

  const expected = problem ? buildExpected(problem) : null;

  const startWithLevel = (idx: number) => {
    setLevelIdx(idx);
    const p = LEVELS[idx].generate();
    setProblem(p);
    const exp = buildExpected(p);
    setUserGrid(exp.cells.map((row) => row.map(() => null)));
    setPhase("build");
    setActiveCell(null);
    setMessage("うえの かずを マスに いれよう！");
    setWrongCells(new Set());
    wrongCount.current = 0;
  };

  const handleCellTap = useCallback((row: number, col: number) => {
    if (!expected || (phase !== "build" && phase !== "answer")) return;
    const state = getCellState(row, col, phase as Phase, expected.cells, userGrid, showGuide);
    if (!state.editable || state.expected === null) return;
    // If already correct, skip
    if (state.current === state.expected) return;
    playPop();
    setActiveCell([row, col]);
  }, [expected, phase, userGrid, showGuide]);

  const handleNumPad = useCallback((num: string) => {
    if (!activeCell || !expected) return;
    const [row, col] = activeCell;
    const state = getCellState(row, col, phase as Phase, expected.cells, userGrid, showGuide);
    if (!state.editable) return;

    if (num === state.expected) {
      playSuccess();
      const newGrid = userGrid.map((r) => [...r]);
      newGrid[row][col] = num;
      setUserGrid(newGrid);
      setWrongCells((prev) => { const s = new Set(prev); s.delete(`${row}-${col}`); return s; });

      // Auto-advance to next empty editable cell
      const nextCell = findNextEmpty(row, col, phase as Phase, expected.cells, newGrid, showGuide);
      setActiveCell(nextCell);

      // Check if current phase is complete
      if (!nextCell) {
        if (phase === "build") {
          setPhase("answer");
          setMessage("こたえを いれよう！");
          // Reset grid row 2
          const gridWithAnswer = newGrid.map((r) => [...r]);
          // Find first editable cell in answer row
          const firstAns = findNextEmpty(-1, -1, "answer", expected.cells, gridWithAnswer, showGuide);
          setActiveCell(firstAns);
        } else if (phase === "answer") {
          // All done!
          playBundle();
          setPhase("correct");
          setMessage("せいかい！ ひっさん かんぺき！");
          setScore((s) => s + 10);
          setStreak((s) => {
            const ns = s + 1;
            if (ns > 0 && ns % 3 === 0) setTimeout(() => setShowReward(true), 800);
            return ns;
          });
        }
      }
    } else {
      playError();
      setWrongCells((prev) => new Set(prev).add(`${row}-${col}`));
      wrongCount.current++;
      if (wrongCount.current >= 3 && showGuide) {
        setMessage("ヒント: うすい すうじを みてみよう！");
      }
    }
  }, [activeCell, expected, phase, userGrid, showGuide]);

  const handleOpPad = useCallback((op: string) => {
    handleNumPad(op);
  }, [handleNumPad]);

  const next = useCallback(() => {
    if (!problem) return;
    const p = LEVELS[levelIdx].generate();
    setProblem(p);
    const exp = buildExpected(p);
    setUserGrid(exp.cells.map((row) => row.map(() => null)));
    setPhase("build");
    setActiveCell(null);
    setMessage("うえの かずを マスに いれよう！");
    setWrongCells(new Set());
    wrongCount.current = 0;
  }, [levelIdx, problem]);

  if (!expected || !problem) {
    // Level select
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-sky-50 to-blue-50 p-3 flex flex-col touch-manipulation" style={{ overflow: "hidden" }}>
        <div className="max-w-lg mx-auto w-full flex flex-col h-full">
          <div className="flex items-center justify-between mb-1 flex-shrink-0">
            <Link href="/" className="text-sky-700 text-sm hover:underline">&larr; もどる</Link>
            <span className="text-sky-600 text-sm font-bold">ひっさんビルダー</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-5xl mb-3">📝</p>
              <h2 className="text-2xl font-bold text-sky-700 mb-2">ひっさんビルダー</h2>
              <p className="text-gray-500 text-sm">しきを ひっさんの かたちに しよう！</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {LEVELS.map((lv, i) => (
                <button
                  key={i}
                  onClick={() => startWithLevel(i)}
                  className="px-4 py-3 rounded-xl font-bold transition-all bg-white border-2 border-sky-200 text-sky-600 active:scale-95 hover:border-sky-400 shadow-sm"
                >
                  <span className="block text-sm">{lv.label}</span>
                  <span className="block text-[10px] opacity-60 mt-0.5">{lv.desc}</span>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-500">
              <input
                type="checkbox"
                checked={showGuide}
                onChange={(e) => setShowGuide(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              ガイド（うすもじ）ひょうじ
            </label>
          </div>
        </div>
      </div>
    );
  }

  const { cells, cols } = expected;
  const phaseBuild = phase === "build" || phase === "answer";

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-50 to-blue-50 p-3 flex flex-col touch-manipulation" style={{ overflow: "hidden" }}>
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1 flex-shrink-0">
          <Link href="/" className="text-sky-700 text-sm hover:underline">&larr; もどる</Link>
          <span className="text-sky-600 text-sm font-bold">ひっさんビルダー</span>
        </div>

        {/* Stats */}
        <div className="bg-white/90 border border-sky-200 rounded-2xl p-2 mb-2 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between text-center">
            <div>
              <p className="text-gray-400 text-[10px]">スコア</p>
              <p className="text-sky-600 font-bold text-base leading-tight">{score}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px]">れんぞく</p>
              <p className="text-orange-500 font-bold text-base leading-tight">{streak}</p>
            </div>
            <div>
              <button onClick={() => { setProblem(null); setPhase("select"); }} className="text-gray-400 text-[10px] underline">
                レベルへんこう
              </button>
              <p className="text-purple-600 font-bold text-xs">{LEVELS[levelIdx].label}</p>
            </div>
          </div>
        </div>

        {/* Horizontal equation */}
        <div className="bg-white/90 border-2 border-sky-200 rounded-2xl p-3 mb-2 shadow-md text-center flex-shrink-0">
          <p className="text-gray-400 text-[10px] mb-1">この しきを ひっさんに しよう</p>
          <p className="text-3xl font-black text-sky-700 tracking-wider">
            {problem.a} {problem.op} {problem.b} = <span className="text-sky-300">？</span>
          </p>
        </div>

        {/* Hissan grid */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-0">
          <div className="flex flex-col items-center gap-0">
            {cells.map((row, ri) => (
              <div key={ri}>
                <div className="flex">
                  {row.map((_, ci) => {
                    const state = getCellState(ri, ci, phase as Phase, cells, userGrid, showGuide);
                    const isActive = activeCell?.[0] === ri && activeCell?.[1] === ci;
                    const isWrong = wrongCells.has(`${ri}-${ci}`);
                    const isFilled = state.current !== null && state.current === state.expected;
                    const isEmpty = state.expected !== null && state.current === null;

                    if (state.expected === null) {
                      return <div key={ci} className="w-14 h-14 md:w-16 md:h-16" />;
                    }

                    return (
                      <button
                        key={ci}
                        onClick={() => handleCellTap(ri, ci)}
                        className={`w-14 h-14 md:w-16 md:h-16 border-2 flex items-center justify-center text-2xl md:text-3xl font-black transition-all select-none touch-manipulation
                          ${isActive
                            ? "border-sky-400 bg-sky-100 scale-105 shadow-md"
                            : isWrong
                              ? "border-red-400 bg-red-50 animate-shake"
                              : isFilled
                                ? "border-green-300 bg-green-50"
                                : isEmpty && state.editable
                                  ? "border-dashed border-gray-300 bg-white hover:bg-sky-50 cursor-pointer"
                                  : "border-gray-200 bg-gray-50"
                          }
                        `}
                      >
                        {isFilled ? (
                          <span className="text-gray-800">{state.current}</span>
                        ) : state.guide && !isFilled ? (
                          <span className="text-gray-200">{state.guide}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {/* Line between row 1 and row 2 */}
                {ri === 1 && (
                  <div className="flex">
                    {row.map((_, ci) => (
                      <div key={ci} className="w-14 md:w-16 h-1 bg-gray-700" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Message */}
          {message && (
            <p className={`text-center text-sm font-bold ${
              phase === "correct" ? "text-green-600 animate-bounce" : phase === "wrong" ? "text-red-500" : "text-sky-600"
            }`}>
              {phase === "correct" && "⭕ "}{message}
            </p>
          )}

          {/* Phase indicator */}
          {phaseBuild && (
            <div className="flex gap-2 justify-center">
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${phase === "build" ? "bg-sky-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                1. ならべる
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${phase === "answer" ? "bg-sky-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                2. こたえ
              </span>
            </div>
          )}
        </div>

        {/* Tap to continue or numpad */}
        {phase === "correct" ? (
          <>
            <div className="fixed inset-0 z-40" onClick={next} />
            <p className="text-center text-gray-400 text-sm animate-pulse py-2 relative z-50 flex-shrink-0">タップして つぎへ</p>
          </>
        ) : phaseBuild ? (
          /* Number pad */
          <div className="flex-shrink-0 pb-1">
            <div className="grid grid-cols-6 gap-1.5 max-w-xs mx-auto">
              {["1","2","3","4","5","6","7","8","9","0","+","−"].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    if (n === "+" || n === "−") handleOpPad(n === "−" ? "-" : "+");
                    else handleNumPad(n);
                  }}
                  disabled={!activeCell}
                  className={`h-11 rounded-xl font-black text-xl transition-all active:scale-90 select-none touch-manipulation disabled:opacity-30
                    ${n === "+" || n === "−"
                      ? "bg-orange-100 border-2 border-orange-300 text-orange-600"
                      : "bg-white border-2 border-sky-200 text-sky-700 shadow-sm"
                    }
                  `}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}

// Find next empty editable cell scanning left-to-right, top-to-bottom
function findNextEmpty(
  fromRow: number,
  fromCol: number,
  phase: Phase,
  expected: (string | null)[][],
  userGrid: (string | null)[][],
  showGuide: boolean,
): [number, number] | null {
  const rows = expected.length;
  const cols = expected[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r < fromRow || (r === fromRow && c <= fromCol)) continue;
      const state = getCellState(r, c, phase, expected, userGrid, showGuide);
      if (state.editable && state.expected !== null && (userGrid[r]?.[c] ?? null) !== state.expected) {
        return [r, c];
      }
    }
  }
  // Wrap around from start
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const state = getCellState(r, c, phase, expected, userGrid, showGuide);
      if (state.editable && state.expected !== null && (userGrid[r]?.[c] ?? null) !== state.expected) {
        return [r, c];
      }
    }
  }
  return null;
}
