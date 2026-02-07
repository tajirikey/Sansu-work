"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import TenBundle from "@/components/TenBundle";
import HundredPlate from "@/components/HundredPlate";
import { playPop, playBundle, playSuccess, playError } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

/* ─── constants ─── */
const COLS = 10;
const CELL = 44; // px per grid cell
const DOT_SIZE = 32;
const DOT_R = DOT_SIZE / 2 + 6; // hit-test radius (generous)

/* ─── helpers ─── */
interface DotState {
  id: number;
  selected: boolean;
  bundled: boolean;
  hiding: boolean; // true during morph-out
}
interface BarState {
  id: number;
  selected: boolean;
  bundledToPlate: boolean;
}

function makeDots(n: number): DotState[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    selected: false,
    bundled: false,
    hiding: false,
  }));
}

function randomTarget(): number {
  // 11–200, biased toward carry-over numbers
  return Math.floor(Math.random() * 190) + 11;
}

function numberToReading(n: number): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  const hN = ["", "ひゃく", "にひゃく"];
  const tN = ["", "じゅう", "にじゅう", "さんじゅう", "よんじゅう", "ごじゅう", "ろくじゅう", "ななじゅう", "はちじゅう", "きゅうじゅう"];
  const oN = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];
  return `${hN[h] || ""}${tN[t]}${oN[o]}`;
}

