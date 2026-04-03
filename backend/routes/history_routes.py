from flask import Blueprint, jsonify
from bson import ObjectId
from datetime import datetime

from utils.auth import token_required
from models.db import history_collection

history_bp = Blueprint('history', __name__)

@history_bp.route('/history', methods=['GET'])
@token_required
def get_history(**kwargs):
    try:
        current_user = kwargs['current_user']

        history = list(history_collection.find(
            {'user_id': current_user['_id']}
        ).sort('timestamp', -1).limit(20))

        formatted_history = []
        for item in history:
            formatted_history.append({
                'id': str(item['_id']),
                'input_data': item.get('input_data', {}),
                'result': item.get('result', {}),
                'dashboard': item.get('dashboard', {}),
                'model': item.get('model', 'decision'),  # 🔥 ADD THIS
                'timestamp': item['timestamp'].isoformat() if item.get('timestamp') else None
            })

        return jsonify({'success': True, 'history': formatted_history}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
