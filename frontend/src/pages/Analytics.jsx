import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import SpendingHeatmap from "../components/SpendingHeatmap";
import { useMinimumLoading } from "../hooks/useMinimumLoading";
import PageLoader from "../components/PageLoader";
import Reveal from "../components/Reveal";


function formatCurrency(amount, compact = false) {
    const value = Number(amount || 0);

    if (compact) {
        if (Math.abs(value) >= 1000000) {
            return `Rs. ${(value / 1000000).toFixed(1)}M`;
        }

        if (Math.abs(value) >= 1000) {
            return `Rs. ${(value / 1000).toFixed(1)}K`;
        }
    }

    return `Rs. ${value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}


function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}


function formatMonth(value) {
    if (!value) {
        return "";
    }

    const [year, month] = value.split("-");

    return new Date(
        Number(year),
        Number(month) - 1,
        1
    ).toLocaleDateString("en-US", {
        month: "short",
    });
}


function getChangeLabel(value) {
    if (value === null || value === undefined) {
        return "New";
    }

    if (value > 0) {
        return `↑ ${Math.abs(value).toFixed(1)}%`;
    }

    if (value < 0) {
        return `↓ ${Math.abs(value).toFixed(1)}%`;
    }

    return "No change";
}


function InsightIcon({ type }) {
    if (type === "savings") {
        return "↗";
    }

    if (type === "budget") {
        return "!";
    }

    if (type === "spending") {
        return "◉";
    }

    if (type === "trend") {
        return "↕";
    }

    if (type === "income") {
        return "₹";
    }

    if (type === "goal") {
        return "✓";
    }

    return "•";
}


function Analytics() {
    const [analytics, setAnalytics] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        loadAnalytics();
    }, []);


    async function loadAnalytics() {
        try {
            setLoading(true);
            setError("");

            const [analyticsData, transactionsData] =
                await Promise.all([
                    apiFetch("/api/analytics/summary"),
                    // Powers the spending heatmap, which needs full
                    // day-by-day history rather than the pre-aggregated
                    // summary above.
                    apiFetch("/api/transactions/"),
                ]);

            setAnalytics(analyticsData);
            setTransactions(
                transactionsData.transactions || []
            );
        } catch (err) {
            setError(
                err.message ||
                "Unable to load analytics."
            );
        } finally {
            setLoading(false);
        }
    }


    const categoryTotal = useMemo(() => {
        return (
            analytics?.category_breakdown || []
        ).reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );
    }, [analytics]);


    const incomeSourceTotal = useMemo(() => {
        return (
            analytics?.income_sources || []
        ).reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );
    }, [analytics]);


    const chartMaximum = useMemo(() => {
        const values = (
            analytics?.monthly_data || []
        ).flatMap((month) => [
            Number(month.income || 0),
            Number(month.expenses || 0),
        ]);

        return Math.max(...values, 1);
    }, [analytics]);


    const showLoader =
        useMinimumLoading(loading);


    // `|| loading` also covers the "Try again" retry below: the whole
    // page depends on this one payload, so it shouldn't render empty.
    if (showLoader || loading) {
        return (
            <PageLoader label="Crunching your analytics" />
        );
    }


    if (error) {
        return (
            <Reveal className="p-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Analytics
                </h1>

                <div className="mt-6 max-w-xl rounded-lg border border-red-200 bg-red-50 p-5">
                    <p className="text-sm text-red-700">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={loadAnalytics}
                        className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Try again
                    </button>
                </div>
            </Reveal>
        );
    }


    const summary = analytics?.summary || {};

    const monthlyData =
        analytics?.monthly_data || [];

    const categories =
        analytics?.category_breakdown || [];

    const incomeSources =
        analytics?.income_sources || [];

    const budgets =
        analytics?.budget_performance || [];

    const topExpenses =
        analytics?.top_expenses || [];

    const topIncome =
        analytics?.top_income || [];

    const goals =
        analytics?.goals || {};

    const insights =
        analytics?.insights || [];


    const savingsRate =
        Number(summary.savings_rate || 0);

    const savingsPositive =
        Number(summary.total_savings || 0) >= 0;


    return (
        <Reveal className="min-h-full bg-gray-50 p-6 md:p-8">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">

                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                        Analytics
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                        A deeper look at where your money comes from,
                        where it goes, and how your financial position
                        is changing over time.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadAnalytics}
                    className="w-fit rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Refresh
                </button>

            </div>


            {/* =====================================================
                FINANCIAL SNAPSHOT
            ===================================================== */}

            <section>

                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Financial Snapshot
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Your overall recorded financial activity.
                    </p>
                </div>


                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-start justify-between">

                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Total Income
                                </p>

                                <p className="mt-3 text-2xl font-semibold text-gray-900">
                                    {formatCurrency(
                                        summary.total_income
                                    )}
                                </p>
                            </div>

                            <span className="text-sm font-semibold text-green-600">
                                IN
                            </span>

                        </div>

                        <p className="mt-4 text-xs text-gray-500">
                            Avg. monthly{" "}
                            {formatCurrency(
                                summary.average_monthly_income,
                                true
                            )}
                        </p>
                    </div>


                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-start justify-between">

                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Total Expenses
                                </p>

                                <p className="mt-3 text-2xl font-semibold text-gray-900">
                                    {formatCurrency(
                                        summary.total_expenses
                                    )}
                                </p>
                            </div>

                            <span className="text-sm font-semibold text-red-600">
                                OUT
                            </span>

                        </div>

                        <p className="mt-4 text-xs text-gray-500">
                            Avg. monthly{" "}
                            {formatCurrency(
                                summary.average_monthly_expenses,
                                true
                            )}
                        </p>
                    </div>


                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-start justify-between">

                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Net Savings
                                </p>

                                <p
                                    className={`mt-3 text-2xl font-semibold ${
                                        savingsPositive
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {formatCurrency(
                                        summary.total_savings
                                    )}
                                </p>
                            </div>

                            <span
                                className={`text-sm font-semibold ${
                                    savingsPositive
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                NET
                            </span>

                        </div>

                        <p className="mt-4 text-xs text-gray-500">
                            Avg. monthly{" "}
                            {formatCurrency(
                                summary.average_monthly_savings,
                                true
                            )}
                        </p>
                    </div>


                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <div className="flex items-start justify-between">

                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    Savings Rate
                                </p>

                                <p
                                    className={`mt-3 text-2xl font-semibold ${
                                        savingsRate >= 20
                                            ? "text-green-600"
                                            : savingsRate >= 0
                                                ? "text-amber-600"
                                                : "text-red-600"
                                    }`}
                                >
                                    {savingsRate.toFixed(1)}%
                                </p>
                            </div>

                            <span className="text-sm font-semibold text-gray-500">
                                {summary.transaction_count || 0}
                            </span>

                        </div>

                        <p className="mt-4 text-xs text-gray-500">
                            Recorded transactions
                        </p>
                    </div>

                </div>

            </section>


            {/* =====================================================
                TREND + FINANCIAL HEALTH
            ===================================================== */}

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">

                {/* Trend */}

                <section className="rounded-xl border border-gray-200 bg-white p-6">

                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Income, Expenses & Savings
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Your financial movement across the last 12 months.
                            </p>
                        </div>

                        <div className="flex gap-4 text-xs text-gray-500">

                            <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                Income
                            </span>

                            <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                Expenses
                            </span>

                        </div>

                    </div>


                    {monthlyData.length === 0 ? (
                        <div className="flex h-80 items-center justify-center">
                            <p className="text-sm text-gray-500">
                                Not enough transaction data to show a trend.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-8">

                            <div className="relative h-72">

                                <div className="absolute inset-0 flex flex-col justify-between">

                                    {[0, 1, 2, 3, 4].map(
                                        (line) => (
                                            <div
                                                key={line}
                                                className="border-t border-gray-100"
                                            />
                                        )
                                    )}

                                </div>


                                <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">

                                    {monthlyData.map(
                                        (month) => {

                                            const income =
                                                Number(
                                                    month.income || 0
                                                );

                                            const expenses =
                                                Number(
                                                    month.expenses || 0
                                                );

                                            const incomeHeight =
                                                Math.max(
                                                    (
                                                        income /
                                                        chartMaximum
                                                    ) * 100,
                                                    income > 0
                                                        ? 2
                                                        : 0
                                                );

                                            const expenseHeight =
                                                Math.max(
                                                    (
                                                        expenses /
                                                        chartMaximum
                                                    ) * 100,
                                                    expenses > 0
                                                        ? 2
                                                        : 0
                                                );

                                            return (
                                                <button
                                                    type="button"
                                                    key={month.month}
                                                    aria-label={`${formatMonth(
                                                        month.month
                                                    )} — income ${formatCurrency(
                                                        income
                                                    )}, expenses ${formatCurrency(
                                                        expenses
                                                    )}`}
                                                    className="group flex h-full min-w-0 flex-1 items-end justify-center gap-1 outline-none"
                                                >

                                                    <div className="relative flex h-full w-2.5 max-w-4 items-end sm:w-4">

                                                        <div
                                                            className="w-full rounded-t bg-green-500 transition-all group-hover:bg-green-600"
                                                            style={{
                                                                height: `${incomeHeight}%`,
                                                            }}
                                                        >

                                                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block group-focus:block">
                                                                Income:{" "}
                                                                {formatCurrency(
                                                                    income
                                                                )}
                                                            </div>

                                                        </div>

                                                    </div>


                                                    <div className="relative flex h-full w-2.5 max-w-4 items-end sm:w-4">

                                                        <div
                                                            className="w-full rounded-t bg-red-500 transition-all group-hover:bg-red-600"
                                                            style={{
                                                                height: `${expenseHeight}%`,
                                                            }}
                                                        >

                                                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block group-focus:block">
                                                                Expenses:{" "}
                                                                {formatCurrency(
                                                                    expenses
                                                                )}
                                                            </div>

                                                        </div>

                                                    </div>

                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                            </div>


                            <div className="mt-3 flex gap-2 px-2">

                                {monthlyData.map(
                                    (month) => (
                                        <div
                                            key={month.month}
                                            className="min-w-0 flex-1 text-center text-[10px] text-gray-400 sm:text-xs"
                                        >
                                            {formatMonth(
                                                month.month
                                            )}
                                        </div>
                                    )
                                )}

                            </div>


                            <div className="mt-6 border-t border-gray-100 pt-5">

                                <div className="mb-3 flex items-center justify-between">

                                    <span className="text-sm font-medium text-gray-700">
                                        Monthly savings
                                    </span>

                                    <span className="text-xs text-gray-400">
                                        Income minus expenses
                                    </span>

                                </div>

                                <div className="grid grid-cols-6 gap-2 md:grid-cols-12">

                                    {monthlyData.map(
                                        (month) => {

                                            const savings =
                                                Number(
                                                    month.savings || 0
                                                );

                                            const positive =
                                                savings >= 0;

                                            return (
                                                <div
                                                    key={month.month}
                                                    className={`rounded-md p-2 text-center ${
                                                        positive
                                                            ? "bg-green-50"
                                                            : "bg-red-50"
                                                    }`}
                                                >

                                                    <p
                                                        className={`text-xs font-semibold ${
                                                            positive
                                                                ? "text-green-700"
                                                                : "text-red-700"
                                                        }`}
                                                    >
                                                        {formatCurrency(
                                                            savings,
                                                            true
                                                        )}
                                                    </p>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                            </div>

                        </div>
                    )}

                </section>


                {/* Financial Health */}

                <section className="rounded-xl border border-gray-200 bg-white p-6">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Financial Health
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            A quick read on your current savings behavior.
                        </p>
                    </div>


                    <div className="mt-8 flex items-center justify-center">

                        <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-gray-100">

                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `conic-gradient(
                                        ${
                                            savingsRate >= 20
                                                ? "#22c55e"
                                                : savingsRate >= 0
                                                    ? "#f59e0b"
                                                    : "#ef4444"
                                        } ${
                                            Math.min(
                                                Math.max(
                                                    savingsRate,
                                                    0
                                                ),
                                                100
                                            ) * 3.6
                                        }deg,
                                        #f3f4f6 0deg
                                    )`,
                                }}
                            />

                            <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white">

                                <span
                                    className={`text-3xl font-semibold ${
                                        savingsRate >= 20
                                            ? "text-green-600"
                                            : savingsRate >= 0
                                                ? "text-amber-600"
                                                : "text-red-600"
                                    }`}
                                >
                                    {savingsRate.toFixed(1)}%
                                </span>

                                <span className="mt-1 text-xs text-gray-500">
                                    savings rate
                                </span>

                            </div>

                        </div>

                    </div>


                    <div className="mt-8 space-y-4">

                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">

                            <span className="text-sm text-gray-500">
                                Average monthly income
                            </span>

                            <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(
                                    summary.average_monthly_income
                                )}
                            </span>

                        </div>


                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">

                            <span className="text-sm text-gray-500">
                                Average monthly expenses
                            </span>

                            <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(
                                    summary.average_monthly_expenses
                                )}
                            </span>

                        </div>


                        <div className="flex items-center justify-between">

                            <span className="text-sm text-gray-500">
                                Average monthly savings
                            </span>

                            <span
                                className={`text-sm font-semibold ${
                                    Number(
                                        summary.average_monthly_savings
                                    ) >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }`}
                            >
                                {formatCurrency(
                                    summary.average_monthly_savings
                                )}
                            </span>

                        </div>

                    </div>

                </section>

            </div>


            {/* =====================================================
                SPENDING HEATMAP
            ===================================================== */}

            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">

                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Spending activity
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Every expense day over the last six months, darker means you spent more.
                    </p>
                </div>


                <div className="mt-6">
                    <SpendingHeatmap
                        transactions={transactions}
                        formatCurrency={formatCurrency}
                    />
                </div>

            </section>


            {/* =====================================================
                SPENDING ANALYSIS
            ===================================================== */}

            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">

                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Where Your Money Goes
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Current-month spending broken down by category.
                    </p>
                </div>


                {categories.length === 0 ? (
                    <div className="flex min-h-72 items-center justify-center">
                        <p className="text-sm text-gray-500">
                            No expenses recorded this month.
                        </p>
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[300px_minmax(0,1fr)]">

                        {/* Donut */}

                        <div className="flex flex-col items-center justify-center">

                            <div
                                className="relative h-48 w-48 rounded-full sm:h-64 sm:w-64"
                                style={{
                                    background: (() => {
                                        let current = 0;

                                        const segments =
                                            categories.map(
                                                (item, index) => {

                                                    const itemPercentage =
                                                        Number(
                                                            item.percentage ||
                                                            0
                                                        );

                                                    const start =
                                                        current;

                                                    current +=
                                                        itemPercentage;

                                                    const colors = [
                                                        "#111827",
                                                        "#374151",
                                                        "#4b5563",
                                                        "#6b7280",
                                                        "#9ca3af",
                                                        "#d1d5db",
                                                        "#16a34a",
                                                        "#dc2626",
                                                        "#d97706",
                                                    ];

                                                    return `${colors[index % colors.length]} ${start}% ${current}%`;
                                                }
                                            );

                                        return `conic-gradient(${segments.join(
                                            ", "
                                        )})`;
                                    })(),
                                }}
                            >

                                <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white px-2 sm:inset-10">

                                    <span className="text-xs font-medium text-gray-500">
                                        Total spent
                                    </span>

                                    <span className="mt-1 text-center text-base font-semibold text-gray-900 sm:mt-2 sm:text-xl">
                                        {formatCurrency(
                                            categoryTotal,
                                            true
                                        )}
                                    </span>

                                </div>

                            </div>

                            <p className="mt-5 text-center text-xs text-gray-400">
                                Current month
                            </p>

                        </div>


                        {/* Categories */}

                        <div className="space-y-5">

                            {categories.map(
                                (item, index) => {

                                    const colors = [
                                        "bg-gray-900",
                                        "bg-gray-700",
                                        "bg-gray-600",
                                        "bg-gray-500",
                                        "bg-gray-400",
                                        "bg-gray-300",
                                        "bg-green-600",
                                        "bg-red-600",
                                        "bg-amber-600",
                                    ];

                                    const change =
                                        item.change_percentage;

                                    return (
                                        <div
                                            key={item.category}
                                        >

                                            <div className="flex items-center justify-between gap-4">

                                                <div className="flex min-w-0 items-center gap-3">

                                                    <span
                                                        className={`h-3 w-3 shrink-0 rounded-full ${
                                                            colors[
                                                                index %
                                                                    colors.length
                                                            ]
                                                        }`}
                                                    />

                                                    <span className="truncate text-sm font-medium text-gray-700">
                                                        {item.category}
                                                    </span>

                                                </div>


                                                <div className="text-right">

                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {formatCurrency(
                                                            item.amount
                                                        )}
                                                    </span>

                                                    <span className="ml-3 text-xs text-gray-400">
                                                        {Number(
                                                            item.percentage ||
                                                            0
                                                        ).toFixed(1)}
                                                        %
                                                    </span>

                                                </div>

                                            </div>


                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">

                                                <div
                                                    className={`h-full rounded-full ${
                                                        colors[
                                                            index %
                                                                colors.length
                                                        ]
                                                    }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            Number(
                                                                item.percentage ||
                                                                0
                                                            ),
                                                            100
                                                        )}%`,
                                                    }}
                                                />

                                            </div>


                                            <div className="mt-2 flex justify-between text-xs">

                                                <span className="text-gray-400">
                                                    {item.transaction_count || 0}{" "}
                                                    transactions
                                                </span>

                                                <span
                                                    className={
                                                        change === null
                                                            ? "text-gray-400"
                                                            : change > 0
                                                                ? "text-red-500"
                                                                : change < 0
                                                                    ? "text-green-600"
                                                                    : "text-gray-400"
                                                    }
                                                >
                                                    {change === null
                                                        ? "New category"
                                                        : `${getChangeLabel(
                                                            change
                                                        )} vs last month`}
                                                </span>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </div>
                )}

            </section>


            {/* =====================================================
                BUDGET + INCOME SOURCES
            ===================================================== */}

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">

                {/* Budget Performance */}

                <section className="rounded-xl border border-gray-200 bg-white p-6">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Budget Performance
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            How your current spending compares with your budgets.
                        </p>
                    </div>


                    {budgets.length === 0 ? (
                        <div className="flex min-h-64 items-center justify-center">
                            <p className="text-sm text-gray-500">
                                No budgets are set for this month.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-7 space-y-6">

                            {budgets.map(
                                (budget) => {

                                    const used =
                                        Number(
                                            budget.percentage || 0
                                        );

                                    const width =
                                        Math.min(
                                            used,
                                            100
                                        );

                                    const status =
                                        budget.status;

                                    return (
                                        <div
                                            key={budget.id}
                                        >

                                            <div className="flex items-center justify-between gap-4">

                                                <div>

                                                    <p className="text-sm font-medium text-gray-800">
                                                        {budget.category}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {formatCurrency(
                                                            budget.spent
                                                        )}{" "}
                                                        of{" "}
                                                        {formatCurrency(
                                                            budget.budget
                                                        )}
                                                    </p>

                                                </div>


                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        status === "over"
                                                            ? "bg-red-50 text-red-600"
                                                            : status === "warning"
                                                                ? "bg-amber-50 text-amber-600"
                                                                : "bg-green-50 text-green-600"
                                                    }`}
                                                >
                                                    {status === "over"
                                                        ? "Over budget"
                                                        : status === "warning"
                                                            ? "Near limit"
                                                            : "Healthy"}
                                                </span>

                                            </div>


                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

                                                <div
                                                    className={`h-full rounded-full ${
                                                        status === "over"
                                                            ? "bg-red-500"
                                                            : status === "warning"
                                                                ? "bg-amber-500"
                                                                : "bg-green-500"
                                                    }`}
                                                    style={{
                                                        width: `${width}%`,
                                                    }}
                                                />

                                            </div>


                                            <div className="mt-2 flex justify-between text-xs text-gray-400">

                                                <span>
                                                    {used.toFixed(1)}% used
                                                </span>

                                                <span
                                                    className={
                                                        Number(
                                                            budget.remaining
                                                        ) < 0
                                                            ? "font-medium text-red-500"
                                                            : "text-gray-500"
                                                    }
                                                >
                                                    {Number(
                                                        budget.remaining
                                                    ) < 0
                                                        ? `${formatCurrency(
                                                            Math.abs(
                                                                budget.remaining
                                                            )
                                                        )} over`
                                                        : `${formatCurrency(
                                                            budget.remaining
                                                        )} remaining`}
                                                </span>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                </section>


                {/* Income Sources */}

                <section className="rounded-xl border border-gray-200 bg-white p-6">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Income Sources
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Where your recorded income is coming from.
                        </p>
                    </div>


                    {incomeSources.length === 0 ? (
                        <div className="flex min-h-64 items-center justify-center">
                            <p className="text-sm text-gray-500">
                                No income transactions recorded yet.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-7 space-y-5">

                            {incomeSources.map(
                                (item) => {

                                    const share =
                                        incomeSourceTotal > 0
                                            ? (
                                                Number(
                                                    item.amount
                                                ) /
                                                incomeSourceTotal
                                            ) * 100
                                            : 0;

                                    return (
                                        <div
                                            key={item.source}
                                        >

                                            <div className="flex items-center justify-between">

                                                <div>

                                                    <p className="text-sm font-medium text-gray-800">
                                                        {item.source}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {item.transaction_count || 0}{" "}
                                                        transactions
                                                    </p>

                                                </div>


                                                <div className="text-right">

                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {formatCurrency(
                                                            item.amount
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {share.toFixed(1)}%
                                                    </p>

                                                </div>

                                            </div>


                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">

                                                <div
                                                    className="h-full rounded-full bg-gray-800"
                                                    style={{
                                                        width: `${Math.min(
                                                            share,
                                                            100
                                                        )}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                </section>

            </div>


            {/* =====================================================
                SMART INSIGHTS
            ===================================================== */}

            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">

                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Smart Insights
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Observations generated from your financial activity.
                    </p>
                </div>


                {insights.length === 0 ? (
                    <div className="mt-8 rounded-lg bg-gray-50 p-8 text-center">

                        <p className="text-sm text-gray-500">
                            Keep recording transactions and budgets.
                            More insights will appear as your financial history grows.
                        </p>

                    </div>
                ) : (
                    <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">

                        {insights.map(
                            (insight, index) => (
                                <div
                                    key={`${insight.type}-${index}`}
                                    className={`rounded-lg border p-5 ${
                                        insight.severity === "negative"
                                            ? "border-red-200 bg-red-50"
                                            : insight.severity === "warning"
                                                ? "border-amber-200 bg-amber-50"
                                                : insight.severity === "positive"
                                                    ? "border-green-200 bg-green-50"
                                                    : "border-gray-200 bg-gray-50"
                                    }`}
                                >

                                    <div className="flex gap-4">

                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                                insight.severity === "negative"
                                                    ? "bg-red-100 text-red-600"
                                                    : insight.severity === "warning"
                                                        ? "bg-amber-100 text-amber-600"
                                                        : insight.severity === "positive"
                                                            ? "bg-green-100 text-green-600"
                                                            : "bg-gray-200 text-gray-700"
                                            }`}
                                        >
                                            <InsightIcon
                                                type={insight.type}
                                            />
                                        </div>


                                        <div>

                                            <h3 className="text-sm font-semibold text-gray-900">
                                                {insight.title}
                                            </h3>

                                            <p className="mt-1.5 text-sm leading-6 text-gray-600">
                                                {insight.message}
                                            </p>

                                        </div>

                                    </div>

                                </div>
                            )
                        )}

                    </div>
                )}

            </section>


            {/* =====================================================
                SAVINGS GOALS
            ===================================================== */}

            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

                    <div>

                        <h2 className="text-lg font-semibold text-gray-900">
                            Savings Goals
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            How your savings are progressing toward your goals.
                        </p>

                    </div>


                    {goals.items?.length > 0 && (
                        <div className="text-left sm:text-right">

                            <p className="text-xs text-gray-500">
                                Total saved toward goals
                            </p>

                            <p className="mt-1 text-lg font-semibold text-gray-900">
                                {formatCurrency(
                                    goals.total_saved
                                )}
                            </p>

                        </div>
                    )}

                </div>


                {!goals.items ||
                goals.items.length === 0 ? (
                    <div className="mt-8 rounded-lg bg-gray-50 p-8 text-center">

                        <p className="text-sm text-gray-500">
                            You haven't created any savings goals yet.
                        </p>

                    </div>
                ) : (
                    <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">

                        {goals.items.map(
                            (goal) => {

                                const progress =
                                    Math.min(
                                        Number(
                                            goal.progress_percentage ||
                                            0
                                        ),
                                        100
                                    );

                                return (
                                    <div
                                        key={goal.id}
                                        className="rounded-lg border border-gray-200 p-5"
                                    >

                                        <div className="flex items-start justify-between gap-4">

                                            <div>

                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    {goal.name}
                                                </h3>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {goal.completed
                                                        ? "Goal completed"
                                                        : `${formatCurrency(
                                                            goal.remaining_amount
                                                        )} remaining`}
                                                </p>

                                            </div>


                                            <span
                                                className={`text-sm font-semibold ${
                                                    goal.completed
                                                        ? "text-green-600"
                                                        : "text-gray-700"
                                                }`}
                                            >
                                                {progress.toFixed(1)}%
                                            </span>

                                        </div>


                                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">

                                            <div
                                                className={`h-full rounded-full ${
                                                    goal.completed
                                                        ? "bg-green-500"
                                                        : "bg-gray-800"
                                                }`}
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />

                                        </div>


                                        <div className="mt-3 flex justify-between text-xs text-gray-500">

                                            <span>
                                                {formatCurrency(
                                                    goal.current_amount
                                                )}
                                            </span>

                                            <span>
                                                {formatCurrency(
                                                    goal.target_amount
                                                )}
                                            </span>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </section>


            {/* =====================================================
                TRANSACTION HIGHLIGHTS
            ===================================================== */}

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">

                {/* Largest Expenses */}

                <section className="rounded-xl border border-gray-200 bg-white p-6">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Largest Expenses
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Your five largest recorded expenses.
                        </p>
                    </div>


                    {topExpenses.length === 0 ? (
                        <div className="py-10 text-center">

                            <p className="text-sm text-gray-500">
                                No expenses recorded yet.
                            </p>

                        </div>
                    ) : (
                        <div className="mt-6 divide-y divide-gray-100">

                            {topExpenses.map(
                                (expense) => (
                                    <div
                                        key={expense.id}
                                        className="flex items-center justify-between gap-4 py-4"
                                    >

                                        <div className="min-w-0">

                                            <p className="truncate text-sm font-medium text-gray-800">
                                                {expense.description ||
                                                    expense.category ||
                                                    "Expense"}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                {expense.category}{" "}
                                                •{" "}
                                                {formatDate(
                                                    expense.transaction_date
                                                )}
                                            </p>

                                        </div>


                                        <p className="shrink-0 text-sm font-semibold text-red-600">
                                            {formatCurrency(
                                                expense.amount
                                            )}
                                        </p>

                                    </div>
                                )
                            )}

                        </div>
                    )}

                </section>


                {/* Largest Income */}

                <section className="rounded-xl border border-gray-200 bg-white p-6">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Largest Income
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Your five largest recorded income entries.
                        </p>
                    </div>


                    {topIncome.length === 0 ? (
                        <div className="py-10 text-center">

                            <p className="text-sm text-gray-500">
                                No income recorded yet.
                            </p>

                        </div>
                    ) : (
                        <div className="mt-6 divide-y divide-gray-100">

                            {topIncome.map(
                                (income) => (
                                    <div
                                        key={income.id}
                                        className="flex items-center justify-between gap-4 py-4"
                                    >

                                        <div className="min-w-0">

                                            <p className="truncate text-sm font-medium text-gray-800">
                                                {income.description ||
                                                    income.source ||
                                                    "Income"}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                {income.source}{" "}
                                                •{" "}
                                                {formatDate(
                                                    income.transaction_date
                                                )}
                                            </p>

                                        </div>


                                        <p className="shrink-0 text-sm font-semibold text-green-600">
                                            +{" "}
                                            {formatCurrency(
                                                income.amount
                                            )}
                                        </p>

                                    </div>
                                )
                            )}

                        </div>
                    )}

                </section>

            </div>


            {/* =====================================================
                FOOTER SUMMARY
            ===================================================== */}

            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">

                    <div>

                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Total goal target
                        </p>

                        <p className="mt-2 text-lg font-semibold text-gray-900">
                            {formatCurrency(
                                goals.total_target
                            )}
                        </p>

                    </div>


                    <div>

                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Still needed
                        </p>

                        <p className="mt-2 text-lg font-semibold text-gray-900">
                            {formatCurrency(
                                goals.total_remaining
                            )}
                        </p>

                    </div>


                    <div>

                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Recorded transactions
                        </p>

                        <p className="mt-2 text-lg font-semibold text-gray-900">
                            {summary.transaction_count || 0}
                        </p>

                    </div>

                </div>

            </div>

        </Reveal>
    );
}


export default Analytics;