from flask import Flask, request, jsonify, make_response
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

# ==================== JWT AUTH DECORATOR ====================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').split(" ")[1] if 'Authorization' in request.headers else None
        if not token: return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user: return jsonify({'message': 'User not found!'}), 401
        except: return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# ==================== DATASET LOADING ====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'fertilizer_data.json')
df = None 

def load_data():
    global df
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                df = json.load(f)
            return True
        return False
    except Exception as e:
        print(f"❌ Load error: {e}")
        return False

# ==================== CORE LOGIC ====================
QUANTITY_RANGES = {
    'Urea': {'min': 30, 'max': 70, 'optimal_min': 40, 'optimal_max': 60},
    'DAP': {'min': 25, 'max': 65, 'optimal_min': 35, 'optimal_max': 55},
    '28-28': {'min': 25, 'max': 60, 'optimal_min': 35, 'optimal_max': 50},
    '14-35-14': {'min': 20, 'max': 50, 'optimal_min': 30, 'optimal_max': 45},
    '20-20': {'min': 25, 'max': 55, 'optimal_min': 30, 'optimal_max': 45},
    '17-17-17': {'min': 30, 'max': 65, 'optimal_min': 40, 'optimal_max': 55},
    '10-26-26': {'min': 20, 'max': 50, 'optimal_min': 30, 'optimal_max': 45}
}

def check_compatibility(crop, soil, fert):
    if not df: return True, "Default check", None
    matches = [r for r in df if str(r.get('Crop Type','')).lower() == str(crop).lower() and str(r.get('Soil Type','')).lower() == str(soil).lower()]
    if not matches: return True, "Generic compatibility", None
    counts = Counter(r.get('Fertilizer Name','') for r in matches)
    if fert in counts: return True, f"High match for {crop}", None
    return False, f"Rarely used for {crop}", str(counts.most_common(1)[0][0])

def assess_quantity(fert, qty, soil):
    r = QUANTITY_RANGES.get(fert, {'min': 20, 'max': 60, 'optimal_min': 30, 'optimal_max': 50}).copy()
    recs = []
    if soil.lower() == 'sandy': recs.append("🌱 Sandy soil: Recommend split application.")
    if qty < r['min']: return "Too Low", f"Increase to {r['optimal_min']}kg", recs
    if qty > r['max']: return "Too High", f"Reduce to {r['optimal_max']}kg", recs
    return "Optimal", "Perfect dosage", recs + ["✅ Ready for application."]

