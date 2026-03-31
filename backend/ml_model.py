# ml_model.py

'''import numpy as np
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
        temp = float(data.get("Temperature", 26))
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
        return {"success": False, "error": str(e)}'''


# ml_model.py
import numpy as np
from sklearn.ensemble import RandomForestClassifier

# ================= ENCODING =================
soil_map = {"Sandy": 0, "Loamy": 1, "Clayey": 2, "Black": 3, "Red": 4}

crop_map = {
    "Maize": 0, "Sugarcane": 1, "Cotton": 2, "Wheat": 3, "Paddy": 4,
    "Barley": 5, "Millets": 6, "Pulses": 7,
    "Ground Nuts": 8, "Oil seeds": 9, "Tobacco": 10
}

fert_map = {
    "Urea": 0, "DAP": 1, "14-35-14": 2,
    "28-28": 3, "17-17-17": 4, "20-20": 5, "10-26-26": 6
}

# ================= DATASET =================
# Format: [temp, moisture, soil, crop, fert, quantity]
X = [
    [26,38,0,0,0,37],[29,45,1,1,1,12],[34,62,3,2,2,7],[32,34,4,10,3,22],
    [28,46,2,4,0,35],[26,35,0,5,4,12],[25,64,4,2,5,9],[33,50,1,3,0,41],
    [30,42,0,6,3,21],[29,33,3,9,2,9],[27,28,2,7,1,13],[31,48,0,0,4,14],
    [25,65,1,2,0,36],[32,41,2,4,3,24],[26,31,4,8,1,14],[31,49,3,1,4,10],
    [33,34,2,7,0,38],[25,39,0,5,3,21],[28,65,3,2,0,39],[29,52,1,3,1,13],
    [30,44,0,6,5,10],[34,53,1,1,4,12],[35,33,4,10,1,11],[28,37,3,6,0,36],
    [33,39,2,4,5,13],[26,44,0,0,3,23],[30,63,4,2,2,9],[32,30,1,1,0,38],
    [37,32,3,9,1,12],[26,36,2,7,5,14],[29,40,4,8,3,24],[30,27,1,1,1,12],
    [34,38,2,4,0,39],[36,38,0,5,2,7],[26,48,1,3,3,23],[28,35,3,6,0,41],
    [30,61,1,2,2,8],[37,37,2,4,1,12],[25,26,4,8,4,15],[29,34,0,6,1,15],
    [27,30,2,7,5,13],[30,58,1,1,2,10],[32,34,4,10,3,22],[34,60,3,1,0,35],
    [35,42,0,5,1,10],[38,48,1,3,2,8],[26,32,3,9,5,12],[29,43,2,4,3,24],
    [30,29,4,8,0,41],[33,51,0,0,2,5],[34,31,4,10,3,23],[36,33,3,9,5,13],
    [28,38,2,7,0,40],[30,47,0,5,1,12],[31,63,4,2,4,11],[27,43,3,6,3,23],
    [34,54,1,3,0,38],[29,37,0,6,5,8],[25,56,1,1,4,11],[32,34,4,8,1,15],
    [28,41,2,4,0,36],[30,49,1,3,5,13],[34,64,3,2,3,24],[28,47,0,5,6,5],
    [27,35,3,9,0,37],[36,62,4,2,1,15],[34,57,3,1,5,9],[29,55,1,1,2,8],
    [25,40,2,7,6,6],[30,38,0,6,5,10],[26,39,2,7,3,21],[31,32,4,10,0,39],
    [34,48,1,3,3,23],[27,34,3,9,0,42],[33,31,4,8,1,13],[29,42,2,4,2,9],
    [30,47,0,0,3,22],[27,59,1,1,5,10],[26,36,2,7,6,7],[34,63,4,2,1,14],
    [28,43,2,4,2,10],[30,40,0,6,0,41],[29,65,3,2,1,14],[26,59,1,1,5,11],
    [31,44,0,5,3,21],[35,28,2,7,2,8],[29,30,4,10,6,13],[27,30,3,6,0,35],
    [36,50,1,3,6,12],[29,61,1,2,1,11],[30,26,3,9,2,8],[34,45,2,4,6,6],
    [36,41,4,8,0,41],[28,25,0,0,2,9],[25,32,2,7,3,24],[30,27,4,10,6,4],
    [38,51,1,3,0,39],[36,43,0,6,1,15],[29,57,3,1,5,12]
]

# ================= LABEL GENERATION =================
def generate_label(temp, moisture, qty):
    if 25 <= temp <= 32 and 35 <= moisture <= 50 and 35 <= qty <= 45:
        return 1
    return 0

y = [generate_label(x[0], x[1], x[5]) for x in X]

# ================= MODEL =================
model = RandomForestClassifier(n_estimators=120, random_state=42)
model.fit(X, y)

# ================= ML PREDICT =================
def ml_predict(data):
    try:
        temp = float(data.get("Temperature", 26))
        moist = float(data.get("Moisture", 45))
        soil = soil_map.get(data.get("Soil_Type", "Loamy"), 1)
        crop = crop_map.get(data.get("Crop_Type", "Maize"), 0)
        fert = fert_map.get(data.get("Fertilizer_Name", "Urea"), 0)
        qty = float(data.get("Fertilizer_Quantity", 30))

        # ML prediction probability
        proba = model.predict_proba([[temp, moist, soil, crop, fert, qty]])[0][1]
        score = int(proba * 100)

        # Final classification
        if score >= 75:
            overall = "Highly Compatible"
        elif score >= 50:
            overall = "Moderately Compatible"
        else:
            overall = "Not Compatible"

        # Dynamic status (VERY IMPORTANT)
        temp_status = "Optimal" if 25 <= temp <= 32 else "Not Optimal"
        moisture_status = "Optimal" if 35 <= moist <= 50 else "Not Optimal"
        soil_status = "Good" if soil == 1 else "Average"
        qty_status = "Optimal" if 35 <= qty <= 45 else "Too Low/High"

        return {
            "success": True,
            "overall_compatibility": overall,
            "overall_score": score,
            "temperature_status": temp_status,
            "temperature_range": "25°C - 32°C",
            "moisture_status": moisture_status,
            "moisture_range": "35% - 50%",
            "soil_compatibility": soil_status,
            "quantity_status": qty_status,
            "quantity_range": "35 - 45 kg/ha",
            "suggestions": [
                "ML-based prediction used",
                "Adjust inputs for better compatibility"
            ]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
