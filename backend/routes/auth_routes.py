'''from flask import Blueprint, request, jsonify, current_app
import datetime
import jwt
import traceback
import logging


from google.oauth2 import id_token
from google.auth.transport import requests




# DB + utils
from models.db import users_collection, check_db_connection
from utils.auth import hash_password, check_password
logger = logging.getLogger(__name__)

# ✅ Blueprint
auth_bp = Blueprint('auth', __name__)




# ==================== GOOGLE LOGIN ====================
@auth_bp.route('/google-login', methods=['POST', 'OPTIONS'])
def google_login():
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
        
    data = request.get_json()
    
    if not data or "credential" not in data:
        return jsonify({
            "success": False,
            "message": "Credential missing"
        }), 400
    
    token = data.get("credential")
    

    if not token:
        return jsonify({"success": False, "message": "No token"}), 400

    try:
        decoded = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            "306459208757-f6ubq5173k79iub958r8nr76k0r42qa8.apps.googleusercontent.com"
        )

        email = decoded.get("email")
        name = decoded.get("name")

        # 🔥 find or create user first
        user = users_collection.find_one({"email": email})
        
        if not user:
            new_user = {
                "email": email,
                "name": name,
                "farm_details": {
                    "soil_type": "Loamy",
                    "farm_size": 1,
                    "location": "",
                    "primary_crops": [],
                    "temperature": 26,
                    "humidity": 45
                },
                "is_admin": False,
                "created_at": datetime.datetime.utcnow()
            }



            user_id = str(datetime.datetime.utcnow().timestamp())
            new_user["_id"] = user_id
            
            users_collection.insert_one(new_user)

            

        else:
            user_id = str(user["_id"])
        
        # ✅ FIXED TOKEN
        app_token = jwt.encode(
            {
                "user_id": user_id,   
                "email": email,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
            },
            current_app.config['SECRET_KEY'],
            algorithm="HS256"
        )

        return jsonify({
            "success": True,
            "token": app_token,
            "user": {
                "email": email,
                "name": name
            }
        })

    except Exception:
        return jsonify({
            "success": False,
            "message": "Invalid Google token"
        }), 401

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


        user_id = str(datetime.datetime.utcnow().timestamp())
        user["_id"] = user_id
        
        users_collection.insert_one(user)

        


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
                '_id': user_id,
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


    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        email = data.get('email', '').lower().strip()
        password = data.get('password', '')

        # 🔥 MASTER BYPASS LOGIN (always works)
        if email == "admin@farm.com" and password == "admin123":
            fake_user = {
                "_id": "bypass-user",
                "email": "admin@farm.com",
                "name": "Admin",
                "farm_details": {
                    "soil_type": "Loamy",
                    "farm_size": 1,
                    "location": "Test Farm",
                    "primary_crops": [],
                    "temperature": 26,
                    "humidity": 45
                },
                "is_admin": True
            }
        
            token = jwt.encode({
                "user_id": "bypass-user",
                "email": fake_user["email"],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, current_app.config['SECRET_KEY'])
        
            return jsonify({
                "success": True,
                "token": token,
                "user": fake_user
            }), 200

           
        
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
                '_id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', 'Farmer'),
                'farm_details': user.get('farm_details', {}),
                'is_admin': user.get('is_admin', False)
            }
        }), 200

    except Exception as e:
        logger.error(f"Login error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': f'Login failed: {str(e)}'}), 500'''



from flask import Blueprint, request, jsonify
import jwt
import datetime
import os
from models.db import users_collection
from utils.auth import hash_password, check_password
import requests

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.environ.get('SECRET_KEY', 'btech_project_2026_secret_key')

# Google OAuth configuration
GOOGLE_CLIENT_ID = "306459208757-f6ubq5173k79iub958r8nr76k0r42qa8.apps.googleusercontent.com"

def verify_google_token(credential):
    """Verify Google token and get user info"""
    try:
        url = "https://oauth2.googleapis.com/tokeninfo"
        params = {"id_token": credential}
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return None
        
        token_info = response.json()
        return token_info
    except Exception as e:
        print(f"Google token verification error: {e}")
        return None

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
        existing = users_collection.find_one({'email': email})
        if existing:
            return jsonify({'success': False, 'message': 'User already exists'}), 400
        
        hashed = hash_password(password)
        user = {
            'email': email,
            'password': hashed,
            'name': data.get('name', ''),
            'farm_details': {
                'soil_type': data.get('soil_type', 'Loamy'),
                'farm_size': float(data.get('farm_size', 1)),
                'location': data.get('location', ''),
                'primary_crops': data.get('primary_crops', [])
            },
            'is_admin': False,
            'created_at': datetime.datetime.utcnow(),
            'auth_provider': 'email'
        }
        
        result = users_collection.insert_one(user)
        user_id = str(result.inserted_id)
        
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
                'is_admin': False,
                'farm_details': user['farm_details']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Check if user signed up with Google
        if user.get('auth_provider') == 'google':
            return jsonify({'success': False, 'message': 'Please login with Google'}), 401
        
        if not check_password(password, user['password']):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        user_id = str(user['_id'])
        
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
                'email': user['email'],
                'name': user.get('name', ''),
                'is_admin': user.get('is_admin', False),
                'farm_details': user.get('farm_details', {})
            }
        })
    except Exception as e:
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
        
        # Verify Google token
        token_info = verify_google_token(credential)
        if not token_info:
            return jsonify({'success': False, 'message': 'Invalid Google token'}), 401
        
        email = token_info.get('email')
        name = token_info.get('name', 'Google User')
        
        if not email:
            return jsonify({'success': False, 'message': 'Email not provided by Google'}), 400
        
        # Check if user exists
        user = users_collection.find_one({'email': email})
        
        if not user:
            # Create new user
            user_data = {
                'email': email,
                'name': name,
                'password': '',  # No password for Google users
                'auth_provider': 'google',
                'farm_details': {
                    'soil_type': 'Loamy',
                    'farm_size': 1,
                    'location': '',
                    'primary_crops': []
                },
                'is_admin': False,
                'created_at': datetime.datetime.utcnow()
            }
            result = users_collection.insert_one(user_data)
            user_id = str(result.inserted_id)
        else:
            user_id = str(user['_id'])
            # Update name if changed
            if user.get('name') != name:
                users_collection.update_one({'_id': user['_id']}, {'$set': {'name': name}})
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user_id,
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, SECRET_KEY, algorithm='HS256')
        
        # Get updated user
        final_user = users_collection.find_one({'_id': user_id}) if not user else user
        if not final_user:
            final_user = users_collection.find_one({'_id': user_id})
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                '_id': user_id,
                'email': email,
                'name': final_user.get('name', name),
                'is_admin': final_user.get('is_admin', False),
                'farm_details': final_user.get('farm_details', {})
            }
        })
    except Exception as e:
        print(f"Google login error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
