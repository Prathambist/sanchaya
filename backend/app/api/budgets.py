from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.api.transactions import get_current_user
from app.database import engine


router = APIRouter(
    prefix="/api/budgets",
    tags=["Budgets"],
)


class BudgetCreate(BaseModel):
    category: str
    amount: float = Field(gt=0)
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)


def validate_budget(budget):
    if not budget.category.strip():
        raise HTTPException(
            status_code=400,
            detail="Budget category is required.",
        )


def build_budget(row):
    budget = float(row.amount or 0)
    spent = float(row.spent or 0)

    remaining = budget - spent

    percentage = (
        (spent / budget) * 100
        if budget > 0
        else 0
    )

    return {
        "id": row.id,
        "user_id": row.user_id,
        "category": row.category,
        "amount": budget,
        "month": row.month,
        "year": row.year,
        "spent": spent,
        "remaining": remaining,
        "percentage": percentage,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }


@router.get("/")
def get_budgets(
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
        result = connection.execute(
            text(
                """
                SELECT
                    b.id,
                    b.user_id,
                    b.category,
                    b.amount,
                    b.month,
                    b.year,
                    b.created_at,
                    b.updated_at,

                    COALESCE(
                        SUM(t.amount),
                        0
                    ) AS spent

                FROM public.budgets b

                LEFT JOIN public.transactions t
                    ON t.user_id = b.user_id
                    AND t.type = 'expense'
                    AND t.category = b.category
                    AND EXTRACT(
                        MONTH FROM t.transaction_date
                    ) = b.month
                    AND EXTRACT(
                        YEAR FROM t.transaction_date
                    ) = b.year

                WHERE b.user_id = :user_id

                GROUP BY
                    b.id,
                    b.user_id,
                    b.category,
                    b.amount,
                    b.month,
                    b.year,
                    b.created_at,
                    b.updated_at

                ORDER BY
                    b.year DESC,
                    b.month DESC,
                    b.category ASC
                """
            ),
            {
                "user_id": user_id,
            },
        )

        budgets = [
            build_budget(row)
            for row in result
        ]

    return {
        "budgets": budgets
    }


@router.post("/")
def create_budget(
    budget: BudgetCreate,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    user_id = user.get("id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid user session.",
        )

    validate_budget(budget)

    category = budget.category.strip()

    with engine.begin() as connection:
        existing = connection.execute(
            text(
                """
                SELECT id
                FROM public.budgets
                WHERE user_id = :user_id
                  AND category = :category
                  AND month = :month
                  AND year = :year
                """
            ),
            {
                "user_id": user_id,
                "category": category,
                "month": budget.month,
                "year": budget.year,
            },
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail=(
                    "A budget for this category "
                    "already exists for this month."
                ),
            )

        result = connection.execute(
            text(
                """
                INSERT INTO public.budgets (
                    user_id,
                    category,
                    amount,
                    month,
                    year
                )
                VALUES (
                    :user_id,
                    :category,
                    :amount,
                    :month,
                    :year
                )
                RETURNING
                    id,
                    user_id,
                    category,
                    amount,
                    month,
                    year,
                    created_at,
                    updated_at
                """
            ),
            {
                "user_id": user_id,
                "category": category,
                "amount": budget.amount,
                "month": budget.month,
                "year": budget.year,
            },
        )

        created_budget = result.fetchone()

    return {
        "budget": dict(
            created_budget._mapping
        )
    }


@router.put("/{budget_id}")
def update_budget(
    budget_id: str,
    budget: BudgetCreate,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    user_id = user.get("id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid user session.",
        )

    validate_budget(budget)

    category = budget.category.strip()

    with engine.begin() as connection:
        existing = connection.execute(
            text(
                """
                SELECT id
                FROM public.budgets
                WHERE user_id = :user_id
                  AND category = :category
                  AND month = :month
                  AND year = :year
                  AND id != :budget_id
                """
            ),
            {
                "user_id": user_id,
                "category": category,
                "month": budget.month,
                "year": budget.year,
                "budget_id": budget_id,
            },
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail=(
                    "A budget for this category "
                    "already exists for this month."
                ),
            )

        result = connection.execute(
            text(
                """
                UPDATE public.budgets
                SET
                    category = :category,
                    amount = :amount,
                    month = :month,
                    year = :year,
                    updated_at = now()

                WHERE id = :budget_id
                  AND user_id = :user_id

                RETURNING
                    id,
                    user_id,
                    category,
                    amount,
                    month,
                    year,
                    created_at,
                    updated_at
                """
            ),
            {
                "budget_id": budget_id,
                "user_id": user_id,
                "category": category,
                "amount": budget.amount,
                "month": budget.month,
                "year": budget.year,
            },
        )

        updated_budget = result.fetchone()

    if not updated_budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found.",
        )

    return {
        "budget": dict(
            updated_budget._mapping
        )
    }


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: str,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    user_id = user.get("id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid user session.",
        )

    with engine.begin() as connection:
        result = connection.execute(
            text(
                """
                DELETE FROM public.budgets

                WHERE id = :budget_id
                  AND user_id = :user_id

                RETURNING id
                """
            ),
            {
                "budget_id": budget_id,
                "user_id": user_id,
            },
        )

        deleted_budget = result.fetchone()

    if not deleted_budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found.",
        )

    return {
        "message": "Budget deleted successfully."
    }