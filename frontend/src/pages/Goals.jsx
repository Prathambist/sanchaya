import { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Target,
    CalendarDays,
    Check,
    X,
    CircleDollarSign,
    TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";

import { apiFetch } from "../lib/api";
import {
    useCurrency,
} from "../context/CurrencyContext";
import { useToast } from "../context/ToastContext";
import { projectGoalCompletion } from "../lib/insights";
import { useMinimumLoading } from "../hooks/useMinimumLoading";
import PageLoader from "../components/PageLoader";
import Reveal from "../components/Reveal";


function Goals() {
    const {
        formatCurrency,
        convertFromBase,
        convertToBase,
    } = useCurrency();

    const toast = useToast();


    const [goals, setGoals] =
        useState([]);

    const [
        loadingGoals,
        setLoadingGoals,
    ] = useState(true);


    const [showForm, setShowForm] =
        useState(false);

    const [editingGoal, setEditingGoal] =
        useState(null);


    const [
        showContributionForm,
        setShowContributionForm,
    ] = useState(false);

    const [
        contributionGoal,
        setContributionGoal,
    ] = useState(null);

    const [
        contributionAmount,
        setContributionAmount,
    ] = useState("");


    const [
        showCongratulations,
        setShowCongratulations,
    ] = useState(false);

    const [
        completedGoal,
        setCompletedGoal,
    ] = useState(null);


    const [
        goalToDelete,
        setGoalToDelete,
    ] = useState(null);

    const [deleting, setDeleting] =
        useState(false);


    const [name, setName] =
        useState("");

    const [
        targetAmount,
        setTargetAmount,
    ] = useState("");

    const [
        currentAmount,
        setCurrentAmount,
    ] = useState("");

    const [deadline, setDeadline] =
        useState("");


    const [loading, setLoading] =
        useState(false);

    const [
        addingContribution,
        setAddingContribution,
    ] = useState(false);


    const [error, setError] =
        useState("");

    const [
        contributionError,
        setContributionError,
    ] = useState("");


    const loadGoals = async () => {
        try {
            setLoadingGoals(true);

            const data =
                await apiFetch(
                    "/api/goals/"
                );

            setGoals(
                data.goals || []
            );
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Unable to load savings goals."
            );
        } finally {
            setLoadingGoals(false);
        }
    };


    useEffect(() => {
        loadGoals();
    }, []);


    const resetForm = () => {
        setName("");
        setTargetAmount("");
        setCurrentAmount("");
        setDeadline("");

        setError("");
        setEditingGoal(null);
    };


    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };


    const openEditForm =
        (goal) => {
            setEditingGoal(
                goal
            );

            setName(
                goal.name
            );

            setTargetAmount(
                convertFromBase(
                    goal.target_amount
                ).toFixed(2)
            );

            setCurrentAmount(
                convertFromBase(
                    goal.current_amount
                ).toFixed(2)
            );

            setDeadline(
                goal.deadline ||
                    ""
            );

            setError("");
            setShowForm(true);
        };


    const closeForm = () => {
        if (loading) {
            return;
        }

        setShowForm(false);
        resetForm();
    };


    const openContributionForm =
        (goal) => {
            setContributionGoal(
                goal
            );

            setContributionAmount(
                ""
            );

            setContributionError(
                ""
            );

            setShowContributionForm(
                true
            );
        };


    const closeContributionForm =
        () => {
            if (
                addingContribution
            ) {
                return;
            }

            setShowContributionForm(
                false
            );

            setContributionGoal(
                null
            );

            setContributionAmount(
                ""
            );

            setContributionError(
                ""
            );
        };


    const celebrateGoal =
        (goal) => {
            setCompletedGoal(
                goal
            );

            setShowCongratulations(
                true
            );


            const duration = 2200;

            const animationEnd =
                Date.now() +
                duration;


            const defaults = {
                startVelocity: 30,
                spread: 360,
                ticks: 70,
                zIndex: 100,
            };


            const randomInRange =
                (
                    min,
                    max
                ) =>
                    Math.random() *
                        (max - min) +
                    min;


            const interval =
                setInterval(() => {

                    const timeLeft =
                        animationEnd -
                        Date.now();


                    if (
                        timeLeft <=
                        0
                    ) {
                        clearInterval(
                            interval
                        );

                        return;
                    }


                    const particleCount =
                        45 *
                        (
                            timeLeft /
                            duration
                        );


                    confetti({
                        ...defaults,
                        particleCount,
                        origin: {
                            x:
                                randomInRange(
                                    0.1,
                                    0.3
                                ),

                            y:
                                randomInRange(
                                    0.2,
                                    0.7
                                ),
                        },
                    });


                    confetti({
                        ...defaults,
                        particleCount,
                        origin: {
                            x:
                                randomInRange(
                                    0.7,
                                    0.9
                                ),

                            y:
                                randomInRange(
                                    0.2,
                                    0.7
                                ),
                        },
                    });

                }, 250);
        };


    const closeCongratulations =
        () => {
            setShowCongratulations(
                false
            );

            setCompletedGoal(
                null
            );
        };


    const handleSubmit =
        async (event) => {
            event.preventDefault();

            setError("");


            const cleanName =
                name.trim();


            const numericTarget =
                Number(
                    targetAmount
                );


            const numericCurrent =
                Number(
                    currentAmount ||
                        0
                );


            if (!cleanName) {
                setError(
                    "Enter a name for your goal."
                );

                return;
            }


            if (
                !numericTarget ||
                numericTarget <= 0
            ) {
                setError(
                    "Enter a target amount greater than zero."
                );

                return;
            }


            if (
                numericCurrent <
                0
            ) {
                setError(
                    "Current amount cannot be negative."
                );

                return;
            }


            if (
                numericCurrent >
                numericTarget
            ) {
                setError(
                    "Current amount cannot be greater than the target amount."
                );

                return;
            }


            setLoading(true);


            try {
                const payload = {
                    name:
                        cleanName,

                    target_amount:
                        convertToBase(
                            numericTarget
                        ),

                    current_amount:
                        convertToBase(
                            numericCurrent
                        ),

                    deadline:
                        deadline ||
                        null,
                };


                if (
                    editingGoal
                ) {
                    const data =
                        await apiFetch(
                            `/api/goals/${editingGoal.id}`,
                            {
                                method: "PUT",
                                body:
                                    JSON.stringify(
                                        payload
                                    ),
                            }
                        );


                    setGoals(
                        (current) =>
                            current.map(
                                (goal) =>
                                    goal.id ===
                                    editingGoal.id
                                        ? data.goal
                                        : goal
                            )
                    );
                } else {
                    const data =
                        await apiFetch(
                            "/api/goals/",
                            {
                                method: "POST",
                                body:
                                    JSON.stringify(
                                        payload
                                    ),
                            }
                        );


                    setGoals(
                        (current) => [
                            data.goal,
                            ...current,
                        ]
                    );
                }


                toast.success(
                    editingGoal
                        ? "Goal updated."
                        : "Goal created."
                );

                setShowForm(
                    false
                );

                resetForm();

            } catch (error) {
                setError(
                    error.message ||
                        "Unable to save goal."
                );
            } finally {
                setLoading(false);
            }
        };


    const handleContribution =
        async (event) => {
            event.preventDefault();

            setContributionError("");


            if (
                !contributionGoal
            ) {
                return;
            }


            const numericAmount =
                Number(
                    contributionAmount
                );


            if (
                !numericAmount ||
                numericAmount <= 0
            ) {
                setContributionError(
                    "Enter an amount greater than zero."
                );

                return;
            }


            const remainingAmount =
                Number(
                    contributionGoal.remaining_amount
                );


            const remainingInSelectedCurrency =
                convertFromBase(
                    remainingAmount
                );


            if (
                numericAmount >
                remainingInSelectedCurrency
            ) {
                setContributionError(
                    `You can add at most ${formatCurrency(
                        remainingAmount
                    )}.`
                );

                return;
            }


            setAddingContribution(
                true
            );


            try {
                const data =
                    await apiFetch(
                        `/api/goals/${contributionGoal.id}/contribute`,
                        {
                            method: "POST",
                            body:
                                JSON.stringify(
                                    {
                                        amount:
                                            convertToBase(
                                                numericAmount
                                            ),
                                    }
                                ),
                        }
                    );


                const updatedGoal =
                    data.goal;


                setGoals(
                    (current) =>
                        current.map(
                            (goal) =>
                                goal.id ===
                                contributionGoal.id
                                    ? updatedGoal
                                    : goal
                        )
                );


                closeContributionForm();


                if (
                    !contributionGoal.completed &&
                    updatedGoal.completed
                ) {
                    setTimeout(
                        () => {
                            celebrateGoal(
                                updatedGoal
                            );
                        },
                        150
                    );
                } else {
                    // The celebration modal is feedback enough when the
                    // goal just completed; only toast otherwise.
                    toast.success(
                        "Contribution added."
                    );
                }

            } catch (error) {
                setContributionError(
                    error.message ||
                        "Unable to add money to this goal."
                );
            } finally {
                setAddingContribution(
                    false
                );
            }
        };


    const handleDelete =
        async () => {
            if (
                !goalToDelete
            ) {
                return;
            }


            setDeleting(true);
            setError("");


            try {
                await apiFetch(
                    `/api/goals/${goalToDelete.id}`,
                    {
                        method: "DELETE",
                    }
                );


                setGoals(
                    (current) =>
                        current.filter(
                            (goal) =>
                                goal.id !==
                                goalToDelete.id
                        )
                );


                setGoalToDelete(
                    null
                );

                toast.success(
                    "Goal deleted."
                );

            } catch (error) {
                const message =
                    error.message ||
                    "Unable to delete goal.";

                setError(message);
                toast.error(message);
            } finally {
                setDeleting(false);
            }
        };


    const formatDate =
        (value) => {
            if (!value) {
                return "No deadline";
            }

            return new Date(
                `${value}T00:00:00`
            ).toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }
            );
        };


    const getDeadlineStatus =
        (goal) => {
            if (goal.completed) {
                return {
                    label:
                        "Completed",

                    className:
                        "bg-neutral-100 text-neutral-700",
                };
            }


            if (
                goal.days_remaining !==
                    null &&
                goal.days_remaining <
                    0
            ) {
                return {
                    label:
                        "Overdue",

                    className:
                        "bg-red-50 text-red-700",
                };
            }


            if (
                goal.days_remaining !==
                    null &&
                goal.days_remaining <=
                    30
            ) {
                return {
                    label:
                        `${goal.days_remaining} days left`,

                    className:
                        "bg-amber-50 text-amber-700",
                };
            }


            if (
                goal.deadline
            ) {
                return {
                    label:
                        `${goal.days_remaining} days left`,

                    className:
                        "bg-neutral-100 text-neutral-600",
                };
            }


            return {
                label:
                    "No deadline",

                className:
                    "bg-neutral-100 text-neutral-500",
            };
        };


    const totalTarget =
        goals.reduce(
            (total, goal) =>
                total +
                Number(
                    goal.target_amount ||
                        0
                ),
            0
        );


    const totalSaved =
        goals.reduce(
            (total, goal) =>
                total +
                Number(
                    goal.current_amount ||
                        0
                ),
            0
        );


    const totalRemaining =
        Math.max(
            totalTarget -
                totalSaved,
            0
        );


    const overallProgress =
        totalTarget > 0
            ? Math.min(
                  (
                      totalSaved /
                      totalTarget
                  ) *
                      100,
                  100
              )
            : 0;


    const showLoader =
        useMinimumLoading(loadingGoals);


    if (showLoader) {
        return (
            <PageLoader label="Loading your goals" />
        );
    }


    return (
        <Reveal className="space-y-8">

            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                <div>

                    <p className="text-sm font-medium text-neutral-500">
                        Financial goals
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                        Savings Goals
                    </h1>

                    <p className="mt-2 text-sm text-neutral-500">
                        Track what you're saving for and how close you are to getting there.
                    </p>

                </div>


                <button
                    type="button"
                    onClick={
                        openAddForm
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                >
                    <Plus size={17} />

                    Add goal
                </button>

            </div>


            {error &&
                !showForm && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}


            {/* Summary */}

            <div className="grid gap-4 sm:grid-cols-3">

                <div className="rounded-xl border border-neutral-200 bg-white p-5">

                    <p className="text-sm text-neutral-500">
                        Total target
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {formatCurrency(
                            totalTarget
                        )}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                        Across{" "}
                        {
                            goals.length
                        }{" "}
                        {
                            goals.length ===
                            1
                                ? "goal"
                                : "goals"
                        }
                    </p>

                </div>


                <div className="rounded-xl border border-neutral-200 bg-white p-5">

                    <p className="text-sm text-neutral-500">
                        Total saved
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {formatCurrency(
                            totalSaved
                        )}
                    </p>

                    <p className="mt-1 text-xs text-neutral-400">
                        {overallProgress.toFixed(
                            1
                        )}
                        % of total target
                    </p>

                </div>


                <div className="rounded-xl border border-neutral-200 bg-white p-5">

                    <p className="text-sm text-neutral-500">
                        Remaining
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {formatCurrency(
                            totalRemaining
                        )}
                    </p>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">

                        <div
                            className="h-full rounded-full bg-neutral-900"
                            style={{
                                width: `${overallProgress}%`,
                            }}
                        />

                    </div>

                </div>

            </div>


            {/* Goals */}

            {loadingGoals ? (
                <div className="rounded-xl border border-neutral-200 bg-white px-5 py-12 text-center text-sm text-neutral-500">
                    Loading goals...
                </div>
            ) : goals.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">

                    <Target
                        size={22}
                        className="mx-auto text-neutral-400"
                    />

                    <h2 className="mt-4 text-base font-semibold text-neutral-900">
                        No savings goals yet
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                        Create your first savings goal to start tracking your progress.
                    </p>

                    <button
                        type="button"
                        onClick={
                            openAddForm
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        <Plus size={17} />

                        Add your first goal
                    </button>

                </div>
            ) : (
                <div className="space-y-4">

                    {goals.map(
                        (goal) => {

                            const status =
                                getDeadlineStatus(
                                    goal
                                );


                            const progress =
                                Math.min(
                                    Math.max(
                                        Number(
                                            goal.progress_percentage ||
                                                0
                                        ),
                                        0
                                    ),
                                    100
                                );


                            return (
                                <div
                                    key={
                                        goal.id
                                    }
                                    className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6"
                                >

                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                                        <div className="min-w-0">

                                            <div className="flex items-center gap-3">

                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                                                    {goal.completed ? (
                                                        <Check
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    ) : (
                                                        <Target
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    )}
                                                </div>


                                                <div className="min-w-0">

                                                    <h2 className="truncate text-base font-semibold text-neutral-900">
                                                        {
                                                            goal.name
                                                        }
                                                    </h2>


                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">

                                                        <span className="inline-flex items-center gap-1">
                                                            <CalendarDays
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            {formatDate(
                                                                goal.deadline
                                                            )}
                                                        </span>


                                                        <span className="text-neutral-300">
                                                            •
                                                        </span>


                                                        <span
                                                            className={`rounded-full px-2 py-1 font-medium ${status.className}`}
                                                        >
                                                            {
                                                                status.label
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>


                                        <div className="flex items-center gap-1">

                                            {!goal.completed && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openContributionForm(
                                                            goal
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                                                >
                                                    <CircleDollarSign
                                                        size={
                                                            15
                                                        }
                                                    />

                                                    Add money
                                                </button>
                                            )}


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditForm(
                                                        goal
                                                    )
                                                }
                                                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                                            >
                                                <Pencil
                                                    size={
                                                        16
                                                    }
                                                />
                                            </button>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setGoalToDelete(
                                                        goal
                                                    )
                                                }
                                                className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2
                                                    size={
                                                        16
                                                    }
                                                />
                                            </button>

                                        </div>

                                    </div>


                                    <div className="mt-6 grid gap-4 sm:grid-cols-3">

                                        <div>

                                            <p className="text-xs text-neutral-500">
                                                Saved
                                            </p>

                                            <p className="mt-1 text-lg font-semibold text-neutral-900">
                                                {formatCurrency(
                                                    goal.current_amount
                                                )}
                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs text-neutral-500">
                                                Target
                                            </p>

                                            <p className="mt-1 text-lg font-semibold text-neutral-900">
                                                {formatCurrency(
                                                    goal.target_amount
                                                )}
                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs text-neutral-500">
                                                Remaining
                                            </p>

                                            <p className="mt-1 text-lg font-semibold text-neutral-900">
                                                {formatCurrency(
                                                    goal.remaining_amount
                                                )}
                                            </p>

                                        </div>

                                    </div>


                                    <div className="mt-5">

                                        <div className="flex items-center justify-between text-xs">

                                            <span className="font-medium text-neutral-600">
                                                Progress
                                            </span>

                                            <span className="font-medium text-neutral-900">
                                                {progress.toFixed(
                                                    1
                                                )}
                                                %
                                            </span>

                                        </div>


                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">

                                            <div
                                                className="h-full rounded-full bg-neutral-900"
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />

                                        </div>

                                    </div>


                                    {!goal.completed &&
                                        (() => {
                                            const forecast =
                                                projectGoalCompletion(
                                                    goal
                                                );

                                            if (
                                                forecast.status ===
                                                "no-progress"
                                            ) {
                                                return (
                                                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-neutral-50 px-3.5 py-3 text-xs text-neutral-500">
                                                        <TrendingUp
                                                            size={14}
                                                            className="mt-0.5 shrink-0"
                                                        />
                                                        We'll show a completion forecast once this goal has a couple weeks of history.
                                                    </div>
                                                );
                                            }

                                            const projectedLabel =
                                                forecast.projectedDate.toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    }
                                                );

                                            if (
                                                forecast.status ===
                                                "behind"
                                            ) {
                                                return (
                                                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
                                                        <TrendingUp
                                                            size={14}
                                                            className="mt-0.5 shrink-0"
                                                        />
                                                        <span>
                                                            At your current pace you'll reach this goal around{" "}
                                                            <strong className="font-semibold">
                                                                {projectedLabel}
                                                            </strong>
                                                            {" "}— after your deadline. Add{" "}
                                                            <strong className="font-semibold">
                                                                {formatCurrency(
                                                                    forecast.suggestedMonthlyTopUp
                                                                )}
                                                                /mo
                                                            </strong>{" "}
                                                            more to make it in time.
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3.5 py-3 text-xs text-emerald-800">
                                                    <TrendingUp
                                                        size={14}
                                                        className="mt-0.5 shrink-0"
                                                    />
                                                    <span>
                                                        At your current pace you'll reach this goal around{" "}
                                                        <strong className="font-semibold">
                                                            {projectedLabel}
                                                        </strong>
                                                        {forecast.status ===
                                                        "ahead"
                                                            ? " — ahead of your deadline."
                                                            : "."}
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                </div>
                            );
                        }
                    )}

                </div>
            )}


            {/* Add / Edit goal */}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:px-4">

                    <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-xl">

                        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">

                            <div>

                                <h2 className="text-base font-semibold text-neutral-900">
                                    {editingGoal
                                        ? "Edit goal"
                                        : "Add savings goal"}
                                </h2>

                                <p className="mt-0.5 text-xs text-neutral-500">
                                    {editingGoal
                                        ? "Update your goal details."
                                        : "Set a target and start tracking your progress."}
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    closeForm
                                }
                                disabled={
                                    loading
                                }
                                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100"
                            >
                                <X size={18} />
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-4 px-5 py-5"
                        >

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                    {error}
                                </div>
                            )}


                            <div>

                                <label
                                    htmlFor="goalName"
                                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                                >
                                    Goal name
                                </label>

                                <input
                                    id="goalName"
                                    type="text"
                                    value={
                                        name
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. New laptop"
                                    disabled={
                                        loading
                                    }
                                    className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none"
                                />

                            </div>


                            <div className="grid gap-4 sm:grid-cols-2">

                                <div>

                                    <label
                                        htmlFor="targetAmount"
                                        className="mb-1.5 block text-sm font-medium text-neutral-700"
                                    >
                                        Target amount
                                    </label>

                                    <input
                                        id="targetAmount"
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        value={
                                            targetAmount
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setTargetAmount(
                                                event.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        disabled={
                                            loading
                                        }
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none"
                                    />

                                </div>


                                <div>

                                    <label
                                        htmlFor="currentAmount"
                                        className="mb-1.5 block text-sm font-medium text-neutral-700"
                                    >
                                        Amount saved
                                    </label>

                                    <input
                                        id="currentAmount"
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        value={
                                            currentAmount
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setCurrentAmount(
                                                event.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        disabled={
                                            loading
                                        }
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none"
                                    />

                                    <p className="mt-1 text-xs text-neutral-400">
                                        Useful when you already have money saved.
                                    </p>

                                </div>

                            </div>


                            <div>

                                <label
                                    htmlFor="deadline"
                                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                                >
                                    Deadline
                                    <span className="ml-1 font-normal text-neutral-400">
                                        optional
                                    </span>
                                </label>

                                <input
                                    id="deadline"
                                    type="date"
                                    value={
                                        deadline
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setDeadline(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none"
                                />

                            </div>


                            <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">

                                <button
                                    type="button"
                                    onClick={
                                        closeForm
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        loading
                                    }
                                    className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                                >
                                    {loading
                                        ? "Saving..."
                                        : editingGoal
                                        ? "Save changes"
                                        : "Create goal"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}


            {/* Add Money */}

            {showContributionForm &&
                contributionGoal && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:px-4">

                        <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-xl">

                            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">

                                <div>

                                    <h2 className="text-base font-semibold text-neutral-900">
                                        Add money
                                    </h2>

                                    <p className="mt-0.5 text-xs text-neutral-500">
                                        Add money to{" "}
                                        <span className="font-medium text-neutral-700">
                                            {
                                                contributionGoal.name
                                            }
                                        </span>
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        closeContributionForm
                                    }
                                    disabled={
                                        addingContribution
                                    }
                                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100"
                                >
                                    <X
                                        size={
                                            18
                                        }
                                    />
                                </button>

                            </div>


                            <form
                                onSubmit={
                                    handleContribution
                                }
                                className="space-y-5 px-5 py-5"
                            >

                                {contributionError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                        {
                                            contributionError
                                        }
                                    </div>
                                )}


                                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-xs text-neutral-500">
                                                Current saved
                                            </p>

                                            <p className="mt-1 text-base font-semibold text-neutral-900">
                                                {formatCurrency(
                                                    contributionGoal.current_amount
                                                )}
                                            </p>

                                        </div>


                                        <div className="text-right">

                                            <p className="text-xs text-neutral-500">
                                                Remaining
                                            </p>

                                            <p className="mt-1 text-base font-semibold text-neutral-900">
                                                {formatCurrency(
                                                    contributionGoal.remaining_amount
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                </div>


                                <div>

                                    <label
                                        htmlFor="contributionAmount"
                                        className="mb-1.5 block text-sm font-medium text-neutral-700"
                                    >
                                        Amount to add
                                    </label>

                                    <input
                                        id="contributionAmount"
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        max={convertFromBase(
                                            contributionGoal.remaining_amount
                                        )}
                                        value={
                                            contributionAmount
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setContributionAmount(
                                                event.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        autoFocus
                                        disabled={
                                            addingContribution
                                        }
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none"
                                    />

                                    <p className="mt-1.5 text-xs text-neutral-400">
                                        You can add up to{" "}
                                        {formatCurrency(
                                            contributionGoal.remaining_amount
                                        )}
                                    </p>

                                </div>


                                {Number(
                                    contributionAmount
                                ) >
                                    0 && (
                                    <div className="rounded-lg border border-neutral-200 px-4 py-3">

                                        <div className="flex items-center justify-between text-sm">

                                            <span className="text-neutral-500">
                                                Saved after contribution
                                            </span>

                                            <span className="font-semibold text-neutral-900">
                                                {formatCurrency(
                                                    Number(
                                                        contributionGoal.current_amount
                                                    ) +
                                                        convertToBase(
                                                            Number(
                                                                contributionAmount
                                                            )
                                                        )
                                                )}
                                            </span>

                                        </div>

                                    </div>
                                )}


                                <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">

                                    <button
                                        type="button"
                                        onClick={
                                            closeContributionForm
                                        }
                                        disabled={
                                            addingContribution
                                        }
                                        className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        disabled={
                                            addingContribution
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                                    >
                                        <CircleDollarSign
                                            size={
                                                16
                                            }
                                        />

                                        {addingContribution
                                            ? "Adding..."
                                            : "Add money"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}


            {/* Congratulations */}

            {showCongratulations &&
                completedGoal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">

                        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white text-center shadow-2xl">

                            <div className="px-6 pb-6 pt-8">

                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-white">

                                    <Check
                                        size={
                                            30
                                        }
                                    />

                                </div>


                                <p className="mt-5 text-sm font-medium text-neutral-500">
                                    Goal completed
                                </p>


                                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                                    Congratulations!
                                </h2>


                                <p className="mt-3 text-sm leading-6 text-neutral-500">
                                    You've reached your{" "}
                                    <span className="font-medium text-neutral-800">
                                        {
                                            completedGoal.name
                                        }
                                    </span>{" "}
                                    goal.
                                </p>


                                <div className="mt-5 rounded-xl bg-neutral-50 px-4 py-4">

                                    <p className="text-xs text-neutral-500">
                                        Total saved
                                    </p>

                                    <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                                        {formatCurrency(
                                            completedGoal.current_amount
                                        )}
                                    </p>

                                </div>

                            </div>


                            <div className="border-t border-neutral-100 px-6 py-4">

                                <button
                                    type="button"
                                    onClick={
                                        closeCongratulations
                                    }
                                    className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                                >
                                    Continue
                                </button>

                            </div>

                        </div>

                    </div>
                )}


            {/* Delete */}

            {goalToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

                    <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white shadow-xl">

                        <div className="p-5">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                <Trash2 size={18} />
                            </div>


                            <h2 className="mt-4 text-base font-semibold text-neutral-900">
                                Delete this goal?
                            </h2>


                            <p className="mt-1.5 text-sm leading-6 text-neutral-500">
                                This will permanently delete{" "}
                                <span className="font-medium text-neutral-700">
                                    {
                                        goalToDelete.name
                                    }
                                </span>
                                .
                            </p>

                        </div>


                        <div className="flex justify-end gap-2 border-t border-neutral-100 px-5 py-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setGoalToDelete(
                                        null
                                    )
                                }
                                disabled={
                                    deleting
                                }
                                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                onClick={
                                    handleDelete
                                }
                                disabled={
                                    deleting
                                }
                                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete goal"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </Reveal>
    );
}


export default Goals;