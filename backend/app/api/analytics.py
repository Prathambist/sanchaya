from datetime import date

from fastapi import APIRouter, Header, HTTPException
from sqlalchemy import text

from app.api.transactions import get_current_user
from app.database import engine


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


def money(value):
    return float(value or 0)


def percentage(value):
    return round(float(value or 0), 2)


@router.get("/summary")
def get_analytics_summary(
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    user_id = user.get("id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid user session.",
        )

    with engine.connect() as connection:

        # ---------------------------------------------------------
        # OVERALL SUMMARY
        # ---------------------------------------------------------

        totals = connection.execute(
            text(
                """
                SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN type = 'income'
                                THEN amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_income,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN type = 'expense'
                                THEN amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_expenses,

                    COUNT(*) AS transaction_count

                FROM public.transactions

                WHERE user_id = :user_id
                """
            ),
            {
                "user_id": user_id,
            },
        ).fetchone()

        total_income = money(totals.total_income)
        total_expenses = money(totals.total_expenses)
        transaction_count = int(
            totals.transaction_count or 0
        )

        total_savings = (
            total_income - total_expenses
        )

        savings_rate = (
            (total_savings / total_income) * 100
            if total_income > 0
            else 0
        )


        # ---------------------------------------------------------
        # AVERAGES
        # ---------------------------------------------------------

        averages = connection.execute(
            text(
                """
                SELECT
                    COALESCE(
                        AVG(monthly_income),
                        0
                    ) AS average_monthly_income,

                    COALESCE(
                        AVG(monthly_expenses),
                        0
                    ) AS average_monthly_expenses

                FROM (
                    SELECT
                        DATE_TRUNC(
                            'month',
                            transaction_date
                        ) AS month,

                        SUM(
                            CASE
                                WHEN type = 'income'
                                THEN amount
                                ELSE 0
                            END
                        ) AS monthly_income,

                        SUM(
                            CASE
                                WHEN type = 'expense'
                                THEN amount
                                ELSE 0
                            END
                        ) AS monthly_expenses

                    FROM public.transactions

                    WHERE user_id = :user_id

                    GROUP BY DATE_TRUNC(
                        'month',
                        transaction_date
                    )
                ) monthly_totals
                """
            ),
            {
                "user_id": user_id,
            },
        ).fetchone()

        average_monthly_income = money(
            averages.average_monthly_income
        )

        average_monthly_expenses = money(
            averages.average_monthly_expenses
        )

        average_monthly_savings = (
            average_monthly_income -
            average_monthly_expenses
        )


        # ---------------------------------------------------------
        # LARGEST EXPENSE
        # ---------------------------------------------------------

        largest_expense = connection.execute(
            text(
                """
                SELECT
                    id,
                    amount,
                    category,
                    description,
                    transaction_date

                FROM public.transactions

                WHERE user_id = :user_id
                  AND type = 'expense'

                ORDER BY amount DESC

                LIMIT 1
                """
            ),
            {
                "user_id": user_id,
            },
        ).fetchone()

        largest_expense_data = None

        if largest_expense:
            largest_expense_data = {
                "id": largest_expense.id,
                "amount": money(
                    largest_expense.amount
                ),
                "category": largest_expense.category,
                "description": (
                    largest_expense.description
                ),
                "transaction_date": (
                    largest_expense.transaction_date
                ),
            }


        # ---------------------------------------------------------
        # LARGEST INCOME
        # ---------------------------------------------------------

        largest_income = connection.execute(
            text(
                """
                SELECT
                    id,
                    amount,
                    source,
                    description,
                    transaction_date

                FROM public.transactions

                WHERE user_id = :user_id
                  AND type = 'income'

                ORDER BY amount DESC

                LIMIT 1
                """
            ),
            {
                "user_id": user_id,
            },
        ).fetchone()

        largest_income_data = None

        if largest_income:
            largest_income_data = {
                "id": largest_income.id,
                "amount": money(
                    largest_income.amount
                ),
                "source": largest_income.source,
                "description": (
                    largest_income.description
                ),
                "transaction_date": (
                    largest_income.transaction_date
                ),
            }


        # ---------------------------------------------------------
        # MONTHLY TREND
        # ---------------------------------------------------------

        monthly_result = connection.execute(
            text(
                """
                WITH months AS (
                    SELECT
                        generate_series(
                            DATE_TRUNC(
                                'month',
                                CURRENT_DATE
                            ) - interval '11 months',

                            DATE_TRUNC(
                                'month',
                                CURRENT_DATE
                            ),

                            interval '1 month'
                        ) AS month
                ),

                monthly_totals AS (
                    SELECT
                        DATE_TRUNC(
                            'month',
                            transaction_date
                        ) AS month,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN type = 'income'
                                    THEN amount
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS income,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN type = 'expense'
                                    THEN amount
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS expenses

                    FROM public.transactions

                    WHERE user_id = :user_id

                    GROUP BY DATE_TRUNC(
                        'month',
                        transaction_date
                    )
                )

                SELECT
                    months.month,

                    COALESCE(
                        monthly_totals.income,
                        0
                    ) AS income,

                    COALESCE(
                        monthly_totals.expenses,
                        0
                    ) AS expenses

                FROM months

                LEFT JOIN monthly_totals
                    ON monthly_totals.month =
                       months.month

                ORDER BY months.month ASC
                """
            ),
            {
                "user_id": user_id,
            },
        )

        monthly_data = []

        previous_savings = None

        for row in monthly_result:

            month_income = money(row.income)
            month_expenses = money(row.expenses)

            month_savings = (
                month_income - month_expenses
            )

            savings_change = None

            if previous_savings is not None:
                if previous_savings != 0:
                    savings_change = (
                        (
                            (
                                month_savings -
                                previous_savings
                            )
                            / abs(previous_savings)
                        )
                        * 100
                    )

            monthly_data.append(
                {
                    "month": row.month.strftime(
                        "%Y-%m"
                    ),
                    "income": month_income,
                    "expenses": month_expenses,
                    "savings": month_savings,
                    "savings_change": (
                        percentage(savings_change)
                        if savings_change is not None
                        else None
                    ),
                }
            )

            previous_savings = month_savings


        # ---------------------------------------------------------
        # CURRENT MONTH CATEGORY BREAKDOWN
        # ---------------------------------------------------------

        category_result = connection.execute(
            text(
                """
                SELECT
                    category,
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS amount,
                    COUNT(*) AS transaction_count

                FROM public.transactions

                WHERE user_id = :user_id
                  AND type = 'expense'

                  AND transaction_date >=
                      DATE_TRUNC(
                          'month',
                          CURRENT_DATE
                      )

                  AND transaction_date <
                      DATE_TRUNC(
                          'month',
                          CURRENT_DATE
                      ) + interval '1 month'

                GROUP BY category

                ORDER BY amount DESC
                """
            ),
            {
                "user_id": user_id,
            },
        )

        category_rows = list(category_result)

        current_month_expenses = sum(
            money(row.amount)
            for row in category_rows
        )

        category_breakdown = []

        for row in category_rows:

            amount = money(row.amount)

            category_breakdown.append(
                {
                    "category": row.category,
                    "amount": amount,
                    "percentage": percentage(
                        (
                            amount /
                            current_month_expenses
                        ) * 100
                        if current_month_expenses > 0
                        else 0
                    ),
                    "transaction_count": int(
                        row.transaction_count or 0
                    ),
                }
            )


        # ---------------------------------------------------------
        # PREVIOUS MONTH CATEGORY COMPARISON
        # ---------------------------------------------------------

        previous_category_result = connection.execute(
            text(
                """
                SELECT
                    category,
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS amount

                FROM public.transactions

                WHERE user_id = :user_id
                  AND type = 'expense'

                  AND transaction_date >=
                      DATE_TRUNC(
                          'month',
                          CURRENT_DATE
                      ) - interval '1 month'

                  AND transaction_date <
                      DATE_TRUNC(
                          'month',
                          CURRENT_DATE
                      )

                GROUP BY category
                """
            ),
            {
                "user_id": user_id,
            },
        )

        previous_categories = {
            row.category: money(row.amount)
            for row in previous_category_result
        }

        for item in category_breakdown:

            previous_amount = previous_categories.get(
                item["category"],
                0
            )

            item["previous_month_amount"] = (
                previous_amount
            )

            if previous_amount > 0:
                item["change_percentage"] = percentage(
                    (
                        (
                            item["amount"] -
                            previous_amount
                        )
                        / previous_amount
                    )
                    * 100
                )
            elif item["amount"] > 0:
                item["change_percentage"] = None
            else:
                item["change_percentage"] = 0


        # ---------------------------------------------------------
        # INCOME SOURCES
        # ---------------------------------------------------------

        income_source_result = connection.execute(
            text(
                """
                SELECT
                    source,
                    COALESCE(
                        SUM(amount),
                        0
                    ) AS amount,
                    COUNT(*) AS transaction_count

                FROM public.transactions

                WHERE user_id = :user_id
                  AND type = 'income'

                GROUP BY source

                ORDER BY amount DESC
                """
            ),
            {
                "user_id": user_id,
            },
        )

        income_sources = []

        for row in income_source_result:

            amount = money(row.amount)

            income_sources.append(
                {
                    "source": row.source,
                    "amount": amount,
                    "percentage": percentage(
                        (
                            amount /
                            total_income
                        ) * 100
                        if total_income > 0
                        else 0
                    ),
                    "transaction_count": int(
                        row.transaction_count or 0
                    ),
                }
            )


        # ---------------------------------------------------------
        # CURRENT MONTH BUDGET PERFORMANCE
        # ---------------------------------------------------------

        budget_result = connection.execute(
            text(
                """
                SELECT
                    b.id,
                    b.category,
                    b.amount AS budget,

                    COALESCE(
                        SUM(t.amount),
                        0
                    ) AS spent

                FROM public.budgets b

                LEFT JOIN public.transactions t
                    ON t.user_id = b.user_id
                    AND t.type = 'expense'
                    AND t.category = b.category

                    AND t.transaction_date >=
                        make_date(
                            b.year,
                            b.month,
                            1
                        )

                    AND t.transaction_date <
                        make_date(
                            b.year,
                            b.month,
                            1
                        ) + interval '1 month'

                WHERE b.user_id = :user_id

                  AND b.month =
                      EXTRACT(
                          MONTH FROM CURRENT_DATE
                      )

                  AND b.year =
                      EXTRACT(
                          YEAR FROM CURRENT_DATE
                      )

                GROUP BY
                    b.id,
                    b.category,
                    b.amount

                ORDER BY b.amount DESC
                """
            ),
            {
                "user_id": user_id,
            },
        )

        budget_performance = []

        for row in budget_result:

            budget = money(row.budget)
            spent = money(row.spent)

            remaining = (
                budget - spent
            )

            used_percentage = (
                (spent / budget) * 100
                if budget > 0
                else 0
            )

            if used_percentage > 100:
                status = "over"
            elif used_percentage >= 80:
                status = "warning"
            else:
                status = "healthy"

            budget_performance.append(
                {
                    "id": row.id,
                    "category": row.category,
                    "budget": budget,
                    "spent": spent,
                    "remaining": remaining,
                    "percentage": percentage(
                        used_percentage
                    ),
                    "status": status,
                }
            )


        # ---------------------------------------------------------
        # TOP EXPENSES
        # ---------------------------------------------------------

        top_expense_result = connection.execute(
            text(
                """
                SELECT
                    id,
                    amount,
                    category,
                    description,
                    transaction_date

                FROM public.transactions

                WHERE user_id = :user_id
                  AND type = 'expense'

                ORDER BY
                    amount DESC,
                    transaction_date DESC

                LIMIT 5
                """
            ),
            {
                "user_id": user_id,
            },
        )

        top_expenses = [
            {
                "id": row.id,
                "amount": money(row.amount),
                "category": row.category,
                "description": row.description,
                "transaction_date": (
                    row.transaction_date
                ),
            }
            for row in top_expense_result
        ]


        # ---------------------------------------------------------
        # TOP INCOME
        # ---------------------------------------------------------

        top_income_result = connection.execute(
            text(
                """
                SELECT
                    id,
                    amount,
                    source,
                    description,
                    transaction_date

                FROM public.transactions

                WHERE user_id = :user_id
                  AND type = 'income'

                ORDER BY
                    amount DESC,
                    transaction_date DESC

                LIMIT 5
                """
            ),
            {
                "user_id": user_id,
            },
        )

        top_income = [
            {
                "id": row.id,
                "amount": money(row.amount),
                "source": row.source,
                "description": row.description,
                "transaction_date": (
                    row.transaction_date
                ),
            }
            for row in top_income_result
        ]


        # ---------------------------------------------------------
        # GOALS
        # ---------------------------------------------------------

        goals_result = connection.execute(
            text(
                """
                SELECT
                    id,
                    name,
                    target_amount,
                    current_amount,
                    deadline

                FROM public.savings_goals

                WHERE user_id = :user_id

                ORDER BY
                    current_amount DESC
                """
            ),
            {
                "user_id": user_id,
            },
        )

        goals = []

        total_goal_target = 0
        total_goal_saved = 0

        for row in goals_result:

            target = money(row.target_amount)
            saved = money(row.current_amount)

            remaining = max(
                target - saved,
                0
            )

            progress = (
                (saved / target) * 100
                if target > 0
                else 0
            )

            total_goal_target += target
            total_goal_saved += saved

            goals.append(
                {
                    "id": row.id,
                    "name": row.name,
                    "target_amount": target,
                    "current_amount": saved,
                    "remaining_amount": remaining,
                    "progress_percentage": percentage(
                        progress
                    ),
                    "deadline": row.deadline,
                    "completed": (
                        saved >= target
                    ),
                }
            )


        # ---------------------------------------------------------
        # INSIGHTS
        # ---------------------------------------------------------

        insights = []

        # Savings insight
        if total_income > 0:

            if savings_rate >= 30:
                insights.append(
                    {
                        "type": "savings",
                        "title": "Strong savings rate",
                        "message": (
                            f"You're currently saving "
                            f"{savings_rate:.1f}% "
                            f"of your recorded income."
                        ),
                        "severity": "positive",
                    }
                )

            elif savings_rate >= 20:
                insights.append(
                    {
                        "type": "savings",
                        "title": "Healthy savings rate",
                        "message": (
                            f"You're saving "
                            f"{savings_rate:.1f}% "
                            f"of your recorded income."
                        ),
                        "severity": "positive",
                    }
                )

            elif savings_rate >= 0:
                insights.append(
                    {
                        "type": "savings",
                        "title": "Room to increase savings",
                        "message": (
                            f"You're saving "
                            f"{savings_rate:.1f}% "
                            f"of your recorded income. "
                            f"Small spending reductions "
                            f"could increase this."
                        ),
                        "severity": "info",
                    }
                )

            else:
                insights.append(
                    {
                        "type": "savings",
                        "title": "Expenses exceed income",
                        "message": (
                            "Your recorded expenses are "
                            "currently higher than your "
                            "recorded income."
                        ),
                        "severity": "negative",
                    }
                )


        # Top spending category
        if category_breakdown:

            top_category = category_breakdown[0]

            insights.append(
                {
                    "type": "spending",
                    "title": (
                        f"{top_category['category']} "
                        "is your largest expense"
                    ),
                    "message": (
                        f"{top_category['category']} "
                        f"accounts for "
                        f"{top_category['percentage']:.1f}% "
                        f"of your current-month spending."
                    ),
                    "severity": "info",
                }
            )


        # Category increase insight
        category_increases = [
            item
            for item in category_breakdown
            if item["change_percentage"] is not None
            and item["change_percentage"] > 0
        ]

        if category_increases:

            largest_increase = max(
                category_increases,
                key=lambda item: item[
                    "change_percentage"
                ],
            )

            insights.append(
                {
                    "type": "trend",
                    "title": (
                        f"{largest_increase['category']} "
                        "spending increased"
                    ),
                    "message": (
                        f"Spending in "
                        f"{largest_increase['category']} "
                        f"is up "
                        f"{largest_increase['change_percentage']:.1f}% "
                        f"from last month."
                    ),
                    "severity": "warning",
                }
            )


        # Budget insights
        over_budget = [
            item
            for item in budget_performance
            if item["status"] == "over"
        ]

        warning_budgets = [
            item
            for item in budget_performance
            if item["status"] == "warning"
        ]

        if over_budget:

            budget = over_budget[0]

            insights.append(
                {
                    "type": "budget",
                    "title": (
                        f"{budget['category']} "
                        "is over budget"
                    ),
                    "message": (
                        f"You've spent "
                        f"Rs. {abs(budget['remaining']):,.2f} "
                        f"more than your "
                        f"{budget['category']} budget."
                    ),
                    "severity": "negative",
                }
            )

        elif warning_budgets:

            budget = warning_budgets[0]

            insights.append(
                {
                    "type": "budget",
                    "title": (
                        f"{budget['category']} "
                        "is approaching its limit"
                    ),
                    "message": (
                        f"You've used "
                        f"{budget['percentage']:.1f}% "
                        f"of your "
                        f"{budget['category']} budget."
                    ),
                    "severity": "warning",
                }
            )


        # Income concentration
        if income_sources:

            primary_source = income_sources[0]

            if primary_source["percentage"] >= 70:

                insights.append(
                    {
                        "type": "income",
                        "title": (
                            f"{primary_source['source']} "
                            "is your primary income source"
                        ),
                        "message": (
                            f"{primary_source['percentage']:.1f}% "
                            "of your recorded income "
                            f"comes from "
                            f"{primary_source['source']}."
                        ),
                        "severity": "info",
                    }
                )


        # Goal insight
        incomplete_goals = [
            goal
            for goal in goals
            if not goal["completed"]
        ]

        if incomplete_goals:

            closest_goal = max(
                incomplete_goals,
                key=lambda goal: goal[
                    "progress_percentage"
                ],
            )

            insights.append(
                {
                    "type": "goal",
                    "title": (
                        f"{closest_goal['name']} "
                        "is your closest goal"
                    ),
                    "message": (
                        f"You've completed "
                        f"{closest_goal['progress_percentage']:.1f}% "
                        "of this goal and have "
                        f"Rs. {closest_goal['remaining_amount']:,.2f} "
                        "remaining."
                    ),
                    "severity": "positive",
                }
            )


        # ---------------------------------------------------------
        # FINAL RESPONSE
        # ---------------------------------------------------------

        return {
            "summary": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "total_savings": total_savings,
                "savings_rate": percentage(
                    savings_rate
                ),
                "transaction_count": transaction_count,
                "average_monthly_income": (
                    average_monthly_income
                ),
                "average_monthly_expenses": (
                    average_monthly_expenses
                ),
                "average_monthly_savings": (
                    average_monthly_savings
                ),
                "largest_expense": (
                    largest_expense_data
                ),
                "largest_income": (
                    largest_income_data
                ),
            },

            "monthly_data": monthly_data,

            "category_breakdown": (
                category_breakdown
            ),

            "income_sources": income_sources,

            "budget_performance": (
                budget_performance
            ),

            "top_expenses": top_expenses,

            "top_income": top_income,

            "goals": {
                "items": goals,
                "total_target": total_goal_target,
                "total_saved": total_goal_saved,
                "total_remaining": max(
                    total_goal_target -
                    total_goal_saved,
                    0
                ),
            },

            "insights": insights,
        }