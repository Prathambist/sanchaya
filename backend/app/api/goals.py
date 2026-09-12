from datetime import date

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.api.transactions import get_current_user
from app.database import engine


router = APIRouter(
    prefix="/api/goals",
    tags=["Goals"],
)


class GoalCreate(BaseModel):
    name: str
    target_amount: float = Field(gt=0)
    current_amount: float = Field(ge=0)
    deadline: date | None = None


class GoalContribution(BaseModel):
    amount: float = Field(gt=0)


def validate_goal(goal):
    if not goal.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Goal name is required.",
        )

    if goal.current_amount > goal.target_amount:
        raise HTTPException(
            status_code=400,
            detail=(
                "Current amount cannot be greater "
                "than the target amount."
            ),
        )


def build_goal(row):
    target_amount = float(row.target_amount or 0)
    current_amount = float(row.current_amount or 0)

    remaining_amount = max(
        target_amount - current_amount,
        0,
    )

    progress_percentage = (
        (current_amount / target_amount) * 100
        if target_amount > 0
        else 0
    )

    completed = (
        current_amount >= target_amount
    )

    days_remaining = None

    if row.deadline:
        days_remaining = (
            row.deadline - date.today()
        ).days

    return {
        "id": row.id,
        "user_id": row.user_id,
        "name": row.name,
        "target_amount": target_amount,
        "current_amount": current_amount,
        "remaining_amount": remaining_amount,
        "progress_percentage": progress_percentage,
        "deadline": row.deadline,
        "days_remaining": days_remaining,
        "completed": completed,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }


@router.get("/")
def get_goals(
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
                    id,
                    user_id,
                    name,
                    target_amount,
                    current_amount,
                    deadline,
                    created_at,
                    updated_at
                FROM public.savings_goals

                WHERE user_id = :user_id

                ORDER BY
                    deadline ASC NULLS LAST,
                    created_at DESC
                """
            ),
            {
                "user_id": user_id,
            },
        )

        goals = [
            build_goal(row)
            for row in result
        ]

    return {
        "goals": goals
    }


@router.post("/")
def create_goal(
    goal: GoalCreate,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    user_id = user.get("id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid user session.",
        )

    validate_goal(goal)

    name = goal.name.strip()

    with engine.begin() as connection:
        result = connection.execute(
            text(
                """
                INSERT INTO public.savings_goals (
                    user_id,
                    name,
                    target_amount,
                    current_amount,
                    deadline
                )

                VALUES (
                    :user_id,
                    :name,
                    :target_amount,
                    :current_amount,
                    :deadline
                )

                RETURNING
                    id,
                    user_id,
                    name,
                    target_amount,
                    current_amount,
                    deadline,
                    created_at,
                    updated_at
                """
            ),
            {
                "user_id": user_id,
                "name": name,
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "deadline": goal.deadline,
            },
        )

        created_goal = result.fetchone()

    return {
        "goal": build_goal(created_goal)
    }


@router.post("/{goal_id}/contribute")
def contribute_to_goal(
    goal_id: str,
    contribution: GoalContribution,
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

        goal = connection.execute(
            text(
                """
                SELECT
                    id,
                    user_id,
                    name,
                    target_amount,
                    current_amount,
                    deadline,
                    created_at,
                    updated_at
                FROM public.savings_goals

                WHERE id = :goal_id
                  AND user_id = :user_id

                FOR UPDATE
                """
            ),
            {
                "goal_id": goal_id,
                "user_id": user_id,
            },
        ).fetchone()

        if not goal:
            raise HTTPException(
                status_code=404,
                detail="Goal not found.",
            )

        target_amount = float(
            goal.target_amount or 0
        )

        current_amount = float(
            goal.current_amount or 0
        )

        contribution_amount = float(
            contribution.amount
        )

        new_amount = (
            current_amount +
            contribution_amount
        )

        if new_amount > target_amount:
            remaining_amount = max(
                target_amount - current_amount,
                0,
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    f"This contribution is too large. "
                    f"You can add at most Rs. "
                    f"{remaining_amount:,.2f}."
                ),
            )

        result = connection.execute(
            text(
                """
                UPDATE public.savings_goals

                SET
                    current_amount = :current_amount,
                    updated_at = now()

                WHERE id = :goal_id
                  AND user_id = :user_id

                RETURNING
                    id,
                    user_id,
                    name,
                    target_amount,
                    current_amount,
                    deadline,
                    created_at,
                    updated_at
                """
            ),
            {
                "goal_id": goal_id,
                "user_id": user_id,
                "current_amount": new_amount,
            },
        )

        updated_goal = result.fetchone()

    return {
        "goal": build_goal(updated_goal)
    }


@router.put("/{goal_id}")
def update_goal(
    goal_id: str,
    goal: GoalCreate,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    user_id = user.get("id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid user session.",
        )

    validate_goal(goal)

    name = goal.name.strip()

    with engine.begin() as connection:
        result = connection.execute(
            text(
                """
                UPDATE public.savings_goals

                SET
                    name = :name,
                    target_amount = :target_amount,
                    current_amount = :current_amount,
                    deadline = :deadline,
                    updated_at = now()

                WHERE id = :goal_id
                  AND user_id = :user_id

                RETURNING
                    id,
                    user_id,
                    name,
                    target_amount,
                    current_amount,
                    deadline,
                    created_at,
                    updated_at
                """
            ),
            {
                "goal_id": goal_id,
                "user_id": user_id,
                "name": name,
                "target_amount": goal.target_amount,
                "current_amount": goal.current_amount,
                "deadline": goal.deadline,
            },
        )

        updated_goal = result.fetchone()

    if not updated_goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found.",
        )

    return {
        "goal": build_goal(updated_goal)
    }


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: str,
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
                DELETE FROM public.savings_goals

                WHERE id = :goal_id
                  AND user_id = :user_id

                RETURNING id
                """
            ),
            {
                "goal_id": goal_id,
                "user_id": user_id,
            },
        )

        deleted_goal = result.fetchone()

    if not deleted_goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found.",
        )

    return {
        "message": "Goal deleted successfully."
    }