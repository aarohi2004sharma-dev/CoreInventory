from flask import Blueprint, jsonify, request
from models.stock_model import Warehouse, Location
from database import db
from utils.auth import token_required

warehouse_bp = Blueprint('warehouse', __name__, url_prefix='/warehouses', strict_slashes=False)

@warehouse_bp.route('/', methods=['GET'])
@token_required
def get_warehouses(current_user):
    warehouses = Warehouse.query.filter_by(user_id=current_user.id).all()
    result = []
    for w in warehouses:
        result.append({
            'id': w.id,
            'name': w.name,
            'short_code': w.short_code,
            'address': w.address
        })
    return jsonify(result)

@warehouse_bp.route('/', methods=['POST'])
@token_required
def create_warehouse(current_user):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Name is required'}), 400
        
    new_warehouse = Warehouse(
        user_id=current_user.id,
        name=data['name'],
        short_code=data.get('short_code', ''),
        address=data.get('address', '')
    )
    db.session.add(new_warehouse)
    db.session.commit()
    
    return jsonify({'message': 'Warehouse created successfully', 'id': new_warehouse.id}), 201

@warehouse_bp.route('/<int:warehouse_id>/locations', methods=['GET'])
@token_required
def get_locations(current_user, warehouse_id):
    # Ensure warehouse belongs to user
    warehouse = Warehouse.query.filter_by(id=warehouse_id, user_id=current_user.id).first_or_404()
    locations = Location.query.filter_by(warehouse_id=warehouse_id, user_id=current_user.id).all()
    result = []
    for loc in locations:
        result.append({
            'id': loc.id,
            'name': loc.name,
            'short_code': loc.short_code,
            'warehouse_id': loc.warehouse_id
        })
    return jsonify(result)

@warehouse_bp.route('/<int:warehouse_id>/locations', methods=['POST'])
@token_required
def create_location(current_user, warehouse_id):
    data = request.get_json()
    warehouse = Warehouse.query.filter_by(id=warehouse_id, user_id=current_user.id).first_or_404()
        
    if not data or not data.get('name'):
        return jsonify({'message': 'Location name is required'}), 400
        
    new_location = Location(
        user_id=current_user.id,
        warehouse_id=warehouse_id,
        name=data['name'],
        short_code=data.get('short_code', '')
    )
    db.session.add(new_location)
    db.session.commit()
    
    return jsonify({'message': 'Location created successfully', 'id': new_location.id}), 201

@warehouse_bp.route('/locations', methods=['GET'])
@token_required
def get_all_locations(current_user):
    """Helper route to get all locations flatly"""
    locations = Location.query.filter_by(user_id=current_user.id).all()
    result = []
    for loc in locations:
        result.append({
            'id': loc.id,
            'name': loc.name,
            'short_code': loc.short_code,
            'warehouse_id': loc.warehouse_id,
            'warehouse_name': loc.warehouse.name if loc.warehouse else ''
        })
    return jsonify(result)
