import Link from "next/link";
import { games } from "@/lib/games";

export const metadata = {
  title: "Games — E. Wesley Espinoza",
  description: "Play Phaser 3 games and compete on the leaderboard.",
};

export default function GamesPage() {
  return (
    <main className="bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900 min-h-screen px-4 sm:px-6 md:px-8 py-10 sm:py-16 font-sans">
      <section className="mx-auto w-full max-w-5xl">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Phaser 3 Arcade
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Games & Leaderboards
          </h1>
          <p className="mt-3 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Play Phaser 3 experiments as they ship. Each title will have a dedicated
            leaderboard so friends can compete for the top score.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {games.map((game) => (
            <article
              key={game.slug}
              className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/70"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {game.title}
                </h2>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {game.status === "live" ? "Live" : "Coming soon"}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                {game.description}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Link
                  href={`/games/${game.slug}`}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  View game
                </Link>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Leaderboard ready on launch
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
