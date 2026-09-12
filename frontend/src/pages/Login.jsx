import { useState } from "react";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { supabase } from "../lib/supabase";

function Login({ onSignup }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    console.log("Starting login...");

    try {
        const loginPromise = supabase.auth.signInWithPassword({
            email,
            password,
        });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(
                    new Error(
                        "Login request timed out. Please check your connection and try again."
                    )
                );
            }, 10000);
        });

        const { data, error } = await Promise.race([
            loginPromise,
            timeoutPromise,
        ]);

        console.log("Login response:", {
            data,
            error,
        });

        if (error) {
            if (
                error.message
                    .toLowerCase()
                    .includes("invalid login")
            ) {
                setError(
                    "The email or password doesn't look right."
                );
            } else {
                setError(error.message);
            }

            return;
        }
    } catch (error) {
        console.error("Login failed:", error);

        setError(
            error.message ||
                "Something went wrong. Please try again."
        );
    } finally {
        setLoading(false);
    }
};

    return (
        <main className="min-h-screen bg-[#f7f7f5] px-4 py-8 text-neutral-900 sm:px-6">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[410px] flex-col justify-center">
                <div className="mb-8 flex items-center justify-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
                        <Wallet size={16} strokeWidth={2} />
                    </div>

                    <span className="text-[15px] font-semibold tracking-tight">
                        Sanchaya
                    </span>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:p-8">
                    <div className="mb-7">
                        <h1 className="text-[26px] font-semibold tracking-[-0.7px]">
                            Welcome back.
                        </h1>

                        <p className="mt-2 text-sm leading-5 text-neutral-500">
                            A calmer way to keep track of your money.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-[13px] font-medium text-neutral-700"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5"
                            />
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="text-[13px] font-medium text-neutral-700"
                                >
                                    Password
                                </label>

                                <button
                                    type="button"
                                    className="text-xs text-neutral-500 transition hover:text-neutral-900"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 pr-11 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (current) => !current
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                                >
                                    {showPassword ? (
                                        <EyeOff size={17} />
                                    ) : (
                                        <Eye size={17} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-500">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(event) =>
                                    setRememberMe(event.target.checked)
                                }
                                className="h-3.5 w-3.5 rounded border-neutral-300 accent-neutral-900"
                            />

                            <span>Remember me</span>
                        </label>

                        {error && (
                            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs leading-4 text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
                        <span>New to Sanchaya?</span>

                        <button
                            type="button"
                            onClick={onSignup}
                            className="font-medium text-neutral-900 hover:underline hover:underline-offset-3"
                        >
                            Create an account
                        </button>
                    </div>
                </div>

                <p className="mt-5 text-center text-[11px] text-neutral-400">
                    Your financial data is private and securely stored.
                </p>
            </div>
        </main>
    );
}

export default Login;