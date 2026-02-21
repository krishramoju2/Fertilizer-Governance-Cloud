from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from bson.json_util import dumps
import datetime
import jwt
import os
import bcrypt
from functools import wraps
from dotenv import load_dotenv
import logging
from logging.handlers import RotatingFileHandler
import traceback

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enhanced CORS configuration
CORS(app, origins=[
    "http://localhost:3000",
    "http://localhost:5000",
    "https://your-frontend-domain.vercel.app",  # Add your frontend URL
    "https://fertilizer-backend-jj59.onrender.com"
], supports_credentials=True)

# Configuration with proper defaults
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY must be set in environment variables")
    
    MONGO_URI = os.environ.get('MONGO_URI')
    if not MONGO_URI:
        raise ValueError("MONGO_URI must be set in environment variables")
    
    TOKEN_EXPIRY = datetime.timedelta(days=7)  # Longer expiry for better UX
    BCRYPT_ROUNDS = 12
    ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')

app.config.from_object(Config)

# MongoDB connection with retry logic
def get_db():
    try:
        client = MongoClient(
            app.config['MONGO_URI'],
            maxPoolSize=50,
            minPoolSize=10,
            maxIdleTimeMS=45000,
            retryWrites=True,
            retryReads=True,
            connectTimeoutMS=5000,
            serverSelectionTimeoutMS=5000
        )
        # Test connection
        client.admin.command('ping')
        logger.info("MongoDB connection successful")
        return client['fertilizer_intelligence']
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise

db = get_db()

# Create indexes for better performance
db.users.create_index('email', unique=True)
db.history.create_index([('user_id', 1), ('timestamp', -1)])
db.history.create_index('timestamp', expireAfterSeconds=2592000)  # Auto-delete after 30 days

# ==================== UTILITY FUNCTIONS ====================

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    if doc and 'user_id' in doc:
        doc['user_id'] = str(doc['user_id'])
    return doc

def validate_input(data, required_fields):
    """Validate input data"""
    missing = [field for field in required_fields if field not in data]
    if missing:
        return False, f"Missing fields: {', '.join(missing)}"
    
    # Type validation for numeric fields
    numeric_fields = ['Temparature', 'Moisture', 'Fertilizer_Quantity', 'Nitrogen', 'Potassium', 'Phosphorous']
    for field in numeric_fields:
        if field in data:
            try:
                float(data[field])
            except (ValueError, TypeError):
                return False, f"{field} must be a number"
    
    return True, None

# ==================== AUTH MIDDLEWARE ====================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Authentication token missing'}), 401
        
        try:
            data = jwt.decode(
                token, 
                app.config['SECRET_KEY'], 
                algorithms=["HS256"]
            )
            
            current_user = db.users.find_one({'_id': ObjectId(data['user_id'])})
            
            if not current_user:
                return jsonify({'success': False, 'message': 'User not found'}), 401
            
            # Add user to kwargs
            kwargs['current_user'] = current_user
            
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token expired'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'success': False, 'message': f'Invalid token: {str(e)}'}), 401
        except Exception as e:
            logger.error(f"Token validation error: {traceback.format_exc()}")
            return jsonify({'success': False, 'message': 'Authentication failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

# ==================== HEALTH CHECK ====================

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render"""
    try:
        # Check MongoDB connection
        db.command('ping')
        mongo_status = 'connected'
    except Exception as e:
        mongo_status = 'disconnected'
        logger.error(f"Health check - MongoDB: {e}")
    
    return jsonify({
        'success': True,
        'status': 'operational',
        'environment': app.config['ENVIRONMENT'],
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'database': mongo_status,
        'message': 'Fertilizer Intelligence API is running'
    }), 200

# ==================== AUTH ROUTES ====================

@app.route('/register', methods=['POST'])
def register():
    """User registration with password hashing"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password required'
            }), 400
        
        # Check if user exists
        if db.users.find_one({'email': data['email'].lower().strip()}):
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 409
        
        # Hash password
        salt = bcrypt.gensalt(rounds=app.config['BCRYPT_ROUNDS'])
        hashed_password = bcrypt.hashpw(
            data['password'].encode('utf-8'), 
            salt
        )
        
        # Create user
        user = {
            'email': data['email'].lower().strip(),
            'password': hashed_password,
            'name': data.get('name', data['email'].split('@')[0]),
            'created_at': datetime.datetime.utcnow(),
            'last_login': None,
            'preferences': {
                'notifications': True,
                'default_crop': data.get('default_crop', 'Maize')
            }
        }
        
        result = db.users.insert_one(user)
        user_id = str(result.inserted_id)
        
        # Generate token
        token = jwt.encode({
            'user_id': user_id,
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + app.config['TOKEN_EXPIRY']
        }, app.config['SECRET_KEY'])
        
        logger.info(f"New user registered: {user['email']}")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'email': user['email'],
                'name': user['name']
            },
            'message': 'Registration successful'
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Registration failed. Please try again.'
        }), 500

