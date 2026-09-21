import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    AnimatePresence,
    motion,
} from "framer-motion";

import {
    CheckCircle2,
    AlertCircle,
    Info,
    X,
} from "lucide-react";

import { springs } from "../lib/motion";


const ToastContext =
    createContext(null);


const DEFAULT_DURATION = 3500;


const toneStyles = {
    success: {
        icon: CheckCircle2,
        iconClass: "text-emerald-600",
        ringClass: "ring-emerald-100",
    },

    error: {
        icon: AlertCircle,
        iconClass: "text-red-600",
        ringClass: "ring-red-100",
    },

    info: {
        icon: Info,
        iconClass: "text-neutral-500",
        ringClass: "ring-neutral-100",
    },
};


export function ToastProvider({
    children,
}) {
    const [toasts, setToasts] =
        useState([]);

    const timers =
        useRef(new Map());


    const dismiss =
        useCallback((id) => {
            const timer =
                timers.current.get(id);

            if (timer) {
                clearTimeout(timer);
                timers.current.delete(id);
            }

            setToasts((current) =>
                current.filter(
                    (item) => item.id !== id
                )
            );
        }, []);


    const push =
        useCallback(
            (message, tone = "info", duration = DEFAULT_DURATION) => {
                if (!message) {
                    return;
                }

                const id =
                    `${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2, 7)}`;

                setToasts((current) => [
                    ...current.slice(-2),
                    {
                        id,
                        message,
                        tone,
                    },
                ]);

                timers.current.set(
                    id,
                    setTimeout(() => {
                        dismiss(id);
                    }, duration)
                );
            },
            [dismiss]
        );


    const value =
        useMemo(
            () => ({
                toast: {
                    success: (message, duration) =>
                        push(message, "success", duration),

                    error: (message, duration) =>
                        push(message, "error", duration),

                    info: (message, duration) =>
                        push(message, "info", duration),
                },
            }),
            [push]
        );


    return (
        <ToastContext.Provider
            value={value}
        >

            {children}


            {/*
             * Bottom-centred on phones so it clears the thumb zone and
             * never covers a modal's action row; bottom-right on desktop.
             */}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end">

                <AnimatePresence initial={false}>

                    {toasts.map(
                        ({
                            id,
                            message,
                            tone,
                        }) => {
                            const {
                                icon: Icon,
                                iconClass,
                                ringClass,
                            } =
                                toneStyles[tone] ||
                                toneStyles.info;

                            return (
                                <motion.div
                                    key={id}
                                    layout
                                    initial={{
                                        opacity: 0,
                                        y: 16,
                                        scale: 0.96,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        y: 8,
                                        scale: 0.96,
                                    }}
                                    transition={
                                        springs.content
                                    }
                                    className={[
                                        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg ring-4",
                                        ringClass,
                                    ].join(" ")}
                                >

                                    <Icon
                                        size={18}
                                        strokeWidth={2}
                                        className={[
                                            "mt-0.5 shrink-0",
                                            iconClass,
                                        ].join(" ")}
                                    />


                                    <p className="flex-1 text-sm text-neutral-700">
                                        {message}
                                    </p>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            dismiss(id)
                                        }
                                        aria-label="Dismiss notification"
                                        className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                                    >
                                        <X size={14} />
                                    </button>

                                </motion.div>
                            );
                        }
                    )}

                </AnimatePresence>

            </div>

        </ToastContext.Provider>
    );
}


export function useToast() {
    const context =
        useContext(
            ToastContext
        );


    if (!context) {
        throw new Error(
            "useToast must be used inside ToastProvider."
        );
    }


    return context.toast;
}
