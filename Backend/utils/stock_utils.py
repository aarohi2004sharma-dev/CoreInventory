from database import db
from models.stock_model import StockLedger
from sqlalchemy import func

def get_available_stock(user_id, product_id, location_id):
    """Calculate current stock for a product at a specific location."""
    total = db.session.query(
        func.sum(StockLedger.quantity_change)
    ).filter(
        StockLedger.user_id == user_id,
        StockLedger.product_id == product_id,
        StockLedger.location_id == location_id
    ).scalar()
    
    return total or 0
