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
hash_password
check_password
