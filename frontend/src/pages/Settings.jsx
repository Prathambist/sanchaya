import { useEffect, useState } from "react";
import {
    UserRound,
    Mail,
    LockKeyhole,
    LogOut,
    Save,
    Eye,
    EyeOff,
    Globe2,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import {
    useCurrency,
} from "../context/CurrencyContext";
import { useMinimumLoading } from "../hooks/useMinimumLoading";
import PageLoader from "../components/PageLoader";
import Reveal from "../components/Reveal";


function Settings() {
    const {
        currency,
        currencies,
        setCurrency,
        ratesLoading,
        rateError,
    } = useCurrency();


    const [user, setUser] =
        useState(null);

    const [loadingUser, setLoadingUser] =
        useState(true);


    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");


    const [
        savingProfile,
        setSavingProfile,
    ] = useState(false);

    const [
        profileMessage,
        setProfileMessage,
    ] = useState("");

    const [
        profileError,
        setProfileError,
    ] = useState("");


    const [
        currentPassword,
        setCurrentPassword,
    ] = useState("");

    const [
        newPassword,
        setNewPassword,
    ] = useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");


    const [
        showCurrentPassword,
        setShowCurrentPassword,
    ] = useState(false);

    const [
        showNewPassword,
        setShowNewPassword,
    ] = useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);


    const [
        changingPassword,
        setChangingPassword,
    ] = useState(false);

    const [
        passwordMessage,
        setPasswordMessage,
    ] = useState("");

    const [
        passwordError,
        setPasswordError,
    ] = useState("");


    const [
        signingOut,
        setSigningOut,
    ] = useState(false);


    const [
        currencyMessage,
        setCurrencyMessage,
    ] = useState("");


    useEffect(() => {
        const loadUser =
            async () => {
                try {
                    const {
                        data: {
                            user,
                        },
                        error,
                    } =
                        await supabase.auth.getUser();


                    if (error) {
                        throw error;
                    }


                    if (!user) {
                        return;
                    }


                    setUser(user);

                    setName(
                        user.user_metadata
                            ?.name || ""
                    );

                    setEmail(
                        user.email || ""
                    );
                } catch (error) {
                    console.error(error);

                    setProfileError(
                        "Unable to load your account details."
                    );
                } finally {
                    setLoadingUser(
                        false
                    );
                }
            };


        loadUser();
    }, []);


    const handleProfileSubmit =
        async (event) => {
            event.preventDefault();

            setProfileMessage("");
            setProfileError("");


            const trimmedName =
                name.trim();


            if (!trimmedName) {
                setProfileError(
                    "Display name cannot be empty."
                );

                return;
            }


            setSavingProfile(true);


            try {
                const {
                    data,
                    error,
                } =
                    await supabase.auth.updateUser(
                        {
                            data: {
                                name:
                                    trimmedName,
                            },
                        }
                    );


                if (error) {
                    throw error;
                }


                setUser(
                    data.user
                );

                setProfileMessage(
                    "Profile updated successfully."
                );
            } catch (error) {
                console.error(error);

                setProfileError(
                    error.message ||
                        "Unable to update your profile."
                );
            } finally {
                setSavingProfile(
                    false
                );
            }
        };


    const handleCurrencyChange =
        async (event) => {
            const nextCurrency =
                event.target.value;


            setCurrencyMessage("");


            const success =
                await setCurrency(
                    nextCurrency
                );


            if (success) {
                setCurrencyMessage(
                    "Currency preference updated."
                );
            } else {
                setCurrencyMessage(
                    "Currency changed, but saving the preference failed."
                );
            }
        };


    const handlePasswordSubmit =
        async (event) => {
            event.preventDefault();

            setPasswordMessage("");
            setPasswordError("");


            if (!currentPassword) {
                setPasswordError(
                    "Enter your current password."
                );

                return;
            }


            if (!newPassword) {
                setPasswordError(
                    "Enter a new password."
                );

                return;
            }


            if (
                newPassword.length <
                6
            ) {
                setPasswordError(
                    "Your new password must be at least 6 characters."
                );

                return;
            }


            if (
                newPassword !==
                confirmPassword
            ) {
                setPasswordError(
                    "The new passwords do not match."
                );

                return;
            }


            setChangingPassword(
                true
            );


            try {
                if (!user?.email) {
                    throw new Error(
                        "Unable to determine your account email."
                    );
                }


                const {
                    error: signInError,
                } =
                    await supabase.auth.signInWithPassword(
                        {
                            email:
                                user.email,
                            password:
                                currentPassword,
                        }
                    );


                if (signInError) {
                    throw new Error(
                        "Current password is incorrect."
                    );
                }


                const {
                    error,
                } =
                    await supabase.auth.updateUser(
                        {
                            password:
                                newPassword,
                        }
                    );


                if (error) {
                    throw error;
                }


                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");


                setPasswordMessage(
                    "Password changed successfully."
                );
            } catch (error) {
                console.error(error);

                setPasswordError(
                    error.message ||
                        "Unable to change your password."
                );
            } finally {
                setChangingPassword(
                    false
                );
            }
        };


    const handleSignOut =
        async () => {
            setSigningOut(true);

            try {
                await supabase.auth.signOut();
            } catch (error) {
                console.error(error);
            } finally {
                setSigningOut(
                    false
                );
            }
        };


    const displayName =
        name.trim() ||
        user?.email
            ?.split("@")[0] ||
        "Account";


    const initials =
        displayName
            .charAt(0)
            .toUpperCase();


    const showLoader =
        useMinimumLoading(loadingUser);


    if (showLoader) {
        return (
            <PageLoader label="Loading your settings" />
        );
    }


    return (
        <Reveal className="space-y-8">

            {/* Header */}

            <header>
                <p className="text-sm font-medium text-neutral-400">
                    Account
                </p>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                    Settings
                </h1>

                <p className="mt-2 text-base text-neutral-500">
                    Manage your profile, currency, and account security.
                </p>
            </header>


            {/* Profile */}

            <section className="rounded-xl border border-neutral-200 bg-white">

                <div className="border-b border-neutral-100 px-6 py-5 sm:px-7">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                            <UserRound
                                size={19}
                                strokeWidth={1.8}
                            />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-neutral-900">
                                Profile
                            </h2>

                            <p className="mt-0.5 text-sm text-neutral-400">
                                Update the information shown on your account.
                            </p>
                        </div>

                    </div>

                </div>


                <form
                    onSubmit={
                        handleProfileSubmit
                    }
                    className="space-y-6 px-6 py-6 sm:px-7"
                >

                    <div className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
                            {initials}
                        </div>

                        <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-neutral-800">
                                {displayName}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-neutral-400">
                                {email}
                            </p>

                        </div>

                    </div>


                    <div className="grid gap-5 md:grid-cols-2">

                        <div>

                            <label
                                htmlFor="settings-name"
                                className="mb-2 block text-sm font-medium text-neutral-700"
                            >
                                Display name
                            </label>

                            <div className="relative">

                                <UserRound
                                    size={16}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                                />

                                <input
                                    id="settings-name"
                                    type="text"
                                    value={name}
                                    onChange={(event) =>
                                        setName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Your name"
                                    disabled={
                                        savingProfile
                                    }
                                    className="w-full rounded-lg border border-neutral-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5 disabled:bg-neutral-50"
                                />

                            </div>

                        </div>


                        <div>

                            <label
                                htmlFor="settings-email"
                                className="mb-2 block text-sm font-medium text-neutral-700"
                            >
                                Email address
                            </label>

                            <div className="relative">

                                <Mail
                                    size={16}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                                />

                                <input
                                    id="settings-email"
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full cursor-not-allowed rounded-lg border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-3 text-sm text-neutral-500"
                                />

                            </div>

                            <p className="mt-1.5 text-xs text-neutral-400">
                                Email address is managed through your authentication account.
                            </p>

                        </div>

                    </div>


                    {profileMessage && (
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {profileMessage}
                        </div>
                    )}


                    {profileError && (
                        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {profileError}
                        </div>
                    )}


                    <div className="flex justify-end border-t border-neutral-100 pt-5">

                        <button
                            type="submit"
                            disabled={
                                savingProfile
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                        >
                            <Save size={16} />

                            {savingProfile
                                ? "Saving..."
                                : "Save profile"}
                        </button>

                    </div>

                </form>

            </section>


            {/* Preferences */}

            <section className="rounded-xl border border-neutral-200 bg-white">

                <div className="border-b border-neutral-100 px-6 py-5 sm:px-7">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                            <Globe2
                                size={19}
                                strokeWidth={1.8}
                            />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-neutral-900">
                                Preferences
                            </h2>

                            <p className="mt-0.5 text-sm text-neutral-400">
                                Choose how monetary values are displayed throughout Sanchaya.
                            </p>
                        </div>

                    </div>

                </div>


                <div className="space-y-5 px-6 py-6 sm:px-7">

                    <div className="max-w-xl">

                        <label
                            htmlFor="settings-currency"
                            className="mb-2 block text-sm font-medium text-neutral-700"
                        >
                            Currency
                        </label>

                        <select
                            id="settings-currency"
                            value={currency}
                            onChange={
                                handleCurrencyChange
                            }
                            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5"
                        >
                            {Object.values(
                                currencies
                            ).map(
                                (item) => (
                                    <option
                                        key={
                                            item.code
                                        }
                                        value={
                                            item.code
                                        }
                                    >
                                        {
                                            item.code
                                        }{" "}
                                        •{" "}
                                        {
                                            item.name
                                        }{" "}
                                        ({
                                            item.symbol
                                        })
                                    </option>
                                )
                            )}
                        </select>

                    </div>


                    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">

                        <p className="text-sm font-medium text-neutral-700">
                            Exchange rates
                        </p>

                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                            Financial records remain stored in NPR.
                            Sanchaya converts them into your selected currency for display and entry.
                        </p>

                        {ratesLoading && (
                            <p className="mt-2 text-xs text-neutral-500">
                                Updating exchange rates...
                            </p>
                        )}

                        {rateError && (
                            <p className="mt-2 text-xs text-amber-600">
                                {rateError}
                            </p>
                        )}

                    </div>


                    {currencyMessage && (
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {currencyMessage}
                        </div>
                    )}

                </div>

            </section>


            {/* Security */}

            <section className="rounded-xl border border-neutral-200 bg-white">

                <div className="border-b border-neutral-100 px-6 py-5 sm:px-7">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                            <LockKeyhole
                                size={19}
                                strokeWidth={1.8}
                            />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-neutral-900">
                                Security
                            </h2>

                            <p className="mt-0.5 text-sm text-neutral-400">
                                Keep your account protected with a strong password.
                            </p>
                        </div>

                    </div>

                </div>


                <form
                    onSubmit={
                        handlePasswordSubmit
                    }
                    className="space-y-5 px-6 py-6 sm:px-7"
                >

                    <div className="max-w-xl">

                        <label
                            htmlFor="current-password"
                            className="mb-2 block text-sm font-medium text-neutral-700"
                        >
                            Current password
                        </label>

                        <div className="relative">

                            <input
                                id="current-password"
                                type={
                                    showCurrentPassword
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    currentPassword
                                }
                                onChange={(event) =>
                                    setCurrentPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your current password"
                                disabled={
                                    changingPassword
                                }
                                className="w-full rounded-lg border border-neutral-200 py-3 pl-3 pr-11 text-sm outline-none focus:border-neutral-500"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowCurrentPassword(
                                        !showCurrentPassword
                                    )
                                }
                                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100"
                            >
                                {showCurrentPassword ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>

                        </div>

                    </div>


                    <div className="grid max-w-xl gap-5 md:grid-cols-2">

                        <div>

                            <label
                                htmlFor="new-password"
                                className="mb-2 block text-sm font-medium text-neutral-700"
                            >
                                New password
                            </label>

                            <div className="relative">

                                <input
                                    id="new-password"
                                    type={
                                        showNewPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        newPassword
                                    }
                                    onChange={(event) =>
                                        setNewPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter new password"
                                    disabled={
                                        changingPassword
                                    }
                                    className="w-full rounded-lg border border-neutral-200 py-3 pl-3 pr-11 text-sm outline-none focus:border-neutral-500"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPassword(
                                            !showNewPassword
                                        )
                                    }
                                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100"
                                >
                                    {showNewPassword ? (
                                        <EyeOff size={16} />
                                    ) : (
                                        <Eye size={16} />
                                    )}
                                </button>

                            </div>

                            <p className="mt-1.5 text-xs text-neutral-400">
                                Use at least 6 characters.
                            </p>

                        </div>


                        <div>

                            <label
                                htmlFor="confirm-password"
                                className="mb-2 block text-sm font-medium text-neutral-700"
                            >
                                Confirm new password
                            </label>

                            <div className="relative">

                                <input
                                    id="confirm-password"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        confirmPassword
                                    }
                                    onChange={(event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Confirm new password"
                                    disabled={
                                        changingPassword
                                    }
                                    className="w-full rounded-lg border border-neutral-200 py-3 pl-3 pr-11 text-sm outline-none focus:border-neutral-500"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={16} />
                                    ) : (
                                        <Eye size={16} />
                                    )}
                                </button>

                            </div>

                        </div>

                    </div>


                    {passwordMessage && (
                        <div className="max-w-xl rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {passwordMessage}
                        </div>
                    )}


                    {passwordError && (
                        <div className="max-w-xl rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {passwordError}
                        </div>
                    )}


                    <div className="flex justify-start border-t border-neutral-100 pt-5">

                        <button
                            type="submit"
                            disabled={
                                changingPassword
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                        >
                            <LockKeyhole size={16} />

                            {changingPassword
                                ? "Changing password..."
                                : "Change password"}
                        </button>

                    </div>

                </form>

            </section>


            {/* Session */}

            <section className="rounded-xl border border-neutral-200 bg-white">

                <div className="border-b border-neutral-100 px-6 py-5 sm:px-7">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                            <LogOut
                                size={19}
                                strokeWidth={1.8}
                            />
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-neutral-900">
                                Session
                            </h2>

                            <p className="mt-0.5 text-sm text-neutral-400">
                                Sign out of your current Sanchaya session.
                            </p>
                        </div>

                    </div>

                </div>


                <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">

                    <div>
                        <p className="text-sm font-medium text-neutral-800">
                            Sign out
                        </p>

                        <p className="mt-1 text-sm text-neutral-400">
                            You'll need to sign in again to access your account.
                        </p>
                    </div>


                    <button
                        type="button"
                        onClick={
                            handleSignOut
                        }
                        disabled={
                            signingOut
                        }
                        className="inline-flex w-fit items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                    >
                        <LogOut size={16} />

                        {signingOut
                            ? "Signing out..."
                            : "Sign out"}
                    </button>

                </div>

            </section>

        </Reveal>
    );
}


export default Settings;