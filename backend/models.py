from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String)
    role = Column(String, default="cashier")  # admin | cashier
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sales = relationship("Sale", back_populates="cashier")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    color = Column(String, default="#3B82F6")
    icon = Column(String, default="🏷️")
    is_active = Column(Boolean, default=True)
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    category_id = Column(Integer, ForeignKey("categories.id"))
    image_url = Column(Text, default="")
    quantity = Column(Integer, default=-1)  # -1 = unlimited
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = relationship("Category", back_populates="products")
    sale_items = relationship("SaleItem", back_populates="product")


class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    subtotal = Column(Float)
    discount = Column(Float, default=0)
    discount_type = Column(String, default="amount")  # amount | percent
    tax_rate = Column(Float, default=15)
    tax_amount = Column(Float, default=0)
    total = Column(Float)
    payment_method = Column(String, default="cash")  # cash | card | transfer
    cashier_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    cashier = relationship("User", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    product_name = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Float)
    total_price = Column(Float)
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")


class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String, default="متجري")
    store_address = Column(String, default="")
    store_phone = Column(String, default="")
    tax_rate = Column(Float, default=15)
    currency = Column(String, default="ر.س")
    receipt_footer = Column(String, default="شكراً لزيارتكم")
