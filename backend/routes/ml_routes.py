from flask import Blueprint, request, jsonify
import datetime
import logging

# Auth
from utils.auth import token_required

# DB
from models.db import history_collection

# ML
from models.ml_model import (
    ml_predict,
    get_model_dashboard,
    model,
    soil_map,
    crop_map,
    fert_map
)

logger = logging.getLogger(__name__)

# ✅ Blueprint
ml_bp = Blueprint('ml', __name__)

# ==================== ML PREDICTION ====================
@ml_bp.route('/ml/predict', methods=['POST', 'OPTIONS'])
@token_required
def ml_predict_route(**kwargs):

    # ✅ Handle CORS preflight
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.get_json() or {}

        # ✅ SAFE INPUT HANDLING (prevents crashes)
        input_data = {
            'Temperature': float(data.get('temperature') or 26),
            'Moisture': float(data.get('moisture') or 45),
            'Soil_Type': data.get('soil') or 'Loamy',
            'Crop_Type': data.get('crop') or 'Maize',
            'Fertilizer_Name': data.get('fertilizer') or 'Urea',
            'Fertilizer_Quantity': float(data.get('quantity') or 30)
        }

        # ✅ ML Prediction
        ml_result = ml_predict(input_data)

        # ===== ENCODE INPUT FOR DASHBOARD =====
        encoded_input = [
            input_data['Temperature'],
            input_data['Moisture'],
            soil_map.get(input_data['Soil_Type'], 1),
            crop_map.get(input_data['Crop_Type'], 0),
            fert_map.get(input_data['Fertilizer_Name'], 0),
            input_data['Fertilizer_Quantity']
        ]

        # ===== DASHBOARD =====
        dashboard = get_model_dashboard(model, encoded_input)

        # ✅ NORMALIZED RESULT (frontend-safe)
        result = {
            "overall_compatibility": ml_result.get("overall_compatibility", "Moderately Compatible"),
            "overall_score": ml_result.get("overall_score", 60),
            "temperature_status": ml_result.get("temperature_status", "N/A"),
            "moisture_status": ml_result.get("moisture_status", "N/A"),
            "soil_compatibility": ml_result.get("soil_compatibility", "Average"),
            "quantity_status": ml_result.get("quantity_status", "Optimal"),
            "success": True
        }

        # ✅ Save to history
        current_user = kwargs['current_user']

        history_entry = {
            'user_id': current_user['_id'],
            'input_data': input_data,
            'result': result,
            'model': 'ml',
            'dashboard': dashboard,
            'timestamp': datetime.datetime.utcnow()
        }

        history_collection.insert_one(history_entry)

        # ✅ RESPONSE
        return jsonify({
            "success": True,
            "result": result,
            "ml_dashboard": dashboard
        })

    except Exception as e:
        logger.error(f"ML Prediction error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