# ==================== ENDPOINTS ====================

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if users_collection.find_one({'email': data['email']}): return jsonify({'error': 'Email exists'}), 400
    user_id = users_collection.insert_one({'name': data['name'], 'email': data['email'], 'password': generate_password_hash(data['password']), 'created_at': datetime.now(timezone.utc)}).inserted_id
    farms_collection.insert_one({'user_id': user_id, 'location': data.get('location', ''), 'farm_size': float(data.get('farm_size', 0)), 'soil_type': data.get('soil_type', 'Loamy')})
    token = jwt.encode({'user_id': str(user_id)}, app.config['SECRET_KEY'], algorithm='HS256')
    return jsonify({'token': token, 'user': {'id': str(user_id), 'name': data['name']}}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_collection.find_one({'email': data['email']})
    if not user or not check_password_hash(user['password'], data['password']): return jsonify({'error': 'Invalid'}), 401
    token = jwt.encode({'user_id': str(user['_id'])}, app.config['SECRET_KEY'], algorithm='HS256')
    return jsonify({'token': token, 'user': {'id': str(user['_id']), 'name': user['name']}})

@app.route('/predict', methods=['POST'])
@token_required
def predict(current_user):
    try:
        data = request.get_json()
        farm = farms_collection.find_one({'user_id': current_user['_id']}) or {}
        
        # Prepare inputs
        crop = str(data.get('Crop_Type', 'Maize')).strip()
        fert = str(data.get('Fertilizer_Name', 'Urea')).strip()
        qty = float(data.get('Fertilizer_Quantity', 50))
        soil = farm.get('soil_type', 'Loamy')

        # Logic
        is_comp, comp_r, alt = check_compatibility(crop, soil, fert)
        q_stat, q_r, recs = assess_quantity(fert, qty, soil)
        risk = 15 if is_comp and q_stat == "Optimal" else 45

        result = {
            'compatibility': 'Compatible' if is_comp else 'Incompatible',
            'compatibility_reason': comp_r,
            'quantity_status': q_stat,
            'quantity_reason': q_r,
            'recommendations': recs,
            'risk_score': risk,
            'status': "Low Risk" if risk < 30 else "High Risk",
            'suggested_fertilizer': alt
        }

        # CRITICAL: SAVE COMPLETE DATA FOR ANALYTICS
        history_collection.insert_one({
            'user_id': str(current_user['_id']),
            'timestamp': datetime.now(timezone.utc),
            'crop': crop,
            'soil': soil,
            'fertilizer': fert,
            'quantity': qty,
            'nitrogen': float(data.get('Nitrogen', 0)),
            'phosphorous': float(data.get('Phosphorous', 0)),
            'potassium': float(data.get('Potassium', 0)),
            'risk_score': risk,
            'compatibility': result['compatibility']
        })

        return jsonify(result)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/farmer-analytics', methods=['GET'])
@token_required
def get_farmer_analytics(current_user):
    try:
        history = list(history_collection.find({'user_id': str(current_user['_id'])}).sort('timestamp', 1))
        if not history: return jsonify({'total_analyses': 0})

        return jsonify({
            'total_analyses': len(history),
            'npk_averages': {
                'nitrogen': round(sum(h.get('nitrogen', 0) for h in history)/len(history), 1),
                'phosphorous': round(sum(h.get('phosphorous', 0) for h in history)/len(history), 1),
                'potassium': round(sum(h.get('potassium', 0) for h in history)/len(history), 1)
            },
            'time_series': {
                'dates': [h['timestamp'].strftime('%d %b') for h in history],
                'risks': [h.get('risk_score', 0) for h in history]
            }
        })
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/generate-report', methods=['POST'])
@token_required
def generate_report(current_user):
    data = request.get_json()
    res = data.get('result', {})
    inputs = data.get('inputs', {})
    
    # HTML with CSS and Auto-Print
    report_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', sans-serif; color: #333; line-height: 1.6; padding: 40px; }}
            .card {{ border: 2px solid #2e7d32; border-radius: 10px; padding: 20px; }}
            .header {{ background: #2e7d32; color: white; padding: 20px; margin: -40px -40px 20px -40px; }}
            .metric {{ display: inline-block; width: 30%; font-weight: bold; color: #2e7d32; }}
            .footer {{ margin-top: 50px; font-size: 0.8em; color: #888; border-top: 1px solid #ddd; }}
            @media print {{ .no-print {{ display: none; }} }}
        </style>
    </head>
    <body onload="window.print()">
        <div class="header">
            <h1>🌾 FarmWise Analysis Report</h1>
            <p>Generated for: {current_user.get('name')} | Date: {datetime.now().strftime('%Y-%m-%d')}</p>
        </div>
        <div class="card">
            <h2>Analysis Summary: {res.get('status')}</h2>
            <p><span class="metric">Crop:</span> {inputs.get('Crop_Type')}</p>
            <p><span class="metric">Fertilizer:</span> {inputs.get('Fertilizer_Name')} ({inputs.get('Fertilizer_Quantity')} kg)</p>
            <hr/>
            <h3>Details</h3>
            <p><strong>Compatibility:</strong> {res.get('compatibility_reason')}</p>
            <p><strong>Quantity Status:</strong> {res.get('quantity_reason')}</p>
            <h3>Recommendations</h3>
            <ul>{"".join([f"<li>{r}</li>" for r in res.get('recommendations', [])])}</ul>
        </div>
        <div class="no-print" style="margin-top:20px;">
            <button onclick="window.print()" style="padding:10px 20px; background:#2e7d32; color:white; border:none; border-radius:5px; cursor:pointer;">💾 Download as PDF / Print</button>
        </div>
        <div class="footer">This is an AI-generated report for agricultural guidance.</div>
    </body>
    </html>
    """
    return report_html

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'db': db is not None, 'data': df is not None})

if __name__ == '__main__':
    load_data()
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))