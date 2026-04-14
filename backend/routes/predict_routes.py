from flask import Blueprint, request, jsonify
import datetime
import logging
import traceback

from bson import ObjectId

def ensure_object_id(val):
    if isinstance(val, ObjectId):
        return val
    return ObjectId(val)

# Auth
from utils.auth import token_required

# DB
from models.db import history_collection

# Service
from services.analyzer import FertilizerAnalyzer

logger = logging.getLogger(__name__)

# ✅ Blueprint
predict_bp = Blueprint('predict', __name__)

# ==================== PREDICT ROUTE ====================
@predict_bp.route('/predict', methods=['POST'])
@token_required
def predict(**kwargs):
    try:
        current_user = kwargs['current_user']
        data = request.get_json() or {}

        # ✅ Get farm defaults
        farm_details = current_user.get('farm_details', {})

        # ✅ SAFE INPUT (no crashes + proper fallback)
        input_data = {
            'Temperature': float(data.get('Temperature') or farm_details.get('temperature', 26)),
            'Moisture': float(data.get('Moisture') or farm_details.get('humidity', 45)),
            'Soil_Type': data.get('Soil_Type') or farm_details.get('soil_type', 'Loamy'),
            'Crop_Type': data.get('Crop_Type') or 'Maize',
            'Fertilizer_Name': data.get('Fertilizer_Name') or 'Urea',
            'Fertilizer_Quantity': float(data.get('Fertilizer_Quantity') or 30)
        }

        # ✅ Run analysis
        result = FertilizerAnalyzer.analyze(input_data)

        if not result.get('success', True):
            return jsonify({
                'success': False,
                'message': result.get('error', 'Analysis failed')
            }), 400

        # 🔥 FIXED HISTORY (THIS WAS YOUR MAIN BUG)
        history_entry = {
            'user_id': ensure_object_id(current_user['_id']),
            # ✅ USE input_data (NOT raw data)
            'input_data': {
                'Crop_Type': input_data.get('Crop_Type'),
                'Fertilizer_Name': input_data.get('Fertilizer_Name')
            },

            'result': {
                'overall_score': result.get('overall_score', result.get('score', 0)),
                'overall_compatibility': result.get(
                    'overall_compatibility',
                    result.get('compatibility', 'N/A')
                )
            },

            model_type = data.get('model', 'analysis')  # or pass from frontend
            'model': model_type,
            

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
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
