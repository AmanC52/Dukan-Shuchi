from backend.routers.products import router as products_router
from backend.routers.trips import router as trips_router
from backend.routers.analytics import router as analytics_router
from backend.routers.backup import router as backup_router

__all__ = ["products_router", "trips_router", "analytics_router", "backup_router"]
