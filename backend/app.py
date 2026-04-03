from routes.history_routes import history_bp
from routes.auth_routes import auth_bp
from routes.predict_routes import predict_bp
from routes.ml_routes import ml_bp




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



@app.route('/chat', methods=['POST'])
@token_required
def chatbot(**kwargs):
    try:
        data = request.get_json()
        message = data.get("message", "").lower()

        # ✅ Parse input
        input_data = extract_inputs(message)

        # ✅ Use analyzer (more reliable)
        ml_result = FertilizerAnalyzer.analyze(input_data)


        # ---------------- 🧠 FORMAT SUGGESTIONS ----------------
        suggestions = ml_result.get("suggestions", [])
        suggestion_text = "\n".join(suggestions) if suggestions else "✅ No suggestions available"
        
        # ---------------- RESPONSE ----------------
        reply = f"""
        🌱 Compatibility: {ml_result.get('overall_compatibility', 'Unknown')}
        📊 Score: {ml_result.get('overall_score', 0)}
        
        🌡 Temperature: {input_data['Temperature']}°C
        💧 Moisture: {input_data['Moisture']}%
        🌱 Soil: {input_data['Soil_Type']}
        🌾 Crop: {input_data['Crop_Type']}
        🧪 Fertilizer: {input_data['Fertilizer_Name']}
        📦 Quantity: {input_data['Fertilizer_Quantity']} kg/ha
        
        🧠 Smart Advice:
        {suggestion_text}
        """

        return jsonify({
            "success": True,
            "reply": reply.strip()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })










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

# ==================== PUBLIC CONFIG ENDPOINTS ====================
@app.route('/config/soil-types', methods=['GET'])
def get_soil_types():
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'DB error'}), 503
    config = config_collection.find_one({'_id': 'dropdowns'})
    return jsonify({'success': True, 'data': config.get('soil_types', []) if config else []})

@app.route('/config/crop-types', methods=['GET'])
def get_crop_types():
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'DB error'}), 503
    config = config_collection.find_one({'_id': 'dropdowns'})
    return jsonify({'success': True, 'data': config.get('crop_types', []) if config else []})

@app.route('/config/fertilizer-names', methods=['GET'])
def get_fertilizer_names():
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'DB error'}), 503
    config = config_collection.find_one({'_id': 'dropdowns'})
    return jsonify({'success': True, 'data': config.get('fertilizer_names', []) if config else []})



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




