"use client";

import { useEffect, useRef, useState } from "react";
import type * as PhaserType from "phaser";

type GameStatus = "idle" | "running" | "finished";

type StatusPayload = {
  score: number;
  status: GameStatus;
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 520;

const PIPE_WIDTH = 72;
const PIPE_GAP = 140;
const MIN_GAP = 170;
const GAP_EDGE_PADDING = 60;
const PIPE_SPEED = 320;
const PIPE_SPAWN_MS = 950;
const GRAVITY = 1100;
const FLAP_VELOCITY = -300;

type FlappyBirdClientProps = {
  autoStart?: boolean;
};

export default function FlappyBirdClient({ autoStart = false }: FlappyBirdClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusPayload, setStatusPayload] = useState<StatusPayload>({
    score: 0,
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

      class FlappyScene extends PhaserModule.Scene {
        private score = 0;
        private active = true;
        private bird?: PhaserType.GameObjects.Arc;
        private birdBody?: PhaserType.Physics.Arcade.Body;
        private pipes?: PhaserType.Physics.Arcade.Group;
        private pipePairs: {
          top: PhaserType.GameObjects.Rectangle;
          bottom: PhaserType.GameObjects.Rectangle;
          passed: boolean;
        }[] = [];
        private lastPipeAt = 0;
        private pointerHandler?: () => void;
        private keyHandler?: () => void;

        create() {
          this.score = 0;
          this.active = true;
          this.lastPipeAt = this.time.now;
          this.input.enabled = true;
          emitter?.emit("status", "running");
          emitter?.emit("score", this.score);

          this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

          this.bird = this.add.circle(GAME_WIDTH * 0.28, GAME_HEIGHT * 0.5, 16, 0xfbbf24);
          this.bird.setStrokeStyle(2, 0xf59e0b, 0.9);
          this.physics.add.existing(this.bird);
          this.birdBody = this.bird.body as PhaserType.Physics.Arcade.Body;
          this.birdBody.setCircle(16);
          this.birdBody.setGravityY(GRAVITY);
          this.birdBody.setVelocity(0, 0);

          this.pipes = this.physics.add.group({
            allowGravity: false,
            immovable: true,
          });

          this.physics.add.collider(this.bird, this.pipes, () => this.finish());

          this.pointerHandler = () => this.flap();
          this.input.on("pointerdown", this.pointerHandler);

          const spaceKey = this.input.keyboard?.addKey(PhaserModule.Input.Keyboard.KeyCodes.SPACE);
          this.keyHandler = () => this.flap();
          spaceKey?.on("down", this.keyHandler);

          this.spawnPipePair();
        }

        update() {
          if (!this.active || !this.bird || !this.birdBody) {
            return;
          }

          const now = this.time.now;
          if (now - this.lastPipeAt >= PIPE_SPAWN_MS) {
            this.spawnPipePair();
            this.lastPipeAt = now;
          }

          this.updatePipes();
          this.checkScore();

          if (this.bird.y < -40 || this.bird.y > GAME_HEIGHT + 40) {
            this.finish();
          }
        }

        private flap() {
          if (!this.active || !this.birdBody) {
            return;
          }
          this.birdBody.setVelocityY(FLAP_VELOCITY);
        }

        private spawnPipePair() {
          if (!this.pipes) {
            return;
          }

          const gapSize = Math.max(PIPE_GAP, MIN_GAP);
          const minCenter = gapSize / 2 + GAP_EDGE_PADDING;
          const maxCenter = GAME_HEIGHT - gapSize / 2 - GAP_EDGE_PADDING;
          const gapCenter = PhaserModule.Math.Between(minCenter, maxCenter);
          const gapTop = gapCenter - gapSize / 2;
          const gapBottom = gapCenter + gapSize / 2;

          const topHeight = Math.max(40, gapTop);
          const bottomHeight = Math.max(40, GAME_HEIGHT - gapBottom);

          const topPipe = this.add.rectangle(GAME_WIDTH + PIPE_WIDTH, topHeight / 2, PIPE_WIDTH, topHeight, 0x38bdf8);
          const bottomPipe = this.add.rectangle(
            GAME_WIDTH + PIPE_WIDTH,
            GAME_HEIGHT - bottomHeight / 2,
            PIPE_WIDTH,
            bottomHeight,
            0x38bdf8
          );
          topPipe.setStrokeStyle(2, 0x0ea5e9, 0.9);
          bottomPipe.setStrokeStyle(2, 0x0ea5e9, 0.9);

          this.pipes.add(topPipe, true);
          this.pipes.add(bottomPipe, true);

          const topBody = topPipe.body as PhaserType.Physics.Arcade.Body;
          const bottomBody = bottomPipe.body as PhaserType.Physics.Arcade.Body;
          topBody.setVelocityX(-PIPE_SPEED);
          bottomBody.setVelocityX(-PIPE_SPEED);

          this.pipePairs.push({ top: topPipe, bottom: bottomPipe, passed: false });
        }

        private updatePipes() {
          this.pipePairs = this.pipePairs.filter((pair) => {
            if (pair.top.x < -PIPE_WIDTH * 1.5) {
              pair.top.destroy();
              pair.bottom.destroy();
              return false;
            }
            return true;
          });
        }

        private checkScore() {
          if (!this.bird) {
            return;
          }

          for (const pair of this.pipePairs) {
            if (!pair.passed && pair.top.x + PIPE_WIDTH / 2 < this.bird.x) {
              pair.passed = true;
              this.score += 1;
              emitter?.emit("score", this.score);
            }
          }
        }

        private finish() {
          if (!this.active) {
            return;
          }
          this.active = false;
          emitter?.emit("status", "finished");
          this.input.enabled = false;
          this.pipes?.setVelocityX(0);
          if (this.pointerHandler) {
            this.input.off("pointerdown", this.pointerHandler);
          }
          this.input.keyboard?.removeAllKeys(true);
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
        scene: new FlappyScene(),
      });

      const handleScore = (value: number) =>
        setStatusPayload((current) => ({ ...current, score: value }));
      const handleStatus = (value: GameStatus) =>
        setStatusPayload((current) => ({ ...current, status: value }));

      emitter.on("score", handleScore);
      emitter.on("status", handleStatus);
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
    setStatusPayload({ score: 0, status: "running" });
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
            Floppy Ball
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Flap Through The Gaps
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
          <span className="font-semibold">Score: {statusPayload.score}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {statusPayload.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Tap or press space to flap. Pass each pipe pair to score.
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
