from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.models.product import ProductCreate, ProductUpdate, ProductResponse, BulkImportRequest
from backend.services import product_service

router = APIRouter(tags=["Products"])

@router.get("/products", response_model=List[ProductResponse])
def get_products(search: Optional[str] = None, category: Optional[str] = None):
    return product_service.get_all_products(search=search, category=category)

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int):
    prod = product_service.get_product_by_id(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

@router.post("/products", response_model=ProductResponse, status_code=201)
def add_product(product: ProductCreate):
    return product_service.create_product(product)

@router.put("/products/{product_id}", response_model=ProductResponse)
def modify_product(product_id: int, product: ProductUpdate):
    updated = product_service.update_product(product_id, product)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated

@router.delete("/products/{product_id}")
def remove_product(product_id: int):
    success = product_service.delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully", "id": product_id}

@router.get("/categories", response_model=List[str])
def list_categories():
    return product_service.get_all_categories()

@router.post("/products/bulk")
def import_bulk_products(payload: BulkImportRequest):
    count = 0
    if payload.products:
        for p in payload.products:
            product_service.create_product(p)
            count += 1
    elif payload.raw_text:
        count = product_service.bulk_import_raw(payload.raw_text)

    return {"message": f"Successfully imported {count} products", "count": count}
