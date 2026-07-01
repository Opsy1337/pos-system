from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class LoginRequest(BaseModel):
    username: str
    password: str


class CategoryBase(BaseModel):
    name: str
    color: str = "#3B82F6"
    icon: str = "🏷️"
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int
    class Config:
        orm_mode = True


class ProductBase(BaseModel):
    name: str
    price: float
    category_id: int
    image_url: Optional[str] = ""
    quantity: int = -1
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    category: Optional[CategoryOut] = None
    created_at: datetime
    class Config:
        orm_mode = True


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    discount: float = 0
    discount_type: str = "amount"
    tax_rate: float = 15
    payment_method: str = "cash"
    notes: str = ""


class SaleItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    class Config:
        orm_mode = True


class SaleOut(BaseModel):
    id: int
    invoice_number: str
    subtotal: float
    discount: float
    discount_type: str
    tax_rate: float
    tax_amount: float
    total: float
    payment_method: str
    cashier_id: int
    notes: str
    created_at: datetime
    cashier: Optional[dict] = None
    items: List[SaleItemOut] = []
    class Config:
        orm_mode = True


class UserBase(BaseModel):
    username: str
    name: str
    role: str = "cashier"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True


class SettingsOut(BaseModel):
    store_name: str
    store_address: str
    store_phone: str
    tax_rate: float
    currency: str
    receipt_footer: str
    class Config:
        orm_mode = True


class SettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    store_address: Optional[str] = None
    store_phone: Optional[str] = None
    tax_rate: Optional[float] = None
    currency: Optional[str] = None
    receipt_footer: Optional[str] = None
