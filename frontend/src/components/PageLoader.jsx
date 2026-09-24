import { useEffect, useState } from "react";

import {
    AnimatePresence,
    motion,
} from "framer-motion";


const COIN_COUNT = 5;

const CYCLE_SECONDS = 2.2;

const messages = [
    "Counting your coins…",
    "Balancing the books…",
    "Crunching the numbers…",
    "Tallying up your savings…",
];


/*
 * Each coin drops onto the stack in turn, settles with a small bounce,
 * then the whole stack sinks and fades ("deposited") before the cycle
 * repeats. All coins share one cycle length so they stay in sync.
 */
function coinAnimation(index) {
    const dropStart = 0.06 + index * 0.1;
    const landed = dropStart + 0.09;

    return {
        animate: {
            y: [-56, -56, 0, -3, 0, 0, 10, 10],
            opacity: [0, 0, 1, 1, 1, 1, 0, 0],
        },
        transition: {
            duration: CYCLE_SECONDS,
            times: [
                0,
                dropStart,
                landed,
                landed + 0.03,
                landed + 0.06,
                0.8,
                0.92,
                1,
            ],
            ease: [
                "linear",
                "easeIn",
                "easeOut",
                "easeIn",
                "linear",
                "easeIn",
                "linear",
            ],
            repeat: Infinity,
        },
    };
}


function PageLoader({
    label = "Loading",
}) {
    const [messageIndex, setMessageIndex] =
        useState(0);

    const [isSlow, setIsSlow] =
        useState(false);


    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(
                (current) =>
                    (current + 1) % messages.length
            );
        }, 1400);

        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        const timer = setTimeout(
            () => setIsSlow(true),
            5000
        );

        return () => clearTimeout(timer);
    }, []);


    /*
     * The outer AnimatePresence is load-bearing, not decorative.
     * PageTransition's AnimatePresence uses initial={false}, and
     * framer-motion keeps that flag in the presence context for the
     * whole lifetime of the first page rendered after a refresh — so
     * every motion component inside that page skips its mount
     * animation, which would leave these looping coins frozen. A
     * nested AnimatePresence (default initial) gives this subtree a
     * fresh context.
     */
    return (
        <AnimatePresence>

            <motion.div
                key="page-loader"
                role="status"
                aria-live="polite"
                className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center"
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.25,
                }}
            >

                <div
                    aria-hidden="true"
                    className="relative h-20 w-20"
                >

                    <div className="absolute inset-x-0 bottom-0 mx-auto h-2 w-16 rounded-[50%] bg-neutral-900/10 blur-[2px]" />


                    {Array.from({
                        length: COIN_COUNT,
                    }).map((_, index) => {
                        const {
                            animate,
                            transition,
                        } = coinAnimation(index);

                        return (
                            <motion.div
                                key={index}
                                className="absolute inset-x-0 mx-auto h-3 w-14 rounded-[50%] border border-amber-600/40 bg-linear-to-b from-amber-200 to-amber-400 shadow-sm"
                                style={{
                                    bottom: 6 + index * 7,
                                }}
                                initial={{
                                    opacity: 0,
                                    y: -56,
                                }}
                                animate={animate}
                                transition={transition}
                            />
                        );
                    })}

                </div>


                <p className="mt-6 text-sm font-medium text-neutral-800">
                    {label}
                </p>


                <div className="relative mt-1.5 h-5 w-full overflow-hidden">

                    <AnimatePresence
                        mode="wait"
                        initial={false}
                    >

                        <motion.p
                            key={messageIndex}
                            className="text-xs text-neutral-400"
                            initial={{
                                opacity: 0,
                                y: 6,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                y: -6,
                            }}
                            transition={{
                                duration: 0.2,
                            }}
                        >
                            {messages[messageIndex]}
                        </motion.p>

                    </AnimatePresence>

                </div>


                <AnimatePresence>

                    {isSlow && (
                        <motion.p
                            key="slow-hint"
                            className="mt-5 max-w-xs text-xs leading-relaxed text-neutral-400"
                            initial={{
                                opacity: 0,
                                y: 4,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            transition={{
                                duration: 0.3,
                            }}
                        >
                            Still working — the server may be waking up. The first load can take up to a minute.
                        </motion.p>
                    )}

                </AnimatePresence>

            </motion.div>

        </AnimatePresence>
    );
}


export default PageLoader;
