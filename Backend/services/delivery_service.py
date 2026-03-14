from database import db
from models.stock_model import StockLedger, Delivery
from utils.stock_utils import get_available_stock

def validate_delivery(delivery_id):
    delivery = Delivery.query.get(delivery_id)
    if not delivery or delivery.status != 'pending':
        return False, "Delivery not found or already processed"
        
    # Check if stock is available for all items
    for item in delivery.items:
        available = get_available_stock(delivery.user_id, item.product_id, item.location_id)
        if available < item.quantity:
            from models.product_model import Product
            prod = Product.query.get(item.product_id)
            return False, f"Insufficient stock for {prod.name}. Available: {available}, Required: {item.quantity}"

    for item in delivery.items:
        ledger_entry = StockLedger(
            user_id=delivery.user_id,
            product_id=item.product_id,
            location_id=item.location_id,
            quantity_change=-item.quantity, # negative
            operation_type='delivery',
            reference_id=delivery.id
        )
        db.session.add(ledger_entry)
        
    delivery.status = 'completed'
    db.session.commit()
    return True, "Delivery validated and stock updated"
