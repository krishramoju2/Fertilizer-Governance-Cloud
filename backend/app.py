'''from flask import Flask, request, jsonify
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

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS configuration
CORS(app, origins=["*"])

# Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'btech_project_2026_secret_key_change_this')
app.config['SECRET_KEY'] = SECRET_KEY

# ==================== MONGODB CONNECTION WITH PROPER AUTH ====================
def get_mongo_connection():
    """Establish MongoDB connection with proper authentication"""
    try:
        # Your MongoDB credentials - UPDATE THESE!
        username = "krishramoju"          # Your MongoDB username
        password = "Krish161205"          # Your MongoDB password
        cluster = "cluster0.svleqvv.mongodb.net"
        database = "fertilizer_db"

        # URL encode the password to handle special characters
        encoded_password = urllib.parse.quote_plus(password)

        # Construct connection string properly
        mongo_uri = f"mongodb+srv://{username}:{encoded_password}@{cluster}/{database}?retryWrites=true&w=majority&appName=Cluster0"

        logger.info(f"Attempting to connect to MongoDB...")

        # Create client with timeout
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)

        # Test connection
        client.admin.command('ping')
        logger.info("✅ MongoDB ping successful")

        # Get database
        db = client[database]

        # Create collections
        users_collection = db['users']
        history_collection = db['history']
        config_collection = db['config']      # Collection for dynamic dropdowns

        # Create indexes (with error handling)
        try:
            users_collection.create_index('email', unique=True)
            logger.info("✅ Created email index")
        except Exception as e:
            logger.warning(f"Index creation warning (may already exist): {e}")

        try:
            history_collection.create_index([('user_id', 1), ('timestamp', -1)])
            logger.info("✅ Created history index")
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")

        # Initialize config if not exists
        init_config(config_collection)

        logger.info("✅ MongoDB connection successful")
        return client, db, users_collection, history_collection, config_collection
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        logger.error(traceback.format_exc())
        raise

def init_config(config_collection):
    """Initialize configuration document with default dropdown values"""
    try:
        config = config_collection.find_one({'_id': 'dropdowns'})
        if not config:
            default_config = {
                '_id': 'dropdowns',
                'soil_types': ['Loamy', 'Sandy', 'Clayey', 'Black', 'Red'],
                'crop_types': ['Maize', 'Sugarcane', 'Cotton', 'Wheat', 'Paddy',
                               'Barley', 'Millets', 'Pulses', 'Ground Nuts', 'Oil seeds', 'Tobacco'],
                'fertilizer_names': ['Urea', 'DAP', '14-35-14', '28-28', '17-17-17', '20-20', '10-26-26']
            }
            config_collection.insert_one(default_config)
            logger.info("✅ Initialized config dropdowns")
        else:
            logger.info("✅ Config already exists")
    except Exception as e:
        logger.error(f"Error initializing config: {e}")

# Initialize MongoDB connection
try:
    client, db, users_collection, history_collection, config_collection = get_mongo_connection()
    DB_CONNECTED = True
except Exception as e:
    logger.critical(f"Failed to connect to MongoDB: {e}")
    client = db = users_collection = history_collection = config_collection = None
    DB_CONNECTED = False

# ==================== PASSWORD UTILITIES ====================
def hash_password(password):
    """Simple password hashing using SHA-256"""
    salt = "farmadvisor_salt_2026"
    hash_object = hashlib.sha256((password + salt).encode('utf-8'))
    return hash_object.hexdigest()

def check_password(plain_password, hashed_password):
    """Check if plain password matches hashed password"""
    return hash_password(plain_password) == hashed_password

# ==================== HELPER FUNCTIONS ====================
def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

def check_db_connection():
    """Check if database is connected"""
    global DB_CONNECTED
    return DB_CONNECTED

# ==================== AUTH MIDDLEWARE ====================
def token_required(f):
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
            kwargs['current_user'] = current_user
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated

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
        
        # Step 2: Get current weather using coordinates - CORRECTED FORMAT
        # Using current_weather=true parameter (not current=...)
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        logger.info(f"Fetching weather for: {lat}, {lon}")
        
        weather_response = requests.get(weather_url, timeout=10).json()
        
        # Check if we have current_weather data
        if 'current_weather' not in weather_response:
            logger.warning(f"No current_weather data in response for {lat}, {lon}")
            return None, None
        
        current = weather_response['current_weather']
        
        # Extract temperature (humidity not available in current_weather)
        temperature = current.get('temperature')
        
        if temperature is None:
            logger.warning(f"Missing temperature in response: {current}")
            return None, None
        
        logger.info(f"✅ Weather fetched for {location}: {temperature}°C")
        
        # Since humidity isn't available in current_weather, we'll use a reasonable default
        # based on typical values for the location type
        return float(temperature), 65  # Default humidity of 65%
        
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

# ==================== FERTILIZER ANALYSIS ENGINE ====================
class FertilizerAnalyzer:
    """Fertilizer compatibility and quantity analyzer based on CSV data"""

    # Soil type compatibility matrix (static)
    SOIL_COMPATIBILITY = {
        'Sandy': {
            'Urea': 'Good', 'DAP': 'Good', '14-35-14': 'Average', '28-28': 'Good',
            '17-17-17': 'Good', '20-20': 'Average', '10-26-26': 'Average'
        },
        'Loamy': {
            'Urea': 'Excellent', 'DAP': 'Excellent', '14-35-14': 'Good', '28-28': 'Excellent',
            '17-17-17': 'Excellent', '20-20': 'Good', '10-26-26': 'Good'
        },
        'Clayey': {
            'Urea': 'Good', 'DAP': 'Good', '14-35-14': 'Average', '28-28': 'Average',
            '17-17-17': 'Good', '20-20': 'Good', '10-26-26': 'Average'
        },
        'Black': {
            'Urea': 'Excellent', 'DAP': 'Good', '14-35-14': 'Excellent', '28-28': 'Good',
            '17-17-17': 'Excellent', '20-20': 'Good', '10-26-26': 'Good'
        },
        'Red': {
            'Urea': 'Average', 'DAP': 'Good', '14-35-14': 'Good', '28-28': 'Average',
            '17-17-17': 'Good', '20-20': 'Good', '10-26-26': 'Average'
        }
    }

    # Crop-specific recommendations (static)
    CROP_RECOMMENDATIONS = {
        'Maize': {
            'optimal_temp': (25, 32), 'optimal_moisture': (35, 50),
            'common_fertilizers': ['Urea', '28-28', '17-17-17', '14-35-14']
        },
        'Sugarcane': {
            'optimal_temp': (28, 35), 'optimal_moisture': (40, 60),
            'common_fertilizers': ['Urea', 'DAP', '17-17-17', '14-35-14']
        },
        'Cotton': {
            'optimal_temp': (25, 35), 'optimal_moisture': (30, 50),
            'common_fertilizers': ['Urea', 'DAP', '14-35-14', '28-28']
        },
        'Wheat': {
            'optimal_temp': (20, 30), 'optimal_moisture': (35, 55),
            'common_fertilizers': ['Urea', 'DAP', '28-28', '17-17-17']
        },
        'Paddy': {
            'optimal_temp': (25, 35), 'optimal_moisture': (40, 65),
            'common_fertilizers': ['Urea', '28-28', '20-20', '14-35-14']
        },
        'Barley': {
            'optimal_temp': (20, 28), 'optimal_moisture': (30, 45),
            'common_fertilizers': ['Urea', '28-28', '17-17-17', '20-20']
        },
        'Millets': {
            'optimal_temp': (25, 35), 'optimal_moisture': (25, 40),
            'common_fertilizers': ['Urea', '28-28', '20-20', 'DAP']
        },
        'Pulses': {
            'optimal_temp': (20, 30), 'optimal_moisture': (30, 45),
            'common_fertilizers': ['DAP', '20-20', '28-28', '10-26-26']
        },
        'Ground Nuts': {
            'optimal_temp': (25, 35), 'optimal_moisture': (35, 50),
            'common_fertilizers': ['DAP', '28-28', '17-17-17', '14-35-14']
        },
        'Oil seeds': {
            'optimal_temp': (25, 35), 'optimal_moisture': (30, 45),
            'common_fertilizers': ['Urea', 'DAP', '20-20', '14-35-14']
        },
        'Tobacco': {
            'optimal_temp': (20, 30), 'optimal_moisture': (30, 45),
            'common_fertilizers': ['DAP', '28-28', '20-20', '10-26-26']
        }
    }

    # Fertilizer quantity ranges (kg/hectare) (static)
    QUANTITY_RANGES = {
        'Urea': (35, 45),
        'DAP': (35, 45),
        '14-35-14': (25, 35),
        '28-28': (20, 30),
        '17-17-17': (10, 20),
        '20-20': (10, 20),
        '10-26-26': (15, 25)
    }

    @classmethod
    def analyze(cls, data):
        """Main analysis function with fallback for unknown entries"""
        try:
            # Extract inputs with defaults
            temperature = float(data.get('Temparature', 26))
            moisture = float(data.get('Moisture', 45))
            soil_type = data.get('Soil_Type', 'Loamy')
            crop_type = data.get('Crop_Type', 'Maize')
            fertilizer_name = data.get('Fertilizer_Name', 'Urea')
            quantity = float(data.get('Fertilizer_Quantity', 30))

            # Get crop recommendations, fallback to Maize if unknown
            crop_rec = cls.CROP_RECOMMENDATIONS.get(crop_type, cls.CROP_RECOMMENDATIONS['Maize'])

            # 1. Temperature compatibility
            temp_min, temp_max = crop_rec['optimal_temp']
            temp_compatible = temp_min <= temperature <= temp_max
            temp_status = "Optimal" if temp_compatible else "Suboptimal"

            # 2. Moisture compatibility
            moist_min, moist_max = crop_rec['optimal_moisture']
            moisture_compatible = moist_min <= moisture <= moist_max
            moisture_status = "Optimal" if moisture_compatible else "Adjust Needed"

            # 3. Soil compatibility (fallback to 'Average' if soil or fertilizer not in matrix)
            soil_compat = cls.SOIL_COMPATIBILITY.get(soil_type, {}).get(fertilizer_name, 'Average')

            # 4. Overall compatibility
            if temp_compatible and moisture_compatible and soil_compat in ['Excellent', 'Good']:
                overall_compatibility = "Highly Compatible"
                compatibility_score = 85 + (10 if soil_compat == 'Excellent' else 0)
            elif temp_compatible or moisture_compatible:
                overall_compatibility = "Moderately Compatible"
                compatibility_score = 60
            else:
                overall_compatibility = "Not Recommended"
                compatibility_score = 30

            # 5. Quantity analysis (fallback to Urea range if fertilizer unknown)
            q_min, q_max = cls.QUANTITY_RANGES.get(fertilizer_name, cls.QUANTITY_RANGES['Urea'])
            if quantity < q_min:
                quantity_status = "Insufficient"
                quantity_message = f"Quantity too low. Recommended: {q_min}-{q_max} kg/ha"
                quantity_score = 40
            elif quantity > q_max:
                quantity_status = "Excessive"
                quantity_message = f"Quantity too high. Recommended: {q_min}-{q_max} kg/ha"
                quantity_score = 30
            else:
                quantity_status = "Optimal"
                quantity_message = f"Perfect quantity! Within range {q_min}-{q_max} kg/ha"
                quantity_score = 100

            # 6. Generate personalized suggestions
            suggestions = []
            if not temp_compatible:
                if temperature < temp_min:
                    suggestions.append(f"🌡️ Temperature is too low for {crop_type}. Consider delayed planting or using plastic mulch.")
                else:
                    suggestions.append(f"🌡️ Temperature is too high for {crop_type}. Provide shade or irrigate during peak hours.")
            if not moisture_compatible:
                if moisture < moist_min:
                    suggestions.append(f"💧 Soil moisture is low. Irrigate before fertilizer application.")
                else:
                    suggestions.append(f"💧 Soil moisture is high. Improve drainage or wait for optimal conditions.")
            if soil_compat == 'Average':
                suggestions.append(f"🌱 {fertilizer_name} has average compatibility with {soil_type} soil. Consider adding organic matter.")
            elif soil_compat in ['Good', 'Excellent']:
                suggestions.append(f"🌱 Excellent! {fertilizer_name} works well with {soil_type} soil.")
            if quantity_status != "Optimal":
                suggestions.append(quantity_message)
            # Add crop-specific suggestion
            suggestions.append(f"👉 For {crop_type}, commonly used fertilizers: {', '.join(crop_rec['common_fertilizers'][:3])}")

            # 7. Calculate overall score
            overall_score = int((compatibility_score + quantity_score) / 2)

            return {
                'success': True,
                'overall_compatibility': overall_compatibility,
                'overall_score': overall_score,
                'temperature_status': temp_status,
                'temperature_range': f"{temp_min}°C - {temp_max}°C",
                'moisture_status': moisture_status,
                'moisture_range': f"{moist_min}% - {moist_max}%",
                'soil_compatibility': soil_compat,
                'quantity_status': quantity_status,
                'quantity_range': f"{q_min} - {q_max} kg/ha",
                'suggestions': suggestions[:4],
                'fertilizer_info': {
                    'name': fertilizer_name,
                    'type': 'Nitrogenous' if fertilizer_name == 'Urea' else 'Complex',
                    'application': 'Split application recommended' if fertilizer_name in ['Urea', 'DAP'] else 'Basal application'
                }
            }
        except Exception as e:
            logger.error(f"Analysis error: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e)
            }

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
            'Temparature': float(data.get('Temparature', farm_details.get('temperature', 26))),
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

        # Store in history
        history_entry = {
            'user_id': current_user['_id'],
            'input_data': input_data,
            'result': result,
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
                'crop_type': item['input_data']['Crop_Type'],
                'fertilizer': item['input_data']['Fertilizer_Name'],
                'compatibility': item['result']['overall_compatibility'],
                'score': item['result']['overall_score'],
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
def delete_history(**kwargs):
    try:
        current_user = kwargs['current_user']
        record_id = kwargs.get('record_id')

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
        compatible_count = sum(1 for h in history if 'Highly Compatible' in h['result']['overall_compatibility'])
        avg_score = sum(h['result']['overall_score'] for h in history) / total

        # Crop distribution
        crops = {}
        fertilizers = {}
        for h in history:
            crop = h['input_data']['Crop_Type']
            crops[crop] = crops.get(crop, 0) + 1
            fert = h['input_data']['Fertilizer_Name']
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
            time_scores.append(h['result']['overall_score'])

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
    app.run(host='0.0.0.0', port=port, debug=debug)''' 
