from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "macrolens",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.recipe_processing", "app.tasks.import_tasks"]
)

celery_app.conf.task_routes = {
    "app.tasks.recipe_processing.*": "recipe_queue",
    "app.tasks.import_tasks.*": "import_queue",
}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,
)