from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models
from database import get_db
from auth import get_current_user, require_admin
from schemas import ProductCreate, ProductOut

router = APIRouter()


@router.get("/", response_model=List[ProductOut])
def list_products(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    q = db.query(models.Product).options(joinedload(models.Product.category))
    if active_only:
        q = q.filter(models.Product.is_active == True)
    if category_id:
        q = q.filter(models.Product.category_id == category_id)
    if search:
        q = q.filter(models.Product.name.ilike(f"%{search}%"))
    return q.order_by(models.Product.name).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(models.Product).options(joinedload(models.Product.category)).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    return p


@router.post("/", response_model=ProductOut)
def create_product(data: ProductCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    cat = db.query(models.Category).filter(models.Category.id == data.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="التصنيف غير موجود")
    p = models.Product(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return db.query(models.Product).options(joinedload(models.Product.category)).filter(models.Product.id == p.id).first()


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    for k, v in data.model_dump().items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return db.query(models.Product).options(joinedload(models.Product.category)).filter(models.Product.id == p.id).first()


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    p.is_active = False
    db.commit()
    return {"message": "تم الحذف"}


@router.patch("/{product_id}/quantity")
def update_quantity(product_id: int, qty: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    p.quantity = qty
    db.commit()
    return {"quantity": p.quantity}
