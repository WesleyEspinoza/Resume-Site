"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ZombieShooterClient = dynamic(() => import("./ZombieShooterClient"), {
  ssr: false,
});

export default function ZombieShooterWrapper() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (isLoaded) {
    return <ZombieShooterClient autoStart />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
          Zombie Onslaught
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Loading game
        </h2>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 px-4 py-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/70 dark:text-zinc-200">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Arming the defenses...
        </p>
        <span className="loader" aria-label="Loading" />
      </div>
      <style jsx>{`
        .loader {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          border: 3px solid rgba(148, 163, 184, 0.35);
          border-top-color: #f43f5e;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
