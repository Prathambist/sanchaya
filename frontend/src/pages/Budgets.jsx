import { useEffect, useMemo, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
} from "lucide-react";

import { apiFetch } from "../lib/api";
import {
    expenseCategories,
} from "../constants/categories";
import {
    useCurrency,
} from "../context/CurrencyContext";
import { useToast } from "../context/ToastContext";


const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];


function Budgets() {
    const {
        formatCurrency,
        convertFromBase,
        convertToBase,
    } = useCurrency();

    const toast = useToast();


    const today = new Date();


    const [budgets, setBudgets] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    const [selectedMonth, setSelectedMonth] =
        useState(
            today.getMonth() + 1
        );

    const [selectedYear, setSelectedYear] =
        useState(
            today.getFullYear()
        );


    const [showModal, setShowModal] =
        useState(false);

    const [editingBudget, setEditingBudget] =
        useState(null);


    const [form, setForm] = useState({
        category: "",
        amount: "",
    });


    const [saving, setSaving] =
        useState(false);

    const [deleteTarget, setDeleteTarget] =
        useState(null);

    const [deleting, setDeleting] =
        useState(false);


    const loadBudgets = async () => {
        try {
            setLoading(true);
            setError("");

            const data =
                await apiFetch(
                    "/api/budgets/"
                );

            setBudgets(
                data.budgets || []
            );
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Unable to load budgets."
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadBudgets();
    }, []);


    const filteredBudgets = useMemo(
        () =>
            budgets.filter(
                (budget) =>
                    budget.month ===
                        selectedMonth &&
                    budget.year ===
                        selectedYear
            ),
        [
            budgets,
            selectedMonth,
            selectedYear,
        ]
    );


    const totalBudget = useMemo(
        () =>
            filteredBudgets.reduce(
                (
                    total,
                    budget
                ) =>
                    total +
                    Number(
                        budget.amount ||
                            0
                    ),
                0
            ),
        [filteredBudgets]
    );


    const totalSpent = useMemo(
        () =>
            filteredBudgets.reduce(
                (
                    total,
                    budget
                ) =>
                    total +
                    Number(
                        budget.spent ||
                            0
                    ),
                0
            ),
        [filteredBudgets]
    );


    const totalRemaining =
        totalBudget -
        totalSpent;


    const openAddModal = () => {
        setEditingBudget(null);

        setForm({
            category: "",
            amount: "",
        });

        setError("");
        setShowModal(true);
    };


    const openEditModal = (
        budget
    ) => {
        setEditingBudget(budget);

        setForm({
            category:
                budget.category,
            amount:
                convertFromBase(
                    budget.amount
                ).toFixed(2),
        });

        setError("");
        setShowModal(true);
    };


    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingBudget(null);

        setForm({
            category: "",
            amount: "",
        });
    };


    const handleSubmit =
        async (event) => {
            event.preventDefault();

            setError("");


            if (!form.category) {
                setError(
                    "Please select a category."
                );

                return;
            }


            if (
                !form.amount ||
                Number(form.amount) <=
                    0
            ) {
                setError(
                    "Budget amount must be greater than zero."
                );

                return;
            }


            setSaving(true);


            try {
                const payload = {
                    category:
                        form.category,

                    amount:
                        convertToBase(
                            Number(
                                form.amount
                            )
                        ),

                    month:
                        selectedMonth,

                    year:
                        selectedYear,
                };


                if (
                    editingBudget
                ) {
                    await apiFetch(
                        `/api/budgets/${editingBudget.id}`,
                        {
                            method: "PUT",
                            body:
                                JSON.stringify(
                                    payload
                                ),
                        }
                    );
                } else {
                    await apiFetch(
                        "/api/budgets/",
                        {
                            method: "POST",
                            body:
                                JSON.stringify(
                                    payload
                                ),
                        }
                    );
                }


                toast.success(
                    editingBudget
                        ? "Budget updated."
                        : "Budget created."
                );

                closeModal();
                await loadBudgets();
            } catch (error) {
                setError(
                    error.message ||
                        "Unable to save budget."
                );
            } finally {
                setSaving(false);
            }
        };


    const handleDelete =
        async () => {
            if (!deleteTarget) {
                return;
            }

            setDeleting(true);
            setError("");


            try {
                await apiFetch(
                    `/api/budgets/${deleteTarget.id}`,
                    {
                        method: "DELETE",
                    }
                );


                setDeleteTarget(null);
                await loadBudgets();

                toast.success(
                    "Budget deleted."
                );
            } catch (error) {
                const message =
                    error.message ||
                    "Unable to delete budget.";

                setError(message);
                toast.error(message);
            } finally {
                setDeleting(false);
            }
        };


    const years = Array.from(
        {
            length: 7,
        },
        (_, index) =>
            today.getFullYear() -
            3 +
            index
    );


    return (
        <div className="space-y-7">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                <div>

                    <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                        Budgets
                    </h1>

                    <p className="mt-1 text-sm text-neutral-500">
                        Plan your spending and keep track of your limits.
                    </p>

                </div>


                <button
                    type="button"
                    onClick={
                        openAddModal
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
                >
                    <Plus size={17} />

                    Add Budget
                </button>

            </div>


            <div className="flex flex-wrap items-center gap-3">

                <select
                    value={
                        selectedMonth
                    }
                    onChange={(event) =>
                        setSelectedMonth(
                            Number(
                                event.target.value
                            )
                        )
                    }
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 outline-none"
                >

                    {monthNames.map(
                        (
                            month,
                            index
                        ) => (
                            <option
                                key={
                                    month
                                }
                                value={
                                    index +
                                    1
                                }
                            >
                                {month}
                            </option>
                        )
                    )}

                </select>


                <select
                    value={
                        selectedYear
                    }
                    onChange={(event) =>
                        setSelectedYear(
                            Number(
                                event.target.value
                            )
                        )
                    }
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 outline-none"
                >

                    {years.map(
                        (year) => (
                            <option
                                key={
                                    year
                                }
                                value={
                                    year
                                }
                            >
                                {year}
                            </option>
                        )
                    )}

                </select>

            </div>


            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}


            <div className="grid gap-4 md:grid-cols-3">

                <div className="rounded-xl border border-neutral-200 bg-white p-5">

                    <p className="text-sm text-neutral-500">
                        Total Budget
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {formatCurrency(
                            totalBudget
                        )}
                    </p>

                </div>


                <div className="rounded-xl border border-neutral-200 bg-white p-5">

                    <p className="text-sm text-neutral-500">
                        Total Spent
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-red-600">
                        {formatCurrency(
                            totalSpent
                        )}
                    </p>

                </div>


                <div className="rounded-xl border border-neutral-200 bg-white p-5">

                    <p className="text-sm text-neutral-500">
                        Remaining
                    </p>

                    <p
                        className={[
                            "mt-2 text-2xl font-semibold tracking-tight",
                            totalRemaining <
                            0
                                ? "text-red-600"
                                : "text-green-600",
                        ].join(
                            " "
                        )}
                    >
                        {formatCurrency(
                            Math.abs(
                                totalRemaining
                            )
                        )}

                        {totalRemaining <
                            0 && (
                            <span className="ml-2 text-sm font-medium">
                                over
                            </span>
                        )}
                    </p>

                </div>

            </div>


            {loading ? (
                <div className="rounded-xl border border-neutral-200 bg-white px-5 py-12 text-center text-sm text-neutral-500">
                    Loading budgets...
                </div>
            ) : filteredBudgets.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-5 py-14 text-center">

                    <p className="text-base font-medium text-neutral-800">
                        No budgets for{" "}
                        {
                            monthNames[
                                selectedMonth -
                                    1
                            ]
                        }{" "}
                        {selectedYear}
                    </p>

                    <p className="mt-1 text-sm text-neutral-500">
                        Create a budget to start tracking your spending.
                    </p>

                    <button
                        type="button"
                        onClick={
                            openAddModal
                        }
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                        <Plus size={16} />

                        Add Budget
                    </button>

                </div>
            ) : (
                <div className="space-y-3">

                    {filteredBudgets.map(
                        (budget) => {

                            const percentage =
                                Number(
                                    budget.percentage ||
                                        0
                                );

                            const progress =
                                Math.min(
                                    Math.max(
                                        percentage,
                                        0
                                    ),
                                    100
                                );

                            const overBudget =
                                percentage >
                                100;

                            return (
                                <div
                                    key={
                                        budget.id
                                    }
                                    className="rounded-xl border border-neutral-200 bg-white p-5"
                                >

                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                        <div className="min-w-0 flex-1">

                                            <div className="flex items-center justify-between gap-4">

                                                <div>

                                                    <h2 className="text-base font-semibold text-neutral-900">
                                                        {
                                                            budget.category
                                                        }
                                                    </h2>

                                                    <p className="mt-1 text-sm text-neutral-500">
                                                        {formatCurrency(
                                                            budget.spent
                                                        )}{" "}
                                                        spent of{" "}
                                                        {formatCurrency(
                                                            budget.amount
                                                        )}
                                                    </p>

                                                </div>

                                                <p
                                                    className={
                                                        overBudget
                                                            ? "text-sm font-semibold text-red-600"
                                                            : percentage >=
                                                                90
                                                              ? "text-sm font-semibold text-amber-600"
                                                              : "text-sm font-semibold text-green-600"
                                                    }
                                                >
                                                    {percentage.toFixed(
                                                        0
                                                    )}
                                                    %
                                                </p>

                                            </div>


                                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">

                                                <div
                                                    className={
                                                        overBudget
                                                            ? "h-full rounded-full bg-red-500"
                                                            : percentage >=
                                                                90
                                                              ? "h-full rounded-full bg-amber-500"
                                                              : "h-full rounded-full bg-green-500"
                                                    }
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />

                                            </div>


                                            <div className="mt-2 flex justify-between text-xs">

                                                <span
                                                    className={
                                                        overBudget
                                                            ? "text-red-600"
                                                            : "text-neutral-500"
                                                    }
                                                >
                                                    {overBudget
                                                        ? `Over budget by ${formatCurrency(
                                                              Math.abs(
                                                                  Number(
                                                                      budget.remaining ||
                                                                          0
                                                                  )
                                                              )
                                                          )}`
                                                        : `${formatCurrency(
                                                              budget.remaining
                                                          )} remaining`}
                                                </span>

                                                <span className="text-neutral-400">
                                                    {
                                                        monthNames[
                                                            budget.month -
                                                                1
                                                        ]
                                                    }{" "}
                                                    {
                                                        budget.year
                                                    }
                                                </span>

                                            </div>

                                        </div>


                                        <div className="flex items-center gap-1">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditModal(
                                                        budget
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
                                                    setDeleteTarget(
                                                        budget
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

                                </div>
                            );
                        }
                    )}

                </div>
            )}


            {/* Add / Edit modal */}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px] sm:items-center sm:px-4">

                    <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-xl">

                        <div>

                            <h2 className="text-lg font-semibold text-neutral-900">
                                {editingBudget
                                    ? "Edit Budget"
                                    : "Add Budget"}
                            </h2>

                            <p className="mt-1 text-sm text-neutral-500">
                                {
                                    monthNames[
                                        selectedMonth -
                                            1
                                    ]
                                }{" "}
                                {selectedYear}
                            </p>

                        </div>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="mt-6 space-y-4"
                        >

                            <div>

                                <label
                                    htmlFor="budget-category"
                                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                                >
                                    Category
                                </label>

                                <select
                                    id="budget-category"
                                    value={
                                        form.category
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm({
                                            ...form,
                                            category:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none"
                                >

                                    <option value="">
                                        Select category
                                    </option>

                                    {expenseCategories.map(
                                        (
                                            category
                                        ) => (
                                            <option
                                                key={
                                                    category
                                                }
                                                value={
                                                    category
                                                }
                                            >
                                                {
                                                    category
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>


                            <div>

                                <label
                                    htmlFor="budget-amount"
                                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                                >
                                    Monthly Budget
                                </label>

                                <input
                                    id="budget-amount"
                                    type="number"
                                    inputMode="decimal"
                                    min="0.01"
                                    step="0.01"
                                    value={
                                        form.amount
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm({
                                            ...form,
                                            amount:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    }
                                    placeholder="Enter budget amount"
                                    className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none"
                                />

                            </div>


                            <div className="flex justify-end gap-3 pt-3">

                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingBudget
                                        ? "Save Changes"
                                        : "Create Budget"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}


            {/* Delete confirmation */}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">

                    <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-xl">

                        <h2 className="text-lg font-semibold text-neutral-900">
                            Delete budget?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-neutral-500">
                            Are you sure you want to delete the{" "}
                            <span className="font-medium text-neutral-800">
                                {
                                    deleteTarget.category
                                }
                            </span>{" "}
                            budget?
                        </p>


                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteTarget(
                                        null
                                    )
                                }
                                disabled={
                                    deleting
                                }
                                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
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
                                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}


export default Budgets;