from flask import Blueprint, jsonify, request

from models.user_model import User
from database import db
import bcrypt
from utils.auth import generate_token

import re

auth_bp = Blueprint('auth', __name__, url_prefix='/auth', strict_slashes=False)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data or not data.get('login_id') or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Missing required fields'}), 400
        
    login_id = data['login_id']
    if len(login_id) < 6 or len(login_id) > 12:
        return jsonify({'message': 'Login ID must be between 6 and 12 characters'}), 400
        
    pwd = data['password']
    if len(pwd) < 8 or not re.search(r'[a-z]', pwd) or not re.search(r'[A-Z]', pwd) or not re.search(r'[0-9]', pwd) or not re.search(r'[^a-zA-Z0-9]', pwd):
        return jsonify({'message': 'Password must be >= 8 characters and include a lowercase, uppercase, number, and special character'}), 400
        
    if User.query.filter_by(login_id=login_id).first():
        return jsonify({'message': 'Login ID already exists'}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
        
    hashed_pw = bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt())
    
    new_user = User(
        login_id=login_id,
        name=data['name'],
        email=data['email'],
        password_hash=hashed_pw.decode('utf-8'),
        role=data.get('role', 'inventory_manager')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'Account created successfully. Please login.', 'user_id': new_user.id}), 201

@auth_bp.route('/request-reset', methods=['POST'])
def request_reset():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    
    if not user:
        # For security, don't reveal if user exists. 
        # But for this internal app, we can be more transparent if helpful.
        return jsonify({'message': 'If an account exists with this email, an OTP has been sent.'}), 200
        
    import random
    import datetime
    otp = str(random.randint(100000, 999999))
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    db.session.commit()
    
    # SIMULATION: Log OTP to console instead of sending email
    print(f"\n[SECURITY] Password Reset OTP for {email}: {otp}\n")
    
    return jsonify({'message': 'OTP sent to your email.'}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')
    
    if not email or not otp or not new_password:
        return jsonify({'message': 'Missing email, OTP, or password'}), 400
        
    user = User.query.filter_by(email=email).first()
    import datetime
    if not user or user.reset_otp != otp or (user.reset_otp_expiry and user.reset_otp_expiry < datetime.datetime.utcnow()):
        return jsonify({'message': 'Invalid or expired OTP'}), 400
        
    # Strong password validation for reset as well
    if len(new_password) < 8 or not re.search(r'[a-z]', new_password) or not re.search(r'[A-Z]', new_password) or not re.search(r'[0-9]', new_password) or not re.search(r'[^a-zA-Z0-9]', new_password):
        return jsonify({'message': 'Password must be >= 8 characters and include a lowercase, uppercase, number, and special character'}), 400

    hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    user.password_hash = hashed_pw.decode('utf-8')
    user.reset_otp = None
    user.reset_otp_expiry = None
    db.session.commit()
    
    return jsonify({'message': 'Password reset successful. You can now login.'}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('login_id') or not data.get('password'):
        return jsonify({'message': 'Invalid Login Id or Password'}), 400
        
    user = User.query.filter_by(login_id=data.get('login_id')).first()
    
    if not user:
        return jsonify({'message': 'Invalid Login Id or Password'}), 404
        
    if bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        token = generate_token(user.id)
        return jsonify({
            'token': token,
            'user': {'id': user.id, 'login_id': user.login_id, 'name': user.name, 'email': user.email, 'role': user.role}
        })
        
    return jsonify({'message': 'Invalid Login Id or Password'}), 401
