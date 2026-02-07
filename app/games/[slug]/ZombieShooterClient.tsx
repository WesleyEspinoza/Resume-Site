"use client";

import { useEffect, useRef, useState } from "react";
import type * as PhaserType from "phaser";

type GameStatus = "idle" | "running" | "finished";

type StatusPayload = {
  status: GameStatus;
  timeSurvived: number;
  kills: number;
  lives: number;
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 520;

const PLAYER_SPEED = 220;
const PLAYER_RADIUS = 16;
const BULLET_SPEED = 520;
const BULLET_LIFESPAN = 1200;
const FIRE_COOLDOWN = 120;

const BASE_SPAWN_MS = 900;
const MIN_SPAWN_MS = 350;
const BASE_ZOMBIE_SPEED = 60;
const MAX_ZOMBIE_SPEED = 210;

const MAX_LIVES = 3;
const INVULN_MS = 900;

type ZombieShooterClientProps = {
  autoStart?: boolean;
};

export default function ZombieShooterClient({ autoStart = false }: ZombieShooterClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusPayload, setStatusPayload] = useState<StatusPayload>({
    status: "idle",
    timeSurvived: 0,
    kills: 0,
    lives: MAX_LIVES,
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

      class ZombieScene extends PhaserModule.Scene {
        private lives = MAX_LIVES;
        private kills = 0;
        private active = true;
        private elapsedMs = 0;
        private invulnUntil = 0;

        private player?: PhaserType.GameObjects.Arc;
        private playerBody?: PhaserType.Physics.Arcade.Body;

        private bullets?: PhaserType.Physics.Arcade.Group;
        private zombies?: PhaserType.Physics.Arcade.Group;

        private cursors?: PhaserType.Types.Input.Keyboard.CursorKeys;
        private wasd?: Record<string, PhaserType.Input.Keyboard.Key | undefined>;

        private lastShotAt = 0;
        private lastSpawnAt = 0;
        private firing = false;
        private touchActive = false;
        private touchPoint = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };

        private pointerDownHandler?: (pointer: PhaserType.Input.Pointer) => void;
        private pointerUpHandler?: () => void;
        private pointerMoveHandler?: (pointer: PhaserType.Input.Pointer) => void;
        private bulletTextureKey = "zombie-bullet";

        create() {
          this.lives = MAX_LIVES;
          this.kills = 0;
          this.active = true;
          this.elapsedMs = 0;
          this.invulnUntil = 0;
          this.lastShotAt = 0;
          this.lastSpawnAt = 0;
          this.touchActive = false;
          this.touchPoint = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };

          this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

          this.createBulletTexture();


          this.player = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, PLAYER_RADIUS, 0x38bdf8);
          this.player.setStrokeStyle(2, 0x0ea5e9, 0.9);
          this.physics.add.existing(this.player);
          this.playerBody = this.player.body as PhaserType.Physics.Arcade.Body;
          this.playerBody.setCircle(PLAYER_RADIUS);
          this.playerBody.setCollideWorldBounds(true);

          this.bullets = this.physics.add.group({
            allowGravity: false,
            classType: PhaserModule.Physics.Arcade.Image,
          });
          this.zombies = this.physics.add.group({ allowGravity: false });

          this.physics.add.overlap(this.bullets, this.zombies, (bullet, zombie) => {
            bullet.destroy();
            zombie.destroy();
            this.kills += 1;
            emitter?.emit("kills", this.kills);
          });

          this.physics.add.overlap(this.player, this.zombies, () => this.registerHit());

          this.cursors = this.input.keyboard?.createCursorKeys();
          this.wasd = {
            W: this.input.keyboard?.addKey(PhaserModule.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard?.addKey(PhaserModule.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard?.addKey(PhaserModule.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard?.addKey(PhaserModule.Input.Keyboard.KeyCodes.D),
          };

          this.pointerDownHandler = (pointer: PhaserType.Input.Pointer) => {
            this.firing = true;
            this.touchActive = true;
            this.touchPoint = { x: pointer.worldX, y: pointer.worldY };
          };
          this.pointerUpHandler = () => {
            this.firing = false;
            this.touchActive = false;
          };
          this.pointerMoveHandler = (pointer: PhaserType.Input.Pointer) => {
            if (!this.touchActive) {
              return;
            }
            this.touchPoint = { x: pointer.worldX, y: pointer.worldY };
          };
          this.input.on("pointerdown", this.pointerDownHandler);
          this.input.on("pointerup", this.pointerUpHandler);
          this.input.on("pointermove", this.pointerMoveHandler);

          emitter?.emit("status", "running");
          emitter?.emit("lives", this.lives);
          emitter?.emit("kills", this.kills);
        }

        update(_time: number, delta: number) {
          if (!this.active || !this.player || !this.playerBody) {
            return;
          }

          this.elapsedMs += delta;
          emitter?.emit("time", this.elapsedMs / 1000);

          this.updateMovement();
          this.updateShooting();
          this.updateZombies();
          this.spawnZombies();
          this.updateDifficulty();
        }

        private updateMovement() {
          if (!this.playerBody || !this.cursors || !this.wasd) {
            return;
          }

          if (this.touchActive) {
            const dx = this.touchPoint.x - this.player!.x;
            const dy = this.touchPoint.y - this.player!.y;
            const length = Math.hypot(dx, dy) || 1;
            this.playerBody.setVelocity(
              (dx / length) * PLAYER_SPEED,
              (dy / length) * PLAYER_SPEED,
            );
            return;
          }

          const left = this.cursors.left?.isDown || this.wasd.A?.isDown;
          const right = this.cursors.right?.isDown || this.wasd.D?.isDown;
          const up = this.cursors.up?.isDown || this.wasd.W?.isDown;
          const down = this.cursors.down?.isDown || this.wasd.S?.isDown;

          const dirX = (left ? -1 : 0) + (right ? 1 : 0);
          const dirY = (up ? -1 : 0) + (down ? 1 : 0);

          const length = Math.hypot(dirX, dirY) || 1;
          this.playerBody.setVelocity(
            (dirX / length) * PLAYER_SPEED,
            (dirY / length) * PLAYER_SPEED
          );
        }

        private updateShooting() {
          if (!this.player || !this.bullets) {
            return;
          }

          const now = this.time.now;
          if (!this.firing || now - this.lastShotAt < FIRE_COOLDOWN) {
            return;
          }

          const pointer = this.input.activePointer;
          const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
          const targetX = this.touchActive ? this.touchPoint.x : worldPoint.x;
          const targetY = this.touchActive ? this.touchPoint.y : worldPoint.y;
          const dx = targetX - this.player.x;
          const dy = targetY - this.player.y;
          const length = Math.hypot(dx, dy) || 1;

          const bullet = this.bullets.get(this.player.x, this.player.y) as
            | PhaserType.Physics.Arcade.Image
            | null;
          if (!bullet) {
            return;
          }

          bullet.setActive(true);
          bullet.setVisible(true);
          bullet.setTexture(this.bulletTextureKey);
          bullet.setPosition(this.player.x, this.player.y);
          bullet.setCircle(4);
          bullet.setOrigin(0.5, 0.5);

          const body = bullet.body as PhaserType.Physics.Arcade.Body;
          body.setAllowGravity(false);
          body.setCollideWorldBounds(false);
          body.setVelocity((dx / length) * BULLET_SPEED, (dy / length) * BULLET_SPEED);

          this.time.delayedCall(BULLET_LIFESPAN, () => {
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.destroy();
          });

          this.lastShotAt = now;
        }

        private updateZombies() {
          if (!this.zombies || !this.player) {
            return;
          }

          const speed = this.getZombieSpeed();

          this.zombies.children.iterate((child) => {
            const zombie = child as PhaserType.GameObjects.Arc;
            const body = zombie.body as PhaserType.Physics.Arcade.Body;
            const dx = this.player!.x - zombie.x;
            const dy = this.player!.y - zombie.y;
            const length = Math.hypot(dx, dy) || 1;
            body.setVelocity((dx / length) * speed, (dy / length) * speed);
            return true;
          });
        }

        private createBulletTexture() {
          if (this.textures.exists(this.bulletTextureKey)) {
            return;
          }
          const graphics = this.add.graphics();
          graphics.fillStyle(0xf8fafc, 1);
          graphics.fillCircle(4, 4, 4);
          graphics.generateTexture(this.bulletTextureKey, 8, 8);
          graphics.destroy();
        }


        private spawnZombies() {
          if (!this.zombies) {
            return;
          }

          const now = this.time.now;
          const spawnMs = this.getSpawnInterval();
          if (now - this.lastSpawnAt < spawnMs) {
            return;
          }

          this.lastSpawnAt = now;

          const edge = PhaserModule.Math.Between(0, 3);
          const margin = 30;
          let x = margin;
          let y = margin;

          if (edge === 0) {
            x = PhaserModule.Math.Between(margin, GAME_WIDTH - margin);
            y = -margin;
          } else if (edge === 1) {
            x = GAME_WIDTH + margin;
            y = PhaserModule.Math.Between(margin, GAME_HEIGHT - margin);
          } else if (edge === 2) {
            x = PhaserModule.Math.Between(margin, GAME_WIDTH - margin);
            y = GAME_HEIGHT + margin;
          } else {
            x = -margin;
            y = PhaserModule.Math.Between(margin, GAME_HEIGHT - margin);
          }

          const zombie = this.add.circle(x, y, 14, 0x16a34a);
          zombie.setStrokeStyle(2, 0x22c55e, 0.9);
          this.physics.add.existing(zombie);
          const body = zombie.body as PhaserType.Physics.Arcade.Body;
          body.setCircle(14);
          body.setAllowGravity(false);
          this.zombies.add(zombie, true);
        }

        private updateDifficulty() {
          if (!this.player) {
            return;
          }

          if (this.isInvulnerable()) {
            this.player.setFillStyle(0xfacc15);
          } else {
            this.player.setFillStyle(0x38bdf8);
          }
        }

        private getSpawnInterval() {
          const t = Math.min(this.elapsedMs / 60000, 1);
          return PhaserModule.Math.Linear(BASE_SPAWN_MS, MIN_SPAWN_MS, t);
        }

        private getZombieSpeed() {
          const t = Math.min(this.elapsedMs / 60000, 1);
          return PhaserModule.Math.Linear(BASE_ZOMBIE_SPEED, MAX_ZOMBIE_SPEED, t);
        }

        private registerHit() {
          if (!this.active || this.isInvulnerable()) {
            return;
          }

          this.lives -= 1;
          this.invulnUntil = this.time.now + INVULN_MS;
          emitter?.emit("lives", this.lives);

          if (this.lives <= 0) {
            this.finish();
          }
        }

        private isInvulnerable() {
          return this.time.now < this.invulnUntil;
        }

        private finish() {
          if (!this.active) {
            return;
          }
          this.active = false;
          emitter?.emit("status", "finished");
          this.input.enabled = false;
          this.input.off("pointerdown", this.pointerDownHandler);
          this.input.off("pointerup", this.pointerUpHandler);
          this.input.off("pointermove", this.pointerMoveHandler);
          this.input.keyboard?.removeAllKeys(true);
          this.zombies?.setVelocity(0, 0);
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
        scene: new ZombieScene(),
      });

      const handleStatus = (value: GameStatus) =>
        setStatusPayload((current) => ({ ...current, status: value }));
      const handleTime = (value: number) =>
        setStatusPayload((current) => ({ ...current, timeSurvived: value }));
      const handleKills = (value: number) =>
        setStatusPayload((current) => ({ ...current, kills: value }));
      const handleLives = (value: number) =>
        setStatusPayload((current) => ({ ...current, lives: value }));

      emitter.on("status", handleStatus);
      emitter.on("time", handleTime);
      emitter.on("kills", handleKills);
      emitter.on("lives", handleLives);
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
    setStatusPayload({ status: "running", timeSurvived: 0, kills: 0, lives: MAX_LIVES });
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
            Zombie Onslaught
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Twin Stick Survival
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
          <span className="font-semibold">Time: {statusPayload.timeSurvived.toFixed(1)}s</span>
          <span>Kills: {statusPayload.kills}</span>
          <span>Lives: {statusPayload.lives}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Move with WASD/arrows or drag on touch. Aim and hold to fire. Survive as
          long as you can.
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
