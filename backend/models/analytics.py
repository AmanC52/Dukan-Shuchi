from typing import List, Optional
from pydantic import BaseModel

class TopPurchasedItem(BaseModel):
    product_name: str
    total_qty: float
    unit: str
    total_spent: float

class AnalyticsResponse(BaseModel):
    total_trips: int
    total_products: int
    all_time_purchase: float
    all_time_selling: float
    all_time_profit: float
    overall_margin: float
    top_items: List[TopPurchasedItem]
