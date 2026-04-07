import pandas as pd
import pickle

df = pd.read_csv("Fertilizer Prediction (1).csv")
df = df.replace("########", None).dropna()

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

df["Soil_Type"] = df["Soil Type"].map(soil_map)
df["Crop_Type"] = df["Crop Type"].map(crop_map)
df["Fertilizer_Name"] = df["Fertilizer Name"].map(fert_map)

X = [
    [
        row["Temparature"],
        row["Moisture"],
        row["Soil_Type"],
        row["Crop_Type"],
        row["Fertilizer_Name"],
        row["Nitrogen"]
    ]
    for _, row in df.iterrows()
]

with open("X.pkl", "wb") as f:
    pickle.dump(X, f)

print("X.pkl created ✅")
