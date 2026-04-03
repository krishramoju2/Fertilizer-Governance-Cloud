# ==================== PREDICTION ROUTE ====================
@predict_bp.route('/predict', methods=['POST'])
@token_required
def predict(**kwargs):
    try:
        current_user = kwargs['current_user']
        data = request.get_json()

        # Get farm details for defaults (including weather data)
        farm_details = current_user.get('farm_details', {})

        # Prepare input data - using stored weather as defaults
        input_data = {
            'Temperature': float(data.get('Temperature', farm_details.get('temperature', 26))),
            'Moisture': float(data.get('Moisture', farm_details.get('humidity', 45))),
            'Soil_Type': data.get('Soil_Type', farm_details.get('soil_type', 'Loamy')),
            'Crop_Type': data.get('Crop_Type', 'Maize'),
            'Fertilizer_Name': data.get('Fertilizer_Name', 'Urea'),
            'Fertilizer_Quantity': float(data.get('Fertilizer_Quantity', 30))
        }

        # Run analysis
        result = FertilizerAnalyzer.analyze(input_data)

        if not result['success']:
            return jsonify({'success': False, 'message': result.get('error', 'Analysis failed')}), 400

        current_user = kwargs['current_user']

        
        
        history_entry = {
            'user_id': current_user['_id'],
        
            # 🔥 THIS IS WHAT YOU ARE MISSING
            'input_data': {
                'Crop_Type': data.get('crop'),
                'Fertilizer_Name': data.get('fertilizer')
            },
        
            'result': {
                'overall_score': result.get('overall_score', result.get('score', 0)),
                'overall_compatibility': result.get('overall_compatibility', result.get('compatibility', 'N/A'))
            },
        
            'model': 'decision',
            'timestamp': datetime.datetime.utcnow()
        }

        

        
        history_collection.insert_one(history_entry)

        return jsonify({
            'success': True,
            'result': result,
            'input': input_data
        }), 200
    except Exception as e:
        logger.error(f"Prediction error: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': str(e)}), 500
