from flask import Blueprint, jsonify, request
from utils.auth import token_required
from models.stock_model import Receipt, ReceiptItem, Delivery, DeliveryItem, Transfer, TransferItem, StockLedger, Adjustment
from database import db
from services.receipt_service import validate_receipt
from services.delivery_service import validate_delivery
from services.transfer_service import validate_transfer

inventory_bp = Blueprint('inventory', __name__, url_prefix='/inventory', strict_slashes=False)

@inventory_bp.route('/receipts', methods=['GET'])
@token_required
def get_receipts(current_user):
    receipts = Receipt.query.filter_by(user_id=current_user.id).order_by(Receipt.created_at.desc()).all()
    return jsonify([{
        "id": r.id, "supplier": r.supplier, "status": r.status, "created_at": r.created_at.isoformat()
    } for r in receipts])

@inventory_bp.route('/receipts', methods=['POST'])
@token_required
def create_receipt_route(current_user):
    data = request.get_json()
    new_receipt = Receipt(supplier=data['supplier'], user_id=current_user.id)
    db.session.add(new_receipt)
    db.session.flush() # get id
    for item in data.get('items', []):
        new_item = ReceiptItem(
            receipt_id=new_receipt.id,
            product_id=item['product_id'],
            quantity=item['quantity'],
            location_id=item['location_id']
        )
        db.session.add(new_item)
    db.session.commit()
    return jsonify({"message": "Receipt created", "id": new_receipt.id}), 201

@inventory_bp.route('/receipts/<int:id>/validate', methods=['POST'])
@token_required
def validate_receipt_route(current_user, id):
    success, msg = validate_receipt(id)
    return jsonify({"message": msg}), 200 if success else 400

@inventory_bp.route('/deliveries', methods=['GET'])
@token_required
def get_deliveries(current_user):
    deliveries = Delivery.query.filter_by(user_id=current_user.id).order_by(Delivery.created_at.desc()).all()
    return jsonify([{
        "id": d.id, "customer": d.customer, "status": d.status, "created_at": d.created_at.isoformat()
    } for d in deliveries])

@inventory_bp.route('/deliveries', methods=['POST'])
@token_required
def create_delivery_route(current_user):
    data = request.get_json()
    new_delivery = Delivery(customer=data['customer'], user_id=current_user.id)
    db.session.add(new_delivery)
    db.session.flush()
    for item in data.get('items', []):
        new_item = DeliveryItem(
            delivery_id=new_delivery.id,
            product_id=item['product_id'],
            quantity=item['quantity'],
            location_id=item['location_id']
        )
        db.session.add(new_item)
    db.session.commit()
    return jsonify({"message": "Delivery created", "id": new_delivery.id}), 201

@inventory_bp.route('/deliveries/<int:id>/validate', methods=['POST'])
@token_required
def validate_delivery_route(current_user, id):
    success, msg = validate_delivery(id)
    return jsonify({"message": msg}), 200 if success else 400

@inventory_bp.route('/deliveries/<int:id>/status', methods=['PATCH'])
@token_required
def update_delivery_status(current_user, id):
    """Update intermediate delivery status: pending → picked → packed"""
    delivery = Delivery.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    new_status = data.get('status')
    allowed = ['picked', 'packed']
    if new_status not in allowed:
        return jsonify({'message': f'Invalid status. Allowed: {allowed}'}), 400
    delivery.status = new_status
    db.session.commit()
    return jsonify({'message': f'Delivery marked as {new_status}', 'status': new_status})

@inventory_bp.route('/transfers', methods=['GET'])
@token_required
def get_transfers(current_user):
    # Include location names in transfer list
    transfers = Transfer.query.filter_by(user_id=current_user.id).order_by(Transfer.created_at.desc()).all()
    return jsonify([{
        "id": t.id,
        "from_location": t.from_location.name if t.from_location else "N/A",
        "to_location": t.to_location.name if t.to_location else "N/A",
        "status": t.status,
        "created_at": t.created_at.isoformat()
    } for t in transfers])

@inventory_bp.route('/transfers', methods=['POST'])
@token_required
def create_transfer_route(current_user):
    data = request.get_json()
    new_transfer = Transfer(
        user_id=current_user.id,
        from_location_id=data['from_location_id'],
        to_location_id=data['to_location_id']
    )
    db.session.add(new_transfer)
    db.session.flush()
    for item in data.get('items', []):
        new_item = TransferItem(
            transfer_id=new_transfer.id,
            product_id=item['product_id'],
            quantity=item['quantity']
        )
        db.session.add(new_item)
    db.session.commit()
    return jsonify({"message": "Transfer created", "id": new_transfer.id}), 201

@inventory_bp.route('/transfers/<int:id>/validate', methods=['POST'])
@token_required
def validate_transfer_route(current_user, id):
    success, msg = validate_transfer(id)
    return jsonify({"message": msg}), 200 if success else 400

