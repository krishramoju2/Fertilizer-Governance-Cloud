
import pandas as pd
import json

# Load and clean your dataset
df = pd.read_csv('Fertilizer Prediction.csv')
df.columns = df.columns.str.strip()
for col in df.select_dtypes(include=['object', 'str']).columns:
    df[col] = df[col].astype(str).str.strip()

# Convert to JSON for easy loading without pandas
data = df.to_dict(orient='records')

# Save to JSON file
with open('fertilizer_data.json', 'w') as f:
    json.dump(data, f)

print(f"✅ Converted {len(data)} records to fertilizer_data.json")
