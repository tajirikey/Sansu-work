"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
      const b = rand(1, 9 - (a % 10));
      return { a, b, op: "+", answer: a + b };
    },
  },
  {
    label: "ふつう",
    desc: "2けた + 2けた",
    generate: () => {
      const a = rand(11, 49);
      const b = rand(10, 50 - a > 10 ? 50 - a : 30);
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
      const bo = rand(10 - ao, 9);
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

function digitsArr(n: number, width: number): (number | null)[] {
  const s = String(Math.abs(n));
  const result: (number | null)[] = [];
  for (let i = 0; i < width - s.length; i++) result.push(null);
  for (const ch of s) result.push(parseInt(ch));
  return result;
}

function buildExpected(p: HissanProblem) {
  const maxLen = Math.max(String(p.a).length, String(p.b).length, String(p.answer).length);
  const cols = maxLen + 1;

  const dA = digitsArr(p.a, maxLen);
  const dB = digitsArr(p.b, maxLen);
  const dAns = digitsArr(p.answer, maxLen);

  const cells: (string | null)[][] = [];

  const row0: (string | null)[] = [null];
  for (const d of dA) row0.push(d !== null ? String(d) : null);
  cells.push(row0);

  const row1: (string | null)[] = [p.op];
  for (const d of dB) row1.push(d !== null ? String(d) : null);
  cells.push(row1);

  const row2: (string | null)[] = [null];
  for (const d of dAns) row2.push(d !== null ? String(d) : null);
  cells.push(row2);

  // Column sums for answer phase (for carry detection)
  // colSums[i] = sum of digits in column i (data columns only, 0-indexed from left after op col)
  const colSums: { digitA: number; digitB: number; col: number }[] = [];
  for (let c = 1; c < cols; c++) {
    const da = dA[c - 1] ?? 0;
    const db = dB[c - 1] ?? 0;
    colSums.push({ digitA: da, digitB: db, col: c });
  }

  return { cells, cols, rows: 3, colSums, maxLen };
}

type Phase = "build" | "answer" | "correct";
type AnswerSubPhase = "column-sum" | "write-digit" | "carry-anim" | "done";

function getCellState(
  row: number, col: number, phase: Phase,
  expected: (string | null)[][],
  userGrid: (string | null)[][],
  showGuide: boolean,
): { editable: boolean; expected: string | null; current: string | null; guide: string | null } {
  const exp = expected[row]?.[col] ?? null;
  const cur = userGrid[row]?.[col] ?? null;

  if (exp === null) return { editable: false, expected: null, current: null, guide: null };

  if (phase === "build") {
    if (row <= 1) return { editable: true, expected: exp, current: cur, guide: showGuide ? exp : null };
    return { editable: false, expected: exp, current: null, guide: null };
  }

  if (phase === "answer") {
    if (row <= 1) return { editable: false, expected: exp, current: exp, guide: null };
    return { editable: false, expected: exp, current: cur, guide: null };
  }

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

  // Answer phase state
  const [ansColIdx, setAnsColIdx] = useState(0); // index into colSums (right-to-left)
  const [ansSubPhase, setAnsSubPhase] = useState<AnswerSubPhase>("column-sum");
  const [carries, setCarries] = useState<number[]>([]); // carry per column position
  const [colSumInput, setColSumInput] = useState(""); // user's 1-or-2 digit sum input
  const [carryAnimCol, setCarryAnimCol] = useState<number | null>(null); // column index animating carry
  const [colSumWrong, setColSumWrong] = useState(false);

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
    setAnsColIdx(0);
    setAnsSubPhase("column-sum");
    setCarries([]);
    setColSumInput("");
    setCarryAnimCol(null);
    setColSumWrong(false);
  };

  // Build phase: cell tap
  const handleCellTap = useCallback((row: number, col: number) => {
    if (!expected || phase !== "build") return;
    const state = getCellState(row, col, "build", expected.cells, userGrid, showGuide);
    if (!state.editable || state.expected === null) return;
    if (state.current === state.expected) return;
    playPop();
    setActiveCell([row, col]);
  }, [expected, phase, userGrid, showGuide]);

  // Build phase: numpad
  const handleBuildInput = useCallback((num: string) => {
    if (!activeCell || !expected || phase !== "build") return;
    const [row, col] = activeCell;
    const state = getCellState(row, col, "build", expected.cells, userGrid, showGuide);
    if (!state.editable) return;

    if (num === state.expected) {
      playSuccess();
      const newGrid = userGrid.map((r) => [...r]);
      newGrid[row][col] = num;
      setUserGrid(newGrid);
      setWrongCells((prev) => { const s = new Set(prev); s.delete(`${row}-${col}`); return s; });

      const nextCell = findNextEmptyBuild(row, col, expected.cells, newGrid, showGuide);
      setActiveCell(nextCell);

      if (!nextCell) {
        // Build phase complete → answer phase
        const exp = buildExpected(problem!);
        const answerCols = exp.colSums.filter((cs) => exp.cells[2][cs.col] !== null);
        setPhase("answer");
        setMessage("いちのくらいから こたえを いれよう！");
        setAnsColIdx(answerCols.length - 1); // start from rightmost (ones)
        setAnsSubPhase("column-sum");
        setCarries(new Array(exp.maxLen).fill(0));
        setColSumInput("");
        setCarryAnimCol(null);
      }
    } else {
      playError();
      setWrongCells((prev) => new Set(prev).add(`${row}-${col}`));
      wrongCount.current++;
      if (wrongCount.current >= 3) {
        setMessage("ヒント: うすい すうじを みてみよう！");
      }
    }
  }, [activeCell, expected, phase, userGrid, showGuide, problem]);

  // Answer phase: compute expected column sum
  const getColInfo = useCallback(() => {
    if (!expected || !problem) return null;
    const answerCols = expected.colSums.filter((cs) => expected.cells[2][cs.col] !== null);
    if (ansColIdx < 0 || ansColIdx >= answerCols.length) return null;
    const cs = answerCols[ansColIdx];
    const carryIn = carries[ansColIdx + 1] || 0; // carry from the column to the right (already processed)

    // For subtraction, carry works differently (borrow)
    let colTotal: number;
    if (problem.op === "+") {
      colTotal = cs.digitA + cs.digitB + carryIn;
    } else {
      // Subtraction: a - b, borrow if needed
      let da = cs.digitA - (carries[ansColIdx + 1] || 0); // borrow already applied
      if (da < cs.digitB) {
        da += 10;
        // There will be a borrow from next column
      }
      colTotal = da - cs.digitB;
      // Actually let's simplify: just check the expected answer digit
    }

    const expectedDigit = expected.cells[2][cs.col];
    const hasCarry = problem.op === "+" && colTotal >= 10;
    const carryOut = hasCarry ? Math.floor(colTotal / 10) : 0;

    return { cs, carryIn, colTotal, hasCarry, carryOut, expectedDigit, colGridIdx: cs.col };
  }, [expected, problem, ansColIdx, carries]);

  // Answer phase: handle column sum input (for carry columns)
  const handleAnswerInput = useCallback((num: string) => {
    if (phase !== "answer" || !expected || !problem) return;
    const info = getColInfo();
    if (!info) return;

    if (ansSubPhase === "column-sum") {
      if (info.hasCarry) {
        // Expecting 2-digit input
        const newInput = colSumInput + num;
        setColSumInput(newInput);
        playPop();

        if (newInput.length === 2) {
          const entered = parseInt(newInput);
          if (entered === info.colTotal) {
            playSuccess();
            // Write ones digit to answer cell
            const onesDigit = String(info.colTotal % 10);
            const newGrid = userGrid.map((r) => [...r]);
            newGrid[2][info.colGridIdx] = onesDigit;
            setUserGrid(newGrid);

            // Trigger carry animation
            setCarryAnimCol(info.colGridIdx);
            setAnsSubPhase("carry-anim");
            setColSumInput("");
            setColSumWrong(false);

            // After animation, set carry and advance
            setTimeout(() => {
              setCarries((prev) => {
                const next = [...prev];
                // carry goes to the column to the left (ansColIdx - 1)
                next[ansColIdx] = info.carryOut;
                return next;
              });
              setCarryAnimCol(null);
              advanceAnswerCol();
            }, 1200);
          } else {
            playError();
            setColSumInput("");
            setColSumWrong(true);
            setTimeout(() => setColSumWrong(false), 600);
          }
        }
      } else {
        // No carry: direct single digit
        playPop();
        if (num === info.expectedDigit) {
          playSuccess();
          const newGrid = userGrid.map((r) => [...r]);
          newGrid[2][info.colGridIdx] = num;
          setUserGrid(newGrid);
          setColSumWrong(false);
          advanceAnswerCol();
        } else {
          playError();
          setColSumWrong(true);
          setTimeout(() => setColSumWrong(false), 600);
        }
      }
    }
  }, [phase, expected, problem, ansSubPhase, colSumInput, userGrid, getColInfo, ansColIdx, carries]);

  const advanceAnswerCol = useCallback(() => {
    if (!expected) return;
    const answerCols = expected.colSums.filter((cs) => expected.cells[2][cs.col] !== null);

    setAnsColIdx((prev) => {
      const next = prev - 1;
      if (next < 0) {
        // All columns done!
        setTimeout(() => {
          playBundle();
          setPhase("correct");
          setMessage("せいかい！ ひっさん かんぺき！");
          setScore((s) => s + 10);
          setStreak((s) => {
            const ns = s + 1;
            if (ns > 0 && ns % 3 === 0) setTimeout(() => setShowReward(true), 800);
            return ns;
          });
        }, 200);
        return prev;
      }
      setAnsSubPhase("column-sum");
      setColSumInput("");

      // Check if next column has carry from this one
      const nextCs = answerCols[next];
      const carryIn = carries[next + 1] || 0;
      // For the message, include carry info
      if (problem!.op === "+") {
        const da = nextCs.digitA;
        const db = nextCs.digitB;
        if (carryIn > 0) {
          setMessage(`つぎは ${da} + ${db} + ${carryIn}(くりあがり)`);
        } else {
          setMessage(`つぎは ${da} + ${db}`);
        }
      } else {
        setMessage("つぎの くらいへ");
      }
      return next;
    });
  }, [expected, carries, problem]);

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
    setAnsColIdx(0);
    setAnsSubPhase("column-sum");
    setCarries([]);
    setColSumInput("");
    setCarryAnimCol(null);
    setColSumWrong(false);
  }, [levelIdx, problem]);

  // Level select screen
  if (!expected || !problem) {
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
                <button key={i} onClick={() => startWithLevel(i)} className="px-4 py-3 rounded-xl font-bold transition-all bg-white border-2 border-sky-200 text-sky-600 active:scale-95 hover:border-sky-400 shadow-sm">
                  <span className="block text-sm">{lv.label}</span>
                  <span className="block text-[10px] opacity-60 mt-0.5">{lv.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { cells, cols, colSums, maxLen } = expected;
  const phaseBuild = phase === "build";
  const phaseAnswer = phase === "answer";
  const answerCols = colSums.filter((cs) => cells[2][cs.col] !== null);
  const currentColInfo = phaseAnswer ? getColInfo() : null;

  // Active answer column grid index
  const activeAnswerGridCol = currentColInfo?.colGridIdx ?? -1;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-50 to-blue-50 p-2 flex flex-col touch-manipulation" style={{ overflow: "hidden" }}>
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header + Stats in one row */}
        <div className="flex items-center justify-between mb-0.5 flex-shrink-0">
          <Link href="/" className="text-sky-700 text-sm hover:underline">&larr; もどる</Link>
          <div className="flex items-center gap-3 text-center">
            <div><span className="text-gray-400 text-[9px]">スコア </span><span className="text-sky-600 font-bold text-sm">{score}</span></div>
            <div><span className="text-gray-400 text-[9px]">れんぞく </span><span className="text-orange-500 font-bold text-sm">{streak}</span></div>
          </div>
          <div className="flex items-center gap-1.5">
            {phaseBuild && (
              <button
                onClick={() => setShowGuide((g) => !g)}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${showGuide ? "bg-sky-100 border-sky-300 text-sky-600" : "bg-gray-100 border-gray-300 text-gray-400"}`}
              >
                ガイド{showGuide ? "ON" : "OFF"}
              </button>
            )}
            <button onClick={() => { setProblem(null); setPhase("select"); }} className="text-gray-400 text-[10px] underline">{LEVELS[levelIdx].label}</button>
          </div>
        </div>

        {/* All content packed together in center */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          {/* Horizontal equation */}
          <div className="bg-white/90 border-2 border-sky-200 rounded-xl px-4 py-1.5 shadow-md text-center flex-shrink-0 mb-1">
            <p className="text-xl font-black text-sky-700 tracking-wider">
              {problem.a} {problem.op} {problem.b} = <span className="text-sky-300">？</span>
            </p>
          </div>

          {/* Hissan grid */}
          <div className="flex flex-col items-center gap-0 relative flex-shrink-0">
            {/* Carry markers row (above row 0) */}
            <div className="flex">
              {cells[0].map((_, ci) => {
                // Show carry marker for this column if carries exist
                const dataColIdx = ci - 1; // data column index (0-based)
                const ansIdx = answerCols.findIndex((ac) => ac.col === ci);
                // carry-in to this column = carry-out from the column to its right (ansIdx + 1)
                const carryVal = ansIdx >= 0 ? (carries[ansIdx + 1] ?? 0) : 0;
                const isAnimating = carryAnimCol !== null && ci === carryAnimCol - 1;
                const showCarry = carryVal > 0 && !isAnimating;

                return (
                  <div key={ci} className="w-12 h-6 flex items-center justify-center relative">
                    {showCarry && (
                      <span className="text-red-500 text-sm font-bold animate-bounce">{carryVal}</span>
                    )}
                    {/* Carry animation: number flying up from below */}
                    {carryAnimCol !== null && ci === carryAnimCol - 1 && (
                      <span className="absolute text-red-500 text-lg font-black animate-[carry-fly-up_1s_ease-out_forwards]">1</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grid rows */}
            {cells.map((row, ri) => (
              <div key={ri}>
                <div className="flex">
                  {row.map((_, ci) => {
                    const state = getCellState(ri, ci, phase as Phase, cells, userGrid, showGuide);
                    const isActive = phaseBuild && activeCell?.[0] === ri && activeCell?.[1] === ci;
                    const isWrong = wrongCells.has(`${ri}-${ci}`);
                    const isFilled = state.current !== null && state.current === state.expected;
                    const isEmpty = state.expected !== null && state.current === null;
                    const isAnswerActive = phaseAnswer && ri === 2 && ci === activeAnswerGridCol && ansSubPhase !== "carry-anim";
                    const isAnswerFilled = phaseAnswer && ri === 2 && userGrid[2]?.[ci] !== null;

                    if (state.expected === null) {
                      return <div key={ci} className="w-12 h-12" />;
                    }

                    return (
                      <button
                        key={ci}
                        onClick={() => phaseBuild ? handleCellTap(ri, ci) : undefined}
                        className={`w-12 h-12 border-2 flex items-center justify-center text-xl font-black transition-all select-none touch-manipulation
                          ${isActive
                            ? "border-sky-400 bg-sky-100 scale-105 shadow-md"
                            : isAnswerActive
                              ? "border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-300"
                              : isWrong
                                ? "border-red-400 bg-red-50 animate-shake"
                                : isFilled || isAnswerFilled
                                  ? "border-green-300 bg-green-50"
                                  : isEmpty && state.editable
                                    ? "border-dashed border-gray-300 bg-white"
                                    : "border-gray-200 bg-gray-50"
                          }
                        `}
                      >
                        {/* Show content */}
                        {(isFilled || (phaseAnswer && ri <= 1)) ? (
                          <span className="text-gray-800">{state.current ?? state.expected}</span>
                        ) : isAnswerFilled ? (
                          <span className="text-green-600">{userGrid[2][ci]}</span>
                        ) : state.guide && !isFilled ? (
                          <span className="text-gray-200">{state.guide}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {ri === 1 && (
                  <div className="flex">
                    {row.map((_, ci) => (
                      <div key={ci} className="w-12 h-0.5 bg-gray-700" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Answer phase: column sum prompt */}
          {phaseAnswer && currentColInfo && ansSubPhase !== "carry-anim" && ansSubPhase !== "done" && (
            <div className={`bg-white/95 border-2 rounded-xl p-2 shadow-md text-center mt-1 transition-all ${colSumWrong ? "border-red-400 animate-shake" : "border-amber-300"}`}>
              {currentColInfo.hasCarry ? (
                <>
                  <p className="text-amber-600 text-xs font-bold mb-0.5">
                    {currentColInfo.cs.digitA} + {currentColInfo.cs.digitB}
                    {currentColInfo.carryIn > 0 && ` + ${currentColInfo.carryIn}`}
                    {" "}= ？
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <div className={`w-9 h-10 rounded-lg border-2 flex items-center justify-center text-xl font-black ${colSumInput.length >= 1 ? "border-amber-400 bg-amber-50 text-amber-700" : "border-dashed border-gray-300"}`}>
                      {colSumInput[0] || ""}
                    </div>
                    <div className={`w-9 h-10 rounded-lg border-2 flex items-center justify-center text-xl font-black ${colSumInput.length >= 2 ? "border-amber-400 bg-amber-50 text-amber-700" : colSumInput.length === 1 ? "border-amber-300 bg-amber-50/50" : "border-dashed border-gray-300"}`}>
                      {colSumInput[1] || ""}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-amber-600 text-sm font-bold">
                  {currentColInfo.cs.digitA}
                  {problem.op === "+" ? " + " : " − "}
                  {currentColInfo.cs.digitB}
                  {currentColInfo.carryIn > 0 && ` + ${currentColInfo.carryIn}`}
                  {" "}= ？
                </p>
              )}
            </div>
          )}

          {/* Carry animation message */}
          {ansSubPhase === "carry-anim" && (
            <p className="text-red-500 text-sm font-bold animate-bounce mt-1">
              くりあがり！ 1を つぎのくらいへ！
            </p>
          )}

          {/* Message */}
          {message && ansSubPhase !== "carry-anim" && (
            <p className={`text-center text-xs font-bold mt-0.5 ${
              phase === "correct" ? "text-green-600 text-sm animate-bounce" : "text-sky-600"
            }`}>
              {phase === "correct" && "⭕ "}{message}
            </p>
          )}

          {/* Phase indicator */}
          {(phaseBuild || phaseAnswer) && (
            <div className="flex gap-2 justify-center mt-0.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${phaseBuild ? "bg-sky-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                1. ならべる
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${phaseAnswer ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                2. こたえ
              </span>
            </div>
          )}

          {/* Numpad or tap-to-continue */}
          {phase === "correct" ? (
            <>
              <div className="fixed inset-0 z-40" onClick={next} />
              <p className="text-center text-gray-400 text-sm animate-pulse py-1 relative z-50">タップして つぎへ</p>
            </>
          ) : (phaseBuild || phaseAnswer) ? (
            <div className="mt-1.5 flex-shrink-0">
              <div className="grid grid-cols-5 gap-1.5 max-w-[280px] mx-auto">
                {(phaseBuild ? ["1","2","3","4","5","6","7","8","9","0","+","−"] : ["1","2","3","4","5","6","7","8","9","0"]).map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      if (phaseBuild) {
                        if (n === "+" || n === "−") handleBuildInput(n === "−" ? "-" : "+");
                        else handleBuildInput(n);
                      } else {
                        handleAnswerInput(n);
                      }
                    }}
                    disabled={phaseBuild ? !activeCell : ansSubPhase === "carry-anim"}
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
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />

      {/* Carry fly animation style */}
      <style jsx global>{`
        @keyframes carry-fly-up {
          0% { opacity: 0; transform: translateY(56px) scale(0.5); }
          30% { opacity: 1; transform: translateY(20px) scale(1.3); }
          60% { opacity: 1; transform: translateY(0px) scale(1.1); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
      `}</style>
    </div>
  );
}

function findNextEmptyBuild(
  fromRow: number, fromCol: number,
  expected: (string | null)[][],
  userGrid: (string | null)[][],
  showGuide: boolean,
): [number, number] | null {
  const rows = 2; // only rows 0 and 1
  const cols = expected[0]?.length ?? 0;

  for (let r = fromRow; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === fromRow && c <= fromCol) continue;
      const state = getCellState(r, c, "build", expected, userGrid, showGuide);
      if (state.editable && state.expected !== null && (userGrid[r]?.[c] ?? null) !== state.expected) {
        return [r, c];
      }
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const state = getCellState(r, c, "build", expected, userGrid, showGuide);
      if (state.editable && state.expected !== null && (userGrid[r]?.[c] ?? null) !== state.expected) {
        return [r, c];
      }
    }
  }
  return null;
}
