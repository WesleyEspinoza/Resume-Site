export type GameEntry = {
  slug: string;
  title: string;
  description: string;
  status: "coming-soon" | "live";
  thumbnail?: string;
};

export const games: GameEntry[] = [
  {
    slug: "aim-trainer",
    title: "Aim Trainer",
    description:
      "Two modes to sharpen precision: trace a moving orb or react to popping targets.",
    status: "live",
  },
  {
    slug: "floppyball",
    title: "Floppy Ball",
    description:
      "A Flappy Bird-inspired challenge. Tap or press space to glide through the gaps.",
    status: "live",
  },
  {
    slug: "typing-accuracy",
    title: "Typing Accuracy",
    description:
      "Thirty-second accuracy sprint. Keep your streak clean and precise.",
    status: "live",
  },
  {
    slug: "spotting-game",
    title: "Spotting Game",
    description:
      "Find the target letter, number, or shape hidden in the crowd within 30 seconds.",
    status: "live",
  },
  {
    slug: "hole-in-one",
    title: "Hole In One",
    description:
      "Top-down golf fling. Pull, release, and sink it in one stroke.",
    status: "live",
  },
  {
    slug: "coin-flip",
    title: "Coin Flip",
    description:
      "Flip for heads and build a streak. The run ends on the first tails.",
    status: "live",
  },
  {
    slug: "zombie-onslaught",
    title: "Zombie Onslaught",
    description:
      "Twin stick survival. Dodge the horde and see how long you can last.",
    status: "live",
  },
  {
    slug: "circle-defense",
    title: "Circle Defense",
    description:
      "Place circle towers and hold the lane as square enemies grow tougher every wave.",
    status: "live",
  },
  {
    slug: "overclock",
    title: "Overclock",
    description:
      "Four-minute idle run. Overclock your reactor and chase the biggest Power.",
    status: "live",
  },
  {
    slug: "vector-drift",
    title: "Vector Drift",
    description:
      "Inertia-run dodger. Drift fast, skim obstacles, and chase the highest score.",
    status: "live",
  },
];
