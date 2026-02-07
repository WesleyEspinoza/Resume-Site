"use client";

import { useMemo, useState } from "react";

type FlipResult = "heads" | "tails" | null;

type GameStatus = "idle" | "running" | "finished";

type StatusPayload = {
  status: GameStatus;
  streak: number;
  lastFlip: FlipResult;
};

export default function CoinFlipClient() {
  const [statusPayload, setStatusPayload] = useState<StatusPayload>({
    status: "idle",
    streak: 0,
    lastFlip: null,
  });
  const [flipTick, setFlipTick] = useState(0);

  const bestLabel = useMemo(() => {
    if (statusPayload.status === "finished") {
      return "Final streak";
    }
    return "Current streak";
  }, [statusPayload.status]);

  const startGame = () => {
    setFlipTick(0);
    setStatusPayload({ status: "running", streak: 0, lastFlip: null });
  };

  const flipCoin = () => {
    if (statusPayload.status !== "running") {
      return;
    }

    setFlipTick((current) => current + 1);
    const result: FlipResult = Math.random() < 0.5 ? "heads" : "tails";

    if (result === "heads") {
      setStatusPayload((current) => ({
        ...current,
        lastFlip: "heads",
        streak: current.streak + 1,
      }));
      return;
    }

    setStatusPayload((current) => ({
      ...current,
      lastFlip: "tails",
      status: "finished",
    }));
  };

  const resetGame = () => {
    setFlipTick(0);
    setStatusPayload({ status: "idle", streak: 0, lastFlip: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Coin Flip
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Heads Streak Challenge
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
          <span className="font-semibold">{bestLabel}: {statusPayload.streak}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {statusPayload.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Flip the coin and see how long your heads streak lasts. The game ends on the first tails.
        </p>
        {statusPayload.status === "idle" ? (
          <button
            type="button"
            onClick={startGame}
            className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start
          </button>
        ) : statusPayload.status === "running" ? (
          <button
            type="button"
            onClick={flipCoin}
            className="ml-auto rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-emerald-400"
          >
            Flip
          </button>
        ) : (
          <button
            type="button"
            onClick={resetGame}
            className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Play again
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-950/90 p-8 text-center shadow-inner dark:border-zinc-700">
        <div
          key={flipTick}
          className="coin-face mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-zinc-700 bg-zinc-900 text-center text-2xl font-bold uppercase tracking-[0.2em] text-zinc-100"
        >
          {statusPayload.lastFlip ?? "?"}
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          {statusPayload.lastFlip ? `Last flip: ${statusPayload.lastFlip}` : "Flip to start your streak."}
        </p>
      </div>
      <style jsx>{`
        .coin-face {
          animation: coin-flip 420ms ease-out;
          transform-style: preserve-3d;
        }

        @keyframes coin-flip {
          0% {
            transform: rotateY(0deg) scale(1);
          }
          40% {
            transform: rotateY(140deg) scale(1.05);
          }
          70% {
            transform: rotateY(280deg) scale(1.02);
          }
          100% {
            transform: rotateY(360deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
