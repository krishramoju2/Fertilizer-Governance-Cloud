from flask import Blueprint, jsonify, request

# DB
from models.db import config_collection, check_db_connection

# ✅ Create Blueprint
config_bp = Blueprint('config', __name__)

# ==================== PUBLIC CONFIG ENDPOINTS ====================

def get_config_with_fallback(field, defaults):
    try:
        # Check both _id and id for robustness during migration
        config = config_collection.find_one({'_id': 'dropdowns'}) or config_collection.find_one({'id': 'dropdowns'})
        if config and field in config:
            return config[field]
        return defaults
    except Exception as e:
        print(f"Config fetch error for {field}: {e}")
        return defaults

@config_bp.route('/config/soil-types', methods=['GET', 'OPTIONS'])
def get_soil_types():
    if request.method == 'OPTIONS':
        return '', 200
    if not check_db_connection():
        return jsonify({'success': True, 'data': ['Loamy', 'Sandy', 'Clay', 'Black', 'Red']})
    
    data = get_config_with_fallback('soil_types', ['Loamy', 'Sandy', 'Clay', 'Black', 'Red'])
    return jsonify({'success': True, 'data': data}), 200

@config_bp.route('/config/crop-types', methods=['GET', 'OPTIONS'])
def get_crop_types():
    if request.method == 'OPTIONS':
        return '', 200
    if not check_db_connection():
        return jsonify({'success': True, 'data': ['Maize', 'Wheat', 'Rice', 'Millets', 'Cotton']})
    
    data = get_config_with_fallback('crop_types', ['Maize', 'Wheat', 'Rice', 'Millets', 'Cotton'])
    return jsonify({'success': True, 'data': data}), 200

@config_bp.route('/config/fertilizer-names', methods=['GET', 'OPTIONS'])
def get_fertilizer_names():
    if request.method == 'OPTIONS':
        return '', 200
    if not check_db_connection():
        return jsonify({'success': True, 'data': ['Urea', 'DAP', 'Potash', 'NPK']})
    
    data = get_config_with_fallback('fertilizer_names', ['Urea', 'DAP', 'Potash', 'NPK'])
    return jsonify({'success': True, 'data': data}), 200
