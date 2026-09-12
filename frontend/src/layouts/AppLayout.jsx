import { useEffect, useState } from "react";

import {
    NavLink,
    Outlet,
} from "react-router-dom";

import {
    motion,
} from "framer-motion";

import {
    LayoutDashboard,
    ArrowLeftRight,
    WalletCards,
    Target,
    BarChart3,
    Settings,
    LogOut,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import PageTransition from "../components/PageTransition";


function AppLayout() {
    const [user, setUser] =
        useState(null);


    useEffect(() => {
        const getUser =
            async () => {
                const {
                    data: {
                        user,
                    },
                } =
                    await supabase.auth.getUser();

                setUser(user);
            };


        getUser();
    }, []);


    const navigation = [
        {
            label: "Overview",
            path: "/",
            icon: LayoutDashboard,
        },
        {
            label: "Transactions",
            path: "/transactions",
            icon: ArrowLeftRight,
        },
        {
            label: "Budgets",
            path: "/budgets",
            icon: WalletCards,
        },
        {
            label: "Goals",
            path: "/goals",
            icon: Target,
        },
        {
            label: "Analytics",
            path: "/analytics",
            icon: BarChart3,
        },
    ];


    const handleLogout =
        async () => {
            await supabase.auth.signOut();
        };


    const displayName =
        user?.user_metadata?.name ||
        user?.email
            ?.split("@")[0] ||
        "Account";


    const initials =
        displayName
            .charAt(0)
            .toUpperCase();


    return (
        <div className="min-h-screen bg-[#f7f7f5] text-neutral-900">

            {/* =====================================================
                SIDEBAR
            ===================================================== */}

            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-neutral-200 bg-white lg:flex lg:flex-col">

                <div className="flex h-full flex-col px-4 py-5">

                    {/* Logo */}

                    <div className="flex items-center gap-3 px-3">

                        <motion.div
                            whileHover={{
                                scale: 1.06,
                                rotate: 1,
                            }}
                            whileTap={{
                                scale: 0.94,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 25,
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white"
                        >
                            S
                        </motion.div>


                        <span className="text-base font-semibold tracking-tight">
                            Sanchaya
                        </span>

                    </div>


                    {/* Navigation */}

                    <div className="mt-10">

                        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                            Workspace
                        </p>


                        <nav className="mt-3 space-y-1">

                            {navigation.map(
                                ({
                                    label,
                                    path,
                                    icon: Icon,
                                }) => (

                                    <NavLink
                                        key={
                                            path
                                        }
                                        to={
                                            path
                                        }
                                        end={
                                            path ===
                                            "/"
                                        }
                                        className="group relative block rounded-lg px-3 py-3 text-sm outline-none"
                                    >

                                        {({
                                            isActive,
                                        }) => (
                                            <>

                                                {/* Sliding active surface */}

                                                {isActive && (
                                                    <motion.div
                                                        layoutId="smartbudget-active-nav"
                                                        className="absolute inset-0 rounded-lg bg-neutral-100"
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 480,
                                                            damping: 34,
                                                            mass: 0.55,
                                                        }}
                                                    />
                                                )}


                                                {/* Hover surface */}

                                                {!isActive && (
                                                    <motion.div
                                                        className="absolute inset-0 rounded-lg bg-neutral-50"
                                                        initial={{
                                                            opacity: 0,
                                                        }}
                                                        whileHover={{
                                                            opacity: 1,
                                                        }}
                                                        transition={{
                                                            duration: 0.15,
                                                        }}
                                                    />
                                                )}


                                                {/* Icon + label */}

                                                <motion.div
                                                    className={[
                                                        "relative z-10 flex items-center gap-3",
                                                        isActive
                                                            ? "font-medium text-neutral-900"
                                                            : "text-neutral-500",
                                                    ].join(
                                                        " "
                                                    )}
                                                    whileHover={{
                                                        x: 2,
                                                    }}
                                                    whileTap={{
                                                        scale: 0.98,
                                                    }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 500,
                                                        damping: 30,
                                                    }}
                                                >

                                                    <motion.div
                                                        animate={{
                                                            scale: isActive
                                                                ? 1
                                                                : 1,
                                                        }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 450,
                                                            damping: 28,
                                                        }}
                                                    >

                                                        <Icon
                                                            size={
                                                                18
                                                            }
                                                            strokeWidth={
                                                                isActive
                                                                    ? 2
                                                                    : 1.8
                                                            }
                                                        />

                                                    </motion.div>


                                                    <span>
                                                        {
                                                            label
                                                        }
                                                    </span>

                                                </motion.div>

                                            </>
                                        )}

                                    </NavLink>
                                )
                            )}

                        </nav>

                    </div>


                    {/* Bottom navigation */}

                    <div className="mt-auto border-t border-neutral-100 pt-4">

                        {/* Settings */}

                        <NavLink
                            to="/settings"
                            className="group relative block rounded-lg px-3 py-3 text-sm outline-none"
                        >

                            {({
                                isActive,
                            }) => (
                                <>

                                    {isActive && (
                                        <motion.div
                                            layoutId="smartbudget-active-nav"
                                            className="absolute inset-0 rounded-lg bg-neutral-100"
                                            transition={{
                                                type: "spring",
                                                stiffness: 480,
                                                damping: 34,
                                                mass: 0.55,
                                            }}
                                        />
                                    )}


                                    {!isActive && (
                                        <motion.div
                                            className="absolute inset-0 rounded-lg bg-neutral-50"
                                            initial={{
                                                opacity: 0,
                                            }}
                                            whileHover={{
                                                opacity: 1,
                                            }}
                                        />
                                    )}


                                    <motion.div
                                        className={[
                                            "relative z-10 flex items-center gap-3",
                                            isActive
                                                ? "font-medium text-neutral-900"
                                                : "text-neutral-500",
                                        ].join(
                                            " "
                                        )}
                                        whileHover={{
                                            x: 2,
                                        }}
                                        whileTap={{
                                            scale: 0.98,
                                        }}
                                    >

                                        <Settings
                                            size={18}
                                            strokeWidth={
                                                isActive
                                                    ? 2
                                                    : 1.8
                                            }
                                        />

                                        <span>
                                            Settings
                                        </span>

                                    </motion.div>

                                </>
                            )}

                        </NavLink>


                        {/* Sign out */}

                        <motion.button
                            type="button"
                            onClick={
                                handleLogout
                            }
                            whileHover={{
                                x: 3,
                            }}
                            whileTap={{
                                scale: 0.98,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                            }}
                            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                        >

                            <LogOut
                                size={18}
                                strokeWidth={1.8}
                            />

                            <span>
                                Sign out
                            </span>

                        </motion.button>

                    </div>

                </div>

            </aside>


            {/* =====================================================
                APPLICATION
            ===================================================== */}

            <div className="lg:pl-64">

                {/* Top bar */}

                <header className="sticky top-0 z-30 flex h-16 items-center border-b border-neutral-200 bg-white/90 px-5 backdrop-blur-md sm:px-7">

                    <div className="font-semibold tracking-tight lg:hidden">
                        Sanchaya
                    </div>


                    <div className="ml-auto flex items-center gap-3">

                        <div className="hidden text-right sm:block">

                            <p className="text-xs font-medium text-neutral-700">
                                {
                                    displayName
                                }
                            </p>

                            <p className="text-[11px] text-neutral-400">
                                {
                                    user?.email
                                }
                            </p>

                        </div>


                        <motion.div
                            whileHover={{
                                scale: 1.06,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 450,
                                damping: 25,
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-600"
                        >
                            {
                                initials
                            }
                        </motion.div>

                    </div>

                </header>


                {/* Main */}

                <main className="mx-auto max-w-350 px-5 py-7 sm:px-7 sm:py-8">

                    <PageTransition>
                        <Outlet />
                    </PageTransition>

                </main>

            </div>

        </div>
    );
}


export default AppLayout;