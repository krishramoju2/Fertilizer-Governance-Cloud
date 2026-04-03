from routes.history_routes import history_bp

from utils.auth import token_required
from utils.auth import admin_required
from utils.auth import hash_password
from utils.auth import check_password


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

# ==================== AUTH ROUTES ====================
@app.route('/register', methods=['POST'])
def register():
    # Check DB connection
    if not check_db_connection():
        return jsonify({'success': False, 'message': 'Database connection error. Please try again later.'}), 503

    try:
        data = request.get_json()

        # Validate input
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        email = data.get('email', '').lower().strip()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password required'}), 400

        # Check if user exists
        if users_collection.find_one({'email': email}):
            return jsonify({'success': False, 'message': 'Email already registered'}), 400

        # Hash password
        hashed_password = hash_password(password)
        
        # Get location from registration data
        location = data.get('location', '').strip()
        
        # Fetch weather data for the location
        temperature, humidity = fetch_weather_for_location(location)
        
        # Create user with farm details, is_admin defaults to False
        user = {
            'email': email,
            'password': hashed_password,
            'name': data.get('name', email.split('@')[0]),
            'farm_details': {
                'soil_type': data.get('soil_type', 'Loamy'),
                'farm_size': float(data.get('farm_size', 1)),
                'location': location,
                'primary_crops': data.get('primary_crops', []),
                # Weather data fields
                'temperature': temperature if temperature is not None else 26,
                'humidity': humidity if humidity is not None else 45,
                'last_weather_update': datetime.datetime.utcnow().isoformat() if temperature else None
            },
            'is_admin': False,
            'created_at': datetime.datetime.utcnow()
        }

        result = users_collection.insert_one(user)
        user_id = str(result.inserted_id)

        # Generate token
        token = jwt.encode({
            'user_id': user_id,
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, app.config['SECRET_KEY'])

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'email': user['email'],
                'name': user['name'],
                'farm_details': user['farm_details'],
                'is_admin': False
            }
        }), 201
    except Exception as e:
        logger.error(f"Registration error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500

@app.route('/login', methods=['POST'])
def login():
    # Check DB connection
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

        # Find user
        user = users_collection.find_one({'email': email})
        if not user or not check_password(password, user['password']):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        # Generate token
        token = jwt.encode({
            'user_id': str(user['_id']),
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, app.config['SECRET_KEY'])

        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', 'Farmer'),
                'farm_details': user.get('farm_details', {}),
                'is_admin': user.get('is_admin', False)
            }
        }), 200
    except Exception as e:
        logger.error(f"Login error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': f'Login failed: {str(e)}'}), 500

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

# ==================== PREDICTION ROUTE ====================
@app.route('/predict', methods=['POST'])
@token_required
def predict(**kwargs):
    try:
        current_user = kwargs['current_user']
        data = request.get_json()

        # Get farm details for defaults (including weather data)
        farm_details = current_user.get('farm_details', {})

        # Prepare input data - using stored weather as defaults
        input_data = {
            'Temperature': float(data.get('Temperature', farm_details.get('temperature', 26))),
            'Moisture': float(data.get('Moisture', farm_details.get('humidity', 45))),
            'Soil_Type': data.get('Soil_Type', farm_details.get('soil_type', 'Loamy')),
            'Crop_Type': data.get('Crop_Type', 'Maize'),
            'Fertilizer_Name': data.get('Fertilizer_Name', 'Urea'),
            'Fertilizer_Quantity': float(data.get('Fertilizer_Quantity', 30))
        }

        # Run analysis
        result = FertilizerAnalyzer.analyze(input_data)

        if not result['success']:
            return jsonify({'success': False, 'message': result.get('error', 'Analysis failed')}), 400

        current_user = kwargs['current_user']

        
        
        history_entry = {
            'user_id': current_user['_id'],
        
            # 🔥 THIS IS WHAT YOU ARE MISSING
            'input_data': {
                'Crop_Type': data.get('crop'),
                'Fertilizer_Name': data.get('fertilizer')
            },
        
            'result': {
                'overall_score': result.get('overall_score', result.get('score', 0)),
                'overall_compatibility': result.get('overall_compatibility', result.get('compatibility', 'N/A'))
            },
        
            'model': 'decision',
            'timestamp': datetime.datetime.utcnow()
        }

        

        
        history_collection.insert_one(history_entry)

        return jsonify({
            'success': True,
            'result': result,
            'input': input_data
        }), 200
    except Exception as e:
        logger.error(f"Prediction error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== ML PREDICTION ROUTE ====================


@app.route('/ml/predict', methods=['POST', 'OPTIONS'])
@token_required
def ml_predict_route(**kwargs):

    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.get_json() or {}

        input_data = {
            'Temperature': float(data.get('temperature', 26)),
            'Moisture': float(data.get('moisture', 45)),
            'Soil_Type': data.get('soil', 'Loamy'),
            'Crop_Type': data.get('crop', 'Maize'),
            'Fertilizer_Name': data.get('fertilizer', 'Urea'),
            'Fertilizer_Quantity': float(data.get('quantity', 30))
        }

        

        ml_result = ml_predict(input_data)


        # ===== ENCODE INPUT FOR DASHBOARD =====
        temp = input_data['Temperature']
        moist = input_data['Moisture']
        soil = soil_map.get(input_data['Soil_Type'], 1)
        crop = crop_map.get(input_data['Crop_Type'], 0)
        fert = fert_map.get(input_data['Fertilizer_Name'], 0)
        qty = input_data['Fertilizer_Quantity']
        
        encoded_input = [temp, moist, soil, crop, fert, qty]
        
        # ===== GET DASHBOARD =====
        dashboard = get_model_dashboard(model, encoded_input)

        # 🔥 Normalize ML output to match decision format
        result = {
            "overall_compatibility": ml_result.get("overall_compatibility", "Moderately Compatible"),
            "overall_score": ml_result.get("overall_score", 60),
            "temperature_status": ml_result.get("temperature_status", "N/A"),
            "moisture_status": ml_result.get("moisture_status", "N/A"),
            "soil_compatibility": ml_result.get("soil_compatibility", "Average"),
            "quantity_status": ml_result.get("quantity_status", "Optimal"),
            "success": True
        }

        current_user = kwargs['current_user']
        
        history_entry = {
            'user_id': current_user['_id'],   # ✅ FIXED
            'input_data': input_data,
            'result': result,
            'model': 'ml',
            'dashboard': dashboard, 
            'timestamp': datetime.datetime.utcnow()
        }

        history_collection.insert_one(history_entry)

        return jsonify({
            "success": True,
            "result": result,
            "ml_dashboard": dashboard   # 🚀 THIS LINE MAKES IT VISIBLE
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

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


def extract_inputs(message):
    message = message.lower()

    data = {
        "Temperature": 26,
        "Moisture": 45,
        "Soil_Type": "Loamy",
        "Crop_Type": "Maize",
        "Fertilizer_Name": "Urea",
        "Fertilizer_Quantity": 30
    }




        # 🌡️ HUMAN TEMPERATURE WORDS
    if "very hot" in message:
        data["Temperature"] = 38
    elif "hot" in message:
        data["Temperature"] = 32
    elif "warm" in message:
        data["Temperature"] = 28
    elif "cool" in message:
        data["Temperature"] = 22
    elif "cold" in message:
        data["Temperature"] = 18

    # 💧 HUMAN MOISTURE WORDS
    if "very high moisture" in message:
        data["Moisture"] = 80
    elif "high moisture" in message:
        data["Moisture"] = 65
    elif "medium moisture" in message:
        data["Moisture"] = 50
    elif "low moisture" in message:
        data["Moisture"] = 30
    elif "very low moisture" in message:
        data["Moisture"] = 20

    # 🔧 SLIGHT / BIT HANDLING
    if "a bit hot" in message or "slightly hot" in message:
        data["Temperature"] = 30

    if "a bit cold" in message:
        data["Temperature"] = 20

    if "slightly moist" in message:
        data["Moisture"] = 55

    if "a bit dry" in message:
        data["Moisture"] = 35





    
    temp_match = re.search(r'(temp|temperature).*?(\d+)', message)
    if temp_match:
        data["Temperature"] = float(temp_match.group(2))
    else:
        temp_match = re.search(r'(\d+)\s*°?c', message)
        if temp_match:
            data["Temperature"] = float(temp_match.group(1))

    moist_match = re.search(r'(moisture\s*(\d+))|(\d+\s*%)', message)
    if moist_match:
        if moist_match.group(2):
            data["Moisture"] = float(moist_match.group(2))
        else:
            data["Moisture"] = float(re.search(r'\d+', moist_match.group(0)).group())
        
    # 📦 Quantity
    qty_match = re.search(r'(\d+)\s*(kg)', message)
    if qty_match:
        data["Fertilizer_Quantity"] = float(qty_match.group(1))

    # 🌱 Soil
    for soil in ["sandy", "loamy", "clayey", "black", "red"]:
        if soil in message:
            data["Soil_Type"] = soil.capitalize()



    

    # 🌾 Crop (FIXED)
    if "wheat" in message:
        data["Crop_Type"] = "Wheat"
    elif "rice" in message or "paddy" in message:
        data["Crop_Type"] = "Paddy"
    elif "cotton" in message:
        data["Crop_Type"] = "Cotton"
    elif "maize" in message:
        data["Crop_Type"] = "Maize"
    elif "sugarcane" in message:
        data["Crop_Type"] = "Sugarcane"
    elif "barley" in message:
        data["Crop_Type"] = "Barley"







    
        
    # 🧪 Fertilizer (FIXED)
    if "urea" in message:
        data["Fertilizer_Name"] = "Urea"
    elif "dap" in message:
        data["Fertilizer_Name"] = "DAP"
    elif "npk" in message:
        data["Fertilizer_Name"] = "NPK"
    elif "14-35-14" in message:
        data["Fertilizer_Name"] = "14-35-14"
    elif "17-17-17" in message:
        data["Fertilizer_Name"] = "17-17-17"
    elif "10-26-26" in message:
        data["Fertilizer_Name"] = "10-26-26"



    

        # 🔥 FALLBACK NUMBER EXTRACTION (VERY IMPORTANT)
    numbers = list(map(float, re.findall(r'\d+', message)))

    if len(numbers) >= 3:
        # Only override if not already clearly detected
        if not re.search(r'(temp|temperature|°c)', message):
            data["Temperature"] = numbers[0]

        if not re.search(r'(moisture|%)', message):
            data["Moisture"] = numbers[1]

        if not re.search(r'(kg)', message):
            data["Fertilizer_Quantity"] = numbers[2]

    return data

# ==================== ADDITIONAL ALIAS FOR GUNICORN ====================
application = app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('ENVIRONMENT', 'development') == 'development'
    logger.info(f"🚀 Starting server on port {port}")
    logger.info(f"🔧 Debug mode: {debug}")
    logger.info(f"💾 Database status: {'Connected' if DB_CONNECTED else 'Disconnected'}")
    app.run(host='0.0.0.0', port=port, debug=debug)
