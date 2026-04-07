from langchain.prompts import PromptTemplate
from utils.helpers import extract_inputs

# Just using LangChain for structure (NO LLM)
prompt = PromptTemplate(
    input_variables=["query"],
    template="""
    Extract farming parameters from this query:
    {query}
    """
)

def parse_user_query(user_input):
    try:
        # Format prompt (just for structure, no AI call)
        formatted = prompt.format(query=user_input)

        # Use your existing logic
        data = extract_inputs(user_input)

        return data
    except:
        return {}
