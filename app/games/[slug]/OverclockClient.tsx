"use client";

import { useEffect, useRef, useState } from "react";
import type * as PhaserType from "phaser";

type GameStatus = "idle" | "running" | "finished";

type StatusPayload = {
  power: number;
  timeLeft: number;
  status: GameStatus;
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 520;
const START_POWER = 100;

type OverclockClientProps = {
  autoStart?: boolean;
};

export default function OverclockClient({ autoStart = false }: OverclockClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [statusPayload, setStatusPayload] = useState<StatusPayload>({
    power: START_POWER,
    timeLeft: 0,
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

      const formatNumber = (value: number) => {
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

      const submitLeaderboard = (finalPower: number) => {
        // Placeholder hook for leaderboard submission.
        console.info("Submit score", finalPower);
      };

      class BootScene extends PhaserModule.Scene {
        constructor() {
          super("Boot");
        }

        create() {
          this.scene.start("Game");
        }
      }

      class GameScene extends PhaserModule.Scene {
        constructor() {
          super("Game");
        }

        private power = START_POWER;
        private baseRate = 1.2;
        private clickPower = 1;
        private clickUpgradeCost = 60;
        private genUpgradeCost = 85;
        private drainBase = 2.4;
        private drainGrowth = 0.8;
        private drainRate = this.drainBase;
        private elapsed = 0;
        private powerText?: PhaserType.GameObjects.Text;
        private timerText?: PhaserType.GameObjects.Text;
        private statsText?: PhaserType.GameObjects.Text;
        private clickText?: PhaserType.GameObjects.Text;
        private genText?: PhaserType.GameObjects.Text;
        private rampPulse = 0;
        private lastShakeAt = 0;
        private gameOver = false;

        create() {
          this.power = START_POWER;
          this.baseRate = 1.2;
          this.clickPower = 1;
          this.clickUpgradeCost = 60;
          this.genUpgradeCost = 85;
          this.drainBase = 2.4;
          this.drainGrowth = 0.8;
          this.drainRate = this.drainBase;
          this.elapsed = 0;
          this.rampPulse = 0;
          this.lastShakeAt = 0;
          this.gameOver = false;

          emitter?.emit("status", "running");

          const bg = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x0b1220,
          );
          bg.setStrokeStyle(2, 0x1f2937, 0.7);

          this.timerText = this.add.text(GAME_WIDTH / 2, 28, "", {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#e2e8f0",
          });
          this.timerText.setOrigin(0.5, 0.5);

          this.powerText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, "0", {
            fontFamily: "Arial",
            fontSize: "64px",
            color: "#38bdf8",
            fontStyle: "bold",
          });
          this.powerText.setOrigin(0.5, 0.5);

          this.statsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "", {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#94a3b8",
          });
          this.statsText.setOrigin(0.5, 0.5);

          this.clickText = this.add.text(0, 0, "", {
            fontFamily: "Arial",
            fontSize: "16px",
            color: "#0f172a",
            fontStyle: "bold",
          });
          this.genText = this.add.text(0, 0, "", {
            fontFamily: "Arial",
            fontSize: "16px",
            color: "#0f172a",
            fontStyle: "bold",
          });

          this.createButton(
            GAME_WIDTH * 0.3,
            GAME_HEIGHT - 90,
            240,
            52,
            0xfbbf24,
            this.clickText,
            () => this.upgradeClick(),
          );

          this.createButton(
            GAME_WIDTH * 0.7,
            GAME_HEIGHT - 90,
            240,
            52,
            0x38bdf8,
            this.genText,
            () => this.upgradeGenerator(),
          );

          this.input.on("pointerdown", () => this.handleClick());

          this.updateUI(0);
        }

        update(_time: number, delta: number) {
          this.elapsed += delta;
          const elapsedSeconds = this.elapsed / 1000;

          // Drain increases over time to add pressure.
          const minutes = this.elapsed / 60000;
          this.drainRate = this.drainBase + Math.pow(minutes, 1.35) * this.drainGrowth;

          // Core power formula, frame-rate independent.
          const generation = this.baseRate * (delta / 1000);
          const drain = this.drainRate * (delta / 1000);
          this.power += generation - drain;

          if (this.power <= 0 && !this.gameOver) {
            this.gameOver = true;
            this.power = 0;
            emitter?.emit("status", "finished");
            emitter?.emit("final", this.power);
            this.scene.start("End", {
              finalPower: this.power,
              overclocks: 0,
              lost: true,
            });
            return;
          }

          this.updateUI(elapsedSeconds);
          this.handleRampEffects(delta);
        }

        private updateUI(elapsedSeconds: number) {
          if (!this.timerText || !this.powerText || !this.statsText) {
            return;
          }

          this.timerText.setText(`Overclock - ${elapsedSeconds.toFixed(1)}s survived`);
          this.powerText.setText(formatNumber(this.power));
          this.statsText.setText(
            `BaseRate ${formatNumber(this.baseRate)}/s | Click +${formatNumber(
              this.clickPower,
            )} | Drain ${formatNumber(this.drainRate)}/s`,
          );

          this.clickText?.setText(
            `Upgrade Click (Cost ${formatNumber(this.clickUpgradeCost)})`,
          );
          this.genText?.setText(
            `Upgrade Generator (Cost ${formatNumber(this.genUpgradeCost)})`,
          );

          emitter?.emit("time", elapsedSeconds);
          emitter?.emit("power", this.power);
        }

        private handleRampEffects(delta: number) {
          if (!this.powerText) {
            return;
          }

          const pressure = Math.min(this.drainRate / 6, 2.5);
          if (pressure > 1) {
            this.rampPulse += delta * 0.008 * pressure;
            const pulse = 1 + Math.sin(this.rampPulse) * 0.05 * pressure;
            this.powerText.setScale(pulse, pulse);
          } else {
            this.powerText.setScale(1, 1);
          }

          if (pressure > 1.6 && this.time.now - this.lastShakeAt > 700) {
            this.cameras.main.shake(180, 0.006 * Math.min(pressure, 3.5));
            this.lastShakeAt = this.time.now;
          }
        }

        private upgradeClick() {
          if (this.power < this.clickUpgradeCost) {
            return;
          }
          this.power -= this.clickUpgradeCost;

          // Diminishing returns per upgrade.
          this.clickPower += Math.max(1, Math.floor(3 * Math.pow(0.88, this.clickPower)));
          this.clickUpgradeCost *= 1.7;
        }

        private upgradeGenerator() {
          if (this.power < this.genUpgradeCost) {
            return;
          }
          this.power -= this.genUpgradeCost;

          // Diminishing returns for base rate upgrades.
          this.baseRate += 0.6 * Math.pow(0.88, this.baseRate * 0.2);
          this.genUpgradeCost *= 1.75;
        }

        private handleClick() {
          if (this.gameOver) {
            return;
          }
          this.power += this.clickPower;
        }

        private createButton(
          x: number,
          y: number,
          width: number,
          height: number,
          color: number,
          label: PhaserType.GameObjects.Text,
          onClick: () => void,
        ) {
          const rect = this.add.rectangle(x, y, width, height, color, 1);
          rect.setStrokeStyle(2, 0x0f172a, 0.6);
          rect.setInteractive({ useHandCursor: true });
          rect.on("pointerdown", () => onClick());

          label.setPosition(x, y);
          label.setOrigin(0.5, 0.5);
          label.setDepth(2);
          rect.setDepth(1);
        }
      }

      class EndScene extends PhaserModule.Scene {
        constructor() {
          super("End");
        }

        create(data: { finalPower: number; overclocks: number; lost: boolean }) {
          submitLeaderboard(data.finalPower);

          const bg = this.add.rectangle(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x0b1220,
          );
          bg.setStrokeStyle(2, 0x334155, 0.8);

          this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 50,
            data.lost ? "Power Depleted" : "Session Complete",
            {
            fontFamily: "Arial",
            fontSize: "36px",
            color: "#e2e8f0",
            fontStyle: "bold",
            },
          ).setOrigin(0.5, 0.5);

          this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 10,
            `Final Power: ${formatNumber(data.finalPower)}`,
            {
              fontFamily: "Arial",
              fontSize: "28px",
              color: "#38bdf8",
              fontStyle: "bold",
            },
          ).setOrigin(0.5, 0.5);

          this.add.text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 60,
            `Overclocks: ${data.overclocks}`,
            {
              fontFamily: "Arial",
              fontSize: "18px",
              color: "#94a3b8",
            },
          ).setOrigin(0.5, 0.5);
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
        scene: [BootScene, GameScene, EndScene],
      });

      const handlePower = (value: number) =>
        setStatusPayload((current) => ({ ...current, power: value }));
      const handleTime = (value: number) =>
        setStatusPayload((current) => ({ ...current, timeLeft: value }));
      const handleStatus = (value: GameStatus) =>
        setStatusPayload((current) => ({ ...current, status: value }));
      const handleFinal = (value: number) =>
        setStatusPayload((current) => ({ ...current, power: value }));

      emitter.on("power", handlePower);
      emitter.on("time", handleTime);
      emitter.on("status", handleStatus);
      emitter.on("final", handleFinal);
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
      power: START_POWER,
      timeLeft: 0,
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
            Overclock
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Idle Power Session
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
          <span className="font-semibold">Power: {statusPayload.power.toFixed(0)}</span>
          <span className="font-semibold">Time: {statusPayload.timeLeft.toFixed(1)}s</span>
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {statusPayload.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Generate Power for 4 minutes. Spend on multipliers or overclock to reset and
          boost base rate.
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
