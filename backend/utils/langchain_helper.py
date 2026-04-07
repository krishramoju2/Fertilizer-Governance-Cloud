from langchain.schema.runnable import RunnableLambda, RunnableSequence
from utils.helpers import extract_inputs
import re

# ================= STEP 1: CLEAN INPUT =================
def clean_text(input_text):
    return input_text.lower().strip()

# ================= STEP 2: NORMALIZE LANGUAGE =================
def normalize_terms(text):
    replacements = {
        "humid": "high moisture",
        "dry": "low moisture",
        "very dry": "very low moisture",
        "burning": "very hot",
        "chilly": "cold",
        "super hot": "very hot"
    }

    for k, v in replacements.items():
        text = text.replace(k, v)

    return text

# ================= STEP 3: ADD CONTEXT EXTRACTION =================
def enrich_numbers(text):
    # Example: "30 40 20" → assume temp, moisture, qty
    nums = re.findall(r'\d+', text)

    if len(nums) == 3 and "temp" not in text:
        text += f" temperature {nums[0]} moisture {nums[1]} {nums[2]} kg"

    return text

# ================= STEP 4: FINAL PARSE =================
def final_parse(text):
    return extract_inputs(text)

# ================= LANGCHAIN PIPELINE =================
pipeline = RunnableSequence(
    RunnableLambda(clean_text),
    RunnableLambda(normalize_terms),
    RunnableLambda(enrich_numbers),
    RunnableLambda(final_parse)
)

# ================= MAIN FUNCTION =================
def parse_user_query(user_input):
    try:
        return pipeline.invoke(user_input)
    except:
        return extract_inputs(user_input)
