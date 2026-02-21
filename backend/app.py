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

# ==================== DATASET LOADING (PANDAS-FREE) ====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'fertilizer_data.json')
CSV_FILE = os.path.join(BASE_DIR, 'Fertilizer Prediction.csv')
df = None 

def load_data():
    global df
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                df = json.load(f)
            print(f"✅ Dataset loaded: {len(df)} records")
            return True
        elif os.path.exists(CSV_FILE):
            import pandas as pd
            temp_df = pd.read_csv(CSV_FILE)
            temp_df.columns = temp_df.columns.str.strip()
            df = temp_df.to_dict(orient='records')
            print(f"✅ Loaded from CSV fallback")
            return True
        return False
    except Exception as e:
        print(f"❌ Load error: {e}")
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

# ==================== LOGIC FUNCTIONS ====================
def check_compatibility(crop_type, soil_type, fertilizer_name, temperature=None, humidity=None, moisture=None):
    if df is None: return True, "Proceeding with default logic", None
    try:
        matches = [r for r in df if str(r.get('Crop Type','')).lower() == str(crop_type).lower() and str(r.get('Soil Type','')).lower() == str(soil_type).lower()]
        if not matches:
            crop_m = [r for r in df if str(r.get('Crop Type','')).lower() == str(crop_type).lower()]
            if crop_m:
                counts = Counter(r.get('Fertilizer Name','') for r in crop_m)
                if fertilizer_name in counts: return True, f"Common for {crop_type}", None
                top = counts.most_common(1)[0][0]
                return False, f"Not common for {crop_type}", str(top)
            return True, "No historical data", None
        
        counts = Counter(r.get('Fertilizer Name','') for r in matches)
        total = len(matches)
        if fertilizer_name in counts:
            perc = (counts[fertilizer_name] / total) * 100
            status = perc >= 15
            return status, f"{fertilizer_name} is {perc:.1f}% suitable", None
        top = counts.most_common(1)[0][0]
        return False, f"Preferred: {top}", str(top)
    except: return True, "Error in check", None

def assess_quantity(fert, qty, crop, soil, temp=None, hum=None, moist=None, n=0, p=0, k=0):
    recommendations = []
    r = QUANTITY_RANGES.get(fert, {'min': 20, 'max': 60, 'optimal_min': 30, 'optimal_max': 50}).copy()
    
    if soil.lower() == 'sandy': r['optimal_min'] += 5; recommendations.append("🌱 Sandy soil: use split doses.")
    if temp and temp > 32: r['optimal_min'] += 5; recommendations.append("🌡️ High temp increases demand.")
    
    if qty < r['min']:
        return "Too Low", f"Below {r['min']} kg/acre", recommendations + [f"✅ Aim for {r['optimal_min']} kg"]
    elif r['optimal_min'] <= qty <= r['optimal_max']:
        return "Optimal", "Ideal range", recommendations + ["✅ Perfect amount!"]
    else:
        return "High", "Exceeds optimal", recommendations + ["⚠️ Monitor for burn"]

def calculate_risk_score(comp, q_stat, n, p, k, temp=None, hum=None, moist=None):
    score = 0
    if comp != "Compatible": score += 25
    score += {"Optimal": 0, "Too Low": 18, "High": 25}.get(q_stat, 20)
    if (n+p+k) > 90: score += 20
    if temp and (temp > 35 or temp < 10): score += 15
    return min(score, 100)

# ==================== ENDPOINTS ====================

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if users_collection.find_one({'email': data['email']}):
            return jsonify({'error': 'Email exists'}), 400
        user = {'name': data['name'], 'email': data['email'], 'password': generate_password_hash(data['password']), 'created_at': datetime.now(timezone.utc)}
        res = users_collection.insert_one(user)
        farm = {'user_id': res.inserted_id, 'location': data.get('location', ''), 'farm_size': float(data.get('farm_size', 0)), 'soil_type': data.get('soil_type', 'Loamy'), 'created_at': datetime.now(timezone.utc)}
        farms_collection.insert_one(farm)
        token = jwt.encode({'user_id': str(res.inserted_id)}, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'token': token, 'user': {'id': str(res.inserted_id), 'name': user['name']}}), 201
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = users_collection.find_one({'email': data['email']})
        if not user or not check_password_hash(user['password'], data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        token = jwt.encode({'user_id': str(user['_id'])}, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'token': token, 'user': {'id': str(user['_id']), 'name': user['name']}})
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/farm', methods=['GET', 'PUT'])
@token_required
def handle_farm(current_user):
    if request.method == 'GET':
        farm = farms_collection.find_one({'user_id': current_user['_id']})
        if farm: farm['_id'] = str(farm['_id']); farm['user_id'] = str(farm['user_id'])
        return jsonify(farm or {})
    else:
        data = request.get_json()
        farms_collection.update_one({'user_id': current_user['_id']}, {'$set': {'location': data.get('location'), 'farm_size': float(data.get('farm_size',0)), 'soil_type': data.get('soil_type'), 'updated_at': datetime.now(timezone.utc)}})
        return jsonify({'message': 'Updated'})

