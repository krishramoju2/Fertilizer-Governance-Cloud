from flask import Blueprint, jsonify, request
import traceback
import logging
from bson import ObjectId
from datetime import datetime

from utils.auth import token_required
from models.db import history_collection

analytics_bp = Blueprint('analytics', __name__)
logger = logging.getLogger(__name__)

# ==================== ANALYTICS ROUTE ====================
@analytics_bp.route('/analytics', methods=['GET', 'OPTIONS'])
@token_required
def get_analytics(**kwargs):
    if request.method == 'OPTIONS':
        return '', 200
    try:
        current_user = kwargs['current_user']
        user_id = str(current_user['_id'])

        # Robust query: find by string ID or ObjectId
        query = {'user_id': user_id}
        history = list(history_collection.find(query))
        
        if not history and len(user_id) == 24:
            try:
                history = list(history_collection.find({'user_id': ObjectId(user_id)}))
            except:
                pass

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

        # Sort history by timestamp
        def get_ts(h):
            ts = h.get('timestamp')
            if isinstance(ts, datetime):
                return ts
            return datetime.min

        history.sort(key=get_ts)

        # ==================== CALCULATIONS ====================
        total = len(history)

        compatible_count = sum(
            1 for h in history
            if 'Highly' in str(h.get('result', {}).get('overall_compatibility', '')) or 
               'Optimal' in str(h.get('result', {}).get('overall_compatibility', ''))
        )

        def get_score(h):
            res = h.get('result', {})
            score = res.get('overall_score') or res.get('score') or 0
            try:
                return float(score)
            except:
                return 0

        scores = [get_score(h) for h in history]
        avg_score = sum(scores) / total if total > 0 else 0

        # ==================== DISTRIBUTIONS ====================
        crops = {}
        fertilizers = {}

        for h in history:
            input_data = h.get('input_data', {})
            crop = input_data.get('Crop_Type') or input_data.get('crop') or "Unknown"
            crops[crop] = crops.get(crop, 0) + 1

            fert = input_data.get('Fertilizer_Name') or input_data.get('fertilizer') or "Unknown"
            fertilizers[fert] = fertilizers.get(fert, 0) + 1

        # ==================== TIME SERIES ====================
        recent = history[-10:]
        time_labels = []
        time_scores = []

        for h in recent:
            ts = h.get('timestamp')
            if isinstance(ts, datetime):
                time_labels.append(ts.strftime('%d/%m'))
            elif isinstance(ts, str):
                try:
                    # Try to parse string timestamp
                    parsed_ts = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                    time_labels.append(parsed_ts.strftime('%d/%m'))
                except:
                    time_labels.append('N/A')
            else:
                time_labels.append('N/A')
            
            time_scores.append(get_score(h))

        # ==================== RESPONSE ====================
        return jsonify({
            'success': True,
            'analytics': {
                'total_analyses': total,
                'compatibility_rate': round((compatible_count / total) * 100, 1) if total > 0 else 0,
                'average_score': round(avg_score, 1) if total > 0 else 0,
                'crop_distribution': crops,
                'fertilizer_distribution': fertilizers,
                'time_series': {
                    'labels': time_labels,
                    'scores': time_scores
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Analytics error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500
