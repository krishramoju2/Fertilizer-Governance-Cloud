# ml_model.py
'''import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV

# ================= LOAD DATASET =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(BASE_DIR, "Fertilizer Prediction (1).csv")

df = pd.read_csv(file_path)

# Clean bad values
df = df.replace("########", None).dropna()

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

# Apply encoding (IMPORTANT: match your CSV column names)
df["Soil_Type"] = df["Soil Type"].map(soil_map)
df["Crop_Type"] = df["Crop Type"].map(crop_map)
df["Fertilizer_Name"] = df["Fertilizer Name"].map(fert_map)

# ================= DATASET =================
X = np.array([
    [
        row["Temparature"],          # keep same spelling as CSV
        row["Moisture"],
        row["Soil_Type"],
        row["Crop_Type"],
        row["Fertilizer_Name"],
        row["Nitrogen"]              # used as quantity (same position as before)
    ]
    for _, row in df.iterrows()
])

# ================= LABEL GENERATION =================
def generate_label(temp, moisture, qty):
    if 25 <= temp <= 32 and 35 <= moisture <= 50 and 35 <= qty <= 45:
        return 1
    return 0

y = [generate_label(x[0], x[1], x[5]) for x in X]

# ================= MODEL WITH TUNING =================
param_grid = {
    "n_estimators": [100, 150, 200],
    "max_depth": [None, 5, 10],
    "min_samples_split": [2, 5],
    "min_samples_leaf": [1, 2]
}

grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=3,
    n_jobs=-1
)

grid.fit(X, y)
model = grid.best_estimator_

# ================= PREDICTION =================
def ml_predict(data):
    try:
        temp = float(data.get("Temperature", 26))
        moist = float(data.get("Moisture", 45))
        soil = soil_map.get(data.get("Soil_Type", "Loamy"), 1)
        crop = crop_map.get(data.get("Crop_Type", "Maize"), 0)
        fert = fert_map.get(data.get("Fertilizer_Name", "Urea"), 0)
        qty = float(data.get("Fertilizer_Quantity", 30))

        proba = model.predict_proba([[temp, moist, soil, crop, fert, qty]])[0][1]
        score = int(proba * 100)

        if score >= 75:
            overall = "Highly Compatible"
        elif score >= 50:
            overall = "Moderately Compatible"
        else:
            overall = "Not Compatible"

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
                "Model optimized with hyperparameter tuning"
            ]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

# ================= DASHBOARD =================
def get_model_dashboard(model, encoded_input):
    try:
        return {
            "model_name": "Random Forest (Tuned)",
            "num_trees": len(model.estimators_),
            "n_features": len(encoded_input),
            "feature_importance": model.feature_importances_.tolist(),
            "confidence": round(max(model.predict_proba([encoded_input])[0]) * 100, 2)
        }
    except:
        return {}'''






# ml_model.py
import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV

# ================= LOAD DATASET FROM PICKLE =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(BASE_DIR, "X.pkl")

with open(file_path, "rb") as f:
    X = pickle.load(f)

X = np.array(X)

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

# ================= LABEL GENERATION =================
def generate_label(temp, moisture, qty):
    if 25 <= temp <= 32 and 35 <= moisture <= 50 and 35 <= qty <= 45:
        return 1
    return 0

y = [generate_label(x[0], x[1], x[5]) for x in X]

# ================= MODEL WITH TUNING =================
param_grid = {
    "n_estimators": [100, 150, 200],
    "max_depth": [None, 5, 10],
    "min_samples_split": [2, 5],
    "min_samples_leaf": [1, 2]
}

grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=3,
    n_jobs=-1
)

grid.fit(X, y)
model = grid.best_estimator_

# ================= PREDICTION =================
def ml_predict(data):
    try:
        temp = float(data.get("Temperature", 26))
        moist = float(data.get("Moisture", 45))
        soil = soil_map.get(data.get("Soil_Type", "Loamy"), 1)
        crop = crop_map.get(data.get("Crop_Type", "Maize"), 0)
        fert = fert_map.get(data.get("Fertilizer_Name", "Urea"), 0)
        qty = float(data.get("Fertilizer_Quantity", 30))

        proba = model.predict_proba([[temp, moist, soil, crop, fert, qty]])[0][1]
        score = int(proba * 100)

        if score >= 75:
            overall = "Highly Compatible"
        elif score >= 50:
            overall = "Moderately Compatible"
        else:
            overall = "Not Compatible"

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
                "Model optimized with hyperparameter tuning"
            ]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

# ================= DASHBOARD =================
def get_model_dashboard(model, encoded_input):
    try:
        return {
            "model_name": "Random Forest (Tuned)",
            "num_trees": len(model.estimators_),
            "n_features": len(encoded_input),
            "feature_importance": model.feature_importances_.tolist(),
            "confidence": round(max(model.predict_proba([encoded_input])[0]) * 100, 2)
        }
    except:
        return {}