/* ─── page ─── */
export default function BundlingPage() {
  const [target, setTarget] = useState(() => randomTarget());
  const [dots, setDots] = useState<DotState[]>(() => makeDots(randomTarget()));
  const [bars, setBars] = useState<BarState[]>([]);
  const [plates, setPlates] = useState(0);
  const [message, setMessage] = useState("まるを 10こ えらんで「まとめる！」をおそう");
  const [cleared, setCleared] = useState(false);
  const [showReward, setShowReward] = useState(false);

  // morph animation
  const [morphDots, setMorphDots] = useState<{ x: number; y: number }[]>([]);
  const [morphTarget, setMorphTarget] = useState<{ x: number; y: number } | null>(null);
  const [morphPhase, setMorphPhase] = useState<"idle" | "fly">("idle");
  const isAnimating = morphPhase !== "idle";

  // drag selection
  const gridRef = useRef<HTMLDivElement>(null);
  const bundleAreaRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const lastHit = useRef(-1);

  // initialise with matching target
  useEffect(() => {
    const t = randomTarget();
    setTarget(t);
    setDots(makeDots(t));
  }, []);

  /* ── derived ── */
  const visible = dots.filter((d) => !d.bundled && !d.hiding);
  const selectedCount = visible.filter((d) => d.selected).length;
  const unbundledBars = bars.filter((b) => !b.bundledToPlate);
  const selectedBarCount = unbundledBars.filter((b) => b.selected).length;

  /* ── pointer → dot index ── */
  const hitTest = useCallback(
    (cx: number, cy: number): number => {
      if (!gridRef.current) return -1;
      const rect = gridRef.current.getBoundingClientRect();
      const x = cx - rect.left;
      const y = cy - rect.top;
      const col = Math.floor(x / CELL);
      const row = Math.floor(y / CELL);
      if (col < 0 || col >= COLS || row < 0) return -1;
      const idx = row * COLS + col;
      if (idx < 0 || idx >= visible.length) return -1;
      const ctrX = col * CELL + CELL / 2;
      const ctrY = row * CELL + CELL / 2;
      if (Math.hypot(x - ctrX, y - ctrY) > DOT_R) return -1;
      return idx;
    },
    [visible.length],
  );

  /* ── pointer handlers on grid ── */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (cleared || isAnimating) return;
      dragging.current = true;
      moved.current = false;
      lastHit.current = -1;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [cleared, isAnimating],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || cleared || isAnimating) return;
      moved.current = true;
      const idx = hitTest(e.clientX, e.clientY);
      if (idx >= 0 && idx !== lastHit.current) {
        lastHit.current = idx;
        const dot = visible[idx];
        if (!dot.selected) {
          playPop();
          setDots((prev) =>
            prev.map((d) => (d.id === dot.id ? { ...d, selected: true } : d)),
          );
        }
      }
    },
    [cleared, isAnimating, hitTest, visible],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      // single tap → toggle
      if (!moved.current) {
        const idx = hitTest(e.clientX, e.clientY);
        if (idx >= 0) {
          const dot = visible[idx];
          playPop();
          setDots((prev) =>
            prev.map((d) => (d.id === dot.id ? { ...d, selected: !d.selected } : d)),
          );
        }
      }
      dragging.current = false;
    },
    [hitTest, visible],
  );

  /* ── bundle 10 dots → 1 bar (with morph animation) ── */
  const handleBundleDots = useCallback(() => {
    if (isAnimating || cleared) return;
    const sel = visible.filter((d) => d.selected);
    if (sel.length !== 10) {
      playError();
      setMessage(
        sel.length === 0
          ? "まるを 10こ えらんでね"
          : `いま ${sel.length}こ えらんでるよ。10こ にしよう！`,
      );
      return;
    }

    // --- get screen positions of selected dots ---
    const positions: { x: number; y: number }[] = [];
    if (gridRef.current) {
      sel.forEach((d) => {
        const el = gridRef.current!.querySelector(`[data-did="${d.id}"]`);
        if (el) {
          const r = el.getBoundingClientRect();
          positions.push({ x: r.left, y: r.top });
        }
      });
    }

    // --- target: bundle area ---
    let tx = 0;
    let ty = 0;
    if (bundleAreaRef.current) {
      const r = bundleAreaRef.current.getBoundingClientRect();
      tx = r.left + 12 + unbundledBars.length * 110;
      ty = r.top + 36;
    }

    // hide selected dots
    setDots((prev) =>
      prev.map((d) =>
        sel.find((s) => s.id === d.id) ? { ...d, hiding: true, selected: false } : d,
      ),
    );

    // start animation: dots at original positions
    setMorphDots(positions);
    setMorphTarget({ x: tx, y: ty });
    setMorphPhase("idle");

    // next frame → fly to target
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMorphPhase("fly");
        playBundle();
      });
    });

    // after animation → finalise
    setTimeout(() => {
      setDots((prev) =>
        prev.map((d) =>
          sel.find((s) => s.id === d.id)
            ? { ...d, bundled: true, hiding: false, selected: false }
            : d,
        ),
      );
      setBars((prev) => [
        ...prev,
        { id: Date.now(), selected: false, bundledToPlate: false },
      ]);
      setMorphDots([]);
      setMorphTarget(null);
      setMorphPhase("idle");
      setMessage("10こ まとめて 十のたば にしたよ！");
    }, 650);
  }, [isAnimating, cleared, visible, unbundledBars.length]);

  /* ── bundle 10 bars → 1 plate ── */
  const handleBundleBars = useCallback(() => {
    if (isAnimating || cleared) return;
    const sel = unbundledBars.filter((b) => b.selected);
    if (sel.length !== 10) {
      playError();
      setMessage(
        sel.length === 0
          ? "十のたばを 10こ えらんでね"
          : `いま ${sel.length}こ えらんでるよ。10こ にしよう！`,
      );
      return;
    }
    playBundle();
    setBars((prev) =>
      prev.map((b) =>
        sel.find((s) => s.id === b.id)
          ? { ...b, bundledToPlate: true, selected: false }
          : b,
      ),
    );
    setPlates((p) => p + 1);
    setMessage("十のたば 10こで 百のいた にしたよ！");
  }, [isAnimating, cleared, unbundledBars]);

  /* ── toggle bar selection ── */
  const toggleBar = (barId: number) => {
    if (cleared || isAnimating) return;
    playPop();
    setBars((prev) =>
      prev.map((b) => (b.id === barId ? { ...b, selected: !b.selected } : b)),
    );
  };

  /* ── answer check (user-initiated) ── */
  const handleCheck = () => {
    const onesLeft = dots.filter((d) => !d.bundled).length;
    const tensLeft = bars.filter((b) => !b.bundledToPlate).length;
    const val = plates * 100 + tensLeft * 10 + onesLeft;

    if (val !== target) {
      playError();
      setMessage("かずが あわないよ？ もういちど たしかめてね");
      return;
    }
    if (onesLeft >= 10) {
      playError();
      setMessage("まだ まとめられるよ！ まるを 10こ えらんで まとめよう");
      return;
    }
    if (tensLeft >= 10) {
      playError();
      setMessage("十のたばも まとめられるよ！ 10こ えらんで まとめよう");
      return;
    }
    // correct
    setCleared(true);
    playSuccess();
    setMessage(
      `せいかい！ ${target} は ${plates > 0 ? plates + "百 " : ""}${tensLeft}十 ${onesLeft}一 だね！`,
    );
    setTimeout(() => setShowReward(true), 800);
  };

  /* ── next problem ── */
  const nextProblem = () => {
    const t = randomTarget();
    setTarget(t);
    setDots(makeDots(t));
    setBars([]);
    setPlates(0);
    setCleared(false);
    setShowReward(false);
    setMessage("まるを 10こ えらんで「まとめる！」をおそう");
  };

  /* ── clear selection ── */
  const clearSelection = () => {
    setDots((prev) => prev.map((d) => ({ ...d, selected: false })));
    setBars((prev) => prev.map((b) => ({ ...b, selected: false })));
    setMessage("せんたく クリア！");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-gray-950 p-4 pb-32">
      <div className="max-w-lg mx-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-yellow-400 text-sm hover:underline">
            ← もどる
          </Link>
          <span className="text-green-300 text-sm font-bold">まとめてみよう</span>
        </div>

        {/* target */}
        <div className="text-center mb-3">
          <p className="text-gray-300 text-sm mb-1">このかずを つくろう</p>
          <div className="text-5xl font-bold text-yellow-300">{target}</div>
          <p className="text-gray-400 text-xs mt-1">{numberToReading(target)}</p>
        </div>

        {/* counters */}
        <div className="flex justify-center gap-3 mb-3 text-sm">
          {plates > 0 && (
            <div className="bg-red-900/50 rounded-lg px-3 py-1 border border-red-700">
              <span className="text-red-300">百:</span>{" "}
              <span className="text-white font-bold">{plates}</span>
            </div>
          )}
          <div className="bg-blue-900/50 rounded-lg px-3 py-1 border border-blue-700">
            <span className="text-blue-300">十:</span>{" "}
            <span className="text-white font-bold">{unbundledBars.length}</span>
          </div>
          <div className="bg-green-900/50 rounded-lg px-3 py-1 border border-green-700">
            <span className="text-green-300">一:</span>{" "}
            <span className="text-white font-bold">{visible.length}</span>
          </div>
        </div>

        {/* message */}
        <div className="bg-gray-800/70 rounded-xl p-3 mb-4 text-center">
          <p className="text-white text-sm">{message}</p>
        </div>

        {/* 百 plates area */}
        {plates > 0 && (
          <div className="bg-red-950/40 rounded-xl p-3 mb-3 border border-red-800">
            <p className="text-red-300 text-xs mb-2 font-bold">百のいた</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: plates }).map((_, i) => (
                <HundredPlate key={i} />
              ))}
            </div>
          </div>
        )}

        {/* 十 bars area */}
        <div ref={bundleAreaRef} className="bg-blue-950/40 rounded-xl p-3 mb-3 border border-blue-800 min-h-[80px]">
          <p className="text-blue-300 text-xs mb-2 font-bold">
            十のたば
            {unbundledBars.length >= 10 && (
              <span className="text-yellow-300 ml-2">← 10こ えらんで まとめよう！</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {unbundledBars.map((bar) => (
              <button
                key={bar.id}
                onClick={() => toggleBar(bar.id)}
                className="transition-transform active:scale-95"
              >
                <TenBundle selected={bar.selected} dotSize={12} />
              </button>
            ))}
            {unbundledBars.length === 0 && (
              <p className="text-gray-600 text-xs">まるを 10こ まとめると ここに たばが できるよ</p>
            )}
          </div>
        </div>

        {/* 一 dots grid — drag/tap selection */}
        <div className="bg-green-950/40 rounded-xl p-3 mb-4 border border-green-800">
          <p className="text-green-300 text-xs mb-2 font-bold">
            一のまる
            {selectedCount > 0 && (
              <span className="text-yellow-300 ml-2">えらんだ: {selectedCount}こ</span>
            )}
          </p>

          <div
            ref={gridRef}
            className="relative touch-none select-none"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
              gridAutoRows: `${CELL}px`,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {visible.map((dot) => (
              <div
                key={dot.id}
                data-did={dot.id}
                className="flex items-center justify-center"
              >
                <div
                  className={`rounded-full border-2 transition-all duration-150
                    ${dot.selected
                      ? "bg-yellow-400 border-yellow-200 shadow-lg shadow-yellow-400/40 scale-110"
                      : "bg-green-500 border-green-300"
                    }
                    ${dot.hiding ? "opacity-0 scale-0 transition-all duration-500" : ""}
                  `}
                  style={{ width: DOT_SIZE, height: DOT_SIZE }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* action buttons */}
        {!cleared ? (
          <div className="flex flex-col gap-3 items-center">
            <div className="flex gap-3">
              {/* bundle dots button */}
              <button
                onClick={handleBundleDots}
                disabled={isAnimating || selectedCount === 0}
                className="mc-btn text-base px-6 py-3 disabled:opacity-40 disabled:transform-none"
              >
                まとめる！（{selectedCount}こ）
              </button>
              {/* bundle bars button (only when 10+ bars) */}
              {unbundledBars.length >= 10 && (
                <button
                  onClick={handleBundleBars}
                  disabled={isAnimating || selectedBarCount === 0}
                  className="mc-btn mc-btn-red text-base px-6 py-3 disabled:opacity-40"
                >
                  たばも まとめる！
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearSelection}
                className="text-gray-400 text-sm underline"
              >
                せんたく クリア
              </button>
              <button
                onClick={handleCheck}
                className="mc-btn mc-btn-blue text-base px-8 py-3"
              >
                こたえあわせ ✓
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center animate-slide-up">
            <button onClick={nextProblem} className="mc-btn text-xl px-10 py-4">
              つぎのもんだい →
            </button>
          </div>
        )}
      </div>

      {/* ── morph animation overlay ── */}
      {morphDots.length > 0 && morphTarget && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
          {morphDots.map((pos, i) => {
            const tx = morphTarget.x + (i % 5) * 16;
            const ty = morphTarget.y + Math.floor(i / 5) * 16;
            const flying = morphPhase === "fly";
            return (
              <div
                key={i}
                className="absolute rounded-full bg-green-500 border-2 border-green-300"
                style={{
                  width: flying ? 12 : DOT_SIZE,
                  height: flying ? 12 : DOT_SIZE,
                  left: flying ? tx : pos.x,
                  top: flying ? ty : pos.y,
                  transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            );
          })}
        </div>
      )}

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
