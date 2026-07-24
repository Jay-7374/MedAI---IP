from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import User
from app.dependencies import get_current_user
from app.schemas import HealthMetricBatchRequest, BatchUploadResponse, HealthSyncStatus, HealthMetric
from app.services import health_sync_service

router = APIRouter(
    prefix="/api/v1/health-sync",
    tags=["health-sync"],
    responses={401: {"description": "Unauthorized"}},
)

metrics_router = APIRouter(
    prefix="/api/v1/health-metrics",
    tags=["health-metrics"],
    responses={401: {"description": "Unauthorized"}},
)

@router.get("/status", response_model=HealthSyncStatus)
def get_status(current_user: User = Depends(get_current_user)):
    """
    Check if the synchronization API is available and authentication is valid.
    """
    return HealthSyncStatus(
        status="ok",
        authenticated=True,
        backend_version="1.0"
    )

@router.post("", response_model=BatchUploadResponse)
def upload_health_metrics(
    payload: HealthMetricBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Batch upload health metrics. Supports UPSERT on duplicate records.
    """
    return health_sync_service.process_batch_upload(db, current_user.id, payload.records)


@metrics_router.get("/latest", response_model=List[HealthMetric])
def get_latest_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the latest metric for each supported metric_type.
    """
    return health_sync_service.get_latest_metrics(db, current_user.id)


@metrics_router.get("/history", response_model=List[HealthMetric])
def get_metrics_history(
    metric_type: Optional[str] = Query(None, description="Filter by metric type (e.g. HEART_RATE)"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get historical metrics with pagination and filtering.
    """
    return health_sync_service.get_metrics_history(
        db=db,
        user_id=current_user.id,
        metric_type=metric_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )
