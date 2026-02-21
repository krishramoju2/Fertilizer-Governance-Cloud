from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from urllib.parse import quote_plus
import pandas as pd
import os
from datetime import datetime, timezone
import numpy as np
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps

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

# ==================== DATASET LOADING ====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'Fertilizer Prediction.csv')
df = None

def load_data():
    global df
    try:
        df = pd.read_csv(DATA_FILE)
        df.columns = df.columns.str.strip()
        for col in df.select_dtypes(include=['object', 'str']).columns:
            df[col] = df[col].astype(str).str.strip()
        print(f"✅ Dataset loaded: {len(df)} records from {DATA_FILE}")
        return True
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

# ==================== COMPATIBILITY LOGIC (PERSONALIZED) ====================
def check_compatibility(crop_type, soil_type, fertilizer_name, temperature=None, humidity=None, moisture=None):
    if df is None:
        return True, "Dataset not loaded - proceeding with default logic", None
    
    try:
        matches = df[(df['Crop Type'].str.lower() == str(crop_type).lower()) & 
                     (df['Soil Type'].str.lower() == str(soil_type).lower())]
        
        if len(matches) == 0:
            crop_matches = df[df['Crop Type'].str.lower() == str(crop_type).lower()]
            if len(crop_matches) > 0:
                fertilizer_freq = crop_matches['Fertilizer Name'].value_counts()
                if fertilizer_name in fertilizer_freq.index:
                    return True, f"{fertilizer_name} is commonly used for {crop_type}", None
                else:
                    top_alt = fertilizer_freq.index[0] if len(fertilizer_freq) > 0 else "Urea"
                    return False, f"{fertilizer_name} is not commonly used for {crop_type}", str(top_alt)
            return True, f"No historical data for {crop_type} in {soil_type} soil", None
        
        fertilizer_counts = matches['Fertilizer Name'].value_counts()
        total_matches = len(matches)
        
        if fertilizer_name in fertilizer_counts.index:
            freq = fertilizer_counts[fertilizer_name]
            percentage = (freq / total_matches) * 100
            
            # Personalized weather context
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
                top_fert = fertilizer_counts.index[0]
                return False, f"{fertilizer_name} is rarely used ({percentage:.1f}%). {top_fert} is preferred for {crop_type}", str(top_fert)
        else:
            top_fert = fertilizer_counts.index[0] if len(fertilizer_counts) > 0 else "Urea"
            return False, f"{fertilizer_name} has no historical usage for {crop_type} in {soil_type} soil. Try {top_fert}", str(top_fert)
            
    except Exception as e:
        print(f"⚠️ Compatibility check error: {e}")
        return True, "Compatibility check failed - proceeding", None

# ==================== QUANTITY ASSESSMENT (PERSONALIZED) ====================
def assess_quantity(fertilizer_name, quantity, crop_type, soil_type, temperature=None, humidity=None, moisture=None, nitrogen=0, phosphorous=0, potassium=0):
    recommendations = []
    qty_range = QUANTITY_RANGES.get(fertilizer_name, {'min': 20, 'max': 60, 'optimal_min': 30, 'optimal_max': 50}).copy()
    
    # Soil-specific adjustments
    if soil_type.lower() == 'sandy':
        qty_range['optimal_min'] += 5
        qty_range['optimal_max'] += 10
        recommendations.append("🌱 Sandy soil drains quickly - consider split applications to prevent leaching.")
    elif soil_type.lower() == 'clayey':
        qty_range['optimal_max'] -= 5
        recommendations.append("🌱 Clay soil retains nutrients well - avoid over-application to prevent buildup.")
    elif soil_type.lower() == 'black':
        recommendations.append("🌱 Black soil is naturally fertile - moderate application is usually sufficient.")
    
    # Weather-specific adjustments
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
    
    # NPK balance personalization
    if fertilizer_name == 'Urea' and nitrogen > 45:
        recommendations.append(f"⚖️ Current nitrogen level ({nitrogen} kg/ha) is high - consider reducing quantity to avoid excess.")
    elif fertilizer_name == 'DAP' and phosphorous > 28:
        recommendations.append(f"⚖️ Phosphorous level ({phosphorous} kg/ha) is adequate - focus on nitrogen for balanced growth.")
    
    # Assess quantity against personalized range
    if quantity < qty_range['min']:
        status = "Too Low"
        reason = f"{quantity} kg/acre is below minimum ({qty_range['min']} kg/acre) for {fertilizer_name} in {soil_type} soil"
        recommendations.insert(0, f"✅ Increase to at least {qty_range['optimal_min']} kg/acre for effective results with {crop_type}.")
        recommendations.append("📉 Under-application may lead to nutrient deficiency and reduced yield.")
    elif qty_range['optimal_min'] <= quantity <= qty_range['optimal_max']:
        status = "Optimal"
        reason = f"{quantity} kg/acre is ideal for {crop_type} in {soil_type} soil ({qty_range['optimal_min']}-{qty_range['optimal_max']} kg/acre range)"
        recommendations.insert(0, "✅ Perfect amount! Apply in split doses for better nutrient absorption.")
        recommendations.append("📊 Monitor crop response and adjust future applications based on growth stages.")
    elif quantity <= qty_range['max']:
        status = "Slightly High"
        reason = f"{quantity} kg/acre is above optimal but acceptable for {fertilizer_name}"
        recommendations.insert(0, f"⚠️ Consider reducing to {qty_range['optimal_max']} kg/acre for cost efficiency.")
        recommendations.append("👀 Watch for signs of nutrient burn, especially in young plants.")
    else:
        status = "Too High"
        reason = f"{quantity} kg/acre exceeds maximum ({qty_range['max']} kg/acre) for {fertilizer_name} in {soil_type} soil"
        recommendations.insert(0, f"❌ Reduce quantity to {qty_range['optimal_max']} kg/acre to avoid crop damage.")
        recommendations.append("🌍 Excess fertilizer can cause soil degradation and environmental runoff.")
        recommendations.append("🔬 Consider soil testing before next application to optimize nutrient levels.")
    
    return status, reason, recommendations

# ==================== RISK SCORING (PERSONALIZED) ====================
def calculate_risk_score(compatibility, quantity_status, nitrogen, phosphorous, potassium, temperature=None, humidity=None, moisture=None):
    score = 0
    
    # Compatibility contribution (0-25 points)
    score += 0 if compatibility == "Compatible" else 25
    
    # Quantity contribution (0-25 points)
    quantity_risk = {"Optimal": 0, "Slightly High": 12, "Too High": 30, "Too Low": 18, "Low": 18}
    score += quantity_risk.get(quantity_status, 20)
    
    # NPK imbalance (0-20 points)
    total_npk = nitrogen + phosphorous + potassium
    if total_npk > 90:
        score += 20
    elif total_npk < 20 and nitrogen < 20 and phosphorous < 20:
        score += 15
    
    # Weather stress factors (0-20 points)
    if temperature is not None:
        if temperature > 35 or temperature < 10:
            score += 15
        elif temperature > 30 or temperature < 15:
            score += 8
    
    if humidity is not None:
        if humidity > 85 or humidity < 25:
            score += 5
    
    if moisture is not None:
        if moisture < 20:
            score += 10
        elif moisture > 70:
            score += 5
    
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
        
        farm_size_raw = data.get('farm_size', 0)
        farm_size = float(farm_size_raw) if farm_size_raw and str(farm_size_raw).strip() else 0.0
        
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
        print(f"❌ Registration error: {e}")
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
        print(f"❌ Login error: {e}")
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
        print(f"❌ Get farm error: {e}")
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
        print(f"❌ Update farm error: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== PREDICT ENDPOINT (PERSONALIZED) - WITH FIX ====================
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
            return jsonify({'error': 'Fertilizer name and positive quantity required'}), 400
        
        # Personalized compatibility check
        is_compatible, compat_reason, suggested_alt = check_compatibility(
            inputs['Crop_Type'], 
            inputs['Soil_Type'], 
            inputs['Fertilizer_Name'],
            temperature=inputs['Temparature'],
            humidity=inputs['Humidity'],
            moisture=inputs['Moisture']
        )
        
        # Personalized quantity assessment
        qty_status, qty_reason, qty_recommendations = assess_quantity(
            inputs['Fertilizer_Name'], 
            inputs['Fertilizer_Quantity'],
            inputs['Crop_Type'], 
            inputs['Soil_Type'],
            temperature=inputs['Temparature'],
            humidity=inputs['Humidity'],
            moisture=inputs['Moisture'],
            nitrogen=inputs['Nitrogen'],
            phosphorous=inputs['Phosphorous'],
            potassium=inputs['Potassium']
        )
        
        # Personalized risk scoring
        risk_score = calculate_risk_score(
            "Compatible" if is_compatible else "Incompatible",
            qty_status, 
            inputs['Nitrogen'], 
            inputs['Phosphorous'], 
            inputs['Potassium'],
            temperature=inputs['Temparature'],
            humidity=inputs['Humidity'],
            moisture=inputs['Moisture']
        )
        
        # Personalized overall status
        if risk_score <= 20:
            overall_status = "Low Risk - Excellent Choice for Your Farm"
        elif risk_score <= 35:
            overall_status = "Moderate Risk - Acceptable with Monitoring"
        elif risk_score <= 50:
            overall_status = "Moderate-High Risk - Review Recommended"
        else:
            overall_status = "High Risk - Not Recommended for Current Conditions"
        
        # Build personalized recommendations
        all_recommendations = qty_recommendations.copy()
        
        # Crop-specific personalized advice
        crop_advice = {
            'maize': "🌽 Maize is a heavy feeder - ensure adequate nitrogen throughout vegetative and reproductive stages.",
            'paddy': "🌾 Paddy requires flooded conditions - apply fertilizer before final flooding for best uptake.",
            'wheat': "🌾 Wheat benefits from split nitrogen application at tillering and jointing stages.",
            'cotton': "🌿 Cotton needs balanced nutrition - monitor for micronutrient deficiencies like zinc and boron.",
            'sugarcane': "🎋 Sugarcane has high potassium demand - ensure adequate K throughout growth cycle.",
            'tobacco': "🍃 Tobacco is sensitive to chlorine - avoid chloride-containing fertilizers.",
            'barley': "🌾 Barley tolerates saline soils - adjust fertilizer timing based on soil salinity.",
            'millets': "🌾 Millets are drought-tolerant - apply fertilizer with pre-monsoon showers for best results.",
            'pulses': "🫘 Pulses fix nitrogen - reduce nitrogen fertilizer and focus on phosphorous for nodulation.",
            'ground nuts': "🥜 Ground nuts need calcium - apply gypsum at pegging stage for better pod development.",
            'oil seeds': "🌻 Oil seeds require sulfur - ensure adequate S for oil synthesis and yield."
        }
        crop_key = inputs['Crop_Type'].lower()
        if crop_key in crop_advice:
            all_recommendations.append(crop_advice[crop_key])
        
        # Soil-specific timing advice
        soil_timing = {
            'sandy': "⏰ For sandy soil: Apply fertilizer closer to planting time (within 1 week) to prevent leaching.",
            'loamy': "⏰ For loamy soil: Ideal for most fertilizers - apply 1-2 weeks before planting for even distribution.",
            'black': "⏰ For black soil: Apply fertilizer during dry periods for better incorporation into soil.",
            'red': "⏰ For red soil: May need micronutrients - consider soil test for zinc and iron supplementation.",
            'clayey': "⏰ For clayey soil: Apply fertilizer 2-3 weeks before planting for better distribution and reduced runoff."
        }
        soil_key = inputs['Soil_Type'].lower()
        if soil_key in soil_timing:
            all_recommendations.append(soil_timing[soil_key])
        
        # Weather-specific personalized advice
        if inputs['Temparature'] > 30 and inputs['Humidity'] < 40:
            all_recommendations.append("🔥 Hot & dry conditions: Irrigate immediately after fertilizer application to prevent burn.")
        elif inputs['Humidity'] > 75:
            all_recommendations.append("🌧️ High humidity: Watch for fungal diseases - ensure good air circulation around plants.")
        elif inputs['Moisture'] < 25:
            all_recommendations.append("💧 Low soil moisture: Water the field 1-2 days before fertilizer application for optimal uptake.")
        
        # Farm size considerations
        if farm_size > 0:
            if farm_size < 2:
                all_recommendations.append("📏 Small farm tip: Hand-application is feasible - ensure even distribution across the plot.")
            elif farm_size > 10:
                all_recommendations.append(f"📏 Large farm ({farm_size} acres): Consider mechanized application for uniform coverage and cost savings.")
        
        # Location-based seasonal hint (simple)
        if location and any(region in location.lower() for region in ['andhra', 'telangana', 'tamil', 'karnataka']):
            all_recommendations.append("🗓️ South India tip: Align fertilizer application with monsoon onset for maximum efficiency.")
        elif location and any(region in location.lower() for region in ['punjab', 'haryana', 'up', 'rajasthan']):
            all_recommendations.append("🗓️ North India tip: Apply fertilizer before winter crops establish for better root uptake.")
        
        if not is_compatible and suggested_alt:
            all_recommendations.insert(0, f"⚠️ Consider switching to {suggested_alt} for better compatibility with {inputs['Crop_Type']} in {inputs['Soil_Type']} soil at your location.")
        
        if inputs['Fertilizer_Quantity'] > 60:
            all_recommendations.append("💧 Ensure adequate irrigation to prevent fertilizer burn and nutrient runoff.")
        
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
                'farm_size_acres': farm_size,
                'weather_summary': f"Temp: {inputs['Temparature']}°C, Humidity: {inputs['Humidity']}%, Soil Moisture: {inputs['Moisture']}%",
                'crop_nutrient_focus': f"{inputs['Crop_Type']} with N:{inputs['Nitrogen']}, P:{inputs['Phosphorous']}, K:{inputs['Potassium']} kg/ha"
            }
        }
        
        # ✅ FIXED: Save to MongoDB with string user_id for consistent querying
        if history_collection is not None:
            try:
                history_entry = {
                    'user_id': str(current_user['_id']),  # ← Store as STRING for consistent querying
                    'timestamp': datetime.now(timezone.utc),
                    'input_data': inputs,
                    **result
                }
                history_collection.insert_one(history_entry)
            except Exception as e:
                print(f"⚠️ Failed to save to MongoDB: {e}")
        
        return jsonify(result)
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== HISTORY ENDPOINT - FIXED QUERY ====================
@app.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    try:
        if history_collection is None:
            return jsonify([])
        
        # ✅ FIXED: Query by string user_id to match stored data
        records = list(history_collection.find({'user_id': str(current_user['_id'])}).sort('timestamp', -1).limit(20))
        
        for record in records:
            record['_id'] = str(record['_id'])
            if 'user_id' in record:
                record['user_id'] = str(record['user_id'])
            if 'timestamp' in record and hasattr(record['timestamp'], 'isoformat'):
                record['timestamp'] = record['timestamp'].isoformat()
            if 'input_data' in record and isinstance(record['input_data'], dict):
                for key, value in record['input_data'].items():
                    if isinstance(value, ObjectId):
                        record['input_data'][key] = str(value)
        
        return jsonify(records)
    except Exception as e:
        print(f"❌ History fetch error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify([])

# ==================== HEALTH CHECK ====================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'mongodb': 'connected' if history_collection is not None else 'disconnected',
        'dataset_loaded': df is not None
    })

