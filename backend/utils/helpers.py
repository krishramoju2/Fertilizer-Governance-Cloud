import re


def extract_inputs(message):
    message = message.lower()

    data = {
        "Temperature": 26,
        "Moisture": 45,
        "Soil_Type": "Loamy",
        "Crop_Type": "Maize",
        "Fertilizer_Name": "Urea",
        "Fertilizer_Quantity": 30
    }




        # 🌡️ HUMAN TEMPERATURE WORDS
    if "very hot" in message:
        data["Temperature"] = 38
    elif "hot" in message:
        data["Temperature"] = 32
    elif "warm" in message:
        data["Temperature"] = 28
    elif "cool" in message:
        data["Temperature"] = 22
    elif "cold" in message:
        data["Temperature"] = 18

    # 💧 HUMAN MOISTURE WORDS
    if "very high moisture" in message:
        data["Moisture"] = 80
    elif "high moisture" in message:
        data["Moisture"] = 65
    elif "medium moisture" in message:
        data["Moisture"] = 50
    elif "low moisture" in message:
        data["Moisture"] = 30
    elif "very low moisture" in message:
        data["Moisture"] = 20

    # 🔧 SLIGHT / BIT HANDLING
    if "a bit hot" in message or "slightly hot" in message:
        data["Temperature"] = 30

    if "a bit cold" in message:
        data["Temperature"] = 20

    if "slightly moist" in message:
        data["Moisture"] = 55

    if "a bit dry" in message:
        data["Moisture"] = 35





    
    temp_match = re.search(r'(temp|temperature).*?(\d+)', message)
    if temp_match:
        data["Temperature"] = float(temp_match.group(2))
    else:
        temp_match = re.search(r'(\d+)\s*°?c', message)
        if temp_match:
            data["Temperature"] = float(temp_match.group(1))

    moist_match = re.search(r'(moisture\s*(\d+))|(\d+\s*%)', message)
    if moist_match:
        if moist_match.group(2):
            data["Moisture"] = float(moist_match.group(2))
        else:
            data["Moisture"] = float(re.search(r'\d+', moist_match.group(0)).group())
        
    # 📦 Quantity
    qty_match = re.search(r'(\d+)\s*(kg)', message)
    if qty_match:
        data["Fertilizer_Quantity"] = float(qty_match.group(1))

    # 🌱 Soil
    for soil in ["sandy", "loamy", "clayey", "black", "red"]:
        if soil in message:
            data["Soil_Type"] = soil.capitalize()



    

    # 🌾 Crop (FIXED)
    if "wheat" in message:
        data["Crop_Type"] = "Wheat"
    elif "rice" in message or "paddy" in message:
        data["Crop_Type"] = "Paddy"
    elif "cotton" in message:
        data["Crop_Type"] = "Cotton"
    elif "maize" in message:
        data["Crop_Type"] = "Maize"
    elif "sugarcane" in message:
        data["Crop_Type"] = "Sugarcane"
    elif "barley" in message:
        data["Crop_Type"] = "Barley"







    
        
    # 🧪 Fertilizer (FIXED)
    if "urea" in message:
        data["Fertilizer_Name"] = "Urea"
    elif "dap" in message:
        data["Fertilizer_Name"] = "DAP"
    elif "npk" in message:
        data["Fertilizer_Name"] = "NPK"
    elif "14-35-14" in message:
        data["Fertilizer_Name"] = "14-35-14"
    elif "17-17-17" in message:
        data["Fertilizer_Name"] = "17-17-17"
    elif "10-26-26" in message:
        data["Fertilizer_Name"] = "10-26-26"



    



    return data
