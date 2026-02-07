"use client";

import { useEffect, useRef, useState } from "react";
import type * as PhaserType from "phaser";

type GameStatus = "idle" | "running" | "finished";

type StatusPayload = {
  status: GameStatus;
  result: "win" | "lose" | null;
  strokes: number;
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 520;

const BALL_RADIUS = 14;
const MAX_PULL = 160;
const POWER_SCALE = 5.4;
const STOP_SPEED = 150;
const MISS_GRACE_MS = 2200;

const OBSTACLE_CHANCE = 60;

type HoleInOneClientProps = {
  autoStart?: boolean;
};

export default function HoleInOneClient({ autoStart = false }: HoleInOneClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusPayload, setStatusPayload] = useState<StatusPayload>({
    status: "idle",
    result: null,
    strokes: 0,
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

      class HoleInOneScene extends PhaserModule.Scene {
        private ball?: PhaserType.GameObjects.Arc;
        private ballBody?: PhaserType.Physics.Arcade.Body;
        private cup?: PhaserType.GameObjects.Arc;
        private obstacles?: PhaserType.Physics.Arcade.Group;
        private pointerLine?: PhaserType.GameObjects.Graphics;
        private launched = false;
        private launchedAt = 0;
        private strokes = 0;

        create() {
          this.strokes = 0;
          this.launched = false;
          this.launchedAt = 0;

          this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
          this.pointerLine = this.add.graphics();

          this.spawnRound();

          emitter?.emit("status", "running");
          emitter?.emit("strokes", this.strokes);
        }

        update() {
          if (!this.ball || !this.ballBody) {
            return;
          }

          if (!this.launched) {
            return;
          }

          if (
            this.ball.y < -40 ||
            this.ball.y > GAME_HEIGHT + 40 ||
            this.ball.x < -40 ||
            this.ball.x > GAME_WIDTH + 40
          ) {
            this.finish("lose");
            return;
          }

          if (this.time.now - this.launchedAt > MISS_GRACE_MS) {
            const speed = Math.hypot(this.ballBody.velocity.x, this.ballBody.velocity.y);
            if (speed <= STOP_SPEED) {
              this.finish("lose");
            }
          }
        }

        private spawnRound() {
          this.cleanupRound();

          const startX = PhaserModule.Math.Between(120, 220);
          const startY = PhaserModule.Math.Between(120, GAME_HEIGHT - 120);

          this.ball = this.add.circle(startX, startY, BALL_RADIUS, 0x38bdf8);
          this.ball.setStrokeStyle(2, 0x0ea5e9, 0.9);
          this.physics.add.existing(this.ball);
          this.ballBody = this.ball.body as PhaserType.Physics.Arcade.Body;
          this.ballBody.setCircle(BALL_RADIUS);
          this.ballBody.setCollideWorldBounds(true);
          this.ballBody.setBounce(0.4, 0.4);
          this.ballBody.setAllowGravity(false);
          this.ballBody.setDamping(true);
          this.ballBody.setDrag(0.9998, 0.9998);

          const cupX = PhaserModule.Math.Between(GAME_WIDTH * 0.6, GAME_WIDTH - 120);
          const cupY = PhaserModule.Math.Between(100, GAME_HEIGHT - 100);
          this.cup = this.add.circle(cupX, cupY, 20, 0x0f172a);
          this.cup.setStrokeStyle(3, 0xfbbf24, 0.95);

          this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
          this.maybeSpawnObstacles(cupX, cupY);

          if (this.ball && this.obstacles) {
            this.physics.add.collider(this.ball, this.obstacles);
          }

          this.physics.add.overlap(this.ball, this.cup, () => this.finish("win"));

          this.input.on("pointerdown", this.startDrag, this);
          this.input.on("pointermove", this.updateDrag, this);
          this.input.on("pointerup", this.releaseDrag, this);
        }

        private maybeSpawnObstacles(cupX: number, cupY: number) {
          if (!this.obstacles) {
            return;
          }

          if (PhaserModule.Math.Between(0, 100) < OBSTACLE_CHANCE) {
            const obstacleCount = PhaserModule.Math.Between(1, 3);
            for (let i = 0; i < obstacleCount; i += 1) {
              const x = PhaserModule.Math.Between(GAME_WIDTH * 0.35, GAME_WIDTH * 0.75);
              const y = PhaserModule.Math.Between(80, GAME_HEIGHT - 80);
              if (PhaserModule.Math.Distance.Between(x, y, cupX, cupY) < 80) {
                continue;
              }
              const block = this.add.rectangle(x, y, 70, 20, 0x94a3b8);
              block.setStrokeStyle(2, 0xe2e8f0, 0.9);
              this.physics.add.existing(block);
              this.obstacles.add(block, true);
            }
          }
        }

        private startDrag(pointer: PhaserType.Input.Pointer) {
          if (!this.ball || this.launched) {
            return;
          }
          const dx = pointer.worldX - this.ball.x;
          const dy = pointer.worldY - this.ball.y;
          if (dx * dx + dy * dy > BALL_RADIUS * BALL_RADIUS * 6) {
            return;
          }
          this.ballBody?.setVelocity(0, 0);
        }

        private updateDrag(pointer: PhaserType.Input.Pointer) {
          if (!this.ball || !this.pointerLine || this.launched) {
            return;
          }
          this.pointerLine.clear();
          const pull = this.getPullVector(pointer);
          this.pointerLine.lineStyle(3, 0xfbbf24, 0.9);
          this.pointerLine.beginPath();
          this.pointerLine.moveTo(this.ball.x, this.ball.y);
          this.pointerLine.lineTo(this.ball.x + pull.x, this.ball.y + pull.y);
          this.pointerLine.strokePath();
        }

        private releaseDrag(pointer: PhaserType.Input.Pointer) {
          if (!this.ball || !this.ballBody || this.launched) {
            return;
          }

          const pull = this.getPullVector(pointer);
          if (pull.magnitude < 15) {
            this.pointerLine?.clear();
            return;
          }

          this.launched = true;
          this.launchedAt = this.time.now;
          this.strokes += 1;
          emitter?.emit("strokes", this.strokes);

          this.pointerLine?.clear();
          this.ballBody.setVelocity(-pull.x * POWER_SCALE, -pull.y * POWER_SCALE);
        }

        private getPullVector(pointer: PhaserType.Input.Pointer) {
          if (!this.ball) {
            return { x: 0, y: 0, magnitude: 0 };
          }
          const dx = PhaserModule.Math.Clamp(pointer.worldX - this.ball.x, -MAX_PULL, MAX_PULL);
          const dy = PhaserModule.Math.Clamp(pointer.worldY - this.ball.y, -MAX_PULL, MAX_PULL);
          const magnitude = Math.hypot(dx, dy);
          return { x: dx, y: dy, magnitude };
        }

        private finish(result: "win" | "lose") {
          if (!this.ball || !this.ballBody) {
            return;
          }
          emitter?.emit("result", result);
          emitter?.emit("status", "finished");
          this.launched = false;
          this.input.off("pointerdown", this.startDrag, this);
          this.input.off("pointermove", this.updateDrag, this);
          this.input.off("pointerup", this.releaseDrag, this);
          this.ballBody.setVelocity(0, 0);
        }

        private cleanupRound() {
          this.pointerLine?.clear();
          this.ball?.destroy();
          this.cup?.destroy();
          this.obstacles?.clear(true, true);
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
        scene: new HoleInOneScene(),
      });

      const handleStatus = (value: GameStatus) =>
        setStatusPayload((current) => ({ ...current, status: value }));
      const handleResult = (value: "win" | "lose") =>
        setStatusPayload((current) => ({ ...current, result: value }));
      const handleStrokes = (value: number) =>
        setStatusPayload((current) => ({ ...current, strokes: value }));

      emitter.on("status", handleStatus);
      emitter.on("result", handleResult);
      emitter.on("strokes", handleStrokes);
    };

    setup();

    return () => {
      destroyed = true;
      emitter?.removeAllListeners();
      game?.destroy(true);
      game = null;
    };
  }, [sessionId]);

  const startSession = () => {
    setStatusPayload({ status: "running", result: null, strokes: 0 });
    setSessionId((value) => value + 1);
  };

  useEffect(() => {
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startSession();
    }
  }, [autoStart]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Hole In One
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Pull, Aim, Put It
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
          <span className="font-semibold">Strokes: {statusPayload.strokes}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {statusPayload.status}
          </span>
          {statusPayload.result && (
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              {statusPayload.result}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Pull to set power, release to shoot. Sink it in one stroke or you lose.
        </p>
        <button
          type="button"
          onClick={startSession}
          className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {statusPayload.status === "running" ? "Restart" : "Start"}
        </button>
      </div>

      <div
        ref={containerRef}
        className="h-[60vh] min-h-[320px] max-h-[560px] w-full overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-950/90 shadow-inner touch-none select-none cursor-crosshair dark:border-zinc-700"
      />
    </div>
  );
}
