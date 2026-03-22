"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { playPop, playSuccess, playError, playBundle } from "@/lib/sounds";
import RewardModal from "@/components/RewardModal";

/* ═══════════════════════════════════════════════
   10のペアさがし - Find pairs that make 10
   ═══════════════════════════════════════════════ */

interface Card {
  id: number;
  value: number;
  matched: boolean;
  selected: boolean;
  wrong: boolean;
}

let nextId = 0;

function generateCards(count: number, existing?: Card[]): Card[] {
  const cards: Card[] = [];
  const pairCount = Math.floor(count / 2);
  const activeValues = existing
    ? existing.filter((c) => !c.matched).map((c) => c.value)
    : [];

  for (let i = 0; i < pairCount; i++) {
    let a: number;
    let attempts = 0;
    do {
      a = Math.floor(Math.random() * 8) + 1;
      attempts++;
    } while (
      attempts < 20 &&
      activeValues.concat(cards.map((c) => c.value)).filter((v) => v === a).length >= 2
    );
    const b = 10 - a;
    cards.push({ id: nextId++, value: a, matched: false, selected: false, wrong: false });
    cards.push({ id: nextId++, value: b, matched: false, selected: false, wrong: false });
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function refillCards(cards: Card[]): Card[] {
  const active = cards.filter((c) => !c.matched);
  const activeValues = active.map((c) => c.value);
  return cards.map((c) => {
    if (c.matched) {
      let a: number;
      let attempts = 0;
      do {
        a = Math.floor(Math.random() * 8) + 1;
        attempts++;
      } while (attempts < 20 && activeValues.filter((v) => v === a).length >= 2);
      activeValues.push(a);
      return { ...c, value: a, matched: false, selected: false, wrong: false, id: nextId++ };
    }
    return c;
  });
}

function hasValidPair(cards: Card[]): boolean {
  const active = cards.filter((c) => !c.matched);
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      if (active[i].value + active[j].value === 10) return true;
    }
  }
  return false;
}

const LEVELS = [
  { label: "かんたん", time: 60, desc: "60びょう" },
  { label: "ふつう", time: 45, desc: "45びょう" },
  { label: "むずかしい", time: 30, desc: "30びょう" },
];

