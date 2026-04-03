
@app.route('/chat', methods=['POST'])
@token_required
def chatbot(**kwargs):
    try:
        data = request.get_json()
        message = data.get("message", "").lower()

        # ✅ Parse input
        input_data = extract_inputs(message)

        # ✅ Use analyzer (more reliable)
        ml_result = FertilizerAnalyzer.analyze(input_data)


        # ---------------- 🧠 FORMAT SUGGESTIONS ----------------
        suggestions = ml_result.get("suggestions", [])
        suggestion_text = "\n".join(suggestions) if suggestions else "✅ No suggestions available"
        
        # ---------------- RESPONSE ----------------
        reply = f"""
        🌱 Compatibility: {ml_result.get('overall_compatibility', 'Unknown')}
        📊 Score: {ml_result.get('overall_score', 0)}
        
        🌡 Temperature: {input_data['Temperature']}°C
        💧 Moisture: {input_data['Moisture']}%
        🌱 Soil: {input_data['Soil_Type']}
        🌾 Crop: {input_data['Crop_Type']}
        🧪 Fertilizer: {input_data['Fertilizer_Name']}
        📦 Quantity: {input_data['Fertilizer_Quantity']} kg/ha
        
        🧠 Smart Advice:
        {suggestion_text}
        """

        return jsonify({
            "success": True,
            "reply": reply.strip()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


