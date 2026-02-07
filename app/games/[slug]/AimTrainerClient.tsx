"use client";

import { useEffect, useRef, useState } from "react";
import type * as PhaserType from "phaser";

type AimMode = "tracing" | "reaction";
type GameStatus = "idle" | "running" | "finished";

type StatusPayload = {
  score: number;
  timeLeft: number;
  status: GameStatus;
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 520;
const GAME_DURATION_MS = 30000;

type AimTrainerClientProps = {
  initialMode?: AimMode;
  autoStart?: boolean;
};

export default function AimTrainerClient({
  initialMode = "tracing",
  autoStart = false,
}: AimTrainerClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<AimMode>(initialMode);
  const [statusPayload, setStatusPayload] = useState<StatusPayload>({
    score: 0,
    timeLeft: GAME_DURATION_MS / 1000,
    status: "idle",
  });
  const [sessionId, setSessionId] = useState(0);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || sessionId === 0) {
      return;
    }

    let destroyed = false;
    let game: PhaserType.Game | null = null;
    let emitter: PhaserType.Events.EventEmitter | null = null;

    const setup = async () => {
      const PhaserModule = await import("phaser");

      if (destroyed || !containerRef.current) {
        return;
      }

      emitter = new PhaserModule.Events.EventEmitter();

      class AimTrainerScene extends PhaserModule.Scene {
        private score = 0;
        private elapsedMs = 0;
        private active = true;
        private orb?: PhaserType.GameObjects.Arc;
        private orbBody?: PhaserType.Physics.Arcade.Body;
        private nextMoveAt = 0;
        private lastScoreEmit = -1;
        private lastTimeBucket = -1;
        private reactionPointer?: (pointer: PhaserType.Input.Pointer) => void;

        constructor(private sceneMode: AimMode) {
          super("AimTrainerScene");
        }

        create() {
          this.score = 0;
          this.active = true;
          this.elapsedMs = 0;
          this.input.enabled = true;
          this.emitScore();
          this.emitTime();
          emitter?.emit("status", "running");

          this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

          if (this.sceneMode === "tracing") {
            this.setupTracing();
          } else {
            this.setupReaction();
          }
        }

        update(_time: number, delta: number) {
          if (!this.active) {
            return;
          }

          this.elapsedMs += delta;
          const remaining = Math.max(0, GAME_DURATION_MS - this.elapsedMs);
          this.emitTime(remaining);

          if (remaining <= 0) {
            this.finish();
            return;
          }

          if (this.sceneMode === "tracing") {
            this.updateTracing(this.time.now, delta);
          }
        }

        private emitScore() {
          const normalized = Math.max(0, Math.floor(this.score));
          if (normalized !== this.lastScoreEmit) {
            this.lastScoreEmit = normalized;
            emitter?.emit("score", normalized);
          }
        }

        private emitTime(remaining = GAME_DURATION_MS) {
          const bucket = Math.ceil(remaining / 100);
          if (bucket !== this.lastTimeBucket) {
            this.lastTimeBucket = bucket;
            emitter?.emit("time", Math.max(0, remaining / 1000));
          }
        }

        private finish() {
          this.active = false;
          emitter?.emit("status", "finished");
          this.input.enabled = false;
          if (this.reactionPointer) {
            this.input.off("pointerdown", this.reactionPointer);
            this.reactionPointer = undefined;
          }
          if (this.orb) {
            this.orb.setFillStyle(0x475569);
          }
        }

        private setupTracing() {
          const radius = 32;
          const startX = GAME_WIDTH * 0.5;
          const startY = GAME_HEIGHT * 0.5;

          this.orb = this.add.circle(startX, startY, radius, 0x22d3ee);
          this.orb.setStrokeStyle(2, 0x0ea5e9, 0.9);

          this.physics.add.existing(this.orb);
          this.orbBody = this.orb.body as PhaserType.Physics.Arcade.Body;
          this.orbBody.setCircle(radius);
          this.orbBody.setCollideWorldBounds(true);
          this.orbBody.setBounce(1, 1);
          this.setRandomVelocity();
          this.nextMoveAt = this.time.now + 400;
        }

        private updateTracing(now: number, delta: number) {
          if (!this.orb || !this.orbBody) {
            return;
          }

          const pointer = this.input.activePointer;
          const dx = pointer.worldX - this.orb.x;
          const dy = pointer.worldY - this.orb.y;
          const radius = this.orb.displayWidth * 0.5;
          const inside = dx * dx + dy * dy <= radius * radius;

          if (inside) {
            this.score += delta;
            this.emitScore();
          }

          if (now >= this.nextMoveAt) {
            this.setRandomVelocity();
            this.nextMoveAt = now + PhaserModule.Math.Between(250, 600);
          }
        }

        private setRandomVelocity() {
          if (!this.orbBody) {
            return;
          }
          const speed = PhaserModule.Math.Between(180, 260);
          const angle = PhaserModule.Math.FloatBetween(0, Math.PI * 2);
          this.orbBody.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }

        private setupReaction() {
          this.reactionPointer = (pointer: PhaserType.Input.Pointer) => {
            if (!this.active || !this.orb) {
              return;
            }
            const dx = pointer.worldX - this.orb.x;
            const dy = pointer.worldY - this.orb.y;
            const radius = this.orb.displayWidth * 0.5;
            const inside = dx * dx + dy * dy <= radius * radius;

            if (!inside) {
              return;
            }
            this.score += 1;
            this.emitScore();
            this.spawnReactionOrb();
          };

          this.input.on("pointerdown", this.reactionPointer);
          this.spawnReactionOrb();
        }

        private spawnReactionOrb() {
          if (!this.active) {
            return;
          }

          if (this.orb) {
            this.orb.destroy();
          }

          const radius = PhaserModule.Math.Between(18, 54);
          const position = this.getRandomPoint(radius);

          this.orb = this.add.circle(position.x, position.y, radius, 0xf472b6);
          this.orb.setStrokeStyle(2, 0xf9a8d4, 0.95);
        }

        private getRandomPoint(radius: number) {
          const padding = radius + 10;
          return {
            x: PhaserModule.Math.Between(padding, GAME_WIDTH - padding),
            y: PhaserModule.Math.Between(padding, GAME_HEIGHT - padding),
          };
        }
      }

      game = new PhaserModule.Game({
        type: PhaserModule.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent: containerRef.current,
        backgroundColor: "#0b1220",
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scale: {
          mode: PhaserModule.Scale.FIT,
          autoCenter: PhaserModule.Scale.CENTER_BOTH,
        },
        scene: new AimTrainerScene(mode),
      });

      const handleScore = (value: number) =>
        setStatusPayload((current) => ({ ...current, score: value }));
      const handleTime = (value: number) =>
        setStatusPayload((current) => ({ ...current, timeLeft: value }));
      const handleStatus = (value: GameStatus) =>
        setStatusPayload((current) => ({ ...current, status: value }));

      emitter.on("score", handleScore);
      emitter.on("time", handleTime);
      emitter.on("status", handleStatus);
    };

    setup();

    return () => {
      destroyed = true;
      emitter?.removeAllListeners();
      game?.destroy(true);
      game = null;
    };
  }, [mode, sessionId]);

  const startSession = () => {
    setStatusPayload({
      score: 0,
      timeLeft: GAME_DURATION_MS / 1000,
      status: "running",
    });
    setSessionId((value) => value + 1);
  };

  useEffect(() => {
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startSession();
    }
  }, [autoStart]);

  const formattedTime = statusPayload.timeLeft.toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Aim Trainer
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {mode === "tracing" ? "Tracing Mode" : "Reaction Mode"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("tracing")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              mode === "tracing"
                ? "border-sky-500 bg-sky-500 text-white"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
            aria-pressed={mode === "tracing"}
          >
            Tracing
          </button>
          <button
            type="button"
            onClick={() => setMode("reaction")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              mode === "reaction"
                ? "border-pink-500 bg-pink-500 text-white"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            }`}
            aria-pressed={mode === "reaction"}
          >
            Reaction
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <div className="font-semibold">Score: {statusPayload.score}</div>
        <div>Time: {formattedTime}s</div>
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          {statusPayload.status === "finished" ? "Complete" : statusPayload.status}
        </div>
        <button
          type="button"
          onClick={startSession}
          className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {statusPayload.status === "running" ? "Restart" : "Start 30s"}
        </button>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="h-[60vh] min-h-[320px] max-h-[560px] w-full overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-950/90 shadow-inner touch-none select-none cursor-crosshair dark:border-zinc-700"
        />
        {sessionId === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-950/40 text-sm font-semibold uppercase tracking-[0.28em] text-zinc-100">
            Press start
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-300">
        {mode === "tracing" ? (
          <p>
            Keep your cursor on the moving orb. Every millisecond you stay on
            target adds one point.
          </p>
        ) : (
          <p>
            Click each orb as fast as you can. Every hit spawns a new orb in a
            random size and position.
          </p>
        )}
      </div>
    </div>
  );
}
