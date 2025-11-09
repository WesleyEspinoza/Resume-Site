// components/AdPlaceholder.tsx
export default function AdPlaceholder({ type }: { type: "sidebar" | "banner" }) {
    const base =
        "bg-zinc-100 dark:bg-zinc-800 border border-dashed border-zinc-400 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-xs italic p-2";

    if (type === "sidebar") {
        return (
            <div className={`${base} w-full h-[500px] rounded-lg`}>
                <span>Support space</span>
            </div>
        );
    }

    return (
        <div className={`${base} w-full h-[90px] rounded-lg`}>
            <span>Support banner space</span>
        </div>
    );
}