# ==================== FERTILIZERS ENDPOINT ====================
@app.route('/fertilizers', methods=['GET'])
def get_fertilizers():
    if df is not None:
        fertilizers = df['Fertilizer Name'].dropna().unique().tolist()
        return jsonify([str(f).strip() for f in fertilizers if pd.notna(f)])
    return jsonify(['Urea', 'DAP', '14-35-14', '28-28', '20-20', '17-17-17', '10-26-26'])

# ==================== PDF REPORT GENERATION ====================
@app.route('/generate-report', methods=['POST'])
@token_required
def generate_report(current_user):
    try:
        data = request.get_json()
        result = data.get('result', {})
        inputs = data.get('inputs', {})
        farm = data.get('farm', {})
        
        # Generate professional HTML report
        html_report = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fertilizer Analysis Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; padding: 40px; color: #333; }}
                .header {{ text-align: center; border-bottom: 3px solid #27ae60; padding-bottom: 20px; margin-bottom: 30px; }}
                .header h1 {{ color: #27ae60; margin: 0; }}
                .section {{ margin-bottom: 25px; }}
                .section h2 {{ color: #2c3e50; border-left: 4px solid #27ae60; padding-left: 10px; }}
                .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
                .card {{ background: #f8f9fa; padding: 15px; border-radius: 8px; }}
                .label {{ font-weight: bold; color: #7f8c8d; font-size: 12px; }}
                .value {{ font-size: 16px; margin: 5px 0; }}
                .status {{ padding: 10px; border-radius: 6px; color: white; font-weight: bold; text-align: center; }}
                .status-good {{ background: #27ae60; }}
                .status-warning {{ background: #f39c12; }}
                .status-bad {{ background: #e74c3c; }}
                .recommendations {{ background: #e8f4fd; padding: 15px; border-radius: 8px; }}
                .recommendations li {{ margin: 5px 0; }}
                .footer {{ margin-top: 40px; text-align: center; font-size: 12px; color: #95a5a6; border-top: 1px solid #ddd; padding-top: 20px; }}
                @media print {{ .no-print {{ display: none; }} }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🌾 Fertilizer Analysis Report</h1>
                <p>Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
            </div>
            
            <div class="section">
                <h2>📍 Farm Details</h2>
                <div class="grid">
                    <div class="card">
                        <div class="label">Farmer Name</div>
                        <div class="value">{current_user.get('name', 'N/A')}</div>
                    </div>
                    <div class="card">
                        <div class="label">Location</div>
                        <div class="value">{farm.get('location', 'N/A')}</div>
                    </div>
                    <div class="card">
                        <div class="label">Soil Type</div>
                        <div class="value">{farm.get('soil_type', 'N/A')}</div>
                    </div>
                    <div class="card">
                        <div class="label">Farm Size</div>
                        <div class="value">{farm.get('farm_size', 0)} acres</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🌦️ Weather & Crop Conditions</h2>
                <div class="grid">
                    <div class="card">
                        <div class="label">Crop Type</div>
                        <div class="value">{inputs.get('Crop_Type', 'N/A')}</div>
                    </div>
                    <div class="card">
                        <div class="label">Temperature</div>
                        <div class="value">{inputs.get('Temparature', 0)}°C</div>
                    </div>
                    <div class="card">
                        <div class="label">Humidity</div>
                        <div class="value">{inputs.get('Humidity', 0)}%</div>
                    </div>
                    <div class="card">
                        <div class="label">Soil Moisture</div>
                        <div class="value">{inputs.get('Moisture', 0)}%</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🧪 Fertilizer Analysis</h2>
                <div class="grid">
                    <div class="card">
                        <div class="label">Fertilizer Name</div>
                        <div class="value">{inputs.get('Fertilizer_Name', 'N/A')}</div>
                    </div>
                    <div class="card">
                        <div class="label">Quantity</div>
                        <div class="value">{inputs.get('Fertilizer_Quantity', 0)} kg/acre</div>
                    </div>
                    <div class="card">
                        <div class="label">Compatibility</div>
                        <div class="value">{result.get('compatibility', 'N/A')}</div>
                    </div>
                    <div class="card">
                        <div class="label">Quantity Status</div>
                        <div class="value">{result.get('quantity_status', 'N/A')}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📊 Results Summary</h2>
                <div class="grid">
                    <div class="card">
                        <div class="label">Overall Status</div>
                        <div class="value">
                            <div class="status {'status-good' if 'Low Risk' in result.get('status', '') else 'status-warning' if 'Moderate' in result.get('status', '') else 'status-bad'}">
                                {result.get('status', 'N/A')}
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="label">Risk Score</div>
                        <div class="value">{result.get('risk_score', 0)} / 100</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>💡 Personalized Recommendations</h2>
                <div class="recommendations">
                    <ul>
                        {''.join([f'<li>{rec}</li>' for rec in result.get('recommendations', [])])}
                    </ul>
                </div>
            </div>
            
            {f'''
            <div class="section">
                <h2>🔄 Suggested Alternative</h2>
                <div class="card" style="background: #fff3cd; border: 1px solid #ffc107;">
                    Consider <strong>{result.get('suggested_fertilizer', 'N/A')}</strong> for better compatibility.
                </div>
            </div>
            ''' if result.get('suggested_fertilizer') else ''}
            
            <div class="footer">
                <p>This report is generated by Fertilizer Governance Cloud Platform</p>
                <p>Report ID: {datetime.now().strftime('%Y%m%d%H%M%S')}</p>
            </div>
            
            <button class="no-print" onclick="window.print()" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin: 20px auto; display: block;">🖨️ Print / Save as PDF</button>
        </body>
        </html>
        """
        
        return html_report, 200, {'Content-Type': 'text/html'}
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== FARMER ANALYTICS DASHBOARD - FIXED QUERY ====================
@app.route('/farmer-analytics', methods=['GET'])
@token_required
def get_farmer_analytics(current_user):
    """
    Aggregates farmer's historical data for analytics dashboard charts.
    Returns chart-ready JSON that updates as more analyses are added.
    """
    try:
        # ✅ FIXED: Query by string user_id to match stored data
        history = list(history_collection.find(
            {'user_id': str(current_user['_id'])}
        ).sort('timestamp', -1).limit(50))
        
        total = len(history)
        if total == 0:
            return jsonify({
                'total_analyses': 0,
                'message': 'No analysis data yet. Run your first fertilizer analysis to see insights!'
            })
        
        # 1. Success Rate (Compatibility Distribution)
        compatible = sum(1 for h in history if h.get('compatibility') == 'Compatible')
        incompatible = total - compatible
        success_rate = round((compatible / total * 100), 1)
        
        # 2. Quantity Status Distribution
        qty_status_counts = {}
        for h in history:
            status = h.get('quantity_status', 'Unknown')
            qty_status_counts[status] = qty_status_counts.get(status, 0) + 1
        
        # 3. Time Series Data (for trend charts)
        # Reverse to get chronological order (oldest first)
        reversed_history = list(reversed(history))
        dates = [h['timestamp'].strftime('%Y-%m-%d') for h in reversed_history]
        quantities = [h['input_data']['Fertilizer_Quantity'] for h in reversed_history]
        risk_scores = [h.get('risk_score', 0) for h in reversed_history]
        
        # 4. Crop Distribution
        crop_counts = {}
        for h in history:
            crop = h['input_data'].get('Crop_Type', 'Unknown')
            crop_counts[crop] = crop_counts.get(crop, 0) + 1
        
        # 5. Fertilizer Usage Distribution
        fertilizer_counts = {}
        for h in history:
            fert = h['input_data'].get('Fertilizer_Name', 'Unknown')
            fertilizer_counts[fert] = fertilizer_counts.get(fert, 0) + 1
        
        # 6. NPK Averages
        avg_n = sum(h['input_data']['Nitrogen'] for h in history) / total
        avg_p = sum(h['input_data']['Phosphorous'] for h in history) / total
        avg_k = sum(h['input_data']['Potassium'] for h in history) / total
        
        # 7. Cost Estimate (assuming average ₹25/kg for calculation)
        costs = [q * 25 for q in quantities]  # ₹25/kg average price
        total_cost = sum(costs)
        
        return jsonify({
            'total_analyses': total,
            'success_rate': success_rate,
            'compatibility_distribution': {
                'Compatible': compatible,
                'Incompatible': incompatible
            },
            'quantity_status_distribution': qty_status_counts,
            'time_series': {
                'dates': dates,
                'quantities': quantities,
                'risk_scores': risk_scores,
                'costs': costs
            },
            'crop_distribution': crop_counts,
            'fertilizer_distribution': fertilizer_counts,
            'npk_averages': {
                'nitrogen': round(avg_n, 1),
                'phosphorous': round(avg_p, 1),
                'potassium': round(avg_k, 1)
            },
            'cost_summary': {
                'total_season_cost': round(total_cost, 2),
                'average_cost_per_analysis': round(total_cost / total, 2) if total > 0 else 0
            }
        })
        
    except Exception as e:
        print(f"❌ Analytics error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== STARTUP ====================
if __name__ == '__main__':
    load_data()
    PORT = int(os.getenv('PORT', 5000))
    print(f"🚀 Starting server on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true')