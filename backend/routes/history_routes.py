from flask import Blueprint, jsonify, request
from datetime import datetime
from utils.auth import token_required
from models.db import history_collection

history_bp = Blueprint('history', __name__)

@history_bp.route('/history', methods=['GET', 'OPTIONS'])
@token_required
def get_history(**kwargs):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        current_user = kwargs['current_user']
        user_id = str(current_user['_id'])
        
        print(f"📡 Fetching history for user: {user_id}")

        history = list(history_collection.find(
            {'user_id': user_id}
        ).sort('timestamp', -1).limit(20))

        print(f"✅ Found {len(history)} history records")

        formatted_history = []
        for item in history:
            formatted_history.append({
                'id': str(item['_id']),
                'input_data': item.get('input_data', {}),
                'result': item.get('result', {}),
                'dashboard': item.get('dashboard', {}),
                'model': item.get('model', 'decision'),
                'timestamp': item['timestamp'].isoformat() if item.get('timestamp') else None
            })

        return jsonify({'success': True, 'history': formatted_history}), 200

    except Exception as e:
        print(f"❌ History error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@history_bp.route('/history/<record_id>', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_history(record_id, **kwargs):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        current_user = kwargs['current_user']

        result = history_collection.delete_one({
            '_id': record_id,
            'user_id': str(current_user['_id'])
        })

        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'message': 'Record not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Record deleted'
        }), 200

    except Exception as e:
        print(f"❌ Delete error: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
