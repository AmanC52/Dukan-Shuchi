from typing import List
from fastapi import APIRouter, HTTPException
from backend.models.trip import TripCreate, TripSummaryResponse, TripDetailResponse
from backend.services import trip_service

router = APIRouter(tags=["Purchase Trips"])

@router.get("/trips", response_model=List[TripSummaryResponse])
def get_trips():
    return trip_service.get_all_trips()

@router.get("/trips/{trip_id}", response_model=TripDetailResponse)
def get_trip(trip_id: int):
    trip = trip_service.get_trip_detail(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip record not found")
    return trip

@router.post("/trips", response_model=TripSummaryResponse, status_code=201)
def add_trip(trip: TripCreate):
    if not trip.items:
        raise HTTPException(status_code=400, detail="Cannot save an empty purchase trip. Please select items.")
    return trip_service.create_purchase_trip(trip)

@router.delete("/trips/{trip_id}")
def remove_trip(trip_id: int):
    success = trip_service.delete_purchase_trip(trip_id)
    if not success:
        raise HTTPException(status_code=404, detail="Trip record not found")
    return {"message": "Purchase trip record deleted successfully", "id": trip_id}
