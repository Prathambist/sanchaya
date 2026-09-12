from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.api.transactions import router as transactions_router
from app.api.dashboard import router as dashboard_router
from app.api.budgets import router as budgets_router
from app.api.goals import router as goals_router
from app.api.analytics import router as analytics_router


app = FastAPI(
    title="Smart Budget API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://sanchaya-three.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(transactions_router)
app.include_router(dashboard_router)
app.include_router(budgets_router)
app.include_router(goals_router)
app.include_router(analytics_router)


@app.get("/api/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
        }

    except Exception as e:
        return {
            "status": "error",
            "database": str(e),
        }