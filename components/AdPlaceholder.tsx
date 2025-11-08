// components/AdPlaceholder.tsx

export default function AdPlaceholder({ type }: { type: "sidebar" | "banner" }) {
    const base =
        "bg-zinc-100 dark:bg-zinc-800 border border-dashed border-zinc-400 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-sm italic";

    if (type === "sidebar") {
        return (
            <div className={`${base} w-full h-[500px] rounded-lg`}>
                <span>Ad placeholder — real ads coming soon</span>
            </div>
        );
    }

    return (
        <div className={`${base} w-full h-[90px] rounded-lg`}>
            <span>Mobile banner placeholder — ads coming soon</span>
        </div>
    );
}