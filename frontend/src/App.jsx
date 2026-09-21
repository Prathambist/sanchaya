import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";

import { supabase } from "./lib/supabase";

import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";


/*
 * Shown while the Supabase session resolves — i.e. the very first thing
 * a user sees on every cold load, so it carries the brand rather than
 * unstyled "Loading..." text.
 */
function AppLoading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f5]">

            <motion.div
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.85, 1, 0.85],
                }}
                transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-base font-semibold text-white"
            >
                S
            </motion.div>


            <p className="mt-4 text-sm text-neutral-400">
                Loading your workspace…
            </p>

        </div>
    );
}


function App() {
    const [session, setSession] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [showSignup, setShowSignup] =
        useState(false);


    useEffect(() => {
        const initializeSession =
            async () => {
                const {
                    data: {
                        session,
                    },
                } =
                    await supabase.auth.getSession();

                setSession(session);
                setLoading(false);
            };


        initializeSession();


        const {
            data: {
                subscription,
            },
        } =
            supabase.auth.onAuthStateChange(
                (_event, session) => {
                    setSession(session);
                }
            );


        return () => {
            subscription.unsubscribe();
        };
    }, []);


    const content =
        loading
            ? <AppLoading />
            : session
              ? <AuthenticatedApp />
              : showSignup
                ? (
                    <Signup
                        onLogin={() =>
                            setShowSignup(false)
                        }
                    />
                )
                : (
                    <Login
                        onSignup={() =>
                            setShowSignup(true)
                        }
                    />
                );


    return (
        <ErrorBoundary>

            <MotionConfig reducedMotion="user">

                <ToastProvider>
                    {content}
                </ToastProvider>

            </MotionConfig>

        </ErrorBoundary>
    );
}


function AuthenticatedApp() {
    return (
        <BrowserRouter>

            <Routes>

                <Route element={<AppLayout />}>

                    <Route
                        path="/"
                        element={
                            <Dashboard />
                        }
                    />

                    <Route
                        path="/transactions"
                        element={
                            <Transactions />
                        }
                    />

                    <Route
                        path="/budgets"
                        element={
                            <Budgets />
                        }
                    />

                    <Route
                        path="/goals"
                        element={
                            <Goals />
                        }
                    />

                    <Route
                        path="/analytics"
                        element={
                            <Analytics />
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <Settings />
                        }
                    />


                    {/* Unknown paths fall back to the dashboard
                        instead of rendering a blank page. */}
                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/"
                                replace
                            />
                        }
                    />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}


export default App;