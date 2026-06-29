from database import SessionLocal
import models
from auth import hash_password


def seed_data():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            return

        # Users only
        admin = models.User(username="admin", name="المدير", password_hash=hash_password("admin123"), role="admin")
        db.add_all([admin])

        # Default settings
        db.add(models.Settings(
            store_name="متجري",
            tax_rate=0,
            currency="ر.س",
            receipt_footer="شكراً لزيارتكم"
        ))

        # Default categories so user can start adding products
        default_cats = [
            models.Category(name="عام", color="#6B7280", icon="🏷️"),
            models.Category(name="مشروبات", color="#3B82F6", icon="🥤"),
            models.Category(name="طعام", color="#F59E0B", icon="🍽️"),
            models.Category(name="حلويات", color="#8B5CF6", icon="🍰"),
        ]
        db.add_all(default_cats)

        db.commit()
        print("[OK] Setup complete - admin/admin123")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
    finally:
        db.close()
