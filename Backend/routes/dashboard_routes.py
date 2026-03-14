from flask import Blueprint, jsonify
from database import db
from utils.auth import token_required

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard', strict_slashes=False)

@dashboard_bp.route('/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    from models.product_model import Product
    from models.stock_model import Receipt, Delivery, StockLedger, Transfer
    from sqlalchemy import func
    
    # Base stats
    pending_receipts = Receipt.query.filter_by(user_id=current_user.id, status='pending').count()
    pending_deliveries = Delivery.query.filter_by(user_id=current_user.id, status='pending').count()
    scheduled_transfers = Transfer.query.filter_by(user_id=current_user.id, status='pending').count()
    
    # Calculate stock levels per product
    stock_levels = db.session.query(
        StockLedger.product_id,
        func.sum(StockLedger.quantity_change).label('total')
    ).filter(StockLedger.user_id == current_user.id).group_by(StockLedger.product_id).all()
    
    # Stats derived from stock levels
    products_in_stock = 0
    low_stock_count = 0
    total_stock_units = 0
    
    # Map to help look up reorder levels efficiently
    product_meta = {p.id: p.reorder_level for p in Product.query.filter_by(user_id=current_user.id).all()}
    
    for p_id, total in stock_levels:
        total = total or 0
        total_stock_units += total
        
        if total > 0:
            products_in_stock += 1
            
        reorder_level = product_meta.get(p_id, 0)
        if total <= reorder_level:
            low_stock_count += 1
            
    # Also count products that have 0 entries in ledger as Low/Out of Stock
    # (since they have 0 quantity which is <= reorder_level)
    recorded_ids = [s[0] for s in stock_levels]
    for p_id, reorder_level in product_meta.items():
        if p_id not in recorded_ids:
            low_stock_count += 1
            
    return jsonify({
        "total_products_in_stock": products_in_stock,
        "total_stock_units": total_stock_units,
        "low_stock": low_stock_count,
        "pending_receipts": pending_receipts,
        "pending_deliveries": pending_deliveries,
        "internal_transfers": scheduled_transfers
    })
