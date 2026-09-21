import { useEffect, useState } from "react";

import {
    NavLink,
    Outlet,
    useLocation,
} from "react-router-dom";

import {
    AnimatePresence,
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
    Menu,
    X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

import { springs } from "../lib/motion";

import PageTransition from "../components/PageTransition";


/*
 * Shared by every sidebar link (the mapped workspace routes and the
 * standalone Settings link) so the active-surface, hover-surface and
 * icon animations only need to be defined once. `activeLayoutId` is
 * namespaced per sidebar instance (desktop vs. mobile drawer) so the
 * shared-layout highlight doesn't try to animate from a hidden
 * (display:none) desktop element into the drawer, or vice versa.
 */
function NavItem({
    to,
    end,
    icon: Icon,
    label,
    activeLayoutId,
    onNavigate,
}) {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className="group relative block rounded-lg px-3 py-3 text-sm outline-none"
        >

            {({
                isActive,
            }) => (
                <>

                    {/* Sliding active surface */}

                    {isActive && (
                        <motion.div
                            layoutId={activeLayoutId}
                            className="absolute inset-0 rounded-lg bg-neutral-100"
                            transition={
                                springs.nav
                            }
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
                        transition={
                            springs.snappy
                        }
                    >

                        <motion.div
                            animate={{
                                scale: isActive
                                    ? 1.08
                                    : 1,
                            }}
                            transition={
                                springs.smooth
                            }
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
    );
}


/*
 * The full sidebar (logo, nav links, settings, sign out). Rendered
 * once for the always-visible desktop rail and once inside the
 * mobile drawer, so both stay in sync with a single source of truth.
 */
function SidebarContent({
    navigation,
    activeLayoutId,
    onNavigate,
    onLogout,
}) {
    return (
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
                    transition={
                        springs.snappy
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white"
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
                            icon,
                        }) => (
                            <NavItem
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
                                icon={
                                    icon
                                }
                                label={
                                    label
                                }
                                activeLayoutId={
                                    activeLayoutId
                                }
                                onNavigate={
                                    onNavigate
                                }
                            />
                        )
                    )}

                </nav>

            </div>


            {/* Bottom navigation */}

            <div className="mt-auto border-t border-neutral-100 pt-4">

                {/* Settings */}

                <NavItem
                    to="/settings"
                    icon={Settings}
                    label="Settings"
                    activeLayoutId={activeLayoutId}
                    onNavigate={onNavigate}
                />


                {/* Sign out */}

                <motion.button
                    type="button"
                    onClick={
                        onLogout
                    }
                    whileHover={{
                        x: 3,
                    }}
                    whileTap={{
                        scale: 0.98,
                    }}
                    transition={
                        springs.snappy
                    }
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
    );
}


function AppLayout() {
    const [user, setUser] =
        useState(null);

    const [isMobileNavOpen, setMobileNavOpen] =
        useState(false);

    const location =
        useLocation();


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


    // Close the drawer whenever the route changes (covers link taps,
    // browser back/forward, and programmatic navigation alike).
    useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname]);


    // Prevent the page behind the drawer from scrolling while it's open.
    useEffect(() => {
        if (!isMobileNavOpen) {
            return;
        }

        const {
            overflow,
        } = document.body.style;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = overflow;
        };
    }, [isMobileNavOpen]);


    // Let Escape close the drawer, matching the backdrop click affordance.
    useEffect(() => {
        if (!isMobileNavOpen) {
            return;
        }

        const handleKeyDown =
            (event) => {
                if (event.key === "Escape") {
                    setMobileNavOpen(false);
                }
            };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMobileNavOpen]);


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
                SIDEBAR (desktop)
            ===================================================== */}

            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-neutral-200 bg-white lg:flex lg:flex-col">

                <SidebarContent
                    navigation={navigation}
                    activeLayoutId="smartbudget-active-nav-desktop"
                    onLogout={handleLogout}
                />

            </aside>


            {/* =====================================================
                SIDEBAR (mobile drawer)
            ===================================================== */}

            <AnimatePresence>

                {isMobileNavOpen && (
                    <>

                        <motion.div
                            key="nav-backdrop"
                            className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm lg:hidden"
                            initial={{
                                opacity: 0,
                            }}
                            animate={{
                                opacity: 1,
                            }}
                            exit={{
                                opacity: 0,
                            }}
                            transition={{
                                duration: 0.2,
                            }}
                            onClick={() =>
                                setMobileNavOpen(false)
                            }
                        />


                        <motion.aside
                            key="nav-drawer"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Navigation"
                            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl lg:hidden"
                            initial={{
                                x: "-100%",
                            }}
                            animate={{
                                x: 0,
                            }}
                            exit={{
                                x: "-100%",
                            }}
                            transition={
                                springs.page
                            }
                        >

                            <button
                                type="button"
                                onClick={() =>
                                    setMobileNavOpen(false)
                                }
                                aria-label="Close navigation"
                                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
                            >
                                <X size={20} />
                            </button>


                            <SidebarContent
                                navigation={navigation}
                                activeLayoutId="smartbudget-active-nav-mobile"
                                onNavigate={() =>
                                    setMobileNavOpen(false)
                                }
                                onLogout={handleLogout}
                            />

                        </motion.aside>

                    </>
                )}

            </AnimatePresence>


            {/* =====================================================
                APPLICATION
            ===================================================== */}

            <div className="lg:pl-64">

                {/* Top bar */}

                <header className="sticky top-0 z-30 flex h-16 items-center border-b border-neutral-200 bg-white/90 px-5 backdrop-blur-md sm:px-7">

                    <button
                        type="button"
                        onClick={() =>
                            setMobileNavOpen(true)
                        }
                        aria-label="Open navigation"
                        className="-ml-2 mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 lg:hidden"
                    >
                        <Menu size={20} />
                    </button>


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
                            transition={
                                springs.smooth
                            }
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-600"
                        >
                            {
                                initials
                            }
                        </motion.div>

                    </div>

                </header>


                {/* Main */}

                <main className="mx-auto max-w-350 px-4 py-6 sm:px-7 sm:py-8">

                    <PageTransition>
                        <Outlet />
                    </PageTransition>

                </main>

            </div>

        </div>
    );
}


export default AppLayout;
