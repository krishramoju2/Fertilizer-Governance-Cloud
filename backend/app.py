from routes.history_routes import history_bp
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


# CORS configuration
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'btech_project_2026_secret_key_change_this')
app.config['SECRET_KEY'] = SECRET_KEY






# ==================== FIXED WEATHER API HELPER FUNCTION ====================
def fetch_weather_for_location(location):
    """Fetch current temperature and humidity for a given location using Open-Meteo API"""
    if not location or not location.strip():
        logger.warning("No location provided")
        return None, None
    
    try:
        # Step 1: Geocoding - convert location name to coordinates
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1"
        logger.info(f"Fetching coordinates for: {location}")
        
        geo_response = requests.get(geo_url, timeout=10).json()
        
        if not geo_response.get('results'):
            logger.warning(f"No coordinates found for location: {location}")
            return None, None
        
        lat = geo_response['results'][0]['latitude']
        lon = geo_response['results'][0]['longitude']
        logger.info(f"Coordinates for {location}: {lat}, {lon}")
        
        # USE THE EXACT WORKING FORMAT FROM YOUR TEST
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m"
        logger.info(f"Fetching weather data...")
        
        weather_response = requests.get(weather_url, timeout=10).json()
        
        # Check if we have current data (matches your JSON structure)
        if 'current' in weather_response:
            current = weather_response['current']
            temperature = current.get('temperature_2m')
            humidity = current.get('relative_humidity_2m')
            
            if temperature is not None:
                logger.info(f"✅ SUCCESS - Weather for {location}: {temperature}°C, {humidity}%")
                return float(temperature), float(humidity) if humidity else 65
        
        logger.warning(f"❌ No weather data found for {location}")
        logger.debug(f"Response received: {weather_response}")
        return None, None
        
    except requests.exceptions.Timeout:
        logger.error(f"Weather API timeout for {location}")
        return None, None
    except requests.exceptions.RequestException as e:
        logger.error(f"Weather API request error for {location}: {e}")
        return None, None
    except Exception as e:
        logger.error(f"Unexpected error in weather fetch for {location}: {e}")
        logger.error(traceback.format_exc())
        return None, None



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
    app.run(host='0.0.0.0', port=port, debug=debug)
