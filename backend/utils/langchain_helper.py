import re 
from langchain_core.runnables import RunnableLambda, RunnableSequence
# ================= KNOWLEDGE BASE =================
TEMP_CONTEXT = {
    "very hot": 38,
    "hot": 32,
    "warm": 28,
    "cool": 22,
    "cold": 18
}

MOISTURE_CONTEXT = {
    "very high moisture": 80,
    "high moisture": 65,
    "medium moisture": 50,
    "low moisture": 30,
    "very low moisture": 20
}

SOILS = ["sandy", "loamy", "clayey", "black", "red"]
CROPS = ["wheat", "paddy", "rice", "maize", "cotton", "sugarcane", "barley"]
FERTS = ["urea", "dap", "npk", "14-35-14", "17-17-17", "10-26-26"]

# ================= STEP 1: CLEAN =================
def clean(text):
    return text.lower().strip()

# ================= STEP 2: SEMANTIC UNDERSTANDING =================
def semantic_parse(text):
    data = {
        "Temperature": None,
        "Moisture": None,
        "Soil_Type": None,
        "Crop_Type": None,
        "Fertilizer_Name": None,
        "Fertilizer_Quantity": None
    }

    # 🔥 TEMPERATURE (semantic matching, not regex)
    for word, val in TEMP_CONTEXT.items():
        if word in text:
            data["Temperature"] = val

    # 💧 MOISTURE
    for word, val in MOISTURE_CONTEXT.items():
        if word in text:
            data["Moisture"] = val

    # 🌱 SOIL
    for soil in SOILS:
        if soil in text:
            data["Soil_Type"] = soil.capitalize()

    # 🌾 CROPS
    for crop in CROPS:
        if crop in text:
            if crop == "rice":
                data["Crop_Type"] = "Paddy"
            else:
                data["Crop_Type"] = crop.capitalize()

    # 🧪 FERTILIZER
    for fert in FERTS:
        if fert in text:
            data["Fertilizer_Name"] = fert.upper()

    return data

# ================= STEP 3: LIGHT NUMBER EXTRACTION =================
def extract_numbers(text, data):
    words = re.findall(r'\d+\.?\d*|\w+', text)

    for i, word in enumerate(words):
        if word.replace('.', '').isdigit():
            num = float(word)

            # Context-based assignment (NOT regex)
            if i > 0:
                prev = words[i-1]

                if "temp" in prev:
                    data["Temperature"] = num
                elif "%" in prev or "moisture" in prev:
                    data["Moisture"] = num
                elif "kg" in prev:
                    data["Fertilizer_Quantity"] = num



    return data

# ================= STEP 4: APPLY DEFAULTS =================
def apply_defaults(data):
    return {
        "Temperature": data["Temperature"] or 26,
        "Moisture": data["Moisture"] or 45,
        "Soil_Type": data["Soil_Type"] or "Loamy",
        "Crop_Type": data["Crop_Type"] or "Maize",
        "Fertilizer_Name": data["Fertilizer_Name"] or "Urea",
        "Fertilizer_Quantity": data["Fertilizer_Quantity"] or 30
    }

# ================= LANGCHAIN PIPELINE =================
pipeline = RunnableSequence(
    RunnableLambda(clean),
    RunnableLambda(lambda text: {"text": text, "data": semantic_parse(text)}),
    RunnableLambda(lambda x: extract_numbers(x["text"], x["data"])),
    RunnableLambda(apply_defaults)
)

# ================= MAIN FUNCTION =================
def parse_user_query(user_input):
    try:
        return pipeline.invoke(user_input)
    except:
        # fallback minimal safe default
        return {
            "Temperature": 26,
            "Moisture": 45,
            "Soil_Type": "Loamy",
            "Crop_Type": "Maize",
            "Fertilizer_Name": "Urea",
            "Fertilizer_Quantity": 30
        }
