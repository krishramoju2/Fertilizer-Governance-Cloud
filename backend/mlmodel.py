import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# ==================== DATASET (EMBEDDED) ====================

# Using SAME logic ranges from your existing analyzer
dataset = [
    # temp, moisture, soil, crop, fertilizer, quantity, label
    [26, 45, "Loamy", "Maize", "Urea", 30, "Highly Compatible"],
    [30, 40, "Sandy", "Wheat", "DAP", 35, "Moderately Compatible"],
    [35, 60, "Clayey", "Rice", "Urea", 50, "Not Recommended"],
    [28, 50, "Loamy", "Maize", "28-28", 25, "Highly Compatible"],
    [22, 30, "Red", "Pulses", "DAP", 20, "Moderately Compatible"],
    [27, 48, "Black", "Cotton", "17-17-17", 18, "Highly Compatible"],
    [33, 70, "Clayey", "Paddy", "Urea", 55, "Not Recommended"],
    [25, 42, "Loamy", "Maize", "Urea", 40, "Highly Compatible"],
]

# ==================== ENCODERS ====================

soil_enc = LabelEncoder()
crop_enc = LabelEncoder()
fert_enc = LabelEncoder()
label_enc = LabelEncoder()

soils = [row[2] for row in dataset]
crops = [row[3] for row in dataset]
ferts = [row[4] for row in dataset]
labels = [row[6] for row in dataset]

soil_enc.fit(soils)
crop_enc.fit(crops)
fert_enc.fit(ferts)
label_enc.fit(labels)

# ==================== PREPARE TRAINING ====================

X = []
y = []

for row in dataset:
    X.append([
        row[0],
        row[1],
        soil_enc.transform([row[2]])[0],
        crop_enc.transform([row[3]])[0],
        fert_enc.transform([row[4]])[0],
        row[5]
    ])
    y.append(label_enc.transform([row[6]])[0])

X = np.array(X)
y = np.array(y)

# ==================== MODEL ====================

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# ==================== HELPER LOGIC (MATCH OLD SYSTEM) ====================

def get_ranges(crop):
    ranges = {
        "Maize": ((25, 32), (35, 50)),
        "Wheat": ((20, 30), (35, 55)),
        "Rice": ((25, 35), (40, 65)),
        "Paddy": ((25, 35), (40, 65)),
        "Cotton": ((25, 35), (30, 50)),
        "Pulses": ((20, 30), (30, 45)),
    }
    return ranges.get(crop, ((25, 32), (35, 50)))

def get_quantity_range(fertilizer):
    ranges = {
        "Urea": (35, 45),
        "DAP": (35, 45),
        "28-28": (20, 30),
        "17-17-17": (10, 20),
    }
    return ranges.get(fertilizer, (30, 40))

# ==================== MAIN FUNCTION ====================

def predict_ml(data):
    try:
        # Extract input
        temp = float(data.get("Temparature", 26))
        moist = float(data.get("Moisture", 45))
        soil = data.get("Soil_Type", "Loamy")
        crop = data.get("Crop_Type", "Maize")
        fert = data.get("Fertilizer_Name", "Urea")
        qty = float(data.get("Fertilizer_Quantity", 30))

        # Encode
        soil_val = soil_enc.transform([soil])[0] if soil in soil_enc.classes_ else 0
        crop_val = crop_enc.transform([crop])[0] if crop in crop_enc.classes_ else 0
        fert_val = fert_enc.transform([fert])[0] if fert in fert_enc.classes_ else 0

        features = np.array([[temp, moist, soil_val, crop_val, fert_val, qty]])

        # Predict
        pred = model.predict(features)[0]
        label = label_enc.inverse_transform([pred])[0]

        # ================= SAME OUTPUT LOGIC =================

        (tmin, tmax), (mmin, mmax) = get_ranges(crop)

        temp_status = "Optimal" if tmin <= temp <= tmax else "Suboptimal"
        moisture_status = "Optimal" if mmin <= moist <= mmax else "Adjust Needed"

        qmin, qmax = get_quantity_range(fert)

        if qty < qmin:
            quantity_status = "Insufficient"
        elif qty > qmax:
            quantity_status = "Excessive"
        else:
            quantity_status = "Optimal"

        # Score mapping (same feel as decision system)
        score_map = {
            "Highly Compatible": 90,
            "Moderately Compatible": 65,
            "Not Recommended": 35
        }

        overall_score = score_map.get(label, 60)

        # Suggestions
        suggestions = []

        if temp_status != "Optimal":
            suggestions.append("🌡 Adjust temperature conditions if possible")

        if moisture_status != "Optimal":
            suggestions.append("💧 Improve irrigation or drainage")

        if quantity_status != "Optimal":
            suggestions.append(f"📦 Recommended: {qmin}-{qmax} kg/ha")

        suggestions.append(f"🌱 {fert} works with {soil} soil")

        # ================= FINAL RESPONSE =================

        return {
            "success": True,
            "overall_compatibility": label,
            "overall_score": overall_score,
            "temperature_status": temp_status,
            "temperature_range": f"{tmin}°C - {tmax}°C",
            "moisture_status": moisture_status,
            "moisture_range": f"{mmin}% - {mmax}%",
            "soil_compatibility": "Good",
            "quantity_status": quantity_status,
            "quantity_range": f"{qmin} - {qmax} kg/ha",
            "suggestions": suggestions[:4],
            "fertilizer_info": {
                "name": fert,
                "type": "Nitrogenous" if fert == "Urea" else "Complex",
                "application": "Split application recommended"
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
