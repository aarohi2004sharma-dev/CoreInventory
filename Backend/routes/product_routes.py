from flask import Blueprint, jsonify, request
from utils.auth import token_required
from models.product_model import Product, Category
from database import db

product_bp = Blueprint('products', __name__, url_prefix='/products', strict_slashes=False)

@product_bp.route('/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    categories = Category.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': c.id, 'name': c.name} for c in categories])

@product_bp.route('/categories', methods=['POST'])
@token_required
def create_category(current_user):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Category name is required'}), 400
    cat = Category(user_id=current_user.id, name=data['name'], description=data.get('description', ''))
    db.session.add(cat)
    db.session.commit()
    return jsonify({'message': 'Category created', 'id': cat.id}), 201

@product_bp.route('/', methods=['GET'])
@token_required
def get_products(current_user):
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    pagination = Product.query.filter_by(user_id=current_user.id).paginate(page=page, per_page=limit, error_out=False)
    products = pagination.items
    
    from models.stock_model import StockLedger
    from sqlalchemy import func
    
    # Build stock map for this user
    stock_map = {}
    stock_data = db.session.query(
        StockLedger.product_id,
        func.sum(StockLedger.quantity_change).label('total')
    ).filter_by(user_id=current_user.id).group_by(StockLedger.product_id).all()
    for pid, total in stock_data:
        stock_map[pid] = total or 0

    return jsonify({
        'products': [{
            'id': p.id,
            'name': p.name,
            'sku': p.sku,
            'category_id': p.category_id,
            'category_name': p.category.name if p.category else '',
            'unit': p.unit,
            'reorder_level': p.reorder_level,
            'stock': stock_map.get(p.id, 0),
            'created_at': p.created_at.isoformat()
        } for p in products],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })

@product_bp.route('/', methods=['POST'])
@token_required
def create_product(current_user):
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('sku'):
        return jsonify({'message': 'Product name and SKU are required'}), 400
        
    if Product.query.filter_by(sku=data['sku'], user_id=current_user.id).first():
        return jsonify({'message': 'SKU already exists in your inventory'}), 400
        
    # Handle dynamic category creation
    category_id = data.get('category_id')
    cat_name = data.get('category_name')
    if cat_name:
        existing_cat = Category.query.filter_by(user_id=current_user.id, name=cat_name).first()
        if existing_cat:
            category_id = existing_cat.id
        else:
            new_cat = Category(user_id=current_user.id, name=cat_name)
            db.session.add(new_cat)
            db.session.flush()
            category_id = new_cat.id

    new_product = Product(
        user_id=current_user.id,
        name=data['name'],
        sku=data['sku'],
        category_id=category_id,
        unit=data.get('unit', 'pcs'),
        reorder_level=data.get('reorder_level', 0)
    )
    
    db.session.add(new_product)
    db.session.flush()  # Get new_product.id before commit

    # Create initial stock ledger entry if provided
    initial_stock = data.get('initial_stock', 0)
    initial_location_id = data.get('initial_location_id')
    if initial_stock and initial_stock > 0 and initial_location_id:
        from models.stock_model import StockLedger
        ledger_entry = StockLedger(
            user_id=current_user.id,
            product_id=new_product.id,
            location_id=initial_location_id,
            quantity_change=initial_stock,
            operation_type='opening_stock',
            reference_id=new_product.id
        )
        db.session.add(ledger_entry)
    
    db.session.commit()
    return jsonify({'message': 'Product created successfully', 'product_id': new_product.id}), 201

@product_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_product(current_user, id):
    product = Product.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    
    if 'name' in data: product.name = data['name']
    if 'sku' in data: product.sku = data['sku']
    
    # Handle dynamic category update
    if 'category_name' in data:
        cat_name = data['category_name']
        if cat_name:
            existing_cat = Category.query.filter_by(user_id=current_user.id, name=cat_name).first()
            if existing_cat:
                product.category_id = existing_cat.id
            else:
                new_cat = Category(user_id=current_user.id, name=cat_name)
                db.session.add(new_cat)
                db.session.flush()
                product.category_id = new_cat.id
        else:
            product.category_id = None
    elif 'category_id' in data:
        product.category_id = data['category_id']

    if 'unit' in data: product.unit = data['unit']
    if 'reorder_level' in data: product.reorder_level = data['reorder_level']
    
    db.session.commit()
    return jsonify({'message': 'Product updated successfully'})

@product_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_product(current_user, id):
    product = Product.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully'})
