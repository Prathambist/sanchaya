/*
 * Pure, framework-free functions that turn the raw data the backend
 * already returns (transactions, budgets, goals, analytics summary)
 * into the derived "insight" features on Dashboard/Analytics/Goals/
 * Budgets. Nothing here talks to the network — callers fetch, these
 * just compute — so every function can be unit-tested or reused
 * independently of where it's rendered.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;


function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function startOfDay(date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}


// ---------------------------------------------------------------
// Financial Health Score
// ---------------------------------------------------------------

function scoreSavingsRate(rate) {
    if (rate === null || rate === undefined) {
        return null;
    }

    if (rate >= 30) return 100;
    if (rate >= 20) return 85;
    if (rate >= 10) return 70;
    if (rate >= 0) return 55;
    if (rate >= -20) return 30;
    return 10;
}


function scoreBudgetAdherence(budgetPerformance) {
    if (!budgetPerformance?.length) {
        return null;
    }

    const scores = budgetPerformance.map((budget) => {
        if (budget.status === "healthy") return 100;
        if (budget.status === "warning") return 60;

        // Over budget: penalize proportionally to how far over,
        // floored at 0 rather than going negative.
        const overBy = Math.max(
            0,
            Number(budget.percentage || 0) - 100
        );

        return Math.max(0, 40 - overBy);
    });

    return (
        scores.reduce((sum, s) => sum + s, 0) /
        scores.length
    );
}


function scoreGoalProgress(goals) {
    if (!goals?.length) {
        return null;
    }

    const scores = goals.map((goal) => {
        if (goal.completed) return 100;

        const progress = Number(
            goal.progress_percentage || 0
        );

        const overdue =
            goal.deadline &&
            new Date(`${goal.deadline}T00:00:00`) < new Date();

        if (overdue) {
            return Math.max(10, progress * 0.4);
        }

        // Baseline credit for having an active goal at all, scaled
        // up by progress, so 0% isn't indistinguishable from "no goal".
        return Math.min(100, 30 + progress * 0.7);
    });

    return (
        scores.reduce((sum, s) => sum + s, 0) /
        scores.length
    );
}


export function computeHealthScore({
    savingsRate,
    budgetPerformance,
    goals,
}) {
    const components = [];

    const savingsScore = scoreSavingsRate(savingsRate);

    if (savingsScore !== null) {
        components.push({
            key: "savings",
            label: "Savings rate",
            score: savingsScore,
            weight: 0.4,
        });
    }

    const budgetScore = scoreBudgetAdherence(
        budgetPerformance
    );

    if (budgetScore !== null) {
        components.push({
            key: "budget",
            label: "Budget adherence",
            score: budgetScore,
            weight: 0.35,
        });
    }

    const goalScore = scoreGoalProgress(goals);

    if (goalScore !== null) {
        components.push({
            key: "goals",
            label: "Goal progress",
            score: goalScore,
            weight: 0.25,
        });
    }

    if (!components.length) {
        return null;
    }

    const totalWeight = components.reduce(
        (sum, c) => sum + c.weight,
        0
    );

    const weighted =
        components.reduce(
            (sum, c) => sum + c.score * c.weight,
            0
        ) / totalWeight;

    return {
        score: Math.round(
            Math.min(100, Math.max(0, weighted))
        ),
        components,
    };
}


export function healthScoreTier(score) {
    if (score === null || score === undefined) {
        return {
            label: "Not enough data",
            color: "neutral",
        };
    }

    if (score >= 80) {
        return {
            label: "Excellent",
            color: "emerald",
        };
    }

    if (score >= 65) {
        return {
            label: "Good",
            color: "emerald",
        };
    }

    if (score >= 45) {
        return {
            label: "Fair",
            color: "amber",
        };
    }

    return {
        label: "Needs attention",
        color: "red",
    };
}


// ---------------------------------------------------------------
// Smart Goal Forecasts
// ---------------------------------------------------------------

/*
 * Projects a completion date from the goal's actual contribution pace
 * (current_amount / days since it was created) rather than just the
 * deadline the user typed in, and — if that pace won't make the
 * deadline — how much more per month would close the gap.
 */
