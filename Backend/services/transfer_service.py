from database import db
from models.stock_model import StockLedger, Transfer
from utils.stock_utils import get_available_stock

def validate_transfer(transfer_id):
    transfer = Transfer.query.get(transfer_id)
    if not transfer or transfer.status != 'pending':
        return False, "Transfer not found or already processed"
        
    # Check if stock is available at the source location
    for item in transfer.items:
        available = get_available_stock(transfer.user_id, item.product_id, transfer.from_location_id)
        if available < item.quantity:
            from models.product_model import Product
            prod = Product.query.get(item.product_id)
            return False, f"Insufficient stock for {prod.name} at source location. Available: {available}, Required: {item.quantity}"

    for item in transfer.items:
        # Deduct from source
        ledger_out = StockLedger(
            user_id=transfer.user_id,
            product_id=item.product_id,
            location_id=transfer.from_location_id,
            quantity_change=-item.quantity,
            operation_type='transfer',
            reference_id=transfer.id
        )
        # Add to destination
        ledger_in = StockLedger(
            user_id=transfer.user_id,
            product_id=item.product_id,
            location_id=transfer.to_location_id,
            quantity_change=item.quantity,
            operation_type='transfer',
            reference_id=transfer.id
        )
        db.session.add(ledger_out)
        db.session.add(ledger_in)
        
    transfer.status = 'completed'
    db.session.commit()
    return True, "Transfer validated and stock updated"
