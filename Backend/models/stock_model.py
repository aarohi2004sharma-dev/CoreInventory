from database import db
from datetime import datetime

class Warehouse(db.Model):
    __tablename__ = 'warehouses'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    short_code = db.Column(db.String(20), nullable=False, default='')
    address = db.Column(db.String(255), nullable=True)
    locations = db.relationship('Location', backref='warehouse', lazy=True, cascade="all, delete-orphan")

    __table_args__ = (
        db.UniqueConstraint('user_id', 'name', name='_wh_user_name_uc'),
        db.UniqueConstraint('user_id', 'short_code', name='_wh_user_code_uc'),
    )

class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False) # Rack/Shelf
    short_code = db.Column(db.String(20), nullable=False, default='')

    __table_args__ = (
        db.UniqueConstraint('warehouse_id', 'name', name='_loc_wh_name_uc'),
    )

class StockLedger(db.Model):
    __tablename__ = 'stock_ledger'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False, index=True)
    quantity_change = db.Column(db.Integer, nullable=False)
    operation_type = db.Column(db.String(50), nullable=False) # receipt, delivery, transfer, adjustment
    reference_id = db.Column(db.Integer, nullable=True) # ID from receipts, deliveries, etc
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

class Receipt(db.Model):
    __tablename__ = 'receipts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    supplier = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending') # pending, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('ReceiptItem', backref='receipt', lazy=True, cascade="all, delete-orphan")

class ReceiptItem(db.Model):
    __tablename__ = 'receipt_items'
    id = db.Column(db.Integer, primary_key=True)
    receipt_id = db.Column(db.Integer, db.ForeignKey('receipts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True) # Where it should be placed

class Delivery(db.Model):
    __tablename__ = 'deliveries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    customer = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending') # pending, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('DeliveryItem', backref='delivery', lazy=True, cascade="all, delete-orphan")

class DeliveryItem(db.Model):
    __tablename__ = 'delivery_items'
    id = db.Column(db.Integer, primary_key=True)
    delivery_id = db.Column(db.Integer, db.ForeignKey('deliveries.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True) # Where to pick it from

class Transfer(db.Model):
    __tablename__ = 'transfers'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    from_location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    to_location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending') # pending, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('TransferItem', backref='transfer', lazy=True, cascade="all, delete-orphan")

class TransferItem(db.Model):
    __tablename__ = 'transfer_items'
    id = db.Column(db.Integer, primary_key=True)
    transfer_id = db.Column(db.Integer, db.ForeignKey('transfers.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

class Adjustment(db.Model):
    __tablename__ = 'adjustments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    counted_quantity = db.Column(db.Integer, nullable=False)
    difference = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
