import { useEffect, useMemo, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
} from "lucide-react";

import { apiFetch } from "../lib/api";
import {
    useCurrency,
} from "../context/CurrencyContext";


function Dashboard() {
    const {
        formatCurrency,
        formatCompactCurrency,
    } = useCurrency();


    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);

                const data = await apiFetch(
                    "/api/dashboard/summary"
                );

                setSummary(data);
            } catch (error) {
                console.error(error);

                setError(
                    error.message ||
                        "Unable to load dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);


    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        return new Date(
            `${value}T00:00:00`
        ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };


    const formatTransactionAmount = (
        transaction
    ) => {
        return `${
            transaction.type === "income"
                ? "+"
                : "-"
        }${formatCurrency(
            transaction.amount
        )}`;
    };


    /*
     * Build a complete six-month timeline.
     *
     * The API only returns months that contain
     * transactions. Missing months are filled with 0.
     */
    const monthlyChartData = useMemo(() => {
        const existing =
            summary?.monthly_data || [];

        const lookup = new Map(
            existing.map((item) => [
                item.month,
                item,
            ])
        );

        const months = [];

        const currentDate = new Date();

        for (let index = 5; index >= 0; index--) {
            const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() - index,
                1
            );

            const year = date.getFullYear();

            const monthNumber = String(
                date.getMonth() + 1
            ).padStart(2, "0");

            const key =
                `${year}-${monthNumber}`;

            const existingMonth =
                lookup.get(key);

            months.push({
                month: key,

                label: date.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                    }
                ),

                income: Number(
                    existingMonth?.income || 0
                ),

                expenses: Number(
                    existingMonth?.expenses || 0
                ),
            });
        }

        return months;
    }, [summary]);


    const chartMaximum = useMemo(() => {
        const values =
            monthlyChartData.flatMap(
                (item) => [
                    item.income,
                    item.expenses,
                ]
            );

        const maximum = Math.max(
            ...values,
            0
        );

        if (maximum === 0) {
            return 1000;
        }

        return maximum;
    }, [monthlyChartData]);


    if (loading) {
        return (
            <div className="space-y-9">

                <div>

                    <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />

                    <div className="mt-3 h-10 w-40 animate-pulse rounded bg-neutral-200" />

                    <div className="mt-3 h-5 w-72 animate-pulse rounded bg-neutral-100" />

                </div>


                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    {Array.from({
                        length: 3,
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="h-36 animate-pulse rounded-xl border border-neutral-200 bg-white"
                        />
                    ))}

                </div>

            </div>
        );
    }


    if (error) {
        return (
            <div className="space-y-9">

                <div>

                    <p className="text-sm font-medium text-neutral-400">
                        Overview
                    </p>

                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
                        Dashboard
                    </h1>

                </div>


                <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-5">

                    <p className="text-sm font-medium text-red-800">
                        Unable to load your dashboard.
                    </p>

                    <p className="mt-1.5 text-sm text-red-600">
                        {error}
                    </p>

                </div>

            </div>
        );
    }


    return (
        <div className="space-y-9">

            {/* Header */}

            <header>

                <p className="text-sm font-medium text-neutral-400">
                    Overview
                </p>

                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                    Dashboard
                </h1>

                <p className="mt-2 text-base text-neutral-500">
                    A quick look at your finances.
                </p>

            </header>


            {/* Summary cards */}

            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {/* Balance */}

                <div className="rounded-xl border border-neutral-200 bg-white p-6">

                    <div className="flex items-center justify-between">

                        <p className="text-sm font-medium text-neutral-500">
                            Total balance
                        </p>

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">

                            <Wallet
                                size={19}
                                strokeWidth={1.8}
                            />

                        </div>

                    </div>


                    <p
                        className={[
                            "mt-6 text-3xl font-semibold tracking-tight",
                            Number(
                                summary?.balance || 0
                            ) >= 0
                                ? "text-neutral-900"
                                : "text-red-600",
                        ].join(" ")}
                    >
                        {formatCurrency(
                            summary?.balance
                        )}
                    </p>


                    <p className="mt-2 text-sm text-neutral-400">
                        Income minus expenses
                    </p>

                </div>


                {/* Income */}

                <div className="rounded-xl border border-emerald-100 bg-white p-6">

                    <div className="flex items-center justify-between">

                        <p className="text-sm font-medium text-neutral-500">
                            Total income
                        </p>

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">

                            <ArrowDownLeft
                                size={19}
                                strokeWidth={1.8}
                            />

                        </div>

                    </div>


                    <p className="mt-6 text-3xl font-semibold tracking-tight text-emerald-700">
                        {formatCurrency(
                            summary?.income
                        )}
                    </p>


                    <p className="mt-2 text-sm text-neutral-400">
                        All recorded income
                    </p>

                </div>


                {/* Expenses */}

                <div className="rounded-xl border border-red-100 bg-white p-6 sm:col-span-2 lg:col-span-1">

                    <div className="flex items-center justify-between">

                        <p className="text-sm font-medium text-neutral-500">
                            Total expenses
                        </p>

                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">

                            <ArrowUpRight
                                size={19}
                                strokeWidth={1.8}
                            />

                        </div>

                    </div>


                    <p className="mt-6 text-3xl font-semibold tracking-tight text-red-700">
                        {formatCurrency(
                            summary?.expenses
                        )}
                    </p>


                    <p className="mt-2 text-sm text-neutral-400">
                        All recorded expenses
                    </p>

                </div>

            </section>


            {/* Six month chart */}

            <section className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-7">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                        <h2 className="text-base font-semibold text-neutral-900">
                            Financial overview
                        </h2>

                        <p className="mt-1.5 text-sm text-neutral-400">
                            Income and expenses over the last six months.
                        </p>

                    </div>


                    <div className="flex items-center gap-5">

                        <div className="flex items-center gap-2">

                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                            <span className="text-xs text-neutral-500">
                                Income
                            </span>

                        </div>


                        <div className="flex items-center gap-2">

                            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

                            <span className="text-xs text-neutral-500">
                                Expenses
                            </span>

                        </div>

                    </div>

                </div>


                <div className="mt-8">

                    {monthlyChartData.some(
                        (item) =>
                            item.income > 0 ||
                            item.expenses > 0
                    ) ? (

                        <div className="flex h-80 gap-4 sm:gap-6">

                            {/* Y-axis */}

                            <div className="flex w-16 flex-col justify-between pb-8 text-right text-xs text-neutral-400">

                                <span>
                                    {formatCompactCurrency(
                                        chartMaximum
                                    )}
                                </span>


                                <span>
                                    {formatCompactCurrency(
                                        chartMaximum /
                                            2
                                    )}
                                </span>


                                <span>
                                    {formatCurrency(
                                        0
                                    )}
                                </span>

                            </div>


                            {/* Chart */}

                            <div className="relative flex min-w-0 flex-1 items-end">

                                {/* Grid */}

                                <div className="pointer-events-none absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between">

                                    <div className="border-t border-neutral-100" />

                                    <div className="border-t border-neutral-100" />

                                    <div className="border-t border-neutral-100" />

                                </div>


                                {/* Bars */}

                                <div className="relative flex h-full w-full items-end justify-between gap-2 sm:gap-5">

                                    {monthlyChartData.map(
                                        (item) => {

                                            const incomeHeight =
                                                item.income >
                                                0
                                                    ? Math.max(
                                                          3,
                                                          (
                                                              item.income /
                                                              chartMaximum
                                                          ) *
                                                              100
                                                      )
                                                    : 0;


                                            const expenseHeight =
                                                item.expenses >
                                                0
                                                    ? Math.max(
                                                          3,
                                                          (
                                                              item.expenses /
                                                              chartMaximum
                                                          ) *
                                                              100
                                                      )
                                                    : 0;


                                            return (
                                                <div
                                                    key={
                                                        item.month
                                                    }
                                                    className="flex h-full flex-1 flex-col items-center justify-end"
                                                >

                                                    <div className="flex h-[calc(100%-32px)] w-full max-w-20 items-end justify-center gap-1.5 sm:gap-2">

                                                        {/* Income */}

                                                        <button
                                                            type="button"
                                                            aria-label={`${item.label} income: ${formatCurrency(
                                                                item.income
                                                            )}`}
                                                            className="group relative flex h-full flex-1 items-end justify-center outline-none"
                                                        >

                                                            <div
                                                                className="w-full rounded-t-md bg-emerald-500/80 transition hover:bg-emerald-500"
                                                                style={{
                                                                    height: `${incomeHeight}%`,
                                                                }}
                                                            >

                                                                {item.income >
                                                                    0 && (
                                                                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-sm transition group-hover:opacity-100 group-focus:opacity-100">
                                                                        Income:{" "}
                                                                        {formatCurrency(
                                                                            item.income
                                                                        )}
                                                                    </div>
                                                                )}

                                                            </div>

                                                        </button>


                                                        {/* Expenses */}

                                                        <button
                                                            type="button"
                                                            aria-label={`${item.label} expenses: ${formatCurrency(
                                                                item.expenses
                                                            )}`}
                                                            className="group relative flex h-full flex-1 items-end justify-center outline-none"
                                                        >

                                                            <div
                                                                className="w-full rounded-t-md bg-red-500/80 transition hover:bg-red-500"
                                                                style={{
                                                                    height: `${expenseHeight}%`,
                                                                }}
                                                            >

                                                                {item.expenses >
                                                                    0 && (
                                                                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-sm transition group-hover:opacity-100 group-focus:opacity-100">
                                                                        Expenses:{" "}
                                                                        {formatCurrency(
                                                                            item.expenses
                                                                        )}
                                                                    </div>
                                                                )}

                                                            </div>

                                                        </button>

                                                    </div>


                                                    <span className="mt-2 text-xs font-medium text-neutral-400">
                                                        {
                                                            item.label
                                                        }
                                                    </span>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                            </div>

                        </div>

                    ) : (

                        <div className="flex h-80 items-center justify-center">

                            <div className="text-center">

                                <p className="text-sm font-medium text-neutral-700">
                                    Not enough data yet
                                </p>

                                <p className="mt-2 text-sm text-neutral-400">
                                    Add some transactions to see your financial history.
                                </p>

                            </div>

                        </div>

                    )}

                </div>

            </section>


            {/* Monthly overview + categories */}

            <section className="grid gap-5 lg:grid-cols-5">

                {/* Monthly overview */}

                <div className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-7 lg:col-span-3">

                    <div>

                        <h2 className="text-base font-semibold text-neutral-900">
                            This month
                        </h2>

                        <p className="mt-1.5 text-sm text-neutral-400">
                            Your income and spending for the current month.
                        </p>

                    </div>


                    <div className="mt-7 grid gap-5 sm:grid-cols-2">

                        {/* Monthly income */}

                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-5">

                            <div className="flex items-center gap-2.5">

                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">

                                    <ArrowDownLeft
                                        size={15}
                                        strokeWidth={1.8}
                                    />

                                </div>

                                <p className="text-sm font-medium text-emerald-700">
                                    Income
                                </p>

                            </div>


                            <p className="mt-4 text-xl font-semibold text-neutral-900">
                                {formatCurrency(
                                    summary?.monthly_income
                                )}
                            </p>

                        </div>


                        {/* Monthly expenses */}

                        <div className="rounded-lg border border-red-100 bg-red-50/50 p-5">

                            <div className="flex items-center gap-2.5">

                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600">

                                    <ArrowUpRight
                                        size={15}
                                        strokeWidth={1.8}
                                    />

                                </div>

                                <p className="text-sm font-medium text-red-700">
                                    Expenses
                                </p>

                            </div>


                            <p className="mt-4 text-xl font-semibold text-neutral-900">
                                {formatCurrency(
                                    summary?.monthly_expenses
                                )}
                            </p>

                        </div>

                    </div>


                    <div className="mt-7">

                        <div className="flex items-center justify-between text-sm">

                            <span className="text-neutral-500">
                                Spending relative to income
                            </span>


                            <span className="font-medium text-neutral-700">
                                {summary?.monthly_income >
                                0
                                    ? `${Math.round(
                                          Math.min(
                                              100,
                                              (
                                                  summary.monthly_expenses /
                                                  summary.monthly_income
                                              ) *
                                                  100
                                          )
                                      )}%`
                                    : "0%"}
                            </span>

                        </div>


                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-100">

                            <div
                                className="h-full rounded-full bg-red-500 transition-all"
                                style={{
                                    width:
                                        summary?.monthly_income >
                                        0
                                            ? `${Math.min(
                                                  100,
                                                  (
                                                      summary.monthly_expenses /
                                                      summary.monthly_income
                                                  ) *
                                                      100
                                              )}%`
                                            : "0%",
                                }}
                            />

                        </div>


                        <div className="mt-2.5 flex justify-between text-xs">

                            <span className="text-neutral-400">
                                {formatCurrency(
                                    summary?.monthly_expenses
                                )}{" "}
                                spent
                            </span>


                            <span className="text-neutral-400">
                                {formatCurrency(
                                    summary?.monthly_income
                                )}{" "}
                                income
                            </span>

                        </div>

                    </div>

                </div>


                {/* Category breakdown */}

                <div className="rounded-xl border border-neutral-200 bg-white p-6 sm:p-7 lg:col-span-2">

                    <div>

                        <h2 className="text-base font-semibold text-neutral-900">
                            Spending by category
                        </h2>

                        <p className="mt-1.5 text-sm text-neutral-400">
                            This month's expenses.
                        </p>

                    </div>


                    {summary?.category_breakdown
                        ?.length ? (

                        <div className="mt-6 space-y-5">

                            {summary.category_breakdown
                                .slice(0, 5)
                                .map((item) => {

                                    const total =
                                        Number(
                                            summary.monthly_expenses
                                        );


                                    const itemAmount =
                                        Number(
                                            item.amount
                                        );


                                    const itemPercentage =
                                        total > 0
                                            ? (
                                                  itemAmount /
                                                  total
                                              ) *
                                              100
                                            : 0;


                                    return (
                                        <div
                                            key={
                                                item.category
                                            }
                                        >

                                            <div className="flex items-center justify-between gap-3">

                                                <span className="truncate text-sm font-medium text-neutral-700">
                                                    {
                                                        item.category
                                                    }
                                                </span>


                                                <span className="shrink-0 text-sm text-neutral-500">
                                                    {formatCurrency(
                                                        item.amount
                                                    )}
                                                </span>

                                            </div>


                                            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-neutral-100">

                                                <div
                                                    className="h-full rounded-full bg-neutral-700"
                                                    style={{
                                                        width: `${Math.min(
                                                            itemPercentage,
                                                            100
                                                        )}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>
                                    );
                                })}

                        </div>

                    ) : (

                        <div className="flex min-h-44 items-center justify-center">

                            <p className="text-sm text-neutral-400">
                                No expenses recorded this month.
                            </p>

                        </div>

                    )}

                </div>

            </section>


            {/* Recent transactions */}

            <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">

                <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">

                    <div>

                        <h2 className="text-base font-semibold text-neutral-900">
                            Recent transactions
                        </h2>

                        <p className="mt-1.5 text-sm text-neutral-400">
                            Your latest financial activity.
                        </p>

                    </div>

                </div>


                {summary?.recent_transactions
                    ?.length ? (

                    <div className="divide-y divide-neutral-100">

                        {summary.recent_transactions.map(
                            (transaction) => (

                                <div
                                    key={
                                        transaction.id
                                    }
                                    className="flex items-center justify-between gap-4 px-6 py-5"
                                >

                                    <div className="flex min-w-0 items-center gap-4">

                                        <div
                                            className={[
                                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                                transaction.type ===
                                                "income"
                                                    ? "bg-emerald-50 text-emerald-600"
                                                    : "bg-red-50 text-red-600",
                                            ].join(
                                                " "
                                            )}
                                        >

                                            {transaction.type ===
                                            "income" ? (
                                                <ArrowDownLeft
                                                    size={
                                                        17
                                                    }
                                                    strokeWidth={
                                                        1.8
                                                    }
                                                />
                                            ) : (
                                                <ArrowUpRight
                                                    size={
                                                        17
                                                    }
                                                    strokeWidth={
                                                        1.8
                                                    }
                                                />
                                            )}

                                        </div>


                                        <div className="min-w-0">

                                            <p className="truncate text-sm font-medium text-neutral-800">
                                                {transaction.description ||
                                                    "No description"}
                                            </p>


                                            <div className="mt-1.5 flex items-center gap-2">

                                                <span className="text-xs text-neutral-400">
                                                    {formatDate(
                                                        transaction.transaction_date
                                                    )}
                                                </span>


                                                <span className="text-neutral-300">
                                                    /
                                                </span>


                                                <span className="text-xs text-neutral-400">
                                                    {transaction.type ===
                                                    "income"
                                                        ? transaction.source ||
                                                          "Other"
                                                        : transaction.category ||
                                                          "Other"}
                                                </span>

                                            </div>

                                        </div>

                                    </div>


                                    <p
                                        className={[
                                            "shrink-0 text-sm font-semibold",
                                            transaction.type ===
                                            "income"
                                                ? "text-emerald-700"
                                                : "text-red-700",
                                        ].join(
                                            " "
                                        )}
                                    >
                                        {formatTransactionAmount(
                                            transaction
                                        )}
                                    </p>

                                </div>
                            )
                        )}

                    </div>

                ) : (

                    <div className="flex min-h-44 items-center justify-center px-6">

                        <div className="text-center">

                            <p className="text-sm font-medium text-neutral-700">
                                No transactions yet
                            </p>

                            <p className="mt-2 text-sm text-neutral-400">
                                Your recent activity will appear here.
                            </p>

                        </div>

                    </div>

                )}

            </section>

        </div>
    );
}


export default Dashboard;