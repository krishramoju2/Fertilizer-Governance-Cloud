from flask import Blueprint, request, jsonify
import datetime
import jwt
import uuid
import bcrypt
import os
from models.db import users_collection

auth_bp = Blueprint('auth', __name__)

# ==================== DIRECT SECRET KEY FROM ENV ====================
SECRET_KEY = os.environ.get('SECRET_KEY', 'btech_project_2026_secret_key_123')
print(f"🔑 SECRET_KEY loaded (length: {len(SECRET_KEY)})")

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()

def check_password(plain, hashed):
    if not hashed:
        return False
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


# ==================== REGISTER ====================
@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        print("📝 Register request:", data.get('email'))
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
        existing = users_collection.find_one({'email': email})
        if existing:
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        user_id = str(uuid.uuid4())
        hashed = hash_password(password)
        
        user = {
            '_id': user_id,
            'email': email,
            'password': hashed,
            'name': data.get('name', email.split('@')[0]),
            'farm_details': {
                'soil_type': data.get('soil_type', 'Loamy'),
                'farm_size': float(data.get('farm_size', 1)),
                'location': data.get('location', ''),
                'primary_crops': data.get('primary_crops', []),
                'temperature': 26,
                'humidity': 45
            },
            'is_admin': False,
            'created_at': datetime.datetime.utcnow()
        }
        
        users_collection.insert_one(user)
        
        # Use SECRET_KEY directly (not calling a function)
        token = jwt.encode({
            'user_id': user_id,
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                '_id': user_id,
                'email': email,
                'name': user['name'],
                'farm_details': user['farm_details'],
                'is_admin': False
            }
        })
        
    except Exception as e:
        print(f"❌ Register error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== LOGIN ====================
@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        print("🔐 Login request:", data.get('email'))
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        # Admin bypass
        if email == 'admin@farm.com' and password == 'admin123':
            token = jwt.encode({
                'user_id': 'bypass-user',
                'email': email,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, SECRET_KEY, algorithm='HS256')
            
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    '_id': 'bypass-user',
                    'email': email,
                    'name': 'Admin',
                    'is_admin': True,
                    'farm_details': {'soil_type': 'Loamy', 'temperature': 26, 'humidity': 45}
                }
            })
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        if not check_password(password, user['password']):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        user_id = str(user['_id'])
        
        token = jwt.encode({
            'user_id': user_id,
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                '_id': user_id,
                'email': user['email'],
                'name': user.get('name', 'Farmer'),
                'farm_details': user.get('farm_details', {}),
                'is_admin': user.get('is_admin', False)
            }
        })
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/google-login', methods=['POST', 'OPTIONS'])
def google_login():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        credential = data.get('credential')
        
        if not credential:
            return jsonify({'success': False, 'message': 'Credential missing'}), 400
        
        import requests
        url = "https://oauth2.googleapis.com/tokeninfo"
        params = {"id_token": credential}
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({'success': False, 'message': 'Invalid Google token'}), 401
        
        token_info = response.json()
        email = token_info.get('email')
        name = token_info.get('name', 'Google User')
        
        if not email:
            return jsonify({'success': False, 'message': 'Email not provided'}), 400
        
        print(f"🔍 Google login for email: {email}")
        
        # Check if user exists
        user = users_collection.find_one({'email': email})
        print(f"🔍 User exists: {user is not None}")
        
        if not user:
            # Create new user
            user_id = str(uuid.uuid4())
            print(f"📝 Creating new Google user with ID: {user_id}")
            new_user = {
                '_id': user_id,
                'email': email,
                'name': name,
                'password': '',
                'auth_provider': 'google',
                'farm_details': {
                    'soil_type': 'Loamy',
                    'farm_size': 1,
                    'location': '',
                    'primary_crops': [],
                    'temperature': 26,
                    'humidity': 45
                },
                'is_admin': False,
                'created_at': datetime.datetime.utcnow()
            }
            users_collection.insert_one(new_user)
            print(f"✅ Created new Google user: {email}")
        else:
            user_id = str(user['_id'])
            print(f"✅ Found existing Google user: {email} with ID: {user_id}")
        
        # Generate token
        print(f"🔑 Creating token for user_id: {user_id}")
        token = jwt.encode({
            'user_id': user_id,
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        print(f"✅ Google login successful for {email}")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                '_id': user_id,
                'email': email,
                'name': name,
                'is_admin': False,
                'farm_details': {'soil_type': 'Loamy', 'temperature': 26, 'humidity': 45}
            }
        })
        
    except Exception as e:
        print(f"❌ Google login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== GET CURRENT USER ====================
@auth_bp.route('/me', methods=['GET', 'OPTIONS'])
def get_me():
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Token missing'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = data.get('user_id')
        
        if user_id == 'bypass-user':
            return jsonify({
                'success': True,
                'user': {
                    '_id': 'bypass-user',
                    'email': 'admin@farm.com',
                    'name': 'Admin',
                    'is_admin': True,
                    'farm_details': {'soil_type': 'Loamy'}
                }
            })
        
        user = users_collection.find_one({'_id': user_id})
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 401
        
        return jsonify({
            'success': True,
            'user': {
                '_id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', ''),
                'is_admin': user.get('is_admin', False),
                'farm_details': user.get('farm_details', {})
            }
        })
    except Exception as e:
        print(f"❌ /me error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 401
