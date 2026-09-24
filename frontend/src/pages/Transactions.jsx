import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
} from "lucide-react";

import { apiFetch } from "../lib/api";
import {
    expenseCategories,
    incomeSources,
} from "../constants/categories";
import {
    useCurrency,
} from "../context/CurrencyContext";
import { useToast } from "../context/ToastContext";
import { useMinimumLoading } from "../hooks/useMinimumLoading";
import PageLoader from "../components/PageLoader";
import Reveal from "../components/Reveal";


function Transactions() {
    const {
        currency,
        currencies,
        formatCurrency,
        convertFromBase,
        convertToBase,
    } = useCurrency();

    const toast = useToast();


    const [transactions, setTransactions] =
        useState([]);

    const [
        loadingTransactions,
        setLoadingTransactions,
    ] = useState(true);

    const [showForm, setShowForm] =
        useState(false);

    const [
        editingTransaction,
        setEditingTransaction,
    ] = useState(null);

    const [
        transactionToDelete,
        setTransactionToDelete,
    ] = useState(null);

    const [deleting, setDeleting] =
        useState(false);

    const [type, setType] =
        useState("expense");

    const [amount, setAmount] =
        useState("");

    const [category, setCategory] =
        useState("Food");

    const [source, setSource] =
        useState("Salary");

    const [description, setDescription] =
        useState("");

    const [
        transactionDate,
        setTransactionDate,
    ] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    // Kept separate from `error`, which belongs to the add/edit form —
    // a failed initial load has to surface on the page itself.
    const [loadError, setLoadError] =
        useState("");

    const [search, setSearch] =
        useState("");


    const loadTransactions =
        async () => {
            try {
                setLoadingTransactions(
                    true
                );

                setLoadError("");

                const data =
                    await apiFetch(
                        "/api/transactions/"
                    );

                setTransactions(
                    data.transactions || []
                );
            } catch (error) {
                setLoadError(
                    error.message ||
                        "Unable to load transactions."
                );
            } finally {
                setLoadingTransactions(
                    false
                );
            }
        };


    useEffect(() => {
        loadTransactions();
    }, []);


    const resetForm = () => {
        setType("expense");
        setAmount("");
        setCategory("Food");
        setSource("Salary");
        setDescription("");

        setTransactionDate(
            new Date()
                .toISOString()
                .split("T")[0]
        );

        setError("");
        setEditingTransaction(null);
    };


    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };


    const openEditForm = (
        transaction
    ) => {
        setEditingTransaction(
            transaction
        );

        setType(
            transaction.type
        );

        setAmount(
            convertFromBase(
                transaction.amount
            ).toFixed(2)
        );

        setCategory(
            transaction.category ||
                "Food"
        );

        setSource(
            transaction.source ||
                "Salary"
        );

        setDescription(
            transaction.description ||
                ""
        );

        setTransactionDate(
            transaction.transaction_date
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


    const handleTypeChange = (
        newType
    ) => {
        setType(newType);

        if (newType === "expense") {
            setCategory(
                category || "Food"
            );
        } else {
            setSource(
                source || "Salary"
            );
        }

        setError("");
    };


    const handleSubmit =
        async (event) => {
            event.preventDefault();

            setError("");

            const numericAmount =
                Number(amount);


            if (
                !numericAmount ||
                numericAmount <= 0
            ) {
                setError(
                    "Enter an amount greater than zero."
                );

                return;
            }


            if (
                type === "expense" &&
                !category
            ) {
                setError(
                    "Select an expense category."
                );

                return;
            }


            if (
                type === "income" &&
                !source
            ) {
                setError(
                    "Select an income source."
                );

                return;
            }


            setLoading(true);


            try {
                const payload = {
                    amount:
                        convertToBase(
                            numericAmount
                        ),

                    type,

                    category:
                        type === "expense"
                            ? category
                            : null,

                    source:
                        type === "income"
                            ? source
                            : null,

                    description:
                        description.trim() ||
                        null,

                    transaction_date:
                        transactionDate,
                };


                if (
                    editingTransaction
                ) {
                    const data =
                        await apiFetch(
                            `/api/transactions/${editingTransaction.id}`,
                            {
                                method: "PUT",
                                body:
                                    JSON.stringify(
                                        payload
                                    ),
                            }
                        );


                    setTransactions(
                        (current) =>
                            current.map(
                                (
                                    transaction
                                ) =>
                                    transaction.id ===
                                    editingTransaction.id
                                        ? data.transaction
                                        : transaction
                            )
                    );
                } else {
                    const data =
                        await apiFetch(
                            "/api/transactions/",
                            {
                                method: "POST",
                                body:
                                    JSON.stringify(
                                        payload
                                    ),
                            }
                        );


                    setTransactions(
                        (current) => [
                            data.transaction,
                            ...current,
                        ]
                    );
                }


                toast.success(
                    editingTransaction
                        ? "Transaction updated."
                        : "Transaction added."
                );

                setShowForm(false);
                resetForm();
            } catch (error) {
                setError(
                    error.message ||
                        `Unable to ${
                            editingTransaction
                                ? "update"
                                : "create"
                        } transaction.`
                );
            } finally {
                setLoading(false);
            }
        };


    const handleDelete =
        async () => {
            if (
                !transactionToDelete
            ) {
                return;
            }

            setDeleting(true);
            setError("");


            try {
                await apiFetch(
                    `/api/transactions/${transactionToDelete.id}`,
                    {
                        method: "DELETE",
                    }
                );


                setTransactions(
                    (current) =>
                        current.filter(
                            (
                                transaction
                            ) =>
                                transaction.id !==
                                transactionToDelete.id
                        )
                );


                setTransactionToDelete(
                    null
                );

                toast.success(
                    "Transaction deleted."
                );
            } catch (error) {
                const message =
                    error.message ||
                    "Unable to delete transaction.";

                setError(message);
                toast.error(message);
            } finally {
                setDeleting(false);
            }
        };


    const filteredTransactions =
        transactions.filter(
            (transaction) => {
                const query =
                    search
                        .trim()
                        .toLowerCase();


                if (!query) {
                    return true;
                }


                return (
                    transaction.description
                        ?.toLowerCase()
                        .includes(query) ||

                    transaction.category
                        ?.toLowerCase()
                        .includes(query) ||

                    transaction.source
                        ?.toLowerCase()
                        .includes(query) ||

                    transaction.type
                        ?.toLowerCase()
                        .includes(query)
                );
            }
        );


    const formatDate = (
        value
    ) => {
        if (!value) {
            return "-";
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


    const formatAmount = (
        transaction
    ) => {
        return `${
            transaction.type ===
            "income"
                ? "+"
                : "-"
        }${formatCurrency(
            transaction.amount
        )}`;
    };


    const getTransactionLabel = (
        transaction
    ) => {
        if (
            transaction.type ===
            "income"
        ) {
            return (
                transaction.source ||
                "Other"
            );
        }

        return (
            transaction.category ||
            "Other"
        );
    };


    const showLoader =
        useMinimumLoading(loadingTransactions);


    if (showLoader) {
        return (
            <PageLoader label="Loading your transactions" />
        );
    }


    return (
        <Reveal className="space-y-8">

            {/* Header */}

            <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                <div>

                    <p className="text-sm font-medium text-neutral-400">
                        Transactions
                    </p>

                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
                        Transactions
                    </h1>

                    <p className="mt-2 text-base text-neutral-500">
                        Keep track of your income and spending.
                    </p>

                </div>


                <button
                    type="button"
                    onClick={
                        openAddForm
                    }
                    className="inline-flex w-fit items-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                    <Plus
                        size={17}
                        strokeWidth={2}
                    />

                    Add transaction
                </button>

            </header>


            {/* Transaction list */}

            <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">

                <div className="flex flex-col gap-4 border-b border-neutral-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <h2 className="text-base font-semibold text-neutral-900">
                            All transactions
                        </h2>

                        <p className="mt-1.5 text-sm text-neutral-400">
                            {transactions.length}{" "}
                            {transactions.length ===
                            1
                                ? "transaction"
                                : "transactions"}
                        </p>

                    </div>


                    <div className="relative w-full sm:w-72">

                        <Search
                            size={17}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search transactions"
                            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5"
                        />

                    </div>

                </div>


                {loadingTransactions ? (
                    <div className="flex min-h-64 items-center justify-center">

                        <p className="text-sm text-neutral-400">
                            Loading transactions...
                        </p>

                    </div>
                ) : loadError ? (
                    <div className="flex min-h-64 items-center justify-center px-6">

                        <div className="text-center">

                            <p className="text-base font-medium text-neutral-700">
                                Unable to load transactions
                            </p>

                            <p className="mt-2 text-sm text-neutral-400">
                                {loadError}
                            </p>

                            <button
                                type="button"
                                onClick={
                                    loadTransactions
                                }
                                className="mt-4 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                            >
                                Try again
                            </button>

                        </div>

                    </div>
                ) : filteredTransactions.length ===
                  0 ? (
                    <div className="flex min-h-64 items-center justify-center px-6">

                        <div className="text-center">

                            <p className="text-base font-medium text-neutral-700">
                                {search
                                    ? "No matching transactions"
                                    : "No transactions to show"}
                            </p>

                            <p className="mt-2 text-sm text-neutral-400">
                                {search
                                    ? "Try a different search."
                                    : "Add your first transaction to get started."}
                            </p>

                        </div>

                    </div>
                ) : (
                    <>
                        <div className="hidden md:block">

                            <table className="w-full border-collapse">

                                <thead>

                                    <tr className="border-b border-neutral-100 text-left">

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                            Date
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                            Description
                                        </th>

                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                            Category / Source
                                        </th>

                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">
                                            Amount
                                        </th>

                                        <th className="w-24 px-6 py-4" />

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredTransactions.map(
                                        (
                                            transaction
                                        ) => (
                                            <tr
                                                key={
                                                    transaction.id
                                                }
                                                className="border-b border-neutral-100 last:border-0"
                                            >

                                                <td className="px-6 py-5 text-sm text-neutral-500">
                                                    {formatDate(
                                                        transaction.transaction_date
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">

                                                    <p className="text-sm font-medium text-neutral-800">
                                                        {transaction.description ||
                                                            "No description"}
                                                    </p>

                                                </td>

                                                <td className="px-6 py-5">

                                                    <span
                                                        className={[
                                                            "inline-flex rounded-md px-2.5 py-1.5 text-xs font-medium",
                                                            transaction.type ===
                                                            "income"
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-neutral-100 text-neutral-600",
                                                        ].join(
                                                            " "
                                                        )}
                                                    >
                                                        {getTransactionLabel(
                                                            transaction
                                                        )}
                                                    </span>

                                                </td>

                                                <td className="px-6 py-5 text-right">

                                                    <span
                                                        className={[
                                                            "text-sm font-semibold",
                                                            transaction.type ===
                                                            "income"
                                                                ? "text-emerald-700"
                                                                : "text-red-700",
                                                        ].join(
                                                            " "
                                                        )}
                                                    >
                                                        {formatAmount(
                                                            transaction
                                                        )}
                                                    </span>

                                                </td>

                                                <td className="px-6 py-5">

                                                    <div className="flex items-center justify-end gap-1">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    transaction
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 transition hover:bg-neutral-100 hover:text-neutral-700"
                                                        >
                                                            <Pencil
                                                                size={
                                                                    14
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setTransactionToDelete(
                                                                    transaction
                                                                )
                                                            }
                                                            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 transition hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2
                                                                size={
                                                                    15
                                                                }
                                                            />
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>


                        <div className="divide-y divide-neutral-100 md:hidden">

                            {filteredTransactions.map(
                                (
                                    transaction
                                ) => (
                                    <div
                                        key={
                                            transaction.id
                                        }
                                        className="flex items-center justify-between gap-4 px-6 py-5"
                                    >

                                        <div className="min-w-0">

                                            <p className="truncate text-sm font-medium text-neutral-800">
                                                {transaction.description ||
                                                    "No description"}
                                            </p>

                                            <div className="mt-2 flex items-center gap-2">

                                                <span className="text-xs text-neutral-400">
                                                    {formatDate(
                                                        transaction.transaction_date
                                                    )}
                                                </span>

                                                <span className="text-neutral-300">
                                                    /
                                                </span>

                                                <span
                                                    className={[
                                                        "text-xs",
                                                        transaction.type ===
                                                        "income"
                                                            ? "text-emerald-600"
                                                            : "text-neutral-400",
                                                    ].join(
                                                        " "
                                                    )}
                                                >
                                                    {getTransactionLabel(
                                                        transaction
                                                    )}
                                                </span>

                                            </div>

                                        </div>


                                        <div className="flex shrink-0 items-center gap-1">

                                            <p
                                                className={[
                                                    "mr-2 text-sm font-semibold",
                                                    transaction.type ===
                                                    "income"
                                                        ? "text-emerald-700"
                                                        : "text-red-700",
                                                ].join(
                                                    " "
                                                )}
                                            >
                                                {formatAmount(
                                                    transaction
                                                )}
                                            </p>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditForm(
                                                        transaction
                                                    )
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 transition hover:bg-neutral-100 hover:text-neutral-700"
                                            >
                                                <Pencil
                                                    size={14}
                                                />
                                            </button>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTransactionToDelete(
                                                        transaction
                                                    )
                                                }
                                                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 transition hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2
                                                    size={15}
                                                />
                                            </button>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>
                    </>
                )}

            </section>


            {/* Add / Edit modal */}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">

                    <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white shadow-xl sm:rounded-2xl">

                        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">

                            <div>

                                <h2 className="text-base font-semibold text-neutral-900">
                                    {editingTransaction
                                        ? "Edit transaction"
                                        : "Add transaction"}
                                </h2>

                                <p className="mt-1.5 text-sm text-neutral-400">
                                    {editingTransaction
                                        ? "Update the details of this transaction."
                                        : "Record an income or expense."}
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
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="space-y-6 p-6"
                        >

                            {/* Type */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-neutral-700">
                                    Type
                                </label>

                                <div className="grid grid-cols-2 rounded-lg bg-neutral-100 p-1">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTypeChange(
                                                "expense"
                                            )
                                        }
                                        className={[
                                            "rounded-md px-3 py-2.5 text-sm font-medium transition",
                                            type ===
                                            "expense"
                                                ? "bg-white text-neutral-900 shadow-sm"
                                                : "text-neutral-500 hover:text-neutral-800",
                                        ].join(
                                            " "
                                        )}
                                    >
                                        Expense
                                    </button>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTypeChange(
                                                "income"
                                            )
                                        }
                                        className={[
                                            "rounded-md px-3 py-2.5 text-sm font-medium transition",
                                            type ===
                                            "income"
                                                ? "bg-white text-neutral-900 shadow-sm"
                                                : "text-neutral-500 hover:text-neutral-800",
                                        ].join(
                                            " "
                                        )}
                                    >
                                        Income
                                    </button>

                                </div>

                            </div>


                            {/* Amount */}

                            <div>

                                <label
                                    htmlFor="amount"
                                    className="mb-2 block text-sm font-medium text-neutral-700"
                                >
                                    Amount
                                </label>

                                <div className="relative">

                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                                        {currencies[currency]?.symbol}
                                    </span>

                                    <input
                                        id="amount"
                                        type="number"
                                        inputMode="decimal"
                                        min="0.01"
                                        step="0.01"
                                        value={amount}
                                        onChange={(event) =>
                                            setAmount(
                                                event.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        required
                                        className="w-full rounded-lg border border-neutral-200 bg-white py-3 pl-11 pr-3 text-sm outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-neutral-500 focus:ring-3 focus:ring-neutral-900/5"
                                    />

                                </div>

                            </div>


                            {/* Category / Source */}

                            {type ===
                            "expense" ? (
                                <div>

                                    <label
                                        htmlFor="category"
                                        className="mb-2 block text-sm font-medium text-neutral-700"
                                    >
                                        Category
                                    </label>

                                    <select
                                        id="category"
                                        value={
                                            category
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setCategory(
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm outline-none"
                                    >
                                        {expenseCategories.map(
                                            (
                                                item
                                            ) => (
                                                <option
                                                    key={
                                                        item
                                                    }
                                                    value={
                                                        item
                                                    }
                                                >
                                                    {
                                                        item
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>
                            ) : (
                                <div>

                                    <label
                                        htmlFor="source"
                                        className="mb-2 block text-sm font-medium text-neutral-700"
                                    >
                                        Source
                                    </label>

                                    <select
                                        id="source"
                                        value={
                                            source
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSource(
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm outline-none"
                                    >
                                        {incomeSources.map(
                                            (
                                                item
                                            ) => (
                                                <option
                                                    key={
                                                        item
                                                    }
                                                    value={
                                                        item
                                                    }
                                                >
                                                    {
                                                        item
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>

                                </div>
                            )}


                            {/* Description */}

                            <div>

                                <label
                                    htmlFor="description"
                                    className="mb-2 block text-sm font-medium text-neutral-700"
                                >
                                    Description
                                    <span className="ml-1 font-normal text-neutral-400">
                                        optional
                                    </span>
                                </label>

                                <input
                                    id="description"
                                    type="text"
                                    value={
                                        description
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                    placeholder={
                                        type ===
                                        "income"
                                            ? "Where did this money come from?"
                                            : "What was this for?"
                                    }
                                    className="w-full rounded-lg border border-neutral-200 bg-white py-3 px-3 text-sm outline-none"
                                />

                            </div>


                            {/* Date */}

                            <div>

                                <label
                                    htmlFor="transaction-date"
                                    className="mb-2 block text-sm font-medium text-neutral-700"
                                >
                                    Date
                                </label>

                                <input
                                    id="transaction-date"
                                    type="date"
                                    value={
                                        transactionDate
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setTransactionDate(
                                            event.target.value
                                        )
                                    }
                                    required
                                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm outline-none"
                                />

                            </div>


                            {error && (
                                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}


                            {/* Actions */}

                            <div className="flex gap-2 border-t border-neutral-100 pt-5">

                                <button
                                    type="button"
                                    onClick={
                                        closeForm
                                    }
                                    disabled={
                                        loading
                                    }
                                    className="flex-1 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        loading
                                    }
                                    className="flex-1 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                                >
                                    {loading
                                        ? editingTransaction
                                            ? "Saving..."
                                            : "Adding..."
                                        : editingTransaction
                                        ? "Save changes"
                                        : "Add transaction"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}


            {/* Delete confirmation */}

            {transactionToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/20 px-4 backdrop-blur-[2px]">

                    <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">

                        <h2 className="text-base font-semibold text-neutral-900">
                            Delete transaction?
                        </h2>

                        <p className="mt-2 text-sm leading-5 text-neutral-500">
                            This will permanently remove this transaction.
                            This action cannot be undone.
                        </p>


                        <div className="mt-5 rounded-lg bg-neutral-50 px-4 py-3.5">

                            <div className="flex items-center justify-between gap-4">

                                <div className="min-w-0">

                                    <p className="truncate text-sm font-medium text-neutral-700">
                                        {transactionToDelete.description ||
                                            "No description"}
                                    </p>

                                    <p className="mt-1 text-xs text-neutral-400">
                                        {getTransactionLabel(
                                            transactionToDelete
                                        )}
                                    </p>

                                </div>


                                <p
                                    className={[
                                        "shrink-0 text-sm font-semibold",
                                        transactionToDelete.type ===
                                        "income"
                                            ? "text-emerald-700"
                                            : "text-red-700",
                                    ].join(
                                        " "
                                    )}
                                >
                                    {formatAmount(
                                        transactionToDelete
                                    )}
                                </p>

                            </div>

                        </div>


                        <div className="mt-5 flex justify-end gap-2">

                            <button
                                type="button"
                                onClick={() =>
                                    setTransactionToDelete(
                                        null
                                    )
                                }
                                disabled={
                                    deleting
                                }
                                className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
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

        </Reveal>
    );
}


export default Transactions;