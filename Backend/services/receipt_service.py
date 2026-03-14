from database import db
from models.stock_model import StockLedger, Receipt

def validate_receipt(receipt_id):
    receipt = Receipt.query.get(receipt_id)
    if not receipt or receipt.status != 'pending':
        return False, "Receipt not found or already processed"
        
    for item in receipt.items:
        ledger_entry = StockLedger(
            user_id=receipt.user_id,
            product_id=item.product_id,
            location_id=item.location_id,
            quantity_change=item.quantity, # positive
            operation_type='receipt',
            reference_id=receipt.id
        )
        db.session.add(ledger_entry)
        
    receipt.status = 'completed'
    db.session.commit()
    return True, "Receipt validated and stock updated"