@app.route('/predict', methods=['POST'])
@token_required
def predict(current_user):
    try:
        data = request.get_json()
        farm = farms_collection.find_one({'user_id': current_user['_id']})
        soil = farm.get('soil_type', 'Loamy') if farm else 'Loamy'
        
        inputs = {
            'Temparature': float(data.get('Temparature', 26)),
            'Humidity': float(data.get('Humidity', 52)),
            'Moisture': float(data.get('Moisture', 38)),
            'Soil_Type': soil,
            'Crop_Type': str(data.get('Crop_Type', 'Maize')).strip(),
            'Nitrogen': float(data.get('Nitrogen', 0)),
            'Potassium': float(data.get('Potassium', 0)),
            'Phosphorous': float(data.get('Phosphorous', 0)),
            'Fertilizer_Name': str(data.get('Fertilizer_Name', 'Urea')).strip(),
            'Fertilizer_Quantity': float(data.get('Fertilizer_Quantity', 50))
        }

        is_comp, comp_r, alt = check_compatibility(inputs['Crop_Type'], inputs['Soil_Type'], inputs['Fertilizer_Name'], inputs['Temparature'], inputs['Humidity'], inputs['Moisture'])
        q_stat, q_reason, recs = assess_quantity(inputs['Fertilizer_Name'], inputs['Fertilizer_Quantity'], inputs['Crop_Type'], inputs['Soil_Type'], inputs['Temparature'], inputs['Humidity'], inputs['Moisture'], inputs['Nitrogen'], inputs['Phosphorous'], inputs['Potassium'])
        risk = calculate_risk_score("Compatible" if is_comp else "Incompatible", q_stat, inputs['Nitrogen'], inputs['Phosphorous'], inputs['Potassium'], inputs['Temparature'])

        res = {
            'compatibility': 'Compatible' if is_comp else 'Incompatible',
            'compatibility_reason': comp_r,
            'quantity_status': q_stat,
            'quantity_reason': q_reason,
            'recommendations': recs,
            'risk_score': round(risk, 1),
            'status': "Low Risk" if risk <= 20 else "Moderate Risk" if risk <= 50 else "High Risk",
            'suggested_fertilizer': alt
        }

        history_collection.insert_one({
            'user_id': str(current_user['_id']),
            'timestamp': datetime.now(timezone.utc),
            'input_data': inputs,
            **res
        })
        return jsonify(res)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/history', methods=['GET'])
@token_required
def get_history(current_user):
    records = list(history_collection.find({'user_id': str(current_user['_id'])}).sort('timestamp', -1).limit(20))
    for r in records:
        r['_id'] = str(r['_id'])
        if isinstance(r.get('timestamp'), datetime): r['timestamp'] = r['timestamp'].isoformat()
    return jsonify(records)

@app.route('/farmer-analytics', methods=['GET'])
@token_required
def get_farmer_analytics(current_user):
    try:
        # Crucial fix: filter by user_id string
        history = list(history_collection.find({'user_id': str(current_user['_id'])}).sort('timestamp', -1).limit(50))
        if not history: return jsonify({'total_analyses': 0})

        # Calculations
        comp_count = sum(1 for h in history if h.get('compatibility') == 'Compatible')
        
        # Safe NPK Averages
        n_vals = [h['input_data'].get('Nitrogen', 0) for h in history]
        p_vals = [h['input_data'].get('Phosphorous', 0) for h in history]
        k_vals = [h['input_data'].get('Potassium', 0) for h in history]
        
        # Time Series for Charts
        chart_data = list(reversed(history))
        dates = [h['timestamp'].strftime('%d %b') if isinstance(h['timestamp'], datetime) else "N/A" for h in chart_data]
        risks = [h.get('risk_score', 0) for h in chart_data]

        return jsonify({
            'total_analyses': len(history),
            'success_rate': round((comp_count / len(history) * 100), 1),
            'npk_averages': {
                'nitrogen': round(sum(n_vals)/len(n_vals), 1),
                'phosphorous': round(sum(p_vals)/len(p_vals), 1),
                'potassium': round(sum(k_vals)/len(k_vals), 1)
            },
            'time_series': {'dates': dates, 'risk_scores': risks}
        })
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'mongodb': 'connected' if history_collection is not None else 'disconnected', 'dataset_loaded': df is not None})

@app.route('/fertilizers', methods=['GET'])
def get_fertilizers():
    if df:
        f_list = list(set(str(r.get('Fertilizer Name','')).strip() for r in df if r.get('Fertilizer Name')))
        return jsonify(sorted(f_list))
    return jsonify(list(QUANTITY_RANGES.keys()))

@app.route('/generate-report', methods=['POST'])
@token_required
def generate_report(current_user):
    data = request.get_json()
    res = data.get('result', {})
    html = f"<html><body><h1>Report for {current_user.get('name')}</h1><p>Status: {res.get('status')}</p></body></html>"
    return html, 200, {'Content-Type': 'text/html'}

if __name__ == '__main__':
    load_data()
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)