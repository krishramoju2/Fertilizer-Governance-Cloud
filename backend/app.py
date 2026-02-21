from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from urllib.parse import quote_plus
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from collections import Counter

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

# ==================== MONGODB ATLAS CONFIG ====================
raw_uri = os.getenv('MONGODB_URI', 'mongodb+srv://krishramoju:Krish161205@cluster0.svleqvv.mongodb.net/?appName=Cluster0')
try:
    if '@' in raw_uri:
        auth_part, rest = raw_uri.split('@', 1)
        prefix, creds = auth_part.split('://', 1)
        username, password = creds.split(':', 1)
        username = quote_plus(username)
        password = quote_plus(password)
        MONGO_URI = f"{prefix}://{username}:{password}@{rest}"
    else:
        MONGO_URI = raw_uri
    
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client['fertilizer_db']
    users_collection = db['users']
    farms_collection = db['farms']
    history_collection = db['predictions']
    client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    db = None
    users_collection = None
    farms_collection = None
    history_collection = None

# ==================== JWT AUTH DECORATOR ====================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# ==================== DATASET LOADING (UPDATED: PANDAS-FREE) ====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'fertilizer_data.json')
CSV_FILE = os.path.join(BASE_DIR, 'Fertilizer Prediction.csv')
df = None  # This will be a list of dictionaries

def load_data():
    global df
    try:
        # 1. Try JSON first (Optimized for Render)
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                df = json.load(f)
            print(f"✅ Dataset loaded: {len(df)} records from {DATA_FILE}")
            return True
        # 2. Fallback to CSV (Local only - requires pandas)
        elif os.path.exists(CSV_FILE):
            import pandas as pd
            temp_df = pd.read_csv(CSV_FILE)
            temp_df.columns = temp_df.columns.str.strip()
            for col in temp_df.select_dtypes(include=['object', 'str']).columns:
                temp_df[col] = temp_df[col].astype(str).str.strip()
            df = temp_df.to_dict(orient='records')
            print(f"✅ Dataset loaded from CSV fallback: {len(df)} records")
            return True
        else:
            print(f"❌ No dataset found at {DATA_FILE} or {CSV_FILE}")
            return False
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        return False

# ==================== CONFIGURATION ====================
QUANTITY_RANGES = {
    'Urea': {'min': 30, 'max': 70, 'optimal_min': 40, 'optimal_max': 60},
    'DAP': {'min': 25, 'max': 65, 'optimal_min': 35, 'optimal_max': 55},
    '14-35-14': {'min': 20, 'max': 50, 'optimal_min': 30, 'optimal_max': 45},
    '28-28': {'min': 25, 'max': 60, 'optimal_min': 35, 'optimal_max': 50},
    '20-20': {'min': 25, 'max': 55, 'optimal_min': 30, 'optimal_max': 45},
    '17-17-17': {'min': 30, 'max': 65, 'optimal_min': 40, 'optimal_max': 55},
    '10-26-26': {'min': 20, 'max': 50, 'optimal_min': 30, 'optimal_max': 45}
}

# ==================== COMPATIBILITY LOGIC (UPDATED: PANDAS-FREE) ====================
def check_compatibility(crop_type, soil_type, fertilizer_name, temperature=None, humidity=None, moisture=None):
    if df is None:
        return True, "Dataset not loaded - proceeding with default logic", None
    
    try:
        # Filter matches using list comprehension
        matches = [
            row for row in df 
            if str(row.get('Crop Type', '')).lower() == str(crop_type).lower()
            and str(row.get('Soil Type', '')).lower() == str(soil_type).lower()
        ]
        
        if len(matches) == 0:
            crop_matches = [row for row in df if str(row.get('Crop Type', '')).lower() == str(crop_type).lower()]
            if len(crop_matches) > 0:
                fertilizer_freq = Counter(row.get('Fertilizer Name', '') for row in crop_matches)
                if fertilizer_name in fertilizer_freq:
                    return True, f"{fertilizer_name} is commonly used for {crop_type}", None
                else:
                    top_alt = fertilizer_freq.most_common(1)[0][0] if fertilizer_freq else "Urea"
                    return False, f"{fertilizer_name} is not commonly used for {crop_type}", str(top_alt)
            return True, f"No historical data for {crop_type} in {soil_type} soil", None
        
        fertilizer_counts = Counter(row.get('Fertilizer Name', '') for row in matches)
        total_matches = len(matches)
        
        if fertilizer_name in fertilizer_counts:
            freq = fertilizer_counts[fertilizer_name]
            percentage = (freq / total_matches) * 100
            
            weather_note = ""
            if temperature is not None and humidity is not None:
                if temperature > 30 and humidity < 40:
                    weather_note = " (Hot & dry: may reduce nutrient efficiency)"
                elif temperature < 20:
                    weather_note = " (Cool conditions: slower nutrient uptake)"
                elif humidity > 70:
                    weather_note = " (High humidity: monitor for fungal issues)"
            
            if percentage >= 30:
                return True, f"{fertilizer_name} is highly suitable for {crop_type} in {soil_type} soil ({percentage:.1f}% match){weather_note}", None
            elif percentage >= 15:
                return True, f"{fertilizer_name} is moderately suitable ({percentage:.1f}% match){weather_note}", None
            else:
                top_fert = fertilizer_counts.most_common(1)[0][0]
                return False, f"{fertilizer_name} is rarely used ({percentage:.1f}%). {top_fert} is preferred for {crop_type}", str(top_fert)
        else:
            top_fert = fertilizer_counts.most_common(1)[0][0] if fertilizer_counts else "Urea"
            return False, f"{fertilizer_name} has no historical usage for {crop_type} in {soil_type} soil. Try {top_fert}", str(top_fert)
            
    except Exception as e:
        print(f"⚠️ Compatibility check error: {e}")
        return True, "Compatibility check failed - proceeding", None

# ==================== QUANTITY ASSESSMENT (SAME LOGIC) ====================
def assess_quantity(fertilizer_name, quantity, crop_type, soil_type, temperature=None, humidity=None, moisture=None, nitrogen=0, phosphorous=0, potassium=0):
    recommendations = []
    qty_range = QUANTITY_RANGES.get(fertilizer_name, {'min': 20, 'max': 60, 'optimal_min': 30, 'optimal_max': 50}).copy()

    if soil_type.lower() == 'sandy':
        qty_range['optimal_min'] += 5
        qty_range['optimal_max'] += 10
        recommendations.append("🌱 Sandy soil drains quickly - consider split applications to prevent leaching.")
    elif soil_type.lower() == 'clayey':
        qty_range['optimal_max'] -= 5
        recommendations.append("🌱 Clay soil retains nutrients well - avoid over-application to prevent buildup.")
    elif soil_type.lower() == 'black':
        recommendations.append("🌱 Black soil is naturally fertile - moderate application is usually sufficient.")

    if temperature is not None:
        if temperature > 32:
            qty_range['optimal_min'] += 5
            recommendations.append("🌡️ High temperatures increase nutrient demand - ensure adequate irrigation.")
        elif temperature < 18:
            qty_range['optimal_min'] -= 5
            recommendations.append("🌡️ Cool conditions slow nutrient uptake - apply fertilizer closer to active growth.")

    if humidity is not None:
        if humidity > 75:
            recommendations.append("💧 High humidity - ensure good drainage to prevent nutrient runoff.")
        elif humidity < 35:
            recommendations.append("💧 Low humidity - irrigate immediately after fertilizer application.")

    if moisture is not None and moisture < 25:
        recommendations.append("💧 Low soil moisture - water before applying fertilizer for better absorption.")

    if fertilizer_name == 'Urea' and nitrogen > 45:
        recommendations.append(f"⚖️ Current nitrogen level ({nitrogen} kg/ha) is high - consider reducing quantity to avoid excess.")
    elif fertilizer_name == 'DAP' and phosphorous > 28:
        recommendations.append(f"⚖️ Phosphorous level ({phosphorous} kg/ha) is adequate - focus on nitrogen for balanced growth.")

    if quantity < qty_range['min']:
        status = "Too Low"
        reason = f"{quantity} kg/acre is below minimum ({qty_range['min']} kg/acre) for {fertilizer_name}"
        recommendations.insert(0, f"✅ Increase to at least {qty_range['optimal_min']} kg/acre for effective results.")
    elif qty_range['optimal_min'] <= quantity <= qty_range['optimal_max']:
        status = "Optimal"
        reason = f"{quantity} kg/acre is ideal for {crop_type} in {soil_type} soil"
        recommendations.insert(0, "✅ Perfect amount! Apply in split doses for better absorption.")
    elif quantity <= qty_range['max']:
        status = "Slightly High"
        reason = f"{quantity} kg/acre is above optimal but acceptable"
        recommendations.insert(0, f"⚠️ Consider reducing to {qty_range['optimal_max']} kg/acre for cost efficiency.")
    else:
        status = "Too High"
        reason = f"{quantity} kg/acre exceeds maximum safe limit"
        recommendations.insert(0, f"❌ Reduce quantity to {qty_range['optimal_max']} kg/acre to avoid crop damage.")
        
    return status, reason, recommendations

