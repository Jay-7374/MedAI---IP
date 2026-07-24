from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, timezone

from app.models import HealthMetric
from app.schemas import HealthMetricCreate, BatchUploadResponse

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def process_batch_upload(db: Session, user_id: int, records: List[HealthMetricCreate]) -> BatchUploadResponse:
    inserted = 0
    duplicates = 0
    failed = 0

    for record_data in records:
        try:
            # Check if exactly matching record exists based on the unique constraint
            existing = db.query(HealthMetric).filter(
                HealthMetric.user_id == user_id,
                HealthMetric.metric_type == record_data.metric_type,
                HealthMetric.start_time == record_data.start_time,
                HealthMetric.end_time == record_data.end_time,
                HealthMetric.source == record_data.source
            ).first()

            if existing:
                # Update existing record (UPSERT behavior)
                existing.value = record_data.value
                existing.unit = record_data.unit
                existing.device_name = record_data.device_name
                existing.synced_at = utc_now()
                db.commit()
                duplicates += 1
            else:
                # Insert new record
                new_metric = HealthMetric(
                    user_id=user_id,
                    **record_data.model_dump()
                )
                db.add(new_metric)
                db.commit()
                inserted += 1
        except Exception as e:
            db.rollback()
            failed += 1

    return BatchUploadResponse(inserted=inserted, duplicates=duplicates, failed=failed)

def get_latest_metrics(db: Session, user_id: int) -> List[HealthMetric]:
    # Need to get the most recent entry for each metric_type
    metric_types = ["HEART_RATE", "STEPS", "SLEEP", "SPO2"]
    latest_metrics = []

    for m_type in metric_types:
        record = db.query(HealthMetric).filter(
            HealthMetric.user_id == user_id,
            HealthMetric.metric_type == m_type
        ).order_by(desc(HealthMetric.start_time)).first()
        if record:
            latest_metrics.append(record)

    return latest_metrics

def get_metrics_history(
    db: Session, 
    user_id: int, 
    metric_type: Optional[str] = None, 
    start_date: Optional[datetime] = None, 
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
) -> List[HealthMetric]:
    
    query = db.query(HealthMetric).filter(HealthMetric.user_id == user_id)
    
    if metric_type:
        query = query.filter(HealthMetric.metric_type == metric_type)
    if start_date:
        query = query.filter(HealthMetric.start_time >= start_date)
    if end_date:
        query = query.filter(HealthMetric.end_time <= end_date)
        
    query = query.order_by(desc(HealthMetric.start_time)).offset(skip).limit(limit)
    return query.all()
