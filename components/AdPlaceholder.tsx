// components/AdPlaceholder.tsx

export default function AdPlaceholder({ type }: { type: "sidebar" | "banner" }) {
    const base = "bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 flex items-center justify-center";

    if (type === "sidebar") {
        return <div className={`${base} w-full h-[500px] rounded-lg`}>Ad Space</div>;
    }

    return <div className={`${base} w-full h-[90px] rounded-lg`}>Ad Banner</div>;
}