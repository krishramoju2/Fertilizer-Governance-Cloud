
# ==================== FERTILIZER ANALYSIS ENGINE ====================
class FertilizerAnalyzer:
    """Fertilizer compatibility and quantity analyzer based on CSV data"""

    # Soil type compatibility matrix (static)
    SOIL_COMPATIBILITY = {
        'Sandy': {
            'Urea': 'Good', 'DAP': 'Good', '14-35-14': 'Average', '28-28': 'Good',
            '17-17-17': 'Good', '20-20': 'Average', '10-26-26': 'Average'
        },
        'Loamy': {
            'Urea': 'Excellent', 'DAP': 'Excellent', '14-35-14': 'Good', '28-28': 'Excellent',
            '17-17-17': 'Excellent', '20-20': 'Good', '10-26-26': 'Good'
        },
        'Clayey': {
            'Urea': 'Good', 'DAP': 'Good', '14-35-14': 'Average', '28-28': 'Average',
            '17-17-17': 'Good', '20-20': 'Good', '10-26-26': 'Average'
        },
        'Black': {
            'Urea': 'Excellent', 'DAP': 'Good', '14-35-14': 'Excellent', '28-28': 'Good',
            '17-17-17': 'Excellent', '20-20': 'Good', '10-26-26': 'Good'
        },
        'Red': {
            'Urea': 'Average', 'DAP': 'Good', '14-35-14': 'Good', '28-28': 'Average',
            '17-17-17': 'Good', '20-20': 'Good', '10-26-26': 'Average'
        }
    }

    # Crop-specific recommendations (static)
    CROP_RECOMMENDATIONS = {
        'Maize': {
            'optimal_temp': (25, 32), 'optimal_moisture': (35, 50),
            'common_fertilizers': ['Urea', '28-28', '17-17-17', '14-35-14']
        },
        'Sugarcane': {
            'optimal_temp': (28, 35), 'optimal_moisture': (40, 60),
            'common_fertilizers': ['Urea', 'DAP', '17-17-17', '14-35-14']
        },
        'Cotton': {
            'optimal_temp': (25, 35), 'optimal_moisture': (30, 50),
            'common_fertilizers': ['Urea', 'DAP', '14-35-14', '28-28']
        },
        'Wheat': {
            'optimal_temp': (20, 30), 'optimal_moisture': (35, 55),
            'common_fertilizers': ['Urea', 'DAP', '28-28', '17-17-17']
        },
        'Paddy': {
            'optimal_temp': (25, 35), 'optimal_moisture': (40, 65),
            'common_fertilizers': ['Urea', '28-28', '20-20', '14-35-14']
        },
        'Barley': {
            'optimal_temp': (20, 28), 'optimal_moisture': (30, 45),
            'common_fertilizers': ['Urea', '28-28', '17-17-17', '20-20']
        },
        'Millets': {
            'optimal_temp': (25, 35), 'optimal_moisture': (25, 40),
            'common_fertilizers': ['Urea', '28-28', '20-20', 'DAP']
        },
        'Pulses': {
            'optimal_temp': (20, 30), 'optimal_moisture': (30, 45),
            'common_fertilizers': ['DAP', '20-20', '28-28', '10-26-26']
        },
        'Ground Nuts': {
            'optimal_temp': (25, 35), 'optimal_moisture': (35, 50),
            'common_fertilizers': ['DAP', '28-28', '17-17-17', '14-35-14']
        },
        'Oil seeds': {
            'optimal_temp': (25, 35), 'optimal_moisture': (30, 45),
            'common_fertilizers': ['Urea', 'DAP', '20-20', '14-35-14']
        },
        'Tobacco': {
            'optimal_temp': (20, 30), 'optimal_moisture': (30, 45),
            'common_fertilizers': ['DAP', '28-28', '20-20', '10-26-26']
        }
    }

    # Fertilizer quantity ranges (kg/hectare) (static)
    QUANTITY_RANGES = {
        'Urea': (35, 45),
        'DAP': (35, 45),
        '14-35-14': (25, 35),
        '28-28': (20, 30),
        '17-17-17': (10, 20),
        '20-20': (10, 20),
        '10-26-26': (15, 25)
    }

    @classmethod
    def analyze(cls, data):
        """Main analysis function with fallback for unknown entries"""
        try:
            # Extract inputs with defaults
            temperature = float(data.get('Temperature', 26))
            moisture = float(data.get('Moisture', 45))
            soil_type = data.get('Soil_Type', 'Loamy')
            crop_type = data.get('Crop_Type', 'Maize')
            fertilizer_name = data.get('Fertilizer_Name', 'Urea')
            quantity = float(data.get('Fertilizer_Quantity', 30))

            # Get crop recommendations, fallback to Maize if unknown
            crop_rec = cls.CROP_RECOMMENDATIONS.get(crop_type, cls.CROP_RECOMMENDATIONS['Maize'])

            # 1. Temperature compatibility
            temp_min, temp_max = crop_rec['optimal_temp']
            temp_compatible = temp_min <= temperature <= temp_max
            temp_status = "Optimal" if temp_compatible else "Suboptimal"

            # 2. Moisture compatibility
            moist_min, moist_max = crop_rec['optimal_moisture']
            moisture_compatible = moist_min <= moisture <= moist_max
            moisture_status = "Optimal" if moisture_compatible else "Adjust Needed"

            # 3. Soil compatibility (fallback to 'Average' if soil or fertilizer not in matrix)
            soil_compat = cls.SOIL_COMPATIBILITY.get(soil_type, {}).get(fertilizer_name, 'Average')

            # 4. Overall compatibility
            if temp_compatible and moisture_compatible and soil_compat in ['Excellent', 'Good']:
                overall_compatibility = "Highly Compatible"
                compatibility_score = 85 + (10 if soil_compat == 'Excellent' else 0)
            elif temp_compatible or moisture_compatible:
                overall_compatibility = "Moderately Compatible"
                compatibility_score = 60
            else:
                overall_compatibility = "Not Recommended"
                compatibility_score = 30

            # 5. Quantity analysis (fallback to Urea range if fertilizer unknown)
            q_min, q_max = cls.QUANTITY_RANGES.get(fertilizer_name, cls.QUANTITY_RANGES['Urea'])
            if quantity < q_min:
                quantity_status = "Insufficient"
                quantity_message = f"Quantity too low. Recommended: {q_min}-{q_max} kg/ha"
                quantity_score = 40
            elif quantity > q_max:
                quantity_status = "Excessive"
                quantity_message = f"Quantity too high. Recommended: {q_min}-{q_max} kg/ha"
                quantity_score = 30
            else:
                quantity_status = "Optimal"
                quantity_message = f"Perfect quantity! Within range {q_min}-{q_max} kg/ha"
                quantity_score = 100

            # 6. Generate personalized suggestions
            suggestions = []
            if not temp_compatible:
                if temperature < temp_min:
                    suggestions.append(f"🌡️ Temperature is too low for {crop_type}. Consider delayed planting or using plastic mulch.")
                else:
                    suggestions.append(f"🌡️ Temperature is too high for {crop_type}. Provide shade or irrigate during peak hours.")
            if not moisture_compatible:
                if moisture < moist_min:
                    suggestions.append(f"💧 Soil moisture is low. Irrigate before fertilizer application.")
                else:
                    suggestions.append(f"💧 Soil moisture is high. Improve drainage or wait for optimal conditions.")
            if soil_compat == 'Average':
                suggestions.append(f"🌱 {fertilizer_name} has average compatibility with {soil_type} soil. Consider adding organic matter.")
            elif soil_compat in ['Good', 'Excellent']:
                suggestions.append(f"🌱 Excellent! {fertilizer_name} works well with {soil_type} soil.")
            if quantity_status != "Optimal":
                suggestions.append(quantity_message)
            # Add crop-specific suggestion
            suggestions.append(f"👉 For {crop_type}, commonly used fertilizers: {', '.join(crop_rec['common_fertilizers'][:3])}")

            # 7. Calculate overall score
            overall_score = int((compatibility_score + quantity_score) / 2)

            return {
                'success': True,
                'overall_compatibility': overall_compatibility,
                'overall_score': overall_score,
                'temperature_status': temp_status,
                'temperature_range': f"{temp_min}°C - {temp_max}°C",
                'moisture_status': moisture_status,
                'moisture_range': f"{moist_min}% - {moist_max}%",
                'soil_compatibility': soil_compat,
                'quantity_status': quantity_status,
                'quantity_range': f"{q_min} - {q_max} kg/ha",
                'suggestions': suggestions[:4],
                'fertilizer_info': {
                    'name': fertilizer_name,
                    'type': 'Nitrogenous' if fertilizer_name == 'Urea' else 'Complex',
                    'application': 'Split application recommended' if fertilizer_name in ['Urea', 'DAP'] else 'Basal application'
                }
            }
        except Exception as e:
            logger.error(f"Analysis error: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e)
            }
