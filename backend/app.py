







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
