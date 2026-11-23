from typing import Optional, List
from pydantic import BaseModel, Field

class TripItemPayload(BaseModel):
    product_id: Optional[int] = None
    product_name: str = Field(..., min_length=1)
    category: Optional[str] = ""
    unit: Optional[str] = "पीस"
    quantity: float = Field(gt=0, description="Quantity bought")
    purchase_price: float = Field(ge=0, description="Purchase rate per unit")
    selling_price: float = Field(ge=0, description="Selling rate per unit")

class TripItemResponse(TripItemPayload):
    id: int
    subtotal_purchase: float
    subtotal_selling: float
    profit: float

class TripCreate(BaseModel):
    trip_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD")
    title: Optional[str] = "बाजार खरीदारी"
    notes: Optional[str] = ""
    items: List[TripItemPayload]

class TripSummaryResponse(BaseModel):
    id: int
    trip_date: str
    title: str
    total_items: int
    total_purchase_cost: float
    total_selling_value: float
    total_profit: float
    margin_percent: float
    notes: Optional[str] = ""
    created_at: Optional[str] = None

class TripDetailResponse(TripSummaryResponse):
    items: List[TripItemResponse]
