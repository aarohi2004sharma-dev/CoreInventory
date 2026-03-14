from app import create_app
from database import db
from models.user_model import User
from models.product_model import Category, Product
from models.stock_model import Warehouse, Location, StockLedger, Receipt, ReceiptItem, Delivery, DeliveryItem
import bcrypt

app = create_app()

def seed_db():
    with app.app_context():
        db.drop_all()
        db.create_all()
        
        # 1. Admin setup
        hashed_pw = bcrypt.hashpw('Admin@123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = User(login_id='admin123', name='Admin Manager', email='admin@coreinventory.com', password_hash=hashed_pw, role='inventory_manager')
        db.session.add(admin)
        db.session.flush()

        # 2. Categories
        elec = Category(name='Electronics', description='Gadgets and devices', user_id=admin.id)
        fur = Category(name='Furniture', description='Desks and chairs', user_id=admin.id)
        db.session.add_all([elec, fur])
        db.session.flush()

        # 3. Warehouses & locations
        wh1 = Warehouse(name='Main Hub', short_code='WH-MAIN', address='New York', user_id=admin.id)
        db.session.add(wh1)
        db.session.flush()
        
        locA1 = Location(warehouse_id=wh1.id, name='Rack A1', short_code='R-A1', user_id=admin.id)
        locA2 = Location(warehouse_id=wh1.id, name='Rack A2', short_code='R-A2', user_id=admin.id)
        db.session.add_all([locA1, locA2])
        db.session.flush()

        # 4. Products
        p1 = Product(name='MacBook Pro 16"', sku='MBP-16-M3', category_id=elec.id, unit='pcs', reorder_level=10, user_id=admin.id)
        p2 = Product(name='Ergo Desk Plus', sku='ERGO-D1', category_id=fur.id, unit='pcs', reorder_level=5, user_id=admin.id)
        p3 = Product(name='Magic Mouse', sku='APL-MOU', category_id=elec.id, unit='pcs', reorder_level=100, user_id=admin.id) # Will be low stock
        db.session.add_all([p1, p2, p3])
        db.session.flush()

        # 5. Initial stock receipt
        r1 = Receipt(supplier='Apple Inc', status='pending', user_id=admin.id)
        db.session.add(r1)
        db.session.flush()
        
        ri1 = ReceiptItem(receipt_id=r1.id, product_id=p1.id, quantity=50, location_id=locA1.id)
        db.session.add(ri1)

        # 6. Pending Delivery
        d1 = Delivery(customer='Global Reach LLC', status='pending', user_id=admin.id)
        db.session.add(d1)
        db.session.flush()
        
        di1 = DeliveryItem(delivery_id=d1.id, product_id=p2.id, quantity=2, location_id=locA2.id)
        db.session.add(di1)
        
        db.session.commit()
        print("Database seeded! You have pending receipts, deliveries, and low stock items to explore.")

if __name__ == '__main__':
    seed_db()
