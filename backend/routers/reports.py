from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta
from typing import Optional
import models
from database import get_db
from auth import require_admin

router = APIRouter()


@router.get("/summary")
def get_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    q = db.query(models.Sale)
    if start_date:
        q = q.filter(func.date(models.Sale.created_at) >= start_date)
    if end_date:
        q = q.filter(func.date(models.Sale.created_at) <= end_date)

    sales = q.all()
    total_revenue = sum(s.total for s in sales)
    total_sales = len(sales)
    avg_sale = total_revenue / total_sales if total_sales else 0

    by_method = {}
    for s in sales:
        by_method[s.payment_method] = by_method.get(s.payment_method, 0) + s.total

    return {
        "total_revenue": round(total_revenue, 2),
        "total_sales": total_sales,
        "avg_sale": round(avg_sale, 2),
        "by_payment_method": by_method
    }


@router.get("/daily")
def daily_report(
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    now = datetime.utcnow()
    year = year or now.year
    month = month or now.month

    results = db.query(
        func.date(models.Sale.created_at).label("day"),
        func.count(models.Sale.id).label("count"),
        func.sum(models.Sale.total).label("revenue")
    ).filter(
        extract("year", models.Sale.created_at) == year,
        extract("month", models.Sale.created_at) == month
    ).group_by(func.date(models.Sale.created_at)).order_by("day").all()

    return [{"day": str(r.day), "count": r.count, "revenue": round(r.revenue or 0, 2)} for r in results]


@router.get("/monthly")
def monthly_report(year: int = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    now = datetime.utcnow()
    year = year or now.year

    results = db.query(
        extract("month", models.Sale.created_at).label("month"),
        func.count(models.Sale.id).label("count"),
        func.sum(models.Sale.total).label("revenue")
    ).filter(
        extract("year", models.Sale.created_at) == year
    ).group_by(extract("month", models.Sale.created_at)).order_by("month").all()

    months_ar = ["", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                 "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    return [{"month": months_ar[int(r.month)], "month_num": int(r.month), "count": r.count, "revenue": round(r.revenue or 0, 2)} for r in results]


@router.get("/top-products")
def top_products(
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    q = db.query(
        models.SaleItem.product_name,
        func.sum(models.SaleItem.quantity).label("total_qty"),
        func.sum(models.SaleItem.total_price).label("total_revenue")
    )
    if start_date or end_date:
        q = q.join(models.Sale)
    if start_date:
        q = q.filter(func.date(models.Sale.created_at) >= start_date)
    if end_date:
        q = q.filter(func.date(models.Sale.created_at) <= end_date)

    results = q.group_by(models.SaleItem.product_name).order_by(
        func.sum(models.SaleItem.total_price).desc()
    ).limit(limit).all()

    return [{"name": r.product_name, "qty": r.total_qty, "revenue": round(r.total_revenue or 0, 2)} for r in results]


@router.get("/inventory")
def inventory_report(db: Session = Depends(get_db), _=Depends(require_admin)):
    products = db.query(models.Product).filter(
        models.Product.is_active == True,
        models.Product.quantity != -1
    ).order_by(models.Product.quantity).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "quantity": p.quantity,
            "price": p.price,
            "status": "نفد المخزون" if p.quantity == 0 else "منخفض" if p.quantity < 5 else "متوفر"
        }
        for p in products
    ]


@router.get("/settings")
def get_settings(db: Session = Depends(get_db), _=Depends(get_current_user if False else require_admin)):
    s = db.query(models.Settings).first()
    if not s:
        s = models.Settings()
        db.add(s)
        db.commit()
    return s


from auth import get_current_user


@router.get("/store-settings")
def get_store_settings(db: Session = Depends(get_db), _=Depends(get_current_user)):
    s = db.query(models.Settings).first()
    if not s:
        s = models.Settings()
        db.add(s)
        db.commit()
    return {
        "store_name": s.store_name, "store_address": s.store_address,
        "store_phone": s.store_phone, "tax_rate": s.tax_rate,
        "currency": s.currency, "receipt_footer": s.receipt_footer
    }


@router.put("/store-settings")
def update_store_settings(data: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    s = db.query(models.Settings).first()
    if not s:
        s = models.Settings()
        db.add(s)
    for k, v in data.items():
        if hasattr(s, k):
            setattr(s, k, v)
    db.commit()
    return {"message": "تم الحفظ"}
