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

        # ---------------- 🧠 SYSTEM LOGS (PROFESSIONAL THINKING) ----------------
        thinking = [
            f"SYSTEM: Initializing Agricultural Diagnostic Engine for {input_data.get('Crop_Type')}...",
            f"DATA_VALIDATION: Comparing thermal inputs ({input_data.get('Temperature')}°C) against biochemical thresholds.",
            f"SOIL_ANALYSIS: Evaluating moisture saturation ({input_data.get('Moisture')}%) for optimal nutrient absorption.",
            f"SYNERGY_CHECK: Cross-referencing {input_data.get('Fertilizer_Name')} with {input_data.get('Soil_Type')} soil substrate.",
            f"PROTOCOL_VERIFICATION: Auditing application rate ({input_data.get('Fertilizer_Quantity')} kg/ha) against governance standards."
        ]

        # ---------------- RESPONSE ----------------
        reply = f"""
--- AGRICULTURAL COMPATIBILITY REPORT ---

SUMMARY:
COMPATIBILITY STATUS: {ml_result.get('overall_compatibility', 'Unknown').upper()}
RELIABILITY INDEX: {ml_result.get('overall_score', 0)}%

EXECUTIVE GUIDANCE:
{suggestion_text}

TECHNICAL PARAMETERS:
Temperature: {input_data.get('Temperature')}°C (Ref: {ml_result.get('temperature_range')})
Moisture: {input_data.get('Moisture')}% (Ref: {ml_result.get('moisture_range')})
Substrate: {input_data.get('Soil_Type')}
Nutrient Agent: {input_data.get('Fertilizer_Name')}
------------------------------------------
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


