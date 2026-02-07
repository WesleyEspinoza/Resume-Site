"use client";

import { useEffect, useRef, useState } from "react";
import type * as PhaserType from "phaser";

type GameStatus = "idle" | "running" | "finished";

type StatusPayload = {
  coins: number;
  lives: number;
  wave: number;
  status: GameStatus;
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 520;

const GRID_SIZE = 40;
const TOWER_COST = 30;
const START_COINS = 100;
const START_LIVES = 10;

const BASE_ENEMY_HP = 30;
const BASE_ENEMY_SPEED = 80;
const ENEMY_SPAWN_MS = 900;
const WAVE_PAUSE_MS = 1400;

const TOWER_RANGE = 150;
const TOWER_FIRE_MS = 650;
const BULLET_SPEED = 360;
const BULLET_DAMAGE = 10;

const PATH_WIDTH = 56;

type TowerDefenseClientProps = {
  autoStart?: boolean;
};

export default function TowerDefenseClient({ autoStart = false }: TowerDefenseClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusPayload, setStatusPayload] = useState<StatusPayload>({
    coins: START_COINS,
    lives: START_LIVES,
    wave: 0,
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

      class TowerDefenseScene extends PhaserModule.Scene {
        private coins = START_COINS;
        private lives = START_LIVES;
        private wave = 0;
        private active = true;
        private enemies?: PhaserType.Physics.Arcade.Group;
        private bullets?: PhaserType.Physics.Arcade.Group;
        private towers: {
          node: PhaserType.GameObjects.Arc;
          cooldown: number;
        }[] = [];
        private spawnTimer?: PhaserType.Time.TimerEvent;
        private pendingEnemies = 0;
        private enemiesSpawned = 0;
        private bulletTextureKey = "tower-bullet";
        private pathPoints: { x: number; y: number }[] = [];

        create() {
          this.active = true;
          this.coins = START_COINS;
          this.lives = START_LIVES;
          this.wave = 0;
          this.towers = [];
          this.pendingEnemies = 0;
          this.enemiesSpawned = 0;

          emitter?.emit("status", "running");
          this.emitStats();

          this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

          this.pathPoints = this.generatePath();
          this.drawBoard();

          this.createBulletTexture();

          this.enemies = this.physics.add.group({ allowGravity: false });
          this.bullets = this.physics.add.group({
            allowGravity: false,
            classType: PhaserModule.Physics.Arcade.Image,
          });

          this.input.on("pointerdown", (pointer: PhaserType.Input.Pointer) => {
            if (!this.active) {
              return;
            }
            this.placeTower(pointer.worldX, pointer.worldY);
          });

          this.time.delayedCall(600, () => this.startNextWave());
        }

        update(_time: number, delta: number) {
          if (!this.active) {
            return;
          }

          this.updateEnemies();
          this.updateTowers(delta);
          this.updateBullets(delta);
          this.cleanupBullets();
        }

        private drawBoard() {
          const bg = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x0b1220,
          );
          bg.setStrokeStyle(2, 0x1e293b, 0.6);

          const pathGraphics = this.add.graphics();
          pathGraphics.lineStyle(PATH_WIDTH, 0x1f2937, 1);
          pathGraphics.beginPath();
          if (this.pathPoints.length < 2) {
            return;
          }

          pathGraphics.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
          for (let i = 1; i < this.pathPoints.length; i += 1) {
            pathGraphics.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
          }
          pathGraphics.strokePath();

          pathGraphics.lineStyle(3, 0x334155, 1);
          pathGraphics.beginPath();
          pathGraphics.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
          for (let i = 1; i < this.pathPoints.length; i += 1) {
            pathGraphics.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
          }
          pathGraphics.strokePath();

          const grid = this.add.graphics();
          grid.lineStyle(1, 0x0f172a, 0.4);
          for (let x = GRID_SIZE; x < GAME_WIDTH; x += GRID_SIZE) {
            grid.lineBetween(x, 0, x, GAME_HEIGHT);
          }
          for (let y = GRID_SIZE; y < GAME_HEIGHT; y += GRID_SIZE) {
            grid.lineBetween(0, y, GAME_WIDTH, y);
          }
        }

        private placeTower(worldX: number, worldY: number) {
          if (this.coins < TOWER_COST) {
            return;
          }

          const snapped = this.snapToGrid(worldX, worldY);
          if (!this.isBuildable(snapped.x, snapped.y)) {
            return;
          }

          const tower = this.add.circle(snapped.x, snapped.y, 16, 0x38bdf8);
          tower.setStrokeStyle(2, 0x0ea5e9, 0.95);
          this.towers.push({ node: tower, cooldown: 0 });
          this.coins -= TOWER_COST;
          this.emitStats();
        }

        private snapToGrid(x: number, y: number) {
          return {
            x: Math.round(x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(y / GRID_SIZE) * GRID_SIZE,
          };
        }

        private isBuildable(x: number, y: number) {
          if (x < GRID_SIZE || x > GAME_WIDTH - GRID_SIZE) {
            return false;
          }
          if (y < GRID_SIZE || y > GAME_HEIGHT - GRID_SIZE) {
            return false;
          }
          const nearTower = this.towers.some((tower) => {
            const dx = tower.node.x - x;
            const dy = tower.node.y - y;
            return dx * dx + dy * dy < GRID_SIZE * GRID_SIZE * 0.6;
          });
          if (nearTower) {
            return false;
          }

          return !this.isPointOnPath(x, y);
        }

        private isPointOnPath(x: number, y: number) {
          const halfWidth = PATH_WIDTH / 2 + 4;
          for (let i = 0; i < this.pathPoints.length - 1; i += 1) {
            const start = this.pathPoints[i];
            const end = this.pathPoints[i + 1];
            const distance = this.distanceToSegment(
              x,
              y,
              start.x,
              start.y,
              end.x,
              end.y,
            );
            if (distance <= halfWidth) {
              return true;
            }
          }
          return false;
        }

        private distanceToSegment(
          px: number,
          py: number,
          ax: number,
          ay: number,
          bx: number,
          by: number,
        ) {
          const abx = bx - ax;
          const aby = by - ay;
          const apx = px - ax;
          const apy = py - ay;
          const abLenSq = abx * abx + aby * aby;
          if (abLenSq === 0) {
            return Math.hypot(apx, apy);
          }
          const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
          const closestX = ax + abx * t;
          const closestY = ay + aby * t;
          return Math.hypot(px - closestX, py - closestY);
        }

        private startNextWave() {
          if (!this.active) {
            return;
          }

          this.wave += 1;
          this.pendingEnemies = 8 + this.wave * 3;
          this.enemiesSpawned = 0;
          this.emitStats();

          this.spawnTimer?.remove(false);
          this.spawnTimer = this.time.addEvent({
            delay: ENEMY_SPAWN_MS,
            loop: true,
            callback: () => this.spawnEnemy(),
          });
        }

        private spawnEnemy() {
          if (!this.enemies || !this.active) {
            return;
          }

          if (this.pathPoints.length === 0) {
            return;
          }

          if (this.enemiesSpawned >= this.pendingEnemies) {
            this.spawnTimer?.remove(false);
            this.spawnTimer = undefined;
            this.time.delayedCall(WAVE_PAUSE_MS, () => this.startNextWave());
            return;
          }

          const size = 20;
          const start = this.pathPoints[0];
          const enemy = this.add.rectangle(start.x, start.y, size, size, 0xf97316);
          enemy.setStrokeStyle(2, 0xfdba74, 0.9);
          this.physics.add.existing(enemy);
          const body = enemy.body as PhaserType.Physics.Arcade.Body;
          body.setAllowGravity(false);
          body.setImmovable(false);

          const hp = BASE_ENEMY_HP + this.wave * 16;
          const speed = BASE_ENEMY_SPEED + this.wave * 12;

          enemy.setDataEnabled();
          enemy.setData("hp", hp);
          enemy.setData("speed", speed);
          enemy.setData("pathIndex", 0);

          this.enemies.add(enemy);
          this.enemiesSpawned += 1;
        }

        private updateEnemies() {
          if (!this.enemies) {
            return;
          }

          this.enemies.getChildren().forEach((enemyObj) => {
            const enemy = enemyObj as PhaserType.GameObjects.Rectangle;
            const body = enemy.body as PhaserType.Physics.Arcade.Body | null;
            if (!body) {
              return;
            }

            const pathIndex = enemy.getData("pathIndex") as number;
            const nextIndex = pathIndex + 1;

            if (nextIndex >= this.pathPoints.length) {
              this.handleEnemyEscape(enemy);
              return;
            }

            const target = this.pathPoints[nextIndex];
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const distance = Math.hypot(dx, dy);
            const speed = enemy.getData("speed") as number;

            if (distance < 6) {
              enemy.setData("pathIndex", nextIndex);
              body.setVelocity(0, 0);
              return;
            }

            const vx = (dx / distance) * speed;
            const vy = (dy / distance) * speed;
            body.setVelocity(vx, vy);
          });
        }

        private updateTowers(delta: number) {
          if (!this.enemies) {
            return;
          }

          this.towers.forEach((tower) => {
            tower.cooldown -= delta;
            if (tower.cooldown > 0) {
              return;
            }

            const target = this.findTarget(tower.node.x, tower.node.y);
            if (!target) {
              return;
            }

            this.fireBullet(tower.node.x, tower.node.y, target);
            tower.cooldown = TOWER_FIRE_MS;
          });
        }

        private findTarget(x: number, y: number) {
          if (!this.enemies) {
            return null;
          }

          let bestTarget: PhaserType.GameObjects.Rectangle | null = null;
          let bestDistance = Number.POSITIVE_INFINITY;

          this.enemies.getChildren().forEach((enemyObj) => {
            const enemy = enemyObj as PhaserType.GameObjects.Rectangle;
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.hypot(dx, dy);
            if (distance <= TOWER_RANGE && distance < bestDistance) {
              bestDistance = distance;
              bestTarget = enemy;
            }
          });

          return bestTarget;
        }

        private fireBullet(x: number, y: number, target: PhaserType.GameObjects.Rectangle) {
          if (!this.bullets) {
            return;
          }

          const bullet = this.bullets.get(x, y) as PhaserType.Physics.Arcade.Image | null;
          if (!bullet) {
            return;
          }
          bullet.setActive(true);
          bullet.setVisible(true);
          bullet.setTexture(this.bulletTextureKey);
          bullet.setPosition(x, y);
          bullet.setOrigin(0.5, 0.5);

          const dx = target.x - x;
          const dy = target.y - y;
          const distance = Math.hypot(dx, dy) || 1;
          const body = bullet.body as PhaserType.Physics.Arcade.Body;
          body.setAllowGravity(false);
          body.reset(x, y);
          body.setCircle(4);
          body.setVelocity((dx / distance) * BULLET_SPEED, (dy / distance) * BULLET_SPEED);

          bullet.setDataEnabled();
          bullet.setData("bornAt", this.time.now);
          bullet.setData("target", target);
        }

        private updateBullets(delta: number) {
          if (!this.bullets) {
            return;
          }

          this.bullets.getChildren().forEach((bulletObj) => {
            const bullet = bulletObj as PhaserType.Physics.Arcade.Image;
            const target = bullet.getData("target") as
              | PhaserType.GameObjects.Rectangle
              | undefined;
            if (!target || !target.active) {
              bullet.destroy();
              return;
            }

            const dx = target.x - bullet.x;
            const dy = target.y - bullet.y;
            const distance = Math.hypot(dx, dy);
            if (distance <= 8) {
              this.handleBulletHit(bullet, target);
              return;
            }

            const body = bullet.body as PhaserType.Physics.Arcade.Body | null;
            if (!body) {
              return;
            }
            const step = (BULLET_SPEED * delta) / 1000;
            const clamped = Math.max(distance, 1);
            const vx = (dx / clamped) * BULLET_SPEED;
            const vy = (dy / clamped) * BULLET_SPEED;
            body.setVelocity(vx, vy);

            if (distance <= step) {
              bullet.setPosition(target.x, target.y);
              this.handleBulletHit(bullet, target);
            }
          });
        }

        private cleanupBullets() {
          if (!this.bullets) {
            return;
          }

          this.bullets.getChildren().forEach((bulletObj) => {
            const bullet = bulletObj as PhaserType.Physics.Arcade.Image;
            const bornAt = bullet.getData("bornAt") as number;
            if (this.time.now - bornAt > 2000) {
              bullet.setActive(false);
              bullet.setVisible(false);
              bullet.destroy();
            }
          });
        }

        private handleBulletHit(
          bullet: PhaserType.Physics.Arcade.Image,
          enemy: PhaserType.GameObjects.Rectangle,
        ) {
          bullet.destroy();
          const hp = (enemy.getData("hp") as number) - BULLET_DAMAGE;
          enemy.setData("hp", hp);

          if (hp <= 0) {
            enemy.destroy();
            this.coins += 10;
            this.emitStats();
          }
        }

        private handleEnemyEscape(enemy: PhaserType.GameObjects.Rectangle) {
          enemy.destroy();
          this.lives -= 1;
          this.emitStats();

          if (this.lives <= 0) {
            this.finish();
          }
        }

        private finish() {
          this.active = false;
          emitter?.emit("status", "finished");
          this.spawnTimer?.remove(false);
          this.spawnTimer = undefined;
          this.enemies?.clear(true, true);
          this.bullets?.clear(true, true);
        }

        private emitStats() {
          emitter?.emit("coins", this.coins);
          emitter?.emit("lives", this.lives);
          emitter?.emit("wave", this.wave);
        }

        private createBulletTexture() {
          if (this.textures.exists(this.bulletTextureKey)) {
            return;
          }
          const graphics = this.add.graphics();
          graphics.fillStyle(0x38bdf8, 1);
          graphics.fillCircle(4, 4, 4);
          graphics.lineStyle(1, 0xe0f2fe, 0.9);
          graphics.strokeCircle(4, 4, 4);
          graphics.generateTexture(this.bulletTextureKey, 8, 8);
          graphics.destroy();
        }

        private generatePath() {
          const margin = 60;
          const minSegment = 120;
          const maxTurns = 5;
          const points: { x: number; y: number }[] = [];

          let x = margin;
          let y = PhaserModule.Math.Between(margin, GAME_HEIGHT - margin);
          points.push({ x, y });

          let horizontal = true;

          for (let i = 0; i < maxTurns; i += 1) {
            if (horizontal) {
              const remainingTurns = maxTurns - i;
              const maxX = GAME_WIDTH - margin - remainingTurns * 80;
              const minX = Math.min(maxX, x + minSegment);
              const nextX = PhaserModule.Math.Between(minX, maxX);
              x = nextX;
            } else {
              const minY = margin;
              const maxY = GAME_HEIGHT - margin;
              let nextY = PhaserModule.Math.Between(minY, maxY);
              if (Math.abs(nextY - y) < minSegment * 0.6) {
                nextY = y + (nextY > y ? minSegment : -minSegment);
                nextY = PhaserModule.Math.Clamp(nextY, minY, maxY);
              }
              y = nextY;
            }

            points.push({ x, y });
            horizontal = !horizontal;
          }

          if (x < GAME_WIDTH - margin) {
            points.push({ x: GAME_WIDTH - margin, y });
          }

          return points;
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
        scene: new TowerDefenseScene(),
      });

      const handleCoins = (value: number) =>
        setStatusPayload((current) => ({ ...current, coins: value }));
      const handleLives = (value: number) =>
        setStatusPayload((current) => ({ ...current, lives: value }));
      const handleWave = (value: number) =>
        setStatusPayload((current) => ({ ...current, wave: value }));
      const handleStatus = (value: GameStatus) =>
        setStatusPayload((current) => ({ ...current, status: value }));

      emitter.on("coins", handleCoins);
      emitter.on("lives", handleLives);
      emitter.on("wave", handleWave);
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
    setStatusPayload({
      coins: START_COINS,
      lives: START_LIVES,
      wave: 0,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Circle Defense
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Place Circles, Stop Squares
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
          <span className="font-semibold">Coins: {statusPayload.coins}</span>
          <span className="font-semibold">Lives: {statusPayload.lives}</span>
          <span className="font-semibold">Wave: {statusPayload.wave}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {statusPayload.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Click to place circles for {TOWER_COST} coins. Squares follow the lane and get
          tougher every wave.
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
