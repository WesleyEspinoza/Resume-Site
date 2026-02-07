import Link from "next/link";
import { games } from "@/lib/games";
import AimTrainerWrapper from "./AimTrainerWrapper";
import FlappyBirdWrapper from "./FlappyBirdWrapper";
import TypingAccuracyClient from "./TypingAccuracyClient";
import SpottingGameClient from "./SpottingGameClient";
import ZombieShooterWrapper from "./ZombieShooterWrapper";
import CoinFlipClient from "./CoinFlipClient";
import HoleInOneWrapper from "./HoleInOneWrapper";
import TowerDefenseWrapper from "./TowerDefenseWrapper";
import OverclockWrapper from "./OverclockWrapper";
import VectorDriftWrapper from "./VectorDriftWrapper";

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = games.find((entry) => entry.slug === slug);
  const isAimTrainer = game?.slug === "aim-trainer";
  const isFloppyBall = game?.slug === "floppyball";
  const isTypingAccuracy = game?.slug === "typing-accuracy";
  const isSpottingGame = game?.slug === "spotting-game";
  const isZombieOnslaught = game?.slug === "zombie-onslaught";
  const isCoinFlip = game?.slug === "coin-flip";
  const isHoleInOne = game?.slug === "hole-in-one";
  const isCircleDefense = game?.slug === "circle-defense";
  const isOverclock = game?.slug === "overclock";
  const isVectorDrift = game?.slug === "vector-drift";

  if (!game) {
    return (
      <main className="bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900 min-h-screen px-4 sm:px-6 md:px-8 py-10 sm:py-16 font-sans">
        <section className="mx-auto w-full max-w-4xl">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Game not found
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            The game you requested is not listed yet.
          </p>
          <Link
            href="/games"
            className="mt-6 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to games
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900 min-h-screen px-4 sm:px-6 md:px-8 py-10 sm:py-16 font-sans">
      <section className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Phaser 3 game
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {game.title}
            </h1>
            <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400 max-w-2xl">
              {game.description}
            </p>
          </div>
          <Link
            href="/games"
            className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Back to games
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
            {isAimTrainer ? (
              <AimTrainerWrapper />
            ) : isFloppyBall ? (
              <FlappyBirdWrapper />
            ) : isTypingAccuracy ? (
              <TypingAccuracyClient />
            ) : isSpottingGame ? (
              <SpottingGameClient />
            ) : isZombieOnslaught ? (
              <ZombieShooterWrapper />
            ) : isCoinFlip ? (
              <CoinFlipClient />
            ) : isHoleInOne ? (
              <HoleInOneWrapper />
            ) : isCircleDefense ? (
              <TowerDefenseWrapper />
            ) : isOverclock ? (
              <OverclockWrapper />
            ) : isVectorDrift ? (
              <VectorDriftWrapper />
            ) : (
              <>
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Game canvas
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Phaser mount point
                </h2>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  This area is ready for your Phaser 3 game instance. Drop in the
                  game bundle when you are ready to ship.
                </p>
                <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-100/60 py-16 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                  Game loading area
                </div>
              </>
            )}
          </section>

          <aside className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Leaderboard
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Scores will appear here once the game is live.
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                <span>1. Coming soon</span>
                <span>—</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                <span>2. Coming soon</span>
                <span>—</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                <span>3. Coming soon</span>
                <span>—</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