# ==================== HISTORY ROUTES ====================
@app.route('/history', methods=['GET'])
@token_required
def get_history(**kwargs):
    try:
        current_user = kwargs['current_user']

        # Get last 20 entries
        history = list(history_collection.find(
            {'user_id': current_user['_id']}
        ).sort('timestamp', -1).limit(20))

        # Format for response
        formatted_history = []
        for item in history:
            formatted_history.append({
                'id': str(item['_id']),
                'input_data': item.get('input_data', {}),
                'result': item.get('result', {}),
                'dashboard': item.get('dashboard', {}),   # 🔥 ADD THIS
                'model': item.get('model', 'unknown'),
                'timestamp': item['timestamp'].isoformat() if item.get('timestamp') else None
            })

        return jsonify({
            'success': True,
            'history': formatted_history
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/history/<record_id>', methods=['DELETE'])
@token_required
def delete_history(record_id,**kwargs):
    try:
        current_user = kwargs['current_user']

        result = history_collection.delete_one({
            '_id': ObjectId(record_id),
            'user_id': current_user['_id']
        })

        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Record not found'}), 404

        return jsonify({'success': True, 'message': 'Record deleted'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== ANALYTICS ROUTE ====================
@app.route('/analytics', methods=['GET'])
@token_required
def get_analytics(**kwargs):
    try:
        current_user = kwargs['current_user']

        # Get all user history
        history = list(history_collection.find({'user_id': current_user['_id']}))

        if not history:
            return jsonify({
                'success': True,
                'analytics': {
                    'total_analyses': 0,
                    'compatibility_rate': 0,
                    'average_score': 0,
                    'crop_distribution': {},
                    'fertilizer_distribution': {},
                    'time_series': {'labels': [], 'scores': []}
                }
            }), 200

        # Calculate statistics
        total = len(history)
        
        compatible_count = sum(
            1 for h in history
            if 'Highly Compatible' in h.get('result', {}).get('overall_compatibility', '')
        )        

        scores = [h.get('result', {}).get('overall_score', 0) for h in history]
        avg_score = sum(scores) / total if total > 0 else 0

        # Crop distribution
        crops = {}
        fertilizers = {}
        
        for h in history:
            input_data = h.get('input_data', {})
            
            crop = input_data.get('Crop_Type') or input_data.get('crop') or "Unknown"
            crops[crop] = crops.get(crop, 0) + 1
        
            fert = input_data.get('Fertilizer_Name') or input_data.get('fertilizer') or "Unknown"
            fertilizers[fert] = fertilizers.get(fert, 0) + 1

        # Time series for last 7 entries
        recent = history[-7:]
        time_labels = []
        time_scores = []
        for h in recent:
            if h.get('timestamp'):
                time_labels.append(h['timestamp'].strftime('%d/%m'))
            else:
                time_labels.append('N/A')
                
            time_scores.append(h.get('result', {}).get('overall_score', 0))

        return jsonify({
            'success': True,
            'analytics': {
                'total_analyses': total,
                'compatibility_rate': round((compatible_count / total) * 100, 1) if total > 0 else 0,
                'average_score': round(avg_score, 1) if total > 0 else 0,
                'crop_distribution': crops,
                'fertilizer_distribution': fertilizers,
                'time_series': {
                    'labels': time_labels,
                    'scores': time_scores
                }
            }
        }), 200
    except Exception as e:
        logger.error(f"Analytics error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== ADMIN ROUTES ====================

# --- User management ---
@app.route('/admin/users', methods=['GET'])
@admin_required
def admin_get_users(**kwargs):
    try:
        users = list(users_collection.find({}, {'password': 0}))  # exclude password
        logger.info(f"Admin fetched {len(users)} users.")
        for u in users:
            u['_id'] = str(u['_id'])
        return jsonify({'success': True, 'users': users}), 200
    except Exception as e:
        logger.error(f"Error fetching users: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/analytics/<user_id>', methods=['GET'])
@admin_required
def admin_user_analytics(**kwargs):
    try:
        user_id = kwargs['user_id']
        # Verify user exists
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Get history for that user
        history = list(history_collection.find({'user_id': ObjectId(user_id)}))

        if not history:
            return jsonify({
                'success': True,
                'analytics': {
                    'total_analyses': 0,
                    'compatibility_rate': 0,
                    'average_score': 0,
                    'crop_distribution': {},
                    'fertilizer_distribution': {},
                    'time_series': {'labels': [], 'scores': []}
                }
            }), 200

        total = len(history)
        compatible_count = sum(1 for h in history if 'Highly Compatible' in h['result']['overall_compatibility'])
        avg_score = sum(h['result']['overall_score'] for h in history) / total

        crops = {}
        fertilizers = {}
        for h in history:
            crop = h['input_data']['Crop_Type']
            crops[crop] = crops.get(crop, 0) + 1
            fert = h['input_data']['Fertilizer_Name']
            fertilizers[fert] = fertilizers.get(fert, 0) + 1

        recent = history[-7:]
        time_labels = [h['timestamp'].strftime('%d/%m') if h.get('timestamp') else 'N/A' for h in recent]
        time_scores = [h['result']['overall_score'] for h in recent]

        return jsonify({
            'success': True,
            'analytics': {
                'total_analyses': total,
                'compatibility_rate': round((compatible_count / total) * 100, 1),
                'average_score': round(avg_score, 1),
                'crop_distribution': crops,
                'fertilizer_distribution': fertilizers,
                'time_series': {'labels': time_labels, 'scores': time_scores}
            }
        }), 200
    except Exception as e:
        logger.error(f"Admin analytics error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/history/<user_id>', methods=['GET'])
@admin_required
def admin_user_history(**kwargs):
    try:
        user_id = kwargs['user_id']
        history = list(history_collection.find(
            {'user_id': ObjectId(user_id)}
        ).sort('timestamp', -1).limit(50))

        formatted = []
        for item in history:
            formatted.append({
                'id': str(item['_id']),
                'crop_type': item['input_data']['Crop_Type'],
                'fertilizer': item['input_data']['Fertilizer_Name'],
                'compatibility': item['result']['overall_compatibility'],
                'score': item['result']['overall_score'],
                'timestamp': item['timestamp'].isoformat() if item.get('timestamp') else None
            })

        return jsonify({'success': True, 'history': formatted}), 200
    except Exception as e:
        logger.error(f"Error fetching user history: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

# --- Config management (admin only) ---
@app.route('/admin/config/soil-types', methods=['POST'])
@admin_required
def admin_add_soil_type(**kwargs):
    try:
        data = request.get_json()
        new_type = data.get('item', '').strip()
        if not new_type:
            return jsonify({'success': False, 'message': 'Item required'}), 400

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$addToSet': {'soil_types': new_type}}
        )
        logger.info(f"Admin added soil type: {new_type}")
        return jsonify({'success': True, 'message': f'Added {new_type}'}), 200
    except Exception as e:
        logger.error(f"Error adding soil type: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/config/soil-types/<item>', methods=['DELETE'])
@admin_required
def admin_remove_soil_type(**kwargs):
    try:
        item = kwargs['item']
        # Verify config document exists
        config = config_collection.find_one({'_id': 'dropdowns'})
        if not config:
            logger.error("Config document '_id': 'dropdowns' not found!")
            return jsonify({'success': False, 'message': 'Configuration not found'}), 404

        result = config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$pull': {'soil_types': item}}
        )
        if result.modified_count == 0:
            logger.warning(f"Removing '{item}' from soil_types had no effect (maybe not present).")
        else:
            logger.info(f"Successfully removed '{item}' from soil_types.")
        return jsonify({'success': True, 'message': f'Removed {item}'}), 200
    except Exception as e:
        logger.error(f"Error removing soil type '{item}': {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/config/crop-types', methods=['POST'])
@admin_required
def admin_add_crop_type(**kwargs):
    try:
        data = request.get_json()
        new_type = data.get('item', '').strip()
        if not new_type:
            return jsonify({'success': False, 'message': 'Item required'}), 400

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$addToSet': {'crop_types': new_type}}
        )
        logger.info(f"Admin added crop type: {new_type}")
        return jsonify({'success': True, 'message': f'Added {new_type}'}), 200
    except Exception as e:
        logger.error(f"Error adding crop type: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/config/crop-types/<item>', methods=['DELETE'])
@admin_required
def admin_remove_crop_type(**kwargs):
    try:
        item = kwargs['item']
        config = config_collection.find_one({'_id': 'dropdowns'})
        if not config:
            logger.error("Config document '_id': 'dropdowns' not found!")
            return jsonify({'success': False, 'message': 'Configuration not found'}), 404

        result = config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$pull': {'crop_types': item}}
        )
        if result.modified_count == 0:
            logger.warning(f"Removing '{item}' from crop_types had no effect.")
        else:
            logger.info(f"Successfully removed '{item}' from crop_types.")
        return jsonify({'success': True, 'message': f'Removed {item}'}), 200
    except Exception as e:
        logger.error(f"Error removing crop type '{item}': {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/config/fertilizer-names', methods=['POST'])
@admin_required
def admin_add_fertilizer(**kwargs):
    try:
        data = request.get_json()
        new_fert = data.get('item', '').strip()
        if not new_fert:
            return jsonify({'success': False, 'message': 'Item required'}), 400

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$addToSet': {'fertilizer_names': new_fert}}
        )
        logger.info(f"Admin added fertilizer: {new_fert}")
        return jsonify({'success': True, 'message': f'Added {new_fert}'}), 200
    except Exception as e:
        logger.error(f"Error adding fertilizer: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/config/fertilizer-names/<item>', methods=['DELETE'])
@admin_required
def admin_remove_fertilizer(**kwargs):
    try:
        item = kwargs['item']
        config = config_collection.find_one({'_id': 'dropdowns'})
        if not config:
            logger.error("Config document '_id': 'dropdowns' not found!")
            return jsonify({'success': False, 'message': 'Configuration not found'}), 404

        result = config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$pull': {'fertilizer_names': item}}
        )
        if result.modified_count == 0:
            logger.warning(f"Removing '{item}' from fertilizer_names had no effect.")
        else:
            logger.info(f"Successfully removed '{item}' from fertilizer_names.")
        return jsonify({'success': True, 'message': f'Removed {item}'}), 200
    except Exception as e:
        logger.error(f"Error removing fertilizer '{item}': {traceback.format_exc()}")
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
    if not DB_CONNECTED:
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
    logger.info(f"💾 Database status: {'Connected' if DB_CONNECTED else 'Disconnected'}")
    app.run(host='0.0.0.0', port=port, debug=debug)
