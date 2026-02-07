"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GameStatus = "idle" | "running" | "finished";

type StatusPayload = {
  timeLeft: number;
  status: GameStatus;
  correct: number;
  total: number;
};

const GAME_DURATION_MS = 30000;

const PHRASES = [
  "build small tools that help people",
  "ship fast learn faster",
  "practice makes reliable",
  "focus on clean and simple",
  "type with calm precision",
  "make it readable and stable",
  "small steps big progress",
  "care about the details",
  "trust the process",
  "steady hands steady code",
];

const pickPhrase = () => PHRASES[Math.floor(Math.random() * PHRASES.length)];

export default function TypingAccuracyClient() {
  const [statusPayload, setStatusPayload] = useState<StatusPayload>({
    timeLeft: GAME_DURATION_MS / 1000,
    status: "idle",
    correct: 0,
    total: 0,
  });
  const [targetText, setTargetText] = useState<string>(() => pickPhrase());
  const [typedText, setTypedText] = useState("");
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accuracy = useMemo(() => {
    if (statusPayload.total === 0) {
      return 100;
    }
    return Math.round((statusPayload.correct / statusPayload.total) * 100);
  }, [statusPayload.correct, statusPayload.total]);

  const evaluate = (text: string, target: string) => {
    let correct = 0;
    const limit = Math.min(text.length, target.length);
    for (let i = 0; i < limit; i += 1) {
      if (text[i] === target[i]) {
        correct += 1;
      }
    }
    return { correct, total: text.length };
  };

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
    const phrase = pickPhrase();
    setTargetText(phrase);
    setTypedText("");
    setStatusPayload({
      timeLeft: GAME_DURATION_MS / 1000,
      status: "running",
      correct: 0,
      total: 0,
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

    requestAnimationFrame(() => inputRef.current?.focus());
  };

  useEffect(() => () => stopTimer(), []);

  const handleChange = (value: string) => {
    if (statusPayload.status !== "running") {
      return;
    }

    if (value.length >= targetText.length - 2) {
      setTargetText((prev) => `${prev} ${pickPhrase()}`);
    }

    setTypedText(value);
    const result = evaluate(value, targetText);
    setStatusPayload((current) => ({ ...current, correct: result.correct, total: result.total }));
  };

  const renderTarget = () => {
    const chars = targetText.split("");
    return chars.map((char, index) => {
      let className = "text-zinc-400";
      if (index < typedText.length) {
        className = typedText[index] === char ? "text-emerald-400" : "text-rose-400";
      }
      return (
        <span key={`${char}-${index}`} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Typing Accuracy
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            30 Second Accuracy Sprint
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
          <span className="font-semibold">Accuracy: {accuracy}%</span>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {statusPayload.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <div className="font-semibold">Time: {statusPayload.timeLeft.toFixed(1)}s</div>
        <div>Correct: {statusPayload.correct}</div>
        <div>Total: {statusPayload.total}</div>
        <button
          type="button"
          onClick={startSession}
          className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {statusPayload.status === "running" ? "Restart" : "Start 30s"}
        </button>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-950/90 p-6 text-lg leading-relaxed shadow-inner dark:border-zinc-700">
        <p className="font-mono text-base sm:text-lg">{renderTarget()}</p>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={(event) => handleChange(event.target.value)}
        disabled={statusPayload.status !== "running"}
        placeholder="Press Start, then type here..."
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="w-full rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-3 text-base text-zinc-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 dark:focus:border-sky-500 dark:focus:ring-sky-900"
      />
    </div>
  );
}
