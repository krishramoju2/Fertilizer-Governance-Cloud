from flask import Blueprint, jsonify, request
from bson import ObjectId
import traceback
import logging

from utils.auth import admin_required
from models.db import users_collection, history_collection, config_collection

admin_bp = Blueprint('admin', __name__)
logger = logging.getLogger(__name__)

# ==================== USER MANAGEMENT ====================
@admin_bp.route('/admin/users', methods=['GET', 'OPTIONS'])
@admin_required
def admin_get_users(**kwargs):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        users = list(users_collection.find({}, {'password': 0}))
        for u in users:
            u['_id'] = str(u['_id'])
        return jsonify({'success': True, 'users': users}), 200
    except Exception as e:
        logger.error(f"Error fetching users: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== USER ANALYTICS ====================
@admin_bp.route('/admin/user-analytics/<user_id>', methods=['GET', 'OPTIONS'])
@admin_required
def admin_user_analytics(user_id, **kwargs):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        # History is saved with string user_id or ObjectId
        # Try both for robustness
        query = {'user_id': user_id}
        history = list(history_collection.find(query))
        
        if not history and len(user_id) == 24:
            history = list(history_collection.find({'user_id': ObjectId(user_id)}))

        if not history:
            return jsonify({
                'success': True,
                'analytics': {
                    'total_analyses': 0,
                    'compatibility_rate': 0,
                    'average_score': 0
                }
            }), 200

        total = len(history)
        scores = [h.get('result', {}).get('overall_score', 0) for h in history]
        avg_score = sum(scores) / total if total > 0 else 0

        return jsonify({
            'success': True,
            'analytics': {
                'total_analyses': total,
                'average_score': round(avg_score, 1),
                'compatibility_rate': 100 # placeholder
            }
        }), 200
    except Exception as e:
        logger.error(f"Admin analytics error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== USER HISTORY ====================
@admin_bp.route('/admin/user-history/<user_id>', methods=['GET', 'OPTIONS'])
@admin_required
def admin_user_history(user_id, **kwargs):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        query = {'user_id': user_id}
        history = list(history_collection.find(query).sort('timestamp', -1).limit(50))
        
        if not history and len(user_id) == 24:
             history = list(history_collection.find({'user_id': ObjectId(user_id)}).sort('timestamp', -1).limit(50))

        formatted = []
        for item in history:
            input_data = item.get('input_data', {})
            result = item.get('result', {})
            formatted.append({
                'id': str(item['_id']),
                'crop_type': input_data.get('Crop_Type') or input_data.get('crop', 'N/A'),
                'fertilizer': input_data.get('Fertilizer_Name') or input_data.get('fertilizer', 'N/A'),
                'compatibility': result.get('overall_compatibility', 'N/A'),
                'score': result.get('overall_score', 0),
                'timestamp': item['timestamp'].isoformat() if item.get('timestamp') else None
            })

        return jsonify({'success': True, 'history': formatted}), 200
    except Exception as e:
        logger.error(f"Error fetching user history: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== CONFIG MANAGEMENT (ADD) ====================
@admin_bp.route('/admin/add-item/<type>', methods=['POST', 'OPTIONS'])
@admin_required
def admin_add_item(type, **kwargs):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.get_json()
        item = data.get('item', '').strip()
        if not item:
            return jsonify({'success': False, 'message': 'Item required'}), 400

        field_map = {
            'soil': 'soil_types',
            'crop': 'crop_types',
            'fertilizer': 'fertilizer_names'
        }
        field = field_map.get(type)
        if not field:
            return jsonify({'success': False, 'message': 'Invalid type'}), 400

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$addToSet': {field: item}},
            upsert=True
        )
        return jsonify({'success': True, 'message': f'Added {item}'}), 200
    except Exception as e:
        logger.error(f"Error adding config item: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== CONFIG MANAGEMENT (REMOVE) ====================
@admin_bp.route('/admin/remove-item/<type>', methods=['POST', 'OPTIONS'])
@admin_required
def admin_remove_item(type, **kwargs):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.get_json()
        item = data.get('item', '').strip()
        if not item:
            return jsonify({'success': False, 'message': 'Item required'}), 400

        field_map = {
            'soil': 'soil_types',
            'crop': 'crop_types',
            'fertilizer': 'fertilizer_names'
        }
        field = field_map.get(type)
        if not field:
            return jsonify({'success': False, 'message': 'Invalid type'}), 400

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$pull': {field: item}}
        )
        return jsonify({'success': True, 'message': f'Removed {item}'}), 200
    except Exception as e:
        logger.error(f"Error removing config item: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500
