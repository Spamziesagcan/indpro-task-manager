from fastapi import APIRouter

from app.routers.auth import router as auth_router
from app.routers.tasks import router as tasks_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(tasks_router)
