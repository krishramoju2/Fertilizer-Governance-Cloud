# ==================== IMPORTS ====================
from functools import wraps
from flask import request, jsonify
import jwt
import hashlib
import os








from bson import ObjectId

# DB imports
from models.db import users_collection, check_db_connection

# ==================== CONFIG ====================
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'btech_project_2026_secret_key_change_this'
)


# ==================== AUTH MIDDLEWARE ====================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
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
        
            # ✅ FIX HERE
            user_id = data.get("user_id") or data.get("id")
        
            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "Invalid token: user_id missing"
                }), 401
        
            # ✅ Fetch user
            current_user = users_collection.find_one({
                "_id": ObjectId(user_id)
            })
        
            if not current_user:
                return jsonify({
                    "success": False,
                    "message": "User not found"
                }), 401
        
        # ❌ Token expired
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token expired"}), 401
        
        # ❌ Invalid token
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Invalid token"}), 401

        kwargs['current_user'] = current_user
        return f(*args, **kwargs)

    return decorated


# ==================== ADMIN REQUIRED ====================
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        # ✅ Check DB connection
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
            # ✅ FIXED: using SECRET_KEY instead of app.config
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

            user_id = data.get("user_id") or data.get("id")

            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "Invalid token"
                }), 401
                
            current_user = users_collection.find_one({
                '_id': ObjectId(user_id)
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

        # ✅ Admin check
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
    """Hash password using SHA-256"""
    salt = "farmadvisor_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


def check_password(plain_password, hashed_password):
    return hash_password(plain_password) == str(hashed_password)