export function projectGoalCompletion(goal) {
    const currentAmount = Number(
        goal.current_amount || 0
    );

    const remainingAmount = Math.max(
        Number(goal.target_amount || 0) - currentAmount,
        0
    );

    if (goal.completed || remainingAmount <= 0) {
        return {
            status: "completed",
            projectedDate: null,
            dailyPace: 0,
            suggestedMonthlyTopUp: 0,
        };
    }

    const createdAt = goal.created_at
        ? new Date(goal.created_at)
        : null;

    const daysSinceCreated = createdAt
        ? Math.max(
              1,
              (Date.now() - createdAt.getTime()) / MS_PER_DAY
          )
        : null;

    const dailyPace =
        daysSinceCreated && currentAmount > 0
            ? currentAmount / daysSinceCreated
            : 0;

    // A goal that's only a few days old doesn't have enough history to
    // pace from — `current_amount` at creation is often seed money
    // (e.g. savings the user already had), not something earned in the
    // days since, so the pace would be wildly (and misleadingly) fast.
    const hasEnoughHistory =
        daysSinceCreated !== null &&
        daysSinceCreated >= 14;

    if (dailyPace <= 0 || !hasEnoughHistory) {
        return {
            status: "no-progress",
            projectedDate: null,
            dailyPace: 0,
            suggestedMonthlyTopUp: null,
        };
    }

    const daysToGo = remainingAmount / dailyPace;

    const projectedDate = new Date(
        Date.now() + daysToGo * MS_PER_DAY
    );

    if (!goal.deadline) {
        return {
            status: "on-track",
            projectedDate,
            dailyPace,
            suggestedMonthlyTopUp: null,
        };
    }

    const deadlineDate = startOfDay(
        new Date(`${goal.deadline}T00:00:00`)
    );

    // A day of slack either side of the deadline still counts as on time.
    if (
        projectedDate.getTime() <=
        deadlineDate.getTime() + MS_PER_DAY
    ) {
        return {
            status: "ahead",
            projectedDate,
            dailyPace,
            suggestedMonthlyTopUp: 0,
        };
    }

    const daysUntilDeadline = Math.max(
        1,
        (deadlineDate.getTime() - Date.now()) / MS_PER_DAY
    );

    const requiredMonthlyPace =
        (remainingAmount / daysUntilDeadline) * 30;

    const currentMonthlyPace = dailyPace * 30;

    return {
        status: "behind",
        projectedDate,
        dailyPace,
        suggestedMonthlyTopUp: Math.max(
            0,
            requiredMonthlyPace - currentMonthlyPace
        ),
    };
}


// ---------------------------------------------------------------
// Subscription Radar
// ---------------------------------------------------------------

/*
 * Flags expense transactions that repeat with a consistent amount on
 * a roughly-monthly cadence — the signature of a subscription or
 * recurring bill — grouped by description (falling back to category
 * when there's no description to key on).
 */
export function detectRecurringExpenses(
    transactions,
    {
        minOccurrences = 3,
        amountTolerance = 0.12,
        minGapDays = 22,
        maxGapDays = 40,
    } = {}
) {
    const expenses = (transactions || []).filter(
        (t) => t.type === "expense" && Number(t.amount) > 0
    );

    const groups = new Map();

    for (const transaction of expenses) {
        const key =
            transaction.description?.trim().toLowerCase() ||
            `category:${transaction.category || "other"}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key).push(transaction);
    }

    const recurring = [];

    for (const [, items] of groups) {
        if (items.length < minOccurrences) {
            continue;
        }

        const sorted = [...items].sort(
            (a, b) =>
                new Date(a.transaction_date) -
                new Date(b.transaction_date)
        );

        const amounts = sorted.map((t) =>
            Number(t.amount)
        );

        const averageAmount =
            amounts.reduce((sum, a) => sum + a, 0) /
            amounts.length;

        const amountsConsistent = amounts.every(
            (amount) =>
                Math.abs(amount - averageAmount) /
                    averageAmount <=
                amountTolerance
        );

        if (!amountsConsistent) {
            continue;
        }

        let monthlyGaps = 0;

        for (let i = 1; i < sorted.length; i++) {
            const gapDays =
                (new Date(sorted[i].transaction_date) -
                    new Date(
                        sorted[i - 1].transaction_date
                    )) /
                MS_PER_DAY;

            if (
                gapDays >= minGapDays &&
                gapDays <= maxGapDays
            ) {
                monthlyGaps++;
            }
        }

        if (
            monthlyGaps <
            Math.ceil((sorted.length - 1) / 2)
        ) {
            continue;
        }

        const latest = sorted[sorted.length - 1];

        recurring.push({
            key: latest.description?.trim() || latest.category,
            label:
                latest.description?.trim() ||
                latest.category ||
                "Recurring expense",
            category: latest.category,
            averageAmount,
            occurrences: sorted.length,
            lastDate: latest.transaction_date,
        });
    }

    recurring.sort(
        (a, b) => b.averageAmount - a.averageAmount
    );

    const totalMonthly = recurring.reduce(
        (sum, item) => sum + item.averageAmount,
        0
    );

    return {
        items: recurring,
        totalMonthly,
    };
}


// ---------------------------------------------------------------
// Spending Heatmap
// ---------------------------------------------------------------

/*
 * Buckets expense transactions by calendar day over the trailing
 * `weeks` weeks (padded out to full Sun-Sat columns, GitHub-
 * contributions style) and assigns each day an intensity level 0-4
 * based on quartiles of that user's own non-zero spending days —
 * so the scale adapts to whether someone spends in rupees or lakhs.
 */
export function buildSpendingHeatmap(
    transactions,
    { weeks = 26 } = {}
) {
    const today = startOfDay(new Date());

    const start = new Date(today);
    start.setDate(start.getDate() - (weeks * 7 - 1));
    start.setDate(start.getDate() - start.getDay());

    const dayTotals = new Map();

    for (const transaction of transactions || []) {
        if (transaction.type !== "expense") {
            continue;
        }

        const amount = Number(transaction.amount || 0);

        if (!amount) {
            continue;
        }

        const key = transaction.transaction_date;

        if (!dayTotals.has(key)) {
            dayTotals.set(key, {
                total: 0,
                count: 0,
                categories: {},
            });
        }

        const entry = dayTotals.get(key);

        entry.total += amount;
        entry.count += 1;

        const category =
            transaction.category || "Other";

        entry.categories[category] =
            (entry.categories[category] || 0) + amount;
    }

    const days = [];
    const cursor = new Date(start);

    while (cursor <= today) {
        const key = toDateKey(cursor);
        const bucket = dayTotals.get(key);

        days.push({
            date: key,
            dateObj: new Date(cursor),
            total: bucket?.total || 0,
            count: bucket?.count || 0,
            categories: bucket?.categories || {},
        });

        cursor.setDate(cursor.getDate() + 1);
    }

    const nonZeroTotals = days
        .filter((day) => day.total > 0)
        .map((day) => day.total)
        .sort((a, b) => a - b);

    const quantile = (p) => {
        if (!nonZeroTotals.length) {
            return 0;
        }

        const index = Math.min(
            nonZeroTotals.length - 1,
            Math.floor(p * nonZeroTotals.length)
        );

        return nonZeroTotals[index];
    };

    const thresholds = [
        quantile(0.25),
        quantile(0.5),
        quantile(0.75),
    ];

    for (const day of days) {
        if (day.total <= 0) {
            day.level = 0;
        } else if (day.total <= thresholds[0]) {
            day.level = 1;
        } else if (day.total <= thresholds[1]) {
            day.level = 2;
        } else if (day.total <= thresholds[2]) {
            day.level = 3;
        } else {
            day.level = 4;
        }
    }

    const weekColumns = [];

    for (let i = 0; i < days.length; i += 7) {
        weekColumns.push(days.slice(i, i + 7));
    }

    return {
        days,
        weeks: weekColumns,
    };
}


// ---------------------------------------------------------------
// Smart Budget Suggestions
// ---------------------------------------------------------------

/*
 * Averages a category's expense total over the last `monthsBack` full
 * calendar months (the current, still-in-progress month is excluded
 * so it can't skew the estimate) — a starting point for a new budget.
 */
export function suggestCategoryBudget(
    transactions,
    category,
    { monthsBack = 3 } = {}
) {
    if (!category) {
        return null;
    }

    const now = new Date();

    const currentMonthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

    const rangeStart = new Date(
        now.getFullYear(),
        now.getMonth() - monthsBack,
        1
    );

    const relevant = (transactions || []).filter(
        (t) => {
            if (
                t.type !== "expense" ||
                t.category !== category
            ) {
                return false;
            }

            const date = new Date(
                `${t.transaction_date}T00:00:00`
            );

            return (
                date >= rangeStart &&
                date < currentMonthStart
            );
        }
    );

    if (!relevant.length) {
        return null;
    }

    const total = relevant.reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
    );

    return total / monthsBack;
}
