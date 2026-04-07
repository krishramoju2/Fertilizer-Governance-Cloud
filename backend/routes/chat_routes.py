from flask import Blueprint, request, jsonify
from utils.langchain_helper import parse_user_query

# Auth
from utils.auth import token_required

# Helpers + Services
from utils.helpers import extract_inputs
from services.analyzer import FertilizerAnalyzer

# ✅ Create Blueprint
chat_bp = Blueprint('chat', __name__)

# ==================== CHAT ROUTE ====================
@chat_bp.route('/chat', methods=['POST'])
@token_required
def chatbot(**kwargs):
    try:
        data = request.get_json() or {}
        message = data.get("message", "").lower()

        # ✅ Parse input
        input_data = parse_user_query(message)

        # ✅ Run analyzer
        ml_result = FertilizerAnalyzer.analyze(input_data)

        # ---------------- 🧠 FORMAT SUGGESTIONS ----------------
        suggestions = ml_result.get("suggestions", [])
        suggestion_text = "\n".join(suggestions) if suggestions else "✅ No suggestions available"

        # ---------------- RESPONSE ----------------
        reply = f"""
🌱 Compatibility: {ml_result.get('overall_compatibility', 'Unknown')}
📊 Score: {ml_result.get('overall_score', 0)}

🌡 Temperature: {input_data.get('Temperature')}°C
💧 Moisture: {input_data.get('Moisture')}%
🌱 Soil: {input_data.get('Soil_Type')}
🌾 Crop: {input_data.get('Crop_Type')}
🧪 Fertilizer: {input_data.get('Fertilizer_Name')}
📦 Quantity: {input_data.get('Fertilizer_Quantity')} kg/ha

🧠 Smart Advice:
{suggestion_text}
        """

        return jsonify({
            "success": True,
            "reply": reply.strip()
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

