# ==================== IMPORTS ====================
'''from functools import wraps
from flask import request, jsonify
import jwt
import os
import bcrypt

# DB imports
from models.db import users_collection, check_db_connection

# ==================== CONFIG ====================
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise Exception("SECRET_KEY not set in environment")

# ==================== AUTH MIDDLEWARE ====================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        if request.method == "OPTIONS":
            return jsonify({"success": True}), 200

        token = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split(" ")
            if len(parts) == 2:
                token = parts[1]

        if not token:
            return jsonify({"success": False, "message": "Token missing"}), 401

        try:
            # ✅ Decode token
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

            user_id = data.get("user_id") or data.get("id")

            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "Invalid token: user_id missing"
                }), 401

            # 🔥 HANDLE BYPASS USER
            if user_id == "bypass-user":
                current_user = {
                    "_id": "bypass-user",
                    "email": data.get("email"),
                    "farm_details": {
                        "soil_type": "Loamy",
                        "temperature": 26,
                        "humidity": 45
                    },
                    "is_admin": True
                }
            else:
                current_user = users_collection.find_one({
                    "_id": user_id
                })
            
            # ✅ NO BSON → direct string match
            current_user = users_collection.find_one({
                "_id": user_id
            })

            if not current_user:
                return jsonify({
                    "success": False,
                    "message": "User not found"
                }), 401

        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token expired"}), 401

        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Invalid token"}), 401

        kwargs['current_user'] = current_user
        return f(*args, **kwargs)

    return decorated


# ==================== ADMIN REQUIRED ====================
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        if not check_db_connection():
            return jsonify({
                'success': False,
                'message': 'Database connection error'
            }), 503

        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({
                'success': False,
                'message': 'Token missing'
            }), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

            user_id = data.get("user_id") or data.get("id")

            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "Invalid token"
                }), 401

            if user_id == "bypass-user":
                current_user = {
                    "_id": "bypass-user",
                    "email": data.get("email"),
                    "is_admin": True
                }
            else:
                current_user = users_collection.find_one({
                    '_id': user_id
                })

            if not current_user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 401

        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'message': 'Token expired'
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'message': 'Invalid token'
            }), 401

        if not current_user.get('is_admin', False):
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403

        kwargs['current_user'] = current_user
        return f(*args, **kwargs)

    return decorated


# ==================== PASSWORD UTILITIES ====================
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()


def check_password(plain_password, hashed_password):
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )'''


# ==================== IMPORTS ====================
from functools import wraps
from flask import request, jsonify
import jwt
import os
import bcrypt

# DB imports
from models.db import users_collection, check_db_connection

# ==================== CONFIG ====================
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    # Fallback for development
    SECRET_KEY = 'btech_project_2026_secret_key'
    print("⚠️ Warning: SECRET_KEY not set in environment, using default")

# ==================== AUTH MIDDLEWARE ====================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        if request.method == "OPTIONS":
            return jsonify({"success": True}), 200

        token = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split(" ")
            if len(parts) == 2:
                token = parts[1]

        if not token:
            return jsonify({"success": False, "message": "Token missing"}), 401

        try:
            # Decode token
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

            user_id = data.get("user_id") or data.get("id")

            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "Invalid token: user_id missing"
                }), 401

            # Handle BYPASS USER (for testing without database)
            if user_id == "bypass-user":
                current_user = {
                    "_id": "bypass-user",
                    "email": data.get("email", "admin@farm.com"),
                    "farm_details": {
                        "soil_type": "Loamy",
                        "temperature": 26,
                        "humidity": 45
                    },
                    "is_admin": True
                }
            else:
                # Normal user — get from database
                current_user = users_collection.find_one({"_id": user_id})
                
                if not current_user:
                    return jsonify({
                        "success": False,
                        "message": "User not found"
                    }), 401
                
                # Convert ObjectId to string for JSON serialization
                if '_id' in current_user:
                    current_user['_id'] = str(current_user['_id'])

        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Invalid token"}), 401
        except Exception as e:
            print(f"Auth error: {e}")
            return jsonify({"success": False, "message": str(e)}), 401

        kwargs['current_user'] = current_user
        return f(*args, **kwargs)

    return decorated


# ==================== ADMIN REQUIRED ====================
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        if not check_db_connection():
            return jsonify({
                'success': False,
                'message': 'Database connection error'
            }), 503

        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({
                'success': False,
                'message': 'Token missing'
            }), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

            user_id = data.get("user_id") or data.get("id")

            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "Invalid token"
                }), 401

            # Handle BYPASS USER
            if user_id == "bypass-user":
                current_user = {
                    "_id": "bypass-user",
                    "email": data.get("email", "admin@farm.com"),
                    "is_admin": True
                }
            else:
                current_user = users_collection.find_one({'_id': user_id})

                if not current_user:
                    return jsonify({
                        'success': False,
                        'message': 'User not found'
                    }), 401
                
                # Convert ObjectId to string
                if '_id' in current_user:
                    current_user['_id'] = str(current_user['_id'])

        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'message': 'Token expired'
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'message': 'Invalid token'
            }), 401
        except Exception as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 401

        if not current_user.get('is_admin', False):
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403

        kwargs['current_user'] = current_user
        return f(*args, **kwargs)

    return decorated


# ==================== PASSWORD UTILITIES ====================
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()


def check_password(plain_password, hashed_password):
    if not hashed_password:
        return False
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )
