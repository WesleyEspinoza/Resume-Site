"use client";

import { useEffect, useRef } from "react";
import type * as PhaserType from "phaser";

const WIDTH = 960;
const HEIGHT = 540;

const PLAYER_RADIUS = 6;
const MOVE_SPEED = 260; // px/sec
const SPEED_GROWTH_PER_MIN = 0.35; // 25% faster per minute
const DAMPING = 0.2; // damping when no input

const OBSTACLE_SPAWN_MS = 650;
const SCROLL_BASE = 160;
const SCROLL_GROWTH = 18; // speed increase per minute
const DENSITY_GROWTH = 0.06; // spawn rate increase per minute

type VectorDriftProps = {
  autoStart?: boolean;
};

export default function VectorDrift({ autoStart = false }: VectorDriftProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef(0);

  useEffect(() => {
    if (!autoStart) {
      return;
    }

    let destroyed = false;
    let game: PhaserType.Game | null = null;
    let rafId: number | null = null;

    const setup = async () => {
      const PhaserModule = await import("phaser");

      if (destroyed || !containerRef.current) {
        return;
      }

      const format = (value: number) => {
        if (!Number.isFinite(value)) {
          return "0";
        }
        if (value < 1000) {
          return value.toFixed(0);
        }
        if (value < 1_000_000) {
          return value.toFixed(1);
        }
        return value.toExponential(2).replace("e+", "e");
      };

      const submitLeaderboard = (finalScore: number) => {
        // Placeholder leaderboard hook.
        console.info("Submit score:", finalScore);
      };

      class GameScene extends PhaserModule.Scene {
        constructor() {
          super("Game");
        }

        private score = 0;
        private elapsed = 0;
        private spawnTimer = 0;
        private collectTimer = 0;
        private crashed = false;
        private touchActive = false;
        private touchPoint = { x: WIDTH * 0.5, y: HEIGHT * 0.7 };

        private player = {
          x: WIDTH * 0.5,
          y: HEIGHT * 0.7,
          vx: 0,
          vy: 0,
          rot: -Math.PI / 2,
        };

        private obstacles: Array<
          | { type: "circle"; x: number; y: number; r: number }
          | { type: "line"; x: number; y: number; len: number; angle: number }
        > = [];
        private collectibles: { x: number; y: number; r: number }[] = [];

        private cursors?: PhaserType.Types.Input.Keyboard.CursorKeys;
        private wasd?: Record<string, PhaserType.Input.Keyboard.Key | undefined>;

        private scoreText?: PhaserType.GameObjects.Text;
        private speedText?: PhaserType.GameObjects.Text;
        private playerGlow?: PhaserType.GameObjects.Arc;
        private playerDot?: PhaserType.GameObjects.Arc;
        private graphics?: PhaserType.GameObjects.Graphics;

        create() {
          this.score = 0;
          this.elapsed = 0;
          this.spawnTimer = 0;
          this.collectTimer = 0;
          this.crashed = false;
          this.obstacles = [];
          this.collectibles = [];
          this.touchActive = false;
          this.touchPoint = { x: WIDTH * 0.5, y: HEIGHT * 0.7 };

          this.player = {
            x: WIDTH * 0.5,
            y: HEIGHT * 0.7,
            vx: 0,
            vy: 0,
            rot: -Math.PI / 2,
          };

          this.cursors = this.input.keyboard?.createCursorKeys();
          this.wasd = {
            W: this.input.keyboard?.addKey(PhaserModule.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard?.addKey(PhaserModule.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard?.addKey(PhaserModule.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard?.addKey(PhaserModule.Input.Keyboard.KeyCodes.D),
          };

          const bg = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0b1220);
          bg.setStrokeStyle(2, 0x1f2937, 0.8);

          this.scoreText = this.add.text(16, 12, "Score: 0", {
            fontFamily: "Arial",
            fontSize: "16px",
            color: "#e2e8f0",
          });
          this.speedText = this.add.text(16, 34, "Speed: 0", {
            fontFamily: "Arial",
            fontSize: "14px",
            color: "#94a3b8",
          });

          this.playerGlow = this.add.circle(0, 0, PLAYER_RADIUS * 1.6, 0x38bdf8, 0.25);
          this.playerDot = this.add.circle(0, 0, PLAYER_RADIUS, 0x38bdf8);

          this.graphics = this.add.graphics();

          this.input.on("pointerdown", (pointer: PhaserType.Input.Pointer) => {
            this.touchActive = true;
            this.touchPoint = { x: pointer.worldX, y: pointer.worldY };
          });
          this.input.on("pointermove", (pointer: PhaserType.Input.Pointer) => {
            if (!this.touchActive) {
              return;
            }
            this.touchPoint = { x: pointer.worldX, y: pointer.worldY };
          });
          this.input.on("pointerup", () => {
            this.touchActive = false;
          });
        }

        update(_time: number, deltaMs: number) {
          if (this.crashed) {
            return;
          }

          const delta = deltaMs / 1000;
          this.elapsed += delta;

          this.handleInput(delta);
          this.integrate(delta);
          this.spawnObstacles(delta);
          this.scrollObstacles(delta);
          this.spawnCollectibles(delta);
          this.scrollCollectibles(delta);
          this.collectScoreOrbs();
          this.updateHud();
          this.renderScene();
          this.checkCollisions();
        }

        // Direct input: movement ignores inertia while pressed.
        private handleInput(delta: number) {
          if (!this.cursors || !this.wasd) {
            return;
          }

          const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
          const right = this.cursors.right?.isDown || this.wasd.D?.isDown;
          const up = this.cursors.up?.isDown || this.wasd.W?.isDown;
          const down = this.cursors.down?.isDown || this.wasd.S?.isDown;

          let dirX = (left ? -1 : 0) + (right ? 1 : 0);
          let dirY = (up ? -1 : 0) + (down ? 1 : 0);

          if (this.touchActive) {
            dirX = this.touchPoint.x - this.player.x;
            dirY = this.touchPoint.y - this.player.y;
          }

          const length = Math.hypot(dirX, dirY);

          if (length > 0) {
            const nx = dirX / length;
            const ny = dirY / length;
            const speedScale = 1 + (this.elapsed / 60) * SPEED_GROWTH_PER_MIN;
            const currentSpeed = MOVE_SPEED * speedScale;
            this.player.vx = nx * currentSpeed;
            this.player.vy = ny * currentSpeed;
            this.player.rot = Math.atan2(ny, nx);
          } else {
            const damp = Math.max(0, 1 - DAMPING * delta);
            this.player.vx *= damp;
            this.player.vy *= damp;
          }
        }

        private integrate(delta: number) {
          this.player.x += this.player.vx * delta;
          this.player.y += this.player.vy * delta;

          if (this.player.x < -20) {
            this.player.x = WIDTH + 20;
          }
          if (this.player.x > WIDTH + 20) {
            this.player.x = -20;
          }
          this.player.y = PhaserModule.Math.Clamp(this.player.y, 60, HEIGHT - 40);
        }

        private spawnObstacles(delta: number) {
          const minutes = this.elapsed / 60;
          const spawnInterval = OBSTACLE_SPAWN_MS / (1 + minutes * DENSITY_GROWTH);

          this.spawnTimer += delta * 1000;
          if (this.spawnTimer < spawnInterval) {
            return;
          }
          this.spawnTimer = 0;

          const type = PhaserModule.Math.Between(0, 1) === 0 ? "line" : "circle";
          const x = PhaserModule.Math.Between(40, WIDTH - 40);
          const y = -40;

          if (type === "circle") {
            const r = PhaserModule.Math.Between(12, 28);
            this.obstacles.push({ type, x, y, r });
          } else {
            const len = PhaserModule.Math.Between(60, 140);
            const angle = PhaserModule.Math.FloatBetween(0, Math.PI);
            this.obstacles.push({ type, x, y, len, angle });
          }
        }

        private scrollObstacles(delta: number) {
          const minutes = this.elapsed / 60;
          const scroll = SCROLL_BASE + minutes * SCROLL_GROWTH;

          this.obstacles.forEach((o) => {
            o.y += scroll * delta;
          });

          this.obstacles = this.obstacles.filter((o) => o.y < HEIGHT + 80);
        }

        private spawnCollectibles(delta: number) {
          this.collectTimer += delta * 1000;
          if (this.collectTimer < 1000) {
            return;
          }
          this.collectTimer = 0;

          const x = PhaserModule.Math.Between(40, WIDTH - 40);
          const y = -30;
          this.collectibles.push({ x, y, r: 10 });
        }

        private scrollCollectibles(delta: number) {
          const minutes = this.elapsed / 60;
          const scroll = SCROLL_BASE + minutes * SCROLL_GROWTH;

          this.collectibles.forEach((orb) => {
            orb.y += scroll * delta;
          });

          this.collectibles = this.collectibles.filter((orb) => orb.y < HEIGHT + 60);
        }

        private collectScoreOrbs() {
          const px = this.player.x;
          const py = this.player.y;

          this.collectibles = this.collectibles.filter((orb) => {
            const dist = Math.hypot(px - orb.x, py - orb.y);
            if (dist <= PLAYER_RADIUS + orb.r) {
              this.score += 1;
              return false;
            }
            return true;
          });
        }

        private updateHud() {
          const speed = Math.hypot(this.player.vx, this.player.vy);
          this.scoreText?.setText(`Score: ${format(this.score)}`);
          this.speedText?.setText(`Speed: ${speed.toFixed(0)}`);
        }

        private renderScene() {
          if (!this.graphics || !this.playerGlow || !this.playerDot) {
            return;
          }

          this.graphics.clear();
          this.graphics.lineStyle(2, 0x22d3ee, 0.85);
          this.graphics.fillStyle(0x0ea5e9, 1);

          for (const o of this.obstacles) {
            if (o.type === "circle") {
              this.graphics.strokeCircle(o.x, o.y, o.r);
            } else {
              const dx = Math.cos(o.angle) * (o.len / 2);
              const dy = Math.sin(o.angle) * (o.len / 2);
              this.graphics.lineBetween(o.x - dx, o.y - dy, o.x + dx, o.y + dy);
            }
          }

          this.graphics.lineStyle(2, 0xfbbf24, 1);
          this.graphics.fillStyle(0xfbbf24, 0.9);
          for (const orb of this.collectibles) {
            this.graphics.strokeCircle(orb.x, orb.y, orb.r);
          }

          const speed = Math.hypot(this.player.vx, this.player.vy);
          const glowScale = 1 + Math.min(speed / 260, 1.5) * 0.6;
          this.playerGlow.setPosition(this.player.x, this.player.y);
          this.playerGlow.setScale(glowScale, glowScale);
          this.playerDot.setPosition(this.player.x, this.player.y);
        }

        private checkCollisions() {
          for (const o of this.obstacles) {
            const dist = this.distanceToObstacle(o, this.player.x, this.player.y);
            if (dist <= PLAYER_RADIUS) {
              this.crash();
              return;
            }
            if (dist < 14) {
              this.cameras.main.shake(80, 0.0025);
            }
          }
        }

        private distanceToObstacle(
          o:
            | { type: "circle"; x: number; y: number; r: number }
            | { type: "line"; x: number; y: number; len: number; angle: number },
          px: number,
          py: number,
        ) {
          if (o.type === "circle") {
            return Math.hypot(px - o.x, py - o.y) - o.r;
          }

          const dx = Math.cos(o.angle) * (o.len / 2);
          const dy = Math.sin(o.angle) * (o.len / 2);
          const ax = o.x - dx;
          const ay = o.y - dy;
          const bx = o.x + dx;
          const by = o.y + dy;

          const abx = bx - ax;
          const aby = by - ay;
          const apx = px - ax;
          const apy = py - ay;
          const abLenSq = abx * abx + aby * aby;
          const t = abLenSq === 0 ? 0 : PhaserModule.Math.Clamp((apx * abx + apy * aby) / abLenSq, 0, 1);
          const cx = ax + abx * t;
          const cy = ay + aby * t;
          return Math.hypot(px - cx, py - cy);
        }

        private crash() {
          this.crashed = true;
          this.cameras.main.flash(180, 255, 255, 255);
          this.cameras.main.shake(240, 0.012);
          this.scene.start("End", { finalScore: this.score });
        }
      }

      class EndScene extends PhaserModule.Scene {
        constructor() {
          super("End");
        }

        create(data: { finalScore: number }) {
          submitLeaderboard(data.finalScore);

          this.add
            .rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0b1220)
            .setStrokeStyle(2, 0x334155, 0.8);

          this.add
            .text(WIDTH / 2, HEIGHT / 2 - 40, "Vector Drift", {
              fontFamily: "Arial",
              fontSize: "36px",
              color: "#e2e8f0",
              fontStyle: "bold",
            })
            .setOrigin(0.5, 0.5);

          this.add
            .text(WIDTH / 2, HEIGHT / 2 + 10, `Final Score: ${format(data.finalScore)}`, {
              fontFamily: "Arial",
              fontSize: "22px",
              color: "#38bdf8",
            })
            .setOrigin(0.5, 0.5);

          this.add
            .text(WIDTH / 2, HEIGHT / 2 + 50, "Press R to Restart", {
              fontFamily: "Arial",
              fontSize: "16px",
              color: "#94a3b8",
            })
            .setOrigin(0.5, 0.5);

          this.input.keyboard?.once("keydown-R", () => {
            this.scene.start("Game");
          });
        }
      }

      game = new PhaserModule.Game({
        type: PhaserModule.AUTO,
        width: WIDTH,
        height: HEIGHT,
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
        scene: [GameScene, EndScene],
      });
    };

    sessionRef.current += 1;

    const tryStart = () => {
      if (destroyed) {
        return;
      }
      if (!containerRef.current) {
        rafId = window.requestAnimationFrame(tryStart);
        return;
      }
      setup();
    };

    tryStart();

    return () => {
      destroyed = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      game?.destroy(true);
      game = null;
    };
  }, [autoStart]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Vector Drift
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Inertia Run
          </h2>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[60vh] min-h-[320px] max-h-[560px] w-full overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-950/90 shadow-inner touch-none select-none cursor-crosshair dark:border-zinc-700"
      />
    </div>
  );
}