@app.route('/login', methods=['POST'])
def login():
    """User login with password verification"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password required'
            }), 400
        
        # Find user
        user = db.users.find_one({
            'email': data['email'].lower().strip()
        })
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        # Verify password
        if not bcrypt.checkpw(
            data['password'].encode('utf-8'),
            user['password']
        ):
            return jsonify({
                'success': False,
                'message': 'Invalid email or password'
            }), 401
        
        # Update last login
        db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.datetime.utcnow()}}
        )
        
        # Generate token
        token = jwt.encode({
            'user_id': str(user['_id']),
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + app.config['TOKEN_EXPIRY']
        }, app.config['SECRET_KEY'])
        
        logger.info(f"User logged in: {user['email']}")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'name': user.get('name', user['email'].split('@')[0])
            },
            'message': 'Login successful'
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Login failed. Please try again.'
        }), 500

# ==================== PREDICTION ENGINE ====================

class FertilizerAnalyzer:
    """Advanced fertilizer analysis engine"""
    
    @staticmethod
    def check_compatibility(temp, moisture, crop_type, fertilizer_name):
        """Check fertilizer compatibility with conditions"""
        
        # Temperature ranges by crop
        crop_temp_ranges = {
            'Maize': (18, 32),
            'Wheat': (15, 25),
            'Rice': (20, 35),
            'Sugarcane': (20, 35),
            'Cotton': (21, 32),
            'Vegetables': (15, 30),
            'Fruits': (18, 32),
            'Default': (15, 35)
        }
        
        # Moisture ranges by fertilizer type
        fertilizer_moisture = {
            'Urea': (40, 70),
            'DAP': (35, 65),
            'MOP': (30, 60),
            'NPK': (35, 75),
            'Compost': (45, 80),
            'Default': (30, 75)
        }
        
        temp_range = crop_temp_ranges.get(crop_type, crop_temp_ranges['Default'])
        moisture_range = fertilizer_moisture.get(fertilizer_name, fertilizer_moisture['Default'])
        
        # Detailed analysis
        issues = []
        
        if not (temp_range[0] <= temp <= temp_range[1]):
            issues.append(f"Temperature {temp}°C is outside optimal range ({temp_range[0]}-{temp_range[1]}°C) for {crop_type}")
        
        if not (moisture_range[0] <= moisture <= moisture_range[1]):
            issues.append(f"Soil moisture {moisture}% is outside optimal range ({moisture_range[0]}-{moisture_range[1]}%) for {fertilizer_name}")
        
        is_compatible = len(issues) == 0
        
        if is_compatible:
            reason = f"Perfect conditions! Temperature and moisture are optimal for applying {fertilizer_name} to {crop_type}."
            recommendation = "Proceed with application as planned."
        else:
            reason = "; ".join(issues)
            recommendation = FertilizerAnalyzer.generate_recommendation(temp, moisture, issues)
        
        return is_compatible, reason, recommendation
    
    @staticmethod
    def check_quantity(quantity, crop_type, fertilizer_name):
        """Check if fertilizer quantity is optimal"""
        
        # Quantity ranges by crop and fertilizer type (kg/hectare)
        quantity_ranges = {
            'Maize': {'Urea': (100, 150), 'DAP': (50, 80), 'MOP': (30, 50), 'Default': (50, 120)},
            'Wheat': {'Urea': (80, 120), 'DAP': (40, 60), 'MOP': (20, 40), 'Default': (40, 100)},
            'Rice': {'Urea': (90, 130), 'DAP': (45, 70), 'MOP': (25, 45), 'Default': (45, 110)},
            'Default': {'Default': (40, 90)}
        }
        
        crop_ranges = quantity_ranges.get(crop_type, quantity_ranges['Default'])
        range_for_fertilizer = crop_ranges.get(fertilizer_name, crop_ranges.get('Default', (40, 90)))
        
        min_q, max_q = range_for_fertilizer
        
        if quantity < min_q:
            status = "Insufficient"
            reason = f"Quantity {quantity}kg/ha is below recommended minimum ({min_q}kg/ha). Yield may be affected."
            recommendation = f"Increase application to at least {min_q}kg/ha for optimal results."
        elif quantity > max_q:
            status = "Excessive"
            reason = f"Quantity {quantity}kg/ha exceeds recommended maximum ({max_q}kg/ha). Risk of environmental damage and waste."
            recommendation = f"Reduce application to maximum {max_q}kg/ha to prevent nutrient runoff and crop burn."
        else:
            status = "Optimal"
            reason = f"Quantity {quantity}kg/ha is within optimal range ({min_q}-{max_q}kg/ha)."
            recommendation = "Perfect dosage! Continue with current application rate."
        
        return status, reason, recommendation
    
    @staticmethod
    def generate_recommendation(temp, moisture, issues):
        """Generate actionable recommendations"""
        
        recommendations = []
        
        if "temperature" in str(issues).lower():
            if temp < 15:
                recommendations.append("Wait for warmer conditions (above 15°C) before applying fertilizer.")
            elif temp > 35:
                recommendations.append("Apply during early morning or evening to reduce heat stress.")
        
        if "moisture" in str(issues).lower():
            if moisture < 30:
                recommendations.append("Irrigate the field before fertilizer application.")
            elif moisture > 80:
                recommendations.append("Delay application until soil drains to optimal moisture levels.")
        
        if not recommendations:
            recommendations.append("Consider split application for better nutrient uptake.")
        
        return " ".join(recommendations)

@app.route('/predict', methods=['POST'])
@token_required
def predict(**kwargs):
    """Enhanced prediction endpoint"""
    try:
        current_user = kwargs['current_user']
        data = request.get_json()
        
        # Validate input
        required = ['Temparature', 'Moisture', 'Crop_Type', 'Fertilizer_Name', 'Fertilizer_Quantity']
        valid, message = validate_input(data, required)
        if not valid:
            return jsonify({'success': False, 'message': message}), 400
        
        # Parse inputs
        temp = float(data['Temparature'])
        moisture = float(data['Moisture'])
        quantity = float(data['Fertilizer_Quantity'])
        crop_type = data['Crop_Type']
        fertilizer_name = data['Fertilizer_Name']
        
        # Run analysis
        is_compatible, comp_reason, comp_recommendation = FertilizerAnalyzer.check_compatibility(
            temp, moisture, crop_type, fertilizer_name
        )
        
        q_status, q_reason, q_recommendation = FertilizerAnalyzer.check_quantity(
            quantity, crop_type, fertilizer_name
        )
        
        # Calculate efficiency score (0-100)
        efficiency_score = 100
        if not is_compatible:
            efficiency_score -= 30
        if q_status != "Optimal":
            efficiency_score -= 20
        
        efficiency_score = max(0, efficiency_score)
        
        # Store in database
        record = {
            'user_id': current_user['_id'],
            'crop_type': crop_type,
            'fertilizer_name': fertilizer_name,
            'temperature': temp,
            'moisture': moisture,
            'fertilizer_quantity': quantity,
            'compatibility': "Compatible" if is_compatible else "Incompatible",
            'compatibility_reason': comp_reason,
            'compatibility_recommendation': comp_recommendation,
            'quantity_status': q_status,
            'quantity_reason': q_reason,
            'quantity_recommendation': q_recommendation,
            'efficiency_score': efficiency_score,
            'timestamp': datetime.datetime.utcnow()
        }
        
        db.history.insert_one(record)
        
        # Prepare response
        response = {
            'success': True,
            'compatibility': "Compatible" if is_compatible else "Incompatible",
            'compatibility_reason': comp_reason,
            'compatibility_recommendation': comp_recommendation,
            'quantity_status': q_status,
            'quantity_reason': q_reason,
            'quantity_recommendation': q_recommendation,
            'efficiency_score': efficiency_score,
            'summary': {
                'crop': crop_type,
                'fertilizer': fertilizer_name,
                'conditions': f"{temp}°C, {moisture}% moisture",
                'overall_assessment': 'Excellent' if efficiency_score > 80 else 'Good' if efficiency_score > 60 else 'Needs Improvement'
            }
        }
        
        logger.info(f"Prediction made for user: {current_user['email']}")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Prediction error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Analysis failed. Please try again.'
        }), 500

# ==================== HISTORY ROUTES ====================

@app.route('/history', methods=['GET'])
@token_required
def get_history(**kwargs):
    """Get user's prediction history with pagination"""
    try:
        current_user = kwargs['current_user']
        
        # Pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        skip = (page - 1) * limit
        
        # Get total count
        total = db.history.count_documents({'user_id': current_user['_id']})
        
        # Get paginated history
        history = list(db.history.find(
            {'user_id': current_user['_id']}
        ).sort('timestamp', -1).skip(skip).limit(limit))
        
        # Serialize documents
        for item in history:
            item['_id'] = str(item['_id'])
            item['user_id'] = str(item['user_id'])
            if 'timestamp' in item:
                item['timestamp'] = item['timestamp'].isoformat()
        
        return jsonify({
            'success': True,
            'data': history,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        logger.error(f"History error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch history'
        }), 500

@app.route('/history/<record_id>', methods=['DELETE'])
@token_required
def delete_history_record(**kwargs):
    """Delete a specific history record"""
    try:
        current_user = kwargs['current_user']
        record_id = kwargs.get('record_id')
        
        result = db.history.delete_one({
            '_id': ObjectId(record_id),
            'user_id': current_user['_id']
        })
        
        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'message': 'Record not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Record deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete record'
        }), 500

