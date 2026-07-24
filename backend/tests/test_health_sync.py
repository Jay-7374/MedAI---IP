import pytest
from datetime import datetime, timedelta, timezone

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def test_status_endpoint(client, auth_headers):
    response = client.get("/api/v1/health-sync/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["authenticated"] is True

def test_status_endpoint_unauthorized(client):
    response = client.get("/api/v1/health-sync/status")
    assert response.status_code == 401

def test_batch_upload_upsert(client, auth_headers, db_session, test_user):
    now = utc_now()
    start_time = now - timedelta(hours=1)
    
    payload = {
        "records": [
            {
                "metric_type": "HEART_RATE",
                "value": 75,
                "unit": "bpm",
                "start_time": start_time.isoformat(),
                "end_time": now.isoformat(),
                "source": "Health Connect",
                "device_name": "Pixel Watch"
            }
        ]
    }
    
    # Initial insert
    response = client.post("/api/v1/health-sync", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["inserted"] == 1
    assert data["duplicates"] == 0
    
    # Check it was saved
    res_latest = client.get("/api/v1/health-metrics/latest", headers=auth_headers)
    assert res_latest.status_code == 200
    assert len(res_latest.json()) == 1
    assert res_latest.json()[0]["value"] == 75.0
    
    # Upsert with different value
    payload["records"][0]["value"] = 80
    response = client.post("/api/v1/health-sync", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["inserted"] == 0
    assert data["duplicates"] == 1
    
    # Check it was updated
    res_latest = client.get("/api/v1/health-metrics/latest", headers=auth_headers)
    assert res_latest.status_code == 200
    assert res_latest.json()[0]["value"] == 80.0

def test_invalid_metric_type(client, auth_headers):
    now = utc_now()
    payload = {
        "records": [
            {
                "metric_type": "INVALID_METRIC",
                "value": 100,
                "unit": "unit",
                "start_time": now.isoformat(),
                "end_time": now.isoformat(),
            }
        ]
    }
    response = client.post("/api/v1/health-sync", json=payload, headers=auth_headers)
    assert response.status_code == 422
    assert "Invalid metric_type" in str(response.json())

def test_get_metrics_history(client, auth_headers):
    now = utc_now()
    
    # Seed data
    payload = {
        "records": [
            {
                "metric_type": "STEPS",
                "value": 1000,
                "unit": "count",
                "start_time": (now - timedelta(days=1)).isoformat(),
                "end_time": (now - timedelta(days=1)).isoformat(),
            },
            {
                "metric_type": "STEPS",
                "value": 2000,
                "unit": "count",
                "start_time": now.isoformat(),
                "end_time": now.isoformat(),
            }
        ]
    }
    client.post("/api/v1/health-sync", json=payload, headers=auth_headers)
    
    # Get all steps history
    response = client.get("/api/v1/health-metrics/history?metric_type=STEPS", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
