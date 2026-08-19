from celery import Celery
from app.config import config

celery_app = Celery(
    "podcast_worker",
    broker=config.REDIS_URL,
    backend=config.REDIS_URL,
    include=["app.workers.pipeline"]
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_acks_late=True, # Allow tasks to be retried if worker crashes
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1, # Very important for long-running heavy tasks
)