# ==================== ANALYTICS ROUTES ====================

@app.route('/analytics', methods=['GET'])
@token_required
def get_analytics(**kwargs):
    """Get comprehensive analytics for user"""
    try:
        current_user = kwargs['current_user']
        
        # Get all user history
        history = list(db.history.find({'user_id': current_user['_id']}))
        
        if not history:
            return jsonify({
                'success': True,
                'data': {
                    'message': 'No data available for analytics'
                }
            }), 200
        
        # Compatibility distribution
        comp_dist = {"Compatible": 0, "Incompatible": 0}
        for item in history:
            comp_dist[item['compatibility']] += 1
        
        # Crop distribution
        crop_dist = {}
        fertilizer_dist = {}
        
        # Time series data
        time_data = []
        efficiency_data = []
        
        for item in history[-30:]:  # Last 30 records
            crop_dist[item['crop_type']] = crop_dist.get(item['crop_type'], 0) + 1
            fertilizer_dist[item['fertilizer_name']] = fertilizer_dist.get(item['fertilizer_name'], 0) + 1
            
            if 'timestamp' in item and 'efficiency_score' in item:
                time_data.append({
                    'date': item['timestamp'].strftime("%Y-%m-%d"),
                    'score': item['efficiency_score']
                })
                efficiency_data.append(item['efficiency_score'])
        
        # Calculate averages
        avg_efficiency = sum(efficiency_data) / len(efficiency_data) if efficiency_data else 0
        
        # Success rate
        total_records = len(history)
        compatible_records = comp_dist.get("Compatible", 0)
        success_rate = (compatible_records / total_records * 100) if total_records > 0 else 0
        
        # Most common crop and fertilizer
        most_common_crop = max(crop_dist.items(), key=lambda x: x[1])[0] if crop_dist else "N/A"
        most_common_fertilizer = max(fertilizer_dist.items(), key=lambda x: x[1])[0] if fertilizer_dist else "N/A"
        
        analytics = {
            'summary': {
                'total_analyses': total_records,
                'success_rate': round(success_rate, 2),
                'average_efficiency': round(avg_efficiency, 2),
                'most_analyzed_crop': most_common_crop,
                'most_used_fertilizer': most_common_fertilizer
            },
            'compatibility_distribution': comp_dist,
            'crop_distribution': crop_dist,
            'fertilizer_distribution': fertilizer_dist,
            'efficiency_trend': time_data[-10:],  # Last 10 records
            'recent_activity': len(history[-7:])  # Last 7 days activity
        }
        
        return jsonify({
            'success': True,
            'data': analytics
        }), 200
        
    except Exception as e:
        logger.error(f"Analytics error: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Failed to generate analytics'
        }), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'message': 'Method not allowed'
    }), 405

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = app.config['ENVIRONMENT'] == 'development'
    
    logger.info(f"Starting server on port {port} in {app.config['ENVIRONMENT']} mode")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )