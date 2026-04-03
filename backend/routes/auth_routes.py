from flask import Blueprint, request, jsonify, current_app
import datetime
import jwt
import traceback
import logging

# DB + utils
from models.db import users_collection, check_db_connection
from utils.auth import hash_password, check_password
logger = logging.getLogger(__name__)

# ✅ Blueprint
auth_bp = Blueprint('auth', __name__)


# ==================== REGISTER ====================
@auth_bp.route('/register', methods=['POST'])
def register():
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'Database connection error. Please try again later.'}), 503

    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        email = data.get('email', '').lower().strip()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400

        if users_collection.find_one({'email': email}):
            return jsonify({'success': False, 'message': 'Email already registered'}), 400

        hashed_password = hash_password(password)

        location = data.get('location', '').strip()
        
        temperature = data.get('temperature')
        humidity = data.get('humidity')

        user = {
            'email': email,
            'password': hashed_password,
            'name': data.get('name', email.split('@')[0]),
            'farm_details': {
                'soil_type': data.get('soil_type', 'Loamy'),
                'farm_size': float(data.get('farm_size', 1)),
                'location': location,
                'primary_crops': data.get('primary_crops', []),
                'temperature': temperature if temperature is not None else 26,
                'humidity': humidity if humidity is not None else 45,
                'last_weather_update': datetime.datetime.utcnow().isoformat() if temperature else None
            },
            'is_admin': False,
            'created_at': datetime.datetime.utcnow()
        }

        result = users_collection.insert_one(user)
        user_id = str(result.inserted_id)

        # ✅ FIX: use current_app instead of app
        token = jwt.encode({
            'user_id': user_id,
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, current_app.config['SECRET_KEY'])

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'email': user['email'],
                'name': user['name'],
                'farm_details': user['farm_details'],
                'is_admin': False
            }
        }), 201

    except Exception as e:
        logger.error(f"Registration error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500


# ==================== LOGIN ====================
@auth_bp.route('/login', methods=['POST'])
def login():
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'Database connection error. Please try again later.'}), 503

    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        email = data.get('email', '').lower().strip()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400

        user = users_collection.find_one({'email': email})

        if not user or not check_password(password, user['password']):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        token = jwt.encode({
            'user_id': str(user['_id']),
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, current_app.config['SECRET_KEY'])

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', 'Farmer'),
                'farm_details': user.get('farm_details', {}),
                'is_admin': user.get('is_admin', False)
            }
        }), 200

    except Exception as e:
        logger.error(f"Login error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': f'Login failed: {str(e)}'}), 500