export default function PairTenPage() {
  const [cards, setCards] = useState<Card[]>(() => generateCards(8));
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [levelIdx, setLevelIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<"ready" | "playing" | "done">("ready");
  const [showReward, setShowReward] = useState(false);
  const [message, setMessage] = useState("");
  const [pairsFound, setPairsFound] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { setGameState("done"); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
    if (timeLeft <= 0 && gameState === "playing") setGameState("done");
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === "done") {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pairsFound >= 3) {
        setMessage(`おしまい！ ${pairsFound}ペア みつけたよ！`);
        setTimeout(() => setShowReward(true), 800);
      } else {
        setMessage(`${pairsFound}ペア みつけたよ。つぎは もっとできるよ！`);
      }
    }
  }, [gameState, pairsFound]);

  const startGame = () => {
    nextId = 0;
    setCards(generateCards(8));
    setSelected([]);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setTimeLeft(LEVELS[levelIdx].time);
    setPairsFound(0);
    setMessage("");
    setGameState("playing");
    setShowReward(false);
  };

  const handleCardTap = useCallback((cardId: number) => {
    if (gameState !== "playing" || lockRef.current) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.matched || card.selected) return;
    playPop();

    if (selected.length === 0) {
      setSelected([cardId]);
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, selected: true } : c)));
    } else if (selected.length === 1) {
      lockRef.current = true;
      const firstId = selected[0];
      const firstCard = cards.find((c) => c.id === firstId)!;
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, selected: true } : c)));

      if (firstCard.value + card.value === 10) {
        setTimeout(() => {
          playBundle();
          setCombo((c) => { const nc = c + 1; setBestCombo((b) => Math.max(b, nc)); return nc; });
          const comboBonus = combo >= 2 ? combo : 0;
          setScore((s) => s + 10 + comboBonus * 5);
          setPairsFound((p) => p + 1);
          setCards((prev) => {
            const updated = prev.map((c) =>
              c.id === firstId || c.id === cardId ? { ...c, matched: true, selected: false } : c,
            );
            setTimeout(() => {
              setCards((curr) => {
                const refilled = refillCards(curr);
                if (!hasValidPair(refilled)) return generateCards(8);
                return refilled;
              });
            }, 400);
            return updated;
          });
          setSelected([]);
          lockRef.current = false;
        }, 200);
      } else {
        setTimeout(() => {
          playError();
          setCombo(0);
          setCards((prev) => prev.map((c) =>
            c.id === firstId || c.id === cardId ? { ...c, wrong: true } : c,
          ));
          setTimeout(() => {
            setCards((prev) => prev.map((c) => ({ ...c, selected: false, wrong: false })));
            setSelected([]);
            lockRef.current = false;
          }, 400);
        }, 200);
      }
    }
  }, [gameState, cards, selected, combo]);

  const maxTime = LEVELS[levelIdx].time;

  return (
    <div
      className="fixed inset-0 bg-gradient-to-b from-cyan-50 to-amber-50 p-3 flex flex-col touch-manipulation"
      style={{ overflow: "hidden", WebkitOverflowScrolling: "auto" }}
    >
      <div className="max-w-lg mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1 flex-shrink-0">
          <Link href="/" className="text-cyan-700 text-sm hover:underline">
            &larr; もどる
          </Link>
          <span className="text-cyan-600 text-sm font-bold">10のペアさがし</span>
        </div>

        {/* Score / Timer bar */}
        <div className="bg-white/90 border border-cyan-200 rounded-2xl p-2 mb-2 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-700 font-bold text-lg leading-tight">{score}<span className="text-xs text-gray-400 ml-1">てん</span></p>
              {combo >= 2 && (
                <p className="text-orange-500 text-xs font-bold animate-bounce">{combo}コンボ！</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-[10px]">みつけた</p>
              <p className="text-cyan-600 font-bold text-lg leading-tight">{pairsFound}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold text-2xl tabular-nums leading-tight ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-700"}`}>
                {timeLeft}<span className="text-xs text-gray-400 ml-0.5">びょう</span>
              </p>
            </div>
          </div>
          {gameState === "playing" && (
            <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-cyan-400 to-cyan-600"
                style={{ width: `${(timeLeft / maxTime) * 100}%` }}
              />
            </div>
          )}
        </div>

        {gameState === "ready" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-5xl mb-3">🔟</p>
              <h2 className="text-2xl font-bold text-cyan-700 mb-2">10のペアさがし</h2>
              <p className="text-gray-500 text-sm">
                あわせて <span className="font-bold text-cyan-600">10</span> になる ペアを みつけよう！
              </p>
            </div>

            {/* Level selector */}
            <div className="flex gap-2">
              {LEVELS.map((lv, i) => (
                <button
                  key={i}
                  onClick={() => setLevelIdx(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    levelIdx === i
                      ? "bg-cyan-500 text-white shadow-md scale-105"
                      : "bg-white border-2 border-cyan-200 text-cyan-600 active:scale-95"
                  }`}
                >
                  <span className="block">{lv.label}</span>
                  <span className="block text-[10px] opacity-70">{lv.desc}</span>
                </button>
              ))}
            </div>

            <button onClick={startGame} className="mc-btn text-lg px-10 py-4">
              スタート！
            </button>
          </div>
        ) : gameState === "done" ? (
          /* Results - tap anywhere to go back */
          <div
            className="flex-1 flex flex-col items-center justify-center gap-4 cursor-pointer"
            onClick={() => setGameState("ready")}
          >
            <div className="bg-white/90 rounded-2xl p-6 border-2 border-cyan-200 shadow-md text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-cyan-700 font-bold text-xl mb-3">{message}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-gray-400 text-[10px]">スコア</p>
                  <p className="text-cyan-600 font-bold text-xl">{score}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">ペア</p>
                  <p className="text-cyan-600 font-bold text-xl">{pairsFound}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">さいだいコンボ</p>
                  <p className="text-orange-500 font-bold text-xl">{bestCombo}</p>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm animate-pulse">タップして もどる</p>
          </div>
        ) : (
          /* Game board */
          <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-0">
            <p className="text-center text-sm text-gray-500 font-bold flex-shrink-0">
              あわせて <span className="text-cyan-600 text-lg">10</span> になる ペアを タップ！
            </p>

            {/* Card grid: 4x2, compact and centered */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-sm flex-shrink-0">
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardTap(card.id)}
                  disabled={card.matched}
                  className={`aspect-[4/3] rounded-2xl text-4xl font-black transition-all select-none touch-manipulation
                    ${card.matched
                      ? "opacity-0 scale-75"
                      : card.wrong
                        ? "bg-red-100 border-3 border-red-400 text-red-500 animate-shake scale-95"
                        : card.selected
                          ? "bg-cyan-100 border-3 border-cyan-400 text-cyan-700 scale-105 shadow-lg"
                          : "bg-white border-3 border-gray-200 text-gray-700 shadow-md active:scale-95 hover:border-cyan-300"
                    }
                  `}
                >
                  {!card.matched && card.value}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <RewardModal show={showReward} onClose={() => setShowReward(false)} />
    </div>
  );
}
