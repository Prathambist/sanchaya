from fastapi import APIRouter, Header, HTTPException
from sqlalchemy import text

from app.api.transactions import get_current_user
from app.database import engine


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary(
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

        # All-time financial totals
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
                    ) AS expenses,

                    COUNT(*) AS transaction_count

                FROM public.transactions

                WHERE user_id = :user_id
                """
            ),
            {
                "user_id": user_id,
            },
        ).fetchone()

        income = float(totals.income or 0)
        expenses = float(totals.expenses or 0)

        transaction_count = int(
            totals.transaction_count or 0
        )

        balance = income - expenses

        # Current month totals
        current_month = connection.execute(
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

                  AND transaction_date >=
                      date_trunc(
                          'month',
                          CURRENT_DATE
                      )

                  AND transaction_date <
                      date_trunc(
                          'month',
                          CURRENT_DATE
                      ) + interval '1 month'
                """
            ),
            {
                "user_id": user_id,
            },
        ).fetchone()

        monthly_income = float(
            current_month.income or 0
        )

        monthly_expenses = float(
            current_month.expenses or 0
        )

        # Six-month income and expense history
        monthly_result = connection.execute(
            text(
                """
                SELECT
                    date_trunc(
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

                  AND transaction_date >=
                      date_trunc(
                          'month',
                          CURRENT_DATE
                      ) - interval '5 months'

                  AND transaction_date <
                      date_trunc(
                          'month',
                          CURRENT_DATE
                      ) + interval '1 month'

                GROUP BY
                    date_trunc(
                        'month',
                        transaction_date
                    )

                ORDER BY month ASC
                """
            ),
            {
                "user_id": user_id,
            },
        )

        monthly_data = [
            {
                "month": row.month.strftime(
                    "%Y-%m"
                ),
                "income": float(row.income or 0),
                "expenses": float(
                    row.expenses or 0
                ),
            }
            for row in monthly_result
        ]

        # Recent transactions
        recent_result = connection.execute(
            text(
                """
                SELECT
                    id,
                    amount,
                    type,
                    category,
                    description,
                    transaction_date

                FROM public.transactions

                WHERE user_id = :user_id

                ORDER BY
                    transaction_date DESC,
                    created_at DESC

                LIMIT 5
                """
            ),
            {
                "user_id": user_id,
            },
        )

        recent_transactions = [
            dict(row._mapping)
            for row in recent_result
        ]

        # Current month spending by category
        category_result = connection.execute(
            text(
                """
                SELECT
                    category,
                    SUM(amount) AS amount

                FROM public.transactions

                WHERE user_id = :user_id

                  AND type = 'expense'

                  AND transaction_date >=
                      date_trunc(
                          'month',
                          CURRENT_DATE
                      )

                  AND transaction_date <
                      date_trunc(
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

        category_breakdown = [
            {
                "category": row.category,
                "amount": float(row.amount),
            }
            for row in category_result
        ]

    return {
        "balance": balance,
        "income": income,
        "expenses": expenses,
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "transaction_count": transaction_count,
        "monthly_data": monthly_data,
        "recent_transactions": recent_transactions,
        "category_breakdown": category_breakdown,
    }