from flask import Blueprint, jsonify, request
from bson import ObjectId
import traceback
import logging

from utils.auth import admin_required
from models.db import users_collection, history_collection, config_collection

admin_bp = Blueprint('admin', __name__)

logger = logging.getLogger(__name__)

# ==================== USER MANAGEMENT ====================
@admin_bp.route('/admin/users', methods=['GET'])
@admin_required
def admin_get_users(**kwargs):
    try:
        users = list(users_collection.find({}, {'password': 0}))

        for u in users:
            u['_id'] = str(u['_id'])

        return jsonify({'success': True, 'users': users}), 200

    except Exception as e:
        logger.error(f"Error fetching users: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== USER ANALYTICS ====================
@admin_bp.route('/admin/analytics/<user_id>', methods=['GET'])
@admin_required
def admin_user_analytics(user_id, **kwargs):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})

        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        history = list(history_collection.find({'user_id': ObjectId(user_id)}))

        if not history:
            return jsonify({
                'success': True,
                'analytics': {
                    'total_analyses': 0,
                    'compatibility_rate': 0,
                    'average_score': 0,
                    'crop_distribution': {},
                    'fertilizer_distribution': {},
                    'time_series': {'labels': [], 'scores': []}
                }
            }), 200

        total = len(history)

        compatible_count = sum(
            1 for h in history
            if 'Highly Compatible' in h['result']['overall_compatibility']
        )

        avg_score = sum(h['result']['overall_score'] for h in history) / total

        crops = {}
        fertilizers = {}

        for h in history:
            crop = h['input_data']['Crop_Type']
            crops[crop] = crops.get(crop, 0) + 1

            fert = h['input_data']['Fertilizer_Name']
            fertilizers[fert] = fertilizers.get(fert, 0) + 1

        recent = history[-7:]

        time_labels = [
            h['timestamp'].strftime('%d/%m') if h.get('timestamp') else 'N/A'
            for h in recent
        ]

        time_scores = [
            h['result']['overall_score'] for h in recent
        ]

        return jsonify({
            'success': True,
            'analytics': {
                'total_analyses': total,
                'compatibility_rate': round((compatible_count / total) * 100, 1),
                'average_score': round(avg_score, 1),
                'crop_distribution': crops,
                'fertilizer_distribution': fertilizers,
                'time_series': {
                    'labels': time_labels,
                    'scores': time_scores
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Admin analytics error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== USER HISTORY ====================
@admin_bp.route('/admin/history/<user_id>', methods=['GET'])
@admin_required
def admin_user_history(user_id, **kwargs):
    try:
        history = list(
            history_collection.find({'user_id': ObjectId(user_id)})
            .sort('timestamp', -1)
            .limit(50)
        )

        formatted = []

        for item in history:
            formatted.append({
                'id': str(item['_id']),
                'crop_type': item['input_data']['Crop_Type'],
                'fertilizer': item['input_data']['Fertilizer_Name'],
                'compatibility': item['result']['overall_compatibility'],
                'score': item['result']['overall_score'],
                'timestamp': item['timestamp'].isoformat() if item.get('timestamp') else None
            })

        return jsonify({'success': True, 'history': formatted}), 200

    except Exception as e:
        logger.error(f"Error fetching user history: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== CONFIG MANAGEMENT ====================

@admin_bp.route('/admin/config/soil-types', methods=['POST'])
@admin_required
def admin_add_soil_type(**kwargs):
    try:
        data = request.get_json()
        new_type = data.get('item', '').strip()

        if not new_type:
            return jsonify({'success': False, 'message': 'Item required'}), 400

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$addToSet': {'soil_types': new_type}}
        )

        return jsonify({'success': True, 'message': f'Added {new_type}'}), 200

    except Exception as e:
        logger.error(f"Error adding soil type: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/admin/config/soil-types/<item>', methods=['DELETE'])
@admin_required
def admin_remove_soil_type(item, **kwargs):
    try:
        config = config_collection.find_one({'_id': 'dropdowns'})

        if not config:
            return jsonify({'success': False, 'message': 'Configuration not found'}), 404

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$pull': {'soil_types': item}}
        )

        return jsonify({'success': True, 'message': f'Removed {item}'}), 200

    except Exception as e:
        logger.error(f"Error removing soil type: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500


# --- crop types ---
@admin_bp.route('/admin/config/crop-types', methods=['POST'])
@admin_required
def admin_add_crop_type(**kwargs):
    try:
        data = request.get_json()
        new_type = data.get('item', '').strip()

        if not new_type:
            return jsonify({'success': False, 'message': 'Item required'}), 400

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$addToSet': {'crop_types': new_type}}
        )

        return jsonify({'success': True, 'message': f'Added {new_type}'}), 200

    except Exception as e:
        logger.error(f"Error adding crop type: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/admin/config/crop-types/<item>', methods=['DELETE'])
@admin_required
def admin_remove_crop_type(item, **kwargs):
    try:
        config = config_collection.find_one({'_id': 'dropdowns'})

        if not config:
            return jsonify({'success': False, 'message': 'Configuration not found'}), 404

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$pull': {'crop_types': item}}
        )

        return jsonify({'success': True, 'message': f'Removed {item}'}), 200

    except Exception as e:
        logger.error(f"Error removing crop type: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500


# --- fertilizers ---
@admin_bp.route('/admin/config/fertilizer-names', methods=['POST'])
@admin_required
def admin_add_fertilizer(**kwargs):
    try:
        data = request.get_json()
        new_fert = data.get('item', '').strip()

        if not new_fert:
            return jsonify({'success': False, 'message': 'Item required'}), 400

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$addToSet': {'fertilizer_names': new_fert}}
        )

        return jsonify({'success': True, 'message': f'Added {new_fert}'}), 200

    except Exception as e:
        logger.error(f"Error adding fertilizer: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/admin/config/fertilizer-names/<item>', methods=['DELETE'])
@admin_required
def admin_remove_fertilizer(item, **kwargs):
    try:
        config = config_collection.find_one({'_id': 'dropdowns'})

        if not config:
            return jsonify({'success': False, 'message': 'Configuration not found'}), 404

        config_collection.update_one(
            {'_id': 'dropdowns'},
            {'$pull': {'fertilizer_names': item}}
        )

        return jsonify({'success': True, 'message': f'Removed {item}'}), 200

    except Exception as e:
        logger.error(f"Error removing fertilizer: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500
