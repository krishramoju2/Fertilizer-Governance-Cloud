token_required

# ==================== AUTH MIDDLEWARE ====================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        # ✅ allow preflight
        if request.method == "OPTIONS":
            return jsonify({"success": True}), 200

        token = None

        if "Authorization" in request.headers:
            token = request.headers["Authorization"].split(" ")[1]

        if not token:
            return jsonify({"message": "Token missing"}), 401

        try:
            current_user = {
                "_id": "test_user",
                "farm_details": {
                    "temperature": 26,
                    "humidity": 45,
                    "soil_type": "Loamy"
                }
            }
        except:
            return jsonify({"message": "Invalid token"}), 401

        kwargs['current_user'] = {
            "_id": "test_user",
            "farm_details": {
                "temperature": 26,
                "humidity": 45,
                "soil_type": "Loamy"
            }
        }
        
        return f(*args, **kwargs)

    return decorated

admin_required

# ==================== FIXED ADMIN_REQUIRED DECORATOR ====================
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Check DB connection first
        if not check_db_connection():
            return jsonify({'success': False, 'message': 'Database connection error. Please try again later.'}), 503

        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'success': False, 'message': 'Token missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'success': False, 'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401

        # Admin check
        if not current_user.get('is_admin', False):
            return jsonify({'success': False, 'message': 'Admin access required'}), 403

        kwargs['current_user'] = current_user
        return f(*args, **kwargs)
    return decorated


hash_password



# ==================== PASSWORD UTILITIES ====================
def hash_password(password):
    """Simple password hashing using SHA-256"""
    salt = "farmadvisor_salt_2026"
    hash_object = hashlib.sha256((password + salt).encode('utf-8'))
    return hash_object.hexdigest()




check_password
