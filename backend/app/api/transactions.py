import os
from datetime import date

import httpx
from dotenv import load_dotenv

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.database import engine


load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv(
    "SUPABASE_PUBLISHABLE_KEY"
)


router = APIRouter(
    prefix="/api/transactions",
    tags=["Transactions"],
)


class TransactionCreate(BaseModel):
    amount: float = Field(gt=0)
    type: str
    category: str | None = None
    source: str | None = None
    description: str | None = None
    transaction_date: date


def get_current_user(
    authorization: str | None,
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header.",
        )

    access_token = authorization.replace(
        "Bearer ",
        "",
        1,
    )

    if (
        not SUPABASE_URL
        or not SUPABASE_PUBLISHABLE_KEY
    ):
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration is missing.",
        )

    try:
        response = httpx.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_PUBLISHABLE_KEY,
                "Authorization": f"Bearer {access_token}",
            },
            timeout=10,
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Unable to contact authentication service.",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session.",
        )

    return response.json()


def validate_transaction(transaction):
    if transaction.type not in {
        "income",
        "expense",
    }:
        raise HTTPException(
            status_code=400,
            detail="Transaction type must be income or expense.",
        )

    if transaction.type == "expense":
        if not transaction.category:
            raise HTTPException(
                status_code=400,
                detail="Expense transactions require a category.",
            )

        if transaction.source:
            raise HTTPException(
                status_code=400,
                detail="Expense transactions cannot have an income source.",
            )

    if transaction.type == "income":
        if not transaction.source:
            raise HTTPException(
                status_code=400,
                detail="Income transactions require a source.",
            )

        if transaction.category:
            raise HTTPException(
                status_code=400,
                detail="Income transactions cannot have an expense category.",
            )


@router.get("/")
def get_transactions(
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
                    amount,
                    type,
                    category,
                    source,
                    description,
                    transaction_date,
                    created_at,
                    updated_at
                FROM public.transactions

                WHERE user_id = :user_id

                ORDER BY
                    transaction_date DESC,
                    created_at DESC
                """
            ),
            {
                "user_id": user_id,
            },
        )

        transactions = [
            dict(row._mapping)
            for row in result
        ]

    return {
        "transactions": transactions
    }


@router.post("/")
def create_transaction(
    transaction: TransactionCreate,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)

    user_id = user.get("id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid user session.",
        )

    validate_transaction(transaction)

    with engine.begin() as connection:
        result = connection.execute(
            text(
                """
                INSERT INTO public.transactions (
                    user_id,
                    amount,
                    type,
                    category,
                    source,
                    description,
                    transaction_date
                )

                VALUES (
                    :user_id,
                    :amount,
                    :type,
                    :category,
                    :source,
                    :description,
                    :transaction_date
                )

                RETURNING
                    id,
                    user_id,
                    amount,
                    type,
                    category,
                    source,
                    description,
                    transaction_date,
                    created_at,
                    updated_at
                """
            ),
            {
                "user_id": user_id,
                "amount": transaction.amount,
                "type": transaction.type,
                "category": (
                    transaction.category
                    if transaction.type == "expense"
                    else None
                ),
                "source": (
                    transaction.source
                    if transaction.type == "income"
                    else None
                ),
                "description": transaction.description,
                "transaction_date": transaction.transaction_date,
            },
        )

        created_transaction = dict(
            result.fetchone()._mapping
        )

    return {
        "transaction": created_transaction
    }


@router.put("/{transaction_id}")
def update_transaction(
    transaction_id: str,
    transaction: TransactionCreate,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)

    user_id = user.get("id")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid user session.",
        )

    validate_transaction(transaction)

    with engine.begin() as connection:
        result = connection.execute(
            text(
                """
                UPDATE public.transactions

                SET
                    amount = :amount,
                    type = :type,
                    category = :category,
                    source = :source,
                    description = :description,
                    transaction_date = :transaction_date,
                    updated_at = now()

                WHERE id = :transaction_id
                  AND user_id = :user_id

                RETURNING
                    id,
                    user_id,
                    amount,
                    type,
                    category,
                    source,
                    description,
                    transaction_date,
                    created_at,
                    updated_at
                """
            ),
            {
                "transaction_id": transaction_id,
                "user_id": user_id,
                "amount": transaction.amount,
                "type": transaction.type,
                "category": (
                    transaction.category
                    if transaction.type == "expense"
                    else None
                ),
                "source": (
                    transaction.source
                    if transaction.type == "income"
                    else None
                ),
                "description": transaction.description,
                "transaction_date": transaction.transaction_date,
            },
        )

        updated_transaction = result.fetchone()

    if not updated_transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found.",
        )

    return {
        "transaction": dict(
            updated_transaction._mapping
        )
    }


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: str,
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
                DELETE FROM public.transactions

                WHERE id = :transaction_id
                  AND user_id = :user_id

                RETURNING id
                """
            ),
            {
                "transaction_id": transaction_id,
                "user_id": user_id,
            },
        )

        deleted_transaction = result.fetchone()

    if not deleted_transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found.",
        )

    return {
        "message": "Transaction deleted successfully."
    }