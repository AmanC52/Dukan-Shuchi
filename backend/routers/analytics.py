from fastapi import APIRouter
from backend.models.analytics import AnalyticsResponse
from backend.services import analytics_service

router = APIRouter(tags=["Analytics"])

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics():
    return analytics_service.get_analytics_summary()
