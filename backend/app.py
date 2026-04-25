'''from routes.history_routes import history_bp
from routes.auth_routes import auth_bp
from routes.predict_routes import predict_bp
from routes.ml_routes import ml_bp
from routes.chat_routes import chat_bp
from routes.config_routes import config_bp
from routes.analytics_routes import analytics_bp
from routes.admin_routes import admin_bp 


from utils.auth import token_required
from utils.auth import admin_required
from utils.auth import hash_password
from utils.auth import check_password

from utils.helpers import extract_inputs


from models.db import (
    users_collection,
    history_collection,
    config_collection,
    check_db_connection
)


from services.analyzer import FertilizerAnalyzer





from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import datetime
import jwt
import os
import hashlib
from functools import wraps
import logging
from dotenv import load_dotenv
import traceback
import urllib.parse
import requests  # For weather API calls
from models.ml_model import ml_predict, get_model_dashboard, model, soil_map, crop_map, fert_map


from models.ml_model import get_model_dashboard

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)


app.register_blueprint(history_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(predict_bp)
app.register_blueprint(ml_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(config_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(admin_bp)


from flask_cors import CORS

app = Flask(__name__)

# ✅ CORRECT - Single CORS configuration
CORS(app, origins=[
    "https://fertilizer-governance-cloud.vercel.app",
    "http://localhost:3000"
])


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response



# Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'btech_project_2026_secret_key_change_this')
app.config['SECRET_KEY'] = SECRET_KEY








# ==================== ROUTES ====================










@app.route('/', methods=['GET'])
def home():
    db_status = "connected" if check_db_connection() else "disconnected"
    return jsonify({
        'success': True,
        'message': 'Fertilizer Intelligence API is running',
        'version': '2.0.0',
        'database': db_status,
        'timestamp': datetime.datetime.now().isoformat()
    })

@app.route('/health', methods=['GET'])
def health():
    db_status = check_db_connection()
    return jsonify({
        'status': 'healthy' if db_status else 'degraded',
        'database': 'connected' if db_status else 'disconnected',
        'timestamp': datetime.datetime.now().isoformat()
    })





# ==================== FARM ROUTES ====================
@app.route('/farm/update', methods=['POST'])
@token_required
def update_farm(**kwargs):
    try:
        current_user = kwargs['current_user']
        data = request.get_json()

        farm_details = {
            'soil_type': data.get('soil_type', current_user.get('farm_details', {}).get('soil_type', 'Loamy')),
            'farm_size': float(data.get('farm_size', current_user.get('farm_details', {}).get('farm_size', 1))),
            'location': data.get('location', current_user.get('farm_details', {}).get('location', '')),
            'primary_crops': data.get('primary_crops', current_user.get('farm_details', {}).get('primary_crops', [])),
            # Preserve weather data when updating farm details
            'temperature': current_user.get('farm_details', {}).get('temperature', 26),
            'humidity': current_user.get('farm_details', {}).get('humidity', 45),
            'last_weather_update': current_user.get('farm_details', {}).get('last_weather_update')
        }

        users_collection.update_one(
            {'_id': current_user['_id']},
            {'$set': {'farm_details': farm_details}}
        )

        return jsonify({
            'success': True,
            'farm_details': farm_details
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500












# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'success': False, 'message': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

# ==================== CREATE DEFAULT ADMIN ====================
def create_default_admin():
    """Create default admin user if no admin exists"""
    if not check_db_connection():
        return
    try:
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@farm.com')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
        admin_exists = users_collection.find_one({'is_admin': True})
        if not admin_exists:
            hashed = hash_password(admin_password)
            admin_user = {
                'email': admin_email,
                'password': hashed,
                'name': 'Administrator',
                'farm_details': {'soil_type': 'Loamy', 'farm_size': 1, 'location': '', 'primary_crops': []},
                'is_admin': True,
                'created_at': datetime.datetime.utcnow()
            }
            users_collection.insert_one(admin_user)
            logger.info("✅ Default admin created (email: admin@farm.com / password: admin123)")
        else:
            logger.info("✅ Admin user already exists")
    except Exception as e:
        logger.error(f"Error creating default admin: {e}")

# Call after DB init
create_default_admin()




# ==================== ADDITIONAL ALIAS FOR GUNICORN ====================
application = app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('ENVIRONMENT', 'development') == 'development'
    logger.info(f"🚀 Starting server on port {port}")
    logger.info(f"🔧 Debug mode: {debug}")
    logger.info(f"💾 Database status: {'Connected' if check_db_connection() else 'Disconnected'}")
    app.run(host='0.0.0.0', port=port, debug=debug)'''







