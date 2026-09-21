import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";
import { MotionConfig } from "framer-motion";

import { supabase } from "./lib/supabase";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";


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


    if (loading) {
        return (
            <div className="app-loading">
                Loading...
            </div>
        );
    }


    if (!session) {
        if (showSignup) {
            return (
                <Signup
                    onLogin={() =>
                        setShowSignup(false)
                    }
                />
            );
        }


        return (
            <Login
                onSignup={() =>
                    setShowSignup(true)
                }
            />
        );
    }


    return <AuthenticatedApp />;
}


function AuthenticatedApp() {
    return (
        <MotionConfig reducedMotion="user">

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

                    </Route>

                </Routes>

            </BrowserRouter>

        </MotionConfig>
    );
}


export default App;