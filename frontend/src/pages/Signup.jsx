import { useState } from "react";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { supabase } from "../lib/supabase";

function Signup({ onLogin }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSignup = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Your passwords don't match.");
            return;
        }

        if (password.length < 6) {
            setError("Your password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            setSuccess(
                "Account created. Check your email to verify your account."
            );
        }

        setLoading(false);
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
                            Create your account.
                        </h1>

                        <p className="mt-2 text-sm leading-5 text-neutral-500">
                            Start making sense of where your money goes.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSignup}
                        className="space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-[13px] font-medium text-neutral-700"
                            >
                                Name
                            </label>

                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Your name"
                                autoComplete="name"
                                required
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="signup-email"
                                className="mb-1.5 block text-[13px] font-medium text-neutral-700"
                            >
                                Email
                            </label>

                            <input
                                id="signup-email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="signup-password"
                                className="mb-1.5 block text-[13px] font-medium text-neutral-700"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="signup-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="At least 6 characters"
                                    autoComplete="new-password"
                                    required
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 pr-11 text-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (current) => !current
                                        )
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

                        <div>
                            <label
                                htmlFor="confirm-password"
                                className="mb-1.5 block text-[13px] font-medium text-neutral-700"
                            >
                                Confirm password
                            </label>

                            <div className="relative">
                                <input
                                    id="confirm-password"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your password again"
                                    autoComplete="new-password"
                                    required
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 pr-11 text-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            (current) => !current
                                        )
                                    }
                                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={17} />
                                    ) : (
                                        <Eye size={17} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs leading-4 text-red-700">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2.5 text-xs leading-4 text-green-700">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Creating account..."
                                : "Create account"}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
                        <span>Already have an account?</span>

                        <button
                            type="button"
                            onClick={onLogin}
                            className="font-medium text-neutral-900 hover:underline hover:underline-offset-3"
                        >
                            Sign in
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

export default Signup;