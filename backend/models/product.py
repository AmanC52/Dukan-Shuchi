from typing import Optional, List
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, description="Product Name in Hindi/English")
    category: Optional[str] = "किराना / सामान्य"
    unit: Optional[str] = "पेटी / पैकेट"
    sub_quantity: float = Field(default=1.0, gt=0, description="Number of sub-units inside pack (e.g. 12 pouches)")
    sub_unit: Optional[str] = "पीस"
    purchase_price: float = Field(ge=0, description="Wholesale purchase rate per pack (e.g. 1680)")
    retail_selling_price: float = Field(default=0.0, ge=0, description="Retail selling price per piece/pouch (e.g. 160)")
    selling_price: Optional[float] = Field(default=0.0, ge=0, description="Total selling value of pack (e.g. 1920)")
    notes: Optional[str] = ""

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    unit_purchase_price: float = 0.0
    unit_profit: float = 0.0
    total_profit_per_pack: float = 0.0
    profit_per_unit: float = 0.0
    margin_percent: float = 0.0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class BulkImportRequest(BaseModel):
    raw_text: Optional[str] = None
    products: Optional[List[ProductCreate]] = None
