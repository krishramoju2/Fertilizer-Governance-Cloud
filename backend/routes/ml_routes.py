# ==================== ML PREDICTION ROUTE ====================


@app.route('/ml/predict', methods=['POST', 'OPTIONS'])
@token_required
def ml_predict_route(**kwargs):

    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200

    try:
        data = request.get_json() or {}

        input_data = {
            'Temperature': float(data.get('temperature', 26)),
            'Moisture': float(data.get('moisture', 45)),
            'Soil_Type': data.get('soil', 'Loamy'),
            'Crop_Type': data.get('crop', 'Maize'),
            'Fertilizer_Name': data.get('fertilizer', 'Urea'),
            'Fertilizer_Quantity': float(data.get('quantity', 30))
        }

        

        ml_result = ml_predict(input_data)


        # ===== ENCODE INPUT FOR DASHBOARD =====
        temp = input_data['Temperature']
        moist = input_data['Moisture']
        soil = soil_map.get(input_data['Soil_Type'], 1)
        crop = crop_map.get(input_data['Crop_Type'], 0)
        fert = fert_map.get(input_data['Fertilizer_Name'], 0)
        qty = input_data['Fertilizer_Quantity']
        
        encoded_input = [temp, moist, soil, crop, fert, qty]
        
        # ===== GET DASHBOARD =====
        dashboard = get_model_dashboard(model, encoded_input)

        # 🔥 Normalize ML output to match decision format
        result = {
            "overall_compatibility": ml_result.get("overall_compatibility", "Moderately Compatible"),
            "overall_score": ml_result.get("overall_score", 60),
            "temperature_status": ml_result.get("temperature_status", "N/A"),
            "moisture_status": ml_result.get("moisture_status", "N/A"),
            "soil_compatibility": ml_result.get("soil_compatibility", "Average"),
            "quantity_status": ml_result.get("quantity_status", "Optimal"),
            "success": True
        }

        current_user = kwargs['current_user']
        
        history_entry = {
            'user_id': current_user['_id'],   # ✅ FIXED
            'input_data': input_data,
            'result': result,
            'model': 'ml',
            'dashboard': dashboard, 
            'timestamp': datetime.datetime.utcnow()
        }

        history_collection.insert_one(history_entry)

        return jsonify({
            "success": True,
            "result": result,
            "ml_dashboard": dashboard   # 🚀 THIS LINE MAKES IT VISIBLE
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