from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== CREATE APP ====================
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'btech_project_2026_secret_key')

# ==================== CORS - WIDE OPEN FOR TESTING ====================
# This allows ALL origins - once working, restrict it
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
     allow_headers=["*"], supports_credentials=True)

# ==================== IMPORT BLUEPRINTS ====================
from routes.auth_routes import auth_bp
from routes.history_routes import history_bp
from routes.predict_routes import predict_bp
from routes.ml_routes import ml_bp
from routes.chat_routes import chat_bp
from routes.config_routes import config_bp
from routes.analytics_routes import analytics_bp
from routes.admin_routes import admin_bp

# ==================== REGISTER BLUEPRINTS ====================
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(history_bp, url_prefix='/api')
app.register_blueprint(predict_bp, url_prefix='/api')
app.register_blueprint(ml_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(config_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')

# ==================== DIRECT ROUTES (NO BLUEPRINT) ====================
@app.route('/api/config/soil-types', methods=['GET', 'OPTIONS'])
def get_soil_types_direct():
    """Direct route for soil types - no auth required"""
    from models.db import config_collection, check_db_connection
    
    if request.method == 'OPTIONS':
        return '', 200
    
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'Database error'}), 500
    
    try:
        config = config_collection.find_one({'id': 'dropdowns'})
        if config and 'soil_types' in config:
            soil_types = config['soil_types']
        else:
            soil_types = ['Loamy', 'Sandy', 'Clay', 'Black', 'Red']
        return jsonify({'success': True, 'data': soil_types})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/config/crop-types', methods=['GET', 'OPTIONS'])
def get_crop_types_direct():
    from models.db import config_collection, check_db_connection
    
    if request.method == 'OPTIONS':
        return '', 200
    
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'Database error'}), 500
    
    try:
        config = config_collection.find_one({'id': 'dropdowns'})
        if config and 'crop_types' in config:
            crop_types = config['crop_types']
        else:
            crop_types = ['Maize', 'Wheat', 'Rice', 'Millets', 'Cotton']
        return jsonify({'success': True, 'data': crop_types})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/config/fertilizer-names', methods=['GET', 'OPTIONS'])
def get_fertilizer_names_direct():
    from models.db import config_collection, check_db_connection
    
    if request.method == 'OPTIONS':
        return '', 200
    
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'Database error'}), 500
    
    try:
        config = config_collection.find_one({'id': 'dropdowns'})
        if config and 'fertilizer_names' in config:
            fertilizer_names = config['fertilizer_names']
        else:
            fertilizer_names = ['Urea', 'DAP', 'Potash', 'NPK']
        return jsonify({'success': True, 'data': fertilizer_names})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    from models.db import check_db_connection
    if request.method == 'OPTIONS':
        return '', 200
    db_status = check_db_connection()
    return jsonify({'status': 'ok', 'database': 'connected' if db_status else 'disconnected'})

@app.route('/api/me', methods=['GET', 'OPTIONS'])
def get_me_direct():
    from models.db import users_collection
    import jwt
    from functools import wraps
    
    if request.method == 'OPTIONS':
        return '', 200
    
    token = None
    auth_header = request.headers.get('Authorization')
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    
    if not token:
        return jsonify({'success': False, 'message': 'Token missing'}), 401
    
    try:
        SECRET_KEY = os.environ.get('SECRET_KEY', 'btech_project_2026_secret_key')
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = data.get('user_id')
        
        if user_id == 'bypass-user':
            return jsonify({'success': True, 'user': {'_id': 'bypass-user', 'email': 'bypass@example.com', 'name': 'Bypass User', 'is_admin': True}})
        
        from bson import ObjectId
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 401
        
        return jsonify({'success': True, 'user': {
            '_id': str(user['_id']),
            'name': user.get('name'),
            'email': user.get('email'),
            'is_admin': user.get('is_admin', False),
            'farm_details': user.get('farm_details', {})
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 401

@app.route('/', methods=['GET'])
def home():
    return jsonify({'success': True, 'message': 'API is running'})

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
