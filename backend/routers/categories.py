from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
from database import get_db
from auth import get_current_user, require_admin
from schemas import CategoryCreate, CategoryOut

router = APIRouter()


@router.get("/", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Category).filter(models.Category.is_active == True).all()


@router.get("/all", response_model=List[CategoryOut])
def list_all_categories(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.Category).all()


@router.post("/", response_model=CategoryOut)
def create_category(data: CategoryCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(models.Category).filter(models.Category.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="التصنيف موجود مسبقاً")
    cat = models.Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(cat_id: int, data: CategoryCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="التصنيف غير موجود")
    for k, v in data.model_dump().items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="التصنيف غير موجود")
    prod_count = db.query(models.Product).filter(models.Product.category_id == cat_id).count()
    if prod_count > 0:
        raise HTTPException(status_code=400, detail=f"لا يمكن الحذف، يوجد {prod_count} منتج في هذا التصنيف")
    db.delete(cat)
    db.commit()
    return {"message": "تم الحذف"}
