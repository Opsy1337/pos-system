from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
import models
from database import get_db
from auth import get_current_user
from schemas import SaleCreate, SaleOut

router = APIRouter()


def generate_invoice_number(db: Session) -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    count = db.query(func.count(models.Sale.id)).filter(
        func.date(models.Sale.created_at) == date.today()
    ).scalar() or 0
    return f"INV-{today}-{count + 1:04d}"


@router.post("/", response_model=SaleOut)
def create_sale(data: SaleCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if not data.items:
        raise HTTPException(status_code=400, detail="لا يمكن إنشاء فاتورة فارغة")

    subtotal = 0
    sale_items = []

    for item_data in data.items:
        product = db.query(models.Product).filter(
            models.Product.id == item_data.product_id,
            models.Product.is_active == True
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"المنتج {item_data.product_id} غير موجود")
        if product.quantity != -1 and product.quantity < item_data.quantity:
            raise HTTPException(status_code=400, detail=f"الكمية المتوفرة من {product.name} هي {product.quantity} فقط")

        total_price = item_data.unit_price * item_data.quantity
        subtotal += total_price

        sale_items.append(models.SaleItem(
            product_id=product.id,
            product_name=product.name,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=total_price,
        ))

        if product.quantity != -1:
            product.quantity -= item_data.quantity

    if data.discount_type == "percent":
        discount_amount = subtotal * data.discount / 100
    else:
        discount_amount = data.discount

    taxable = subtotal - discount_amount
    tax_amount = taxable * data.tax_rate / 100
    total = taxable + tax_amount

    sale = models.Sale(
        invoice_number=generate_invoice_number(db),
        subtotal=round(subtotal, 2),
        discount=round(data.discount, 2),
        discount_type=data.discount_type,
        tax_rate=data.tax_rate,
        tax_amount=round(tax_amount, 2),
        total=round(total, 2),
        payment_method=data.payment_method,
        cashier_id=current_user.id,
        notes=data.notes,
    )
    db.add(sale)
    db.flush()

    for si in sale_items:
        si.sale_id = sale.id
        db.add(si)

    db.commit()
    db.refresh(sale)
    return _get_sale(sale.id, db)


def _get_sale(sale_id: int, db: Session):
    sale = db.query(models.Sale).options(
        joinedload(models.Sale.items),
        joinedload(models.Sale.cashier)
    ).filter(models.Sale.id == sale_id).first()
    if not sale:
        return None
    result = {
        "id": sale.id,
        "invoice_number": sale.invoice_number,
        "subtotal": sale.subtotal,
        "discount": sale.discount,
        "discount_type": sale.discount_type,
        "tax_rate": sale.tax_rate,
        "tax_amount": sale.tax_amount,
        "total": sale.total,
        "payment_method": sale.payment_method,
        "cashier_id": sale.cashier_id,
        "notes": sale.notes,
        "created_at": sale.created_at,
        "cashier": {"id": sale.cashier.id, "name": sale.cashier.name} if sale.cashier else None,
        "items": [
            {
                "id": si.id, "product_id": si.product_id, "product_name": si.product_name,
                "quantity": si.quantity, "unit_price": si.unit_price, "total_price": si.total_price
            } for si in sale.items
        ]
    }
    return result


@router.get("/")
def list_sales(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    payment_method: Optional[str] = None,
    cashier_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    q = db.query(models.Sale).options(joinedload(models.Sale.cashier))
    if start_date:
        q = q.filter(func.date(models.Sale.created_at) >= start_date)
    if end_date:
        q = q.filter(func.date(models.Sale.created_at) <= end_date)
    if payment_method:
        q = q.filter(models.Sale.payment_method == payment_method)
    if cashier_id:
        q = q.filter(models.Sale.cashier_id == cashier_id)
    total_count = q.count()
    sales = q.order_by(models.Sale.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total_count,
        "sales": [
            {
                "id": s.id, "invoice_number": s.invoice_number, "subtotal": s.subtotal,
                "discount": s.discount, "discount_type": s.discount_type,
                "tax_rate": s.tax_rate, "tax_amount": s.tax_amount, "total": s.total,
                "payment_method": s.payment_method, "cashier_id": s.cashier_id,
                "notes": s.notes, "created_at": s.created_at,
                "cashier": {"id": s.cashier.id, "name": s.cashier.name} if s.cashier else None,
                "items": []
            } for s in sales
        ]
    }


@router.get("/{sale_id}")
def get_sale(sale_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    sale = _get_sale(sale_id, db)
    if not sale:
        raise HTTPException(status_code=404, detail="الفاتورة غير موجودة")
    return sale