# ==================== RISK SCORING (SAME LOGIC) ====================
def calculate_risk_score(compatibility, quantity_status, nitrogen, phosphorous, potassium, temperature=None, humidity=None, moisture=None):
    score = 0
    score += 0 if compatibility == "Compatible" else 25
    quantity_risk = {"Optimal": 0, "Slightly High": 12, "Too High": 30, "Too Low": 18}
    score += quantity_risk.get(quantity_status, 20)
    
    total_npk = nitrogen + phosphorous + potassium
    if total_npk > 90: score += 20
    elif total_npk < 20: score += 15

    if temperature is not None and (temperature > 35 or temperature < 10): score += 15
    if humidity is not None and (humidity > 85 or humidity < 25): score += 5
    if moisture is not None and moisture < 20: score += 10
    
    return min(score, 100)

# ==================== AUTH ENDPOINTS ====================
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if users_collection.find_one({'email': data['email']}):
            return jsonify({'error': 'Email already registered'}), 400
        user = {
            'name': data['name'],
            'email': data['email'],
            'password': generate_password_hash(data['password']),
            'created_at': datetime.now(timezone.utc)
        }
        result = users_collection.insert_one(user)
        
        farm_size = float(data.get('farm_size', 0)) if data.get('farm_size') else 0.0
        farm = {
            'user_id': result.inserted_id,
            'location': data.get('location', ''),
            'farm_size': farm_size,
            'soil_type': data.get('soil_type', 'Loamy'),
            'created_at': datetime.now(timezone.utc)
        }
        farms_collection.insert_one(farm)
        
        token = jwt.encode({'user_id': str(result.inserted_id)}, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': {'id': str(result.inserted_id), 'name': user['name'], 'email': user['email']}
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = users_collection.find_one({'email': data['email']})
        if not user or not check_password_hash(user['password'], data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        token = jwt.encode({'user_id': str(user['_id'])}, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {'id': str(user['_id']), 'name': user['name'], 'email': user['email']}
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/farm', methods=['GET'])
@token_required
def get_farm(current_user):
    try:
        farm = farms_collection.find_one({'user_id': current_user['_id']})
        if farm:
            farm['_id'] = str(farm['_id'])
            farm['user_id'] = str(farm['user_id'])
            return jsonify(farm)
        return jsonify({})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/farm', methods=['PUT'])
@token_required
def update_farm(current_user):
    try:
        data = request.get_json()
        farms_collection.update_one(
            {'user_id': current_user['_id']},
            {'$set': {
                'location': data.get('location', ''),
                'farm_size': float(data.get('farm_size', 0)) if data.get('farm_size') else 0,
                'soil_type': data.get('soil_type', 'Loamy'),
                'updated_at': datetime.now(timezone.utc)
            }}
        )
        return jsonify({'message': 'Farm updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PREDICT ENDPOINT ====================
@app.route('/predict', methods=['POST'])
@token_required
def predict(current_user):
    try:
        data = request.get_json()
        farm = farms_collection.find_one({'user_id': current_user['_id']})
        
        soil_type = farm.get('soil_type', 'Loamy') if farm else 'Loamy'
        farm_size = farm.get('farm_size', 0) if farm else 0
        location = farm.get('location', 'Your farm') if farm else 'Your farm'

        inputs = {
            'Temparature': float(data.get('Temparature', 26)),
            'Humidity': float(data.get('Humidity', 52)),
            'Moisture': float(data.get('Moisture', 38)),
            'Soil_Type': soil_type,
            'Crop_Type': str(data.get('Crop_Type', 'Maize')).strip(),
            'Nitrogen': float(data.get('Nitrogen', 0)),
            'Potassium': float(data.get('Potassium', 0)),
            'Phosphorous': float(data.get('Phosphorous', 0)),
            'Fertilizer_Name': str(data.get('Fertilizer_Name', 'Urea')).strip(),
            'Fertilizer_Quantity': float(data.get('Fertilizer_Quantity', 50))
        }

        if not inputs['Fertilizer_Name'] or inputs['Fertilizer_Quantity'] <= 0:
            return jsonify({'error': 'Fertilizer name and quantity required'}), 400

        is_compatible, compat_reason, suggested_alt = check_compatibility(
            inputs['Crop_Type'], inputs['Soil_Type'], inputs['Fertilizer_Name'],
            temperature=inputs['Temparature'], humidity=inputs['Humidity'], moisture=inputs['Moisture']
        )

        qty_status, qty_reason, qty_recommendations = assess_quantity(
            inputs['Fertilizer_Name'], inputs['Fertilizer_Quantity'], inputs['Crop_Type'], inputs['Soil_Type'],
            temperature=inputs['Temparature'], humidity=inputs['Humidity'], moisture=inputs['Moisture'],
            nitrogen=inputs['Nitrogen'], phosphorous=inputs['Phosphorous'], potassium=inputs['Potassium']
        )

        risk_score = calculate_risk_score(
            "Compatible" if is_compatible else "Incompatible", qty_status,
            inputs['Nitrogen'], inputs['Phosphorous'], inputs['Potassium'],
            temperature=inputs['Temparature'], humidity=inputs['Humidity'], moisture=inputs['Moisture']
        )

        if risk_score <= 20: overall_status = "Low Risk - Excellent Choice"
        elif risk_score <= 35: overall_status = "Moderate Risk - Acceptable"
        elif risk_score <= 50: overall_status = "Moderate-High Risk - Review Recommended"
        else: overall_status = "High Risk - Not Recommended"

        all_recommendations = qty_recommendations.copy()
        
        # Simple crop advice lookup
        crop_advice = {'maize': "🌽 Maize is a heavy feeder - ensure nitrogen during growth.", 'paddy': "🌾 Paddy requires flooded conditions."}
        crop_key = inputs['Crop_Type'].lower()
        if crop_key in crop_advice: all_recommendations.append(crop_advice[crop_key])

        result = {
            'compatibility': 'Compatible' if is_compatible else 'Incompatible',
            'compatibility_reason': compat_reason,
            'quantity_status': qty_status,
            'quantity_reason': qty_reason,
            'recommendations': all_recommendations,
            'suggested_fertilizer': suggested_alt,
            'risk_score': round(risk_score, 1),
            'status': overall_status,
            'recommended_fertilizer': inputs['Fertilizer_Name'] if is_compatible else (suggested_alt or inputs['Fertilizer_Name']),
            'personalized_context': {
                'farm_location': location,
                'soil_type': inputs['Soil_Type'],
                'weather_summary': f"Temp: {inputs['Temparature']}°C, Humidity: {inputs['Humidity']}%"
            }
        }

        if history_collection is not None:
            history_entry = {
                'user_id': str(current_user['_id']),
                'timestamp': datetime.now(timezone.utc),
                'input_data': inputs,
                **result
            }
            history_collection.insert_one(history_entry)

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HISTORY ENDPOINT ====================
@app.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    try:
        if history_collection is None: return jsonify([])
        records = list(history_collection.find({'user_id': str(current_user['_id'])}).sort('timestamp', -1).limit(20))
        for record in records:
            record['_id'] = str(record['_id'])
            if 'timestamp' in record and hasattr(record['timestamp'], 'isoformat'):
                record['timestamp'] = record['timestamp'].isoformat()
        return jsonify(records)
    except Exception as e:
        return jsonify([])

# ==================== ANALYTICS DASHBOARD ====================
@app.route('/farmer-analytics', methods=['GET'])
@token_required
def get_farmer_analytics(current_user):
    try:
        history = list(history_collection.find({'user_id': str(current_user['_id'])}).sort('timestamp', -1).limit(50))
        total = len(history)
        if total == 0:
            return jsonify({'total_analyses': 0, 'message': 'No analysis data yet.'})

        compatible = sum(1 for h in history if h.get('compatibility') == 'Compatible')
        
        reversed_history = list(reversed(history))
        dates = [h['timestamp'].strftime('%Y-%m-%d') for h in reversed_history]
        risk_scores = [h.get('risk_score', 0) for h in reversed_history]

        return jsonify({
            'total_analyses': total,
            'success_rate': round((compatible / total * 100), 1),
            'time_series': {'dates': dates, 'risk_scores': risk_scores},
            'npk_averages': {
                'nitrogen': round(sum(h['input_data']['Nitrogen'] for h in history) / total, 1),
                'phosphorous': round(sum(h['input_data']['Phosphorous'] for h in history) / total, 1),
                'potassium': round(sum(h['input_data']['Potassium'] for h in history) / total, 1)
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HELPERS & PDF ====================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'mongodb': 'connected' if history_collection is not None else 'disconnected',
        'dataset_loaded': df is not None
    })

@app.route('/fertilizers', methods=['GET'])
def get_fertilizers():
    if df is not None:
        # Get unique values from the list of dicts
        fertilizers = list(set(str(row.get('Fertilizer Name', '')).strip() for row in df if row.get('Fertilizer Name')))
        return jsonify(sorted(fertilizers))
    return jsonify(['Urea', 'DAP', '14-35-14', '28-28', '20-20', '17-17-17', '10-26-26'])

@app.route('/generate-report', methods=['POST'])
@token_required
def generate_report(current_user):
    try:
        data = request.get_json()
        result = data.get('result', {})
        inputs = data.get('inputs', {})
        farm = data.get('farm', {})
        
        # Professional HTML template
        html_report = f"""<!DOCTYPE html><html><head><title>Report</title><style>body{{font-family:sans-serif;padding:40px;}}.header{{border-bottom:3px solid #27ae60;}}.status{{padding:10px;background:#27ae60;color:white;}}</style></head><body>
        <div class="header"><h1>🌾 Fertilizer Analysis Report</h1><p>{datetime.now().strftime('%Y-%m-%d')}</p></div>
        <h3>Farmer: {current_user.get('name')}</h3>
        <p><strong>Crop:</strong> {inputs.get('Crop_Type')} | <strong>Soil:</strong> {farm.get('soil_type')}</p>
        <div class="status">{result.get('status')}</div>
        <h4>Recommendations:</h4><ul>{''.join([f'<li>{r}</li>' for r in result.get('recommendations', [])])}</ul>
        <button onclick="window.print()">🖨️ Print Report</button></body></html>"""
        
        return html_report, 200, {'Content-Type': 'text/html'}
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    load_data()
    PORT = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=PORT, debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true')