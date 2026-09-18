"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function FloatingPaths({ position }: { position: number }) {
    // Built once. Upstream rebuilds this inline and rolls Math.random() inside
    // the transition, so every re-render handed framer-motion 72 fresh
    // durations and restarted the animations mid-flight - visible as a jump.
    const paths = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(15,23,42,${0.1 + i * 0.03})`,
        width: 0.5 + i * 0.03,
        duration: 20 + Math.random() * 10,
    })), [position]);

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-slate-950 dark:text-white"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.1 + path.id * 0.03}
                        // pathLength and opacity are set once and left alone.
                        // Animating pathLength 0.3 -> 1 on a looping repeat grew
                        // each line then snapped it back to a third of its
                        // length every cycle, and the opacity keyframes pulsed
                        // it bright and dim on the way. Only the offset moves
                        // now, one direction at a constant rate, and it wraps
                        // seamlessly because a dash pattern is periodic.
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{ pathOffset: [0, 1] }}
                        transition={{
                            duration: path.duration,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({
    title = "Background Paths",
    ctaHref,
    ctaLabel = "Discover Excellence",
}: {
    title?: string;
    /**
     * Turns the call to action into a real link. Left to the caller rather than
     * hardcoded here, because the section worth scrolling to belongs to the
     * page, not to this backdrop. Without it the button renders as before - and
     * does nothing, which is how it arrived from upstream.
     */
    ctaHref?: string;
    ctaLabel?: string;
}) {
    const words = title.split(" ");

    const ctaContent = (
        <>
            <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                {ctaLabel}
            </span>
            <span
                className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5
                transition-all duration-300"
            >
                →
            </span>
        </>
    );

    return (
        <div className="relative min-h-dvh w-full flex items-center justify-center overflow-hidden bg-white dark:bg-transparent">
            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            {/* Vertical padding rather than pure centring: the page header and
                the scroll cue are absolutely positioned over this, and on a
                phone-sized viewport the title otherwise runs under both. */}
            <div className="relative z-10 container mx-auto px-4 py-24 md:px-6 md:py-28 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-4xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="inline-block mr-4 last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay:
                                                wordIndex * 0.1 +
                                                letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block text-transparent bg-clip-text
                                        bg-gradient-to-r from-neutral-900 to-neutral-700/80
                                        dark:from-white dark:to-white/80"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <div
                        className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10
                        dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg
                        overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                        <Button
                            asChild={Boolean(ctaHref)}
                            variant="ghost"
                            className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md
                            bg-white/95 hover:bg-white/100 dark:bg-black/95 dark:hover:bg-black/100
                            text-black dark:text-white transition-all duration-300
                            group-hover:-translate-y-0.5 border border-black/10 dark:border-white/10
                            hover:shadow-md dark:hover:shadow-neutral-800/50"
                        >
                            {ctaHref ? <a href={ctaHref}>{ctaContent}</a> : ctaContent}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
