from flask import Blueprint, jsonify

# DB
from models.db import config_collection, check_db_connection

# ✅ Create Blueprint
config_bp = Blueprint('config', __name__)

# ==================== PUBLIC CONFIG ENDPOINTS ====================

@config_bp.route('/config/soil-types', methods=['GET'])
def get_soil_types():
    try:
        if not check_db_connection():
            return jsonify({'success': False, 'message': 'DB error'}), 503

        config = config_collection.find_one({'_id': 'dropdowns'})

        return jsonify({
            'success': True,
            'data': config.get('soil_types', []) if config else []
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@config_bp.route('/config/crop-types', methods=['GET'])
def get_crop_types():
    try:
        if not check_db_connection():
            return jsonify({'success': False, 'message': 'DB error'}), 503

        config = config_collection.find_one({'_id': 'dropdowns'})

        return jsonify({
            'success': True,
            'data': config.get('crop_types', []) if config else []
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@config_bp.route('/config/fertilizer-names', methods=['GET'])
def get_fertilizer_names():
    try:
        if not check_db_connection():
            return jsonify({'success': False, 'message': 'DB error'}), 503

        config = config_collection.find_one({'_id': 'dropdowns'})

        return jsonify({
            'success': True,
            'data': config.get('fertilizer_names', []) if config else []
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
