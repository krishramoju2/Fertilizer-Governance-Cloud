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

        # ---------------- 🧠 GENERATE THINKING PROCESS ----------------
        thinking = [
            f"🔍 Analyzing your request for {input_data.get('Crop_Type')} with {input_data.get('Fertilizer_Name')}...",
            f"🌡️ Checking temperature ({input_data.get('Temperature')}°C) against {input_data.get('Crop_Type')}'s optimal range ({ml_result.get('temperature_range')}).",
            f"💧 Evaluating soil moisture ({input_data.get('Moisture')}%) for metabolic efficiency.",
            f"🌱 Cross-referencing {input_data.get('Fertilizer_Name')} with {input_data.get('Soil_Type')} soil (Compatibility: {ml_result.get('soil_compatibility')}).",
            f"⚖️ Validating application rate ({input_data.get('Fertilizer_Quantity')} kg/ha) against safety standards."
        ]

        # ---------------- RESPONSE ----------------
        reply = f"""
🌿 **FINAL RECOMMENDATION** 🌿

**Compatibility:** {ml_result.get('overall_compatibility', 'Unknown')}
**Trust Score:** {ml_result.get('overall_score', 0)}%

**Smart Advice:**
{suggestion_text}

---
*Conditions: {input_data.get('Temperature')}°C | {input_data.get('Moisture')}% | {input_data.get('Soil_Type')} Soil*
        """

        return jsonify({
            "success": True,
            "reply": reply.strip(),
            "thinking": thinking
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


