# ml_model.py

import numpy as np
from sklearn.ensemble import RandomForestClassifier

# ================= DATASET (FROM YOUR LOGIC) =================
# Encode categorical values manually

soil_map = {"Sandy": 0, "Loamy": 1, "Clayey": 2, "Black": 3, "Red": 4}
crop_map = {"Maize": 0, "Sugarcane": 1, "Cotton": 2, "Wheat": 3, "Paddy": 4}
fert_map = {"Urea": 0, "DAP": 1, "14-35-14": 2, "28-28": 3, "17-17-17": 4, "20-20": 5, "10-26-26": 6}

# Sample dataset (BASED ON YOUR RULE LOGIC)
X = [
    [26, 45, 1, 0, 0, 30],
    [30, 50, 1, 0, 0, 40],
    [20, 30, 0, 3, 1, 20],
    [35, 60, 2, 4, 0, 50],
    [28, 40, 3, 2, 2, 25],
]

y = [1, 1, 0, 0, 1]  # 1 = good, 0 = bad

model = RandomForestClassifier()
model.fit(X, y)

# ================= ML PREDICT =================
def ml_predict(data):
    try:
        temp = float(data.get("Temparature", 26))
        moist = float(data.get("Moisture", 45))
        soil = soil_map.get(data.get("Soil_Type", "Loamy"), 1)
        crop = crop_map.get(data.get("Crop_Type", "Maize"), 0)
        fert = fert_map.get(data.get("Fertilizer_Name", "Urea"), 0)
        qty = float(data.get("Fertilizer_Quantity", 30))

        pred = model.predict([[temp, moist, soil, crop, fert, qty]])[0]

        # SAME FORMAT AS DECISION SYSTEM
        if pred == 1:
            overall = "Highly Compatible"
            score = 85
        else:
            overall = "Not Recommended"
            score = 40

        return {
            "success": True,
            "overall_compatibility": overall,
            "overall_score": score,
            "temperature_status": "Optimal",
            "temperature_range": "25°C - 32°C",
            "moisture_status": "Optimal",
            "moisture_range": "35% - 50%",
            "soil_compatibility": "Good",
            "quantity_status": "Optimal",
            "quantity_range": "30 - 40 kg/ha",
            "suggestions": [
                "ML-based prediction used",
                "Follow standard agronomic practices"
            ]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