@inventory_bp.route('/moves', methods=['GET'])
@token_required
def get_moves(current_user):
    from models.product_model import Product
    from models.stock_model import Location, Warehouse, StockLedger
    
    query = StockLedger.query.filter_by(user_id=current_user.id)
    
    # Apply Filters from Query Params
    op_type = request.args.get('type')
    if op_type:
        query = query.filter(StockLedger.operation_type == op_type)
        
    loc_id = request.args.get('location_id')
    if loc_id:
        query = query.filter(StockLedger.location_id == loc_id)
        
    wh_id = request.args.get('warehouse_id')
    if wh_id:
        query = query.join(Location).filter(Location.warehouse_id == wh_id)
        
    cat_id = request.args.get('category_id')
    if cat_id:
        query = query.join(Product).filter(Product.category_id == cat_id)

    moves = query.order_by(StockLedger.created_at.desc()).all()
    result = []
    
    for m in moves:
        product_name = m.product.name if m.product else f"Product #{m.product_id}"
        location_name = m.location.name if m.location else f"Loc #{m.location_id}"
        warehouse_name = m.location.warehouse.name if m.location and m.location.warehouse else "Unknown"
        
        result.append({
            'id': m.id,
            'product_id': m.product_id,
            'product_name': product_name,
            'category_id': m.product.category_id if m.product else None,
            'location_id': m.location_id,
            'location_name': f"{warehouse_name} › {location_name}",
            'warehouse_id': m.location.warehouse_id if m.location else None,
            'quantity_change': m.quantity_change,
            'operation_type': m.operation_type,
            'reference_id': m.reference_id,
            'created_at': m.created_at.isoformat()
        })
        
    return jsonify(result)

@inventory_bp.route('/stock', methods=['GET'])
@token_required
def get_stock(current_user):
    # Calculate aggregated stock per product and location
    from sqlalchemy import func
    from models.product_model import Product
    from models.stock_model import Location, StockLedger
    
    # query Sum(quantity_change) grouped by product_id, location_id
    stock_group = db.session.query(
        StockLedger.product_id,
        StockLedger.location_id,
        func.sum(StockLedger.quantity_change).label('total_quantity')
    ).filter(StockLedger.user_id == current_user.id).group_by(StockLedger.product_id, StockLedger.location_id).all()
    
    result = []
    for sg in stock_group:
        if sg.total_quantity <= 0:
            continue # Don't show empty stock records unless needed
            
        product = Product.query.get(sg.product_id)
        location = Location.query.get(sg.location_id)
        
        result.append({
            'product_id': sg.product_id,
            'product_name': product.name if product else f"ID {sg.product_id}",
            'sku': product.sku if product else "-",
            'category_name': product.category.name if product and product.category else "-",
            'location_id': sg.location_id,
            'location_name': location.name if location else "-",
            'warehouse_name': location.warehouse.name if location and location.warehouse else "-",
            'quantity': sg.total_quantity,
            'reserved_quantity': 0, # Placeholder for Phase 4 diagram "Free To Use" math
            'free_to_use': sg.total_quantity # free = total - reserved
        })
        
    return jsonify(result)

@inventory_bp.route('/stock/product/<int:product_id>', methods=['GET'])
@token_required
def get_product_stock_availability(current_user, product_id):
    from sqlalchemy import func
    from models.stock_model import Location, StockLedger
    
    stock_group = db.session.query(
        StockLedger.location_id,
        func.sum(StockLedger.quantity_change).label('total_quantity')
    ).filter(
        StockLedger.user_id == current_user.id,
        StockLedger.product_id == product_id
    ).group_by(StockLedger.location_id).all()
    
    result = []
    for sg in stock_group:
        if sg.total_quantity <= 0: continue
        location = Location.query.get(sg.location_id)
        result.append({
            'location_id': sg.location_id,
            'location_name': location.name if location else "Unknown",
            'warehouse_name': location.warehouse.name if location and location.warehouse else "Unknown",
            'quantity': sg.total_quantity
        })
    return jsonify(result)

@inventory_bp.route('/stock-lookup', methods=['GET'])
@token_required
def stock_lookup(current_user):
    from sqlalchemy import func
    product_id = request.args.get('product_id')
    location_id = request.args.get('location_id')
    
    if not product_id or not location_id:
        return jsonify({'stock': 0}), 200
        
    stock_sum = db.session.query(func.sum(StockLedger.quantity_change)).filter(
        StockLedger.product_id == product_id,
        StockLedger.location_id == location_id,
        StockLedger.user_id == current_user.id
    ).scalar() or 0
    
    return jsonify({'stock': stock_sum}), 200

@inventory_bp.route('/adjustments', methods=['GET'])
@token_required
def get_adjustments(current_user):
    adjustments = Adjustment.query.filter_by(user_id=current_user.id).order_by(Adjustment.created_at.desc()).all()
    return jsonify([{
        "id": a.id,
        "product_id": a.product_id,
        "product_name": a.product.name if a.product else f"Product #{a.product_id}",
        "location_id": a.location_id,
        "location_name": a.location.name if a.location else f"Loc #{a.location_id}",
        "counted_quantity": a.counted_quantity,
        "difference": a.difference,
        "created_at": a.created_at.isoformat()
    } for a in adjustments])

@inventory_bp.route('/adjustments', methods=['POST'])
@token_required
def create_adjustment(current_user):
    from sqlalchemy import func
    data = request.get_json()
    
    # 1. Get current stock
    stock_sum = db.session.query(func.sum(StockLedger.quantity_change)).filter(
        StockLedger.product_id == data['product_id'],
        StockLedger.location_id == data['location_id'],
        StockLedger.user_id == current_user.id
    ).scalar() or 0
    
    diff = int(data['counted_quantity']) - stock_sum
    
    # 2. Add Adjustment Record
    new_adj = Adjustment(
        user_id=current_user.id,
        product_id=data['product_id'],
        location_id=data['location_id'],
        counted_quantity=data['counted_quantity'],
        difference=diff
    )
    db.session.add(new_adj)
    
    # 3. If difference != 0, adjust stock ledger
    if diff != 0:
        ledger_entry = StockLedger(
            user_id=current_user.id,
            product_id=data['product_id'],
            location_id=data['location_id'],
            quantity_change=diff,
            operation_type='adjustment',
            reference_id=None # Optionally link to adj.id after flush
        )
        db.session.add(ledger_entry)
        
    db.session.commit()
    return jsonify({"message": "Adjustment saved", "difference": diff}), 201
