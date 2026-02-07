"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GameStatus = "idle" | "running" | "finished";

type StatusPayload = {
  timeLeft: number;
  status: GameStatus;
  score: number;
  misses: number;
};

const GAME_DURATION_MS = 30000;
const GRID_SIZE = 36;

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ".split("");
const NUMBERS = "23456789".split("");
const SHAPES = ["circle", "square", "triangle", "diamond", "star", "hexagon"] as const;

type ShapeName = (typeof SHAPES)[number];
type CellKind = "letter" | "number" | "shape";
type Cell = { kind: CellKind; value: string };

const getRandom = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const buildPool = (): Cell[] => [
  ...LETTERS.map((value): Cell => ({ kind: "letter", value })),
  ...NUMBERS.map((value): Cell => ({ kind: "number", value })),
  ...SHAPES.map((value): Cell => ({ kind: "shape", value })),
];

export default function SpottingGameClient() {
  const [statusPayload, setStatusPayload] = useState<StatusPayload>({
    timeLeft: GAME_DURATION_MS / 1000,
    status: "idle",
    score: 0,
    misses: 0,
  });
  const [target, setTarget] = useState<Cell>(getRandom(buildPool()));
  const [grid, setGrid] = useState<Cell[]>(() => generateGrid(target));
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const accuracy = useMemo(() => {
    const total = statusPayload.score + statusPayload.misses;
    if (total === 0) {
      return 100;
    }
    return Math.round((statusPayload.score / total) * 100);
  }, [statusPayload.score, statusPayload.misses]);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const finish = () => {
    stopTimer();
    setStatusPayload((current) => ({ ...current, status: "finished", timeLeft: 0 }));
  };

  const startSession = () => {
    stopTimer();
    const nextTarget = getRandom(buildPool());
    setTarget(nextTarget);
    setGrid(generateGrid(nextTarget));
    setStatusPayload({
      timeLeft: GAME_DURATION_MS / 1000,
      status: "running",
      score: 0,
      misses: 0,
    });
    startTimeRef.current = performance.now();

    timerRef.current = window.setInterval(() => {
      if (startTimeRef.current === null) {
        return;
      }
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
      if (remaining <= 0) {
        finish();
        return;
      }
      setStatusPayload((current) => ({ ...current, timeLeft: remaining / 1000 }));
    }, 100);
  };

  useEffect(() => () => stopTimer(), []);

  const handlePick = (value: Cell) => {
    if (statusPayload.status !== "running") {
      return;
    }

    if (value.kind === target.kind && value.value === target.value) {
      const nextTarget = getRandom(buildPool());
      setTarget(nextTarget);
      setGrid(generateGrid(nextTarget));
      setStatusPayload((current) => ({ ...current, score: current.score + 1 }));
    } else {
      setStatusPayload((current) => ({ ...current, misses: current.misses + 1 }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Spotting Game
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Find The Target Fast
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
          <span className="font-semibold">Score: {statusPayload.score}</span>
          <span>Accuracy: {accuracy}%</span>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {statusPayload.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <div className="font-semibold">Time: {statusPayload.timeLeft.toFixed(1)}s</div>
        <div>Misses: {statusPayload.misses}</div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          <span>Target:</span>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900/70">
            {target.kind === "shape" ? (
              <ShapeIcon name={target.value as ShapeName} />
            ) : (
              <span className="text-xs text-zinc-100">{target.value}</span>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={startSession}
          className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {statusPayload.status === "running" ? "Restart" : "Start 30s"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-950/90 p-4 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-100 shadow-inner sm:grid-cols-6 dark:border-zinc-700">
        {grid.map((cell, index) => (
          <button
            key={`${cell.kind}-${cell.value}-${index}`}
            type="button"
            onClick={() => handlePick(cell)}
            className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/70 px-2 py-4 text-center text-xs transition hover:border-sky-400 hover:text-sky-200 sm:py-3 sm:text-sm"
          >
            {cell.kind === "shape" ? (
              <ShapeIcon name={cell.value as ShapeName} />
            ) : (
              cell.value
            )}
          </button>
        ))}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Spot the target letter, number, or shape among the distractors. Click as fast
        as you can in 30 seconds.
      </p>
    </div>
  );
}

function generateGrid(target: Cell) {
  const pool = buildPool();
  const cells: Cell[] = [];
  const targetIndex = Math.floor(Math.random() * GRID_SIZE);

  for (let i = 0; i < GRID_SIZE; i += 1) {
    if (i === targetIndex) {
      cells.push(target);
      continue;
    }
    let pick = getRandom(pool);
    while (pick.kind === target.kind && pick.value === target.value) {
      pick = getRandom(pool);
    }
    cells.push(pick);
  }

  return cells;
}

function ShapeIcon({ name }: { name: ShapeName }) {
  switch (name) {
    case "circle":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="9" cy="9" r="6" fill="#f8fafc" />
        </svg>
      );
    case "square":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <rect x="4" y="4" width="10" height="10" fill="#f8fafc" />
        </svg>
      );
    case "triangle":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <polygon points="9,3 15,14 3,14" fill="#f8fafc" />
        </svg>
      );
    case "diamond":
      return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <polygon points="9,2 16,9 9,16 2,9" fill="#f8fafc" />
        </svg>
      );
    case "star":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <polygon
            points="12,2 15,9 22,9 16.5,13.5 18.5,21 12,16.8 5.5,21 7.5,13.5 2,9 9,9"
            fill="#f8fafc"
          />
        </svg>
      );
    case "hexagon":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="7,3 17,3 22,12 17,21 7,21 2,12" fill="#f8fafc" />
        </svg>
      );
    default:
      return null;
  }
}
