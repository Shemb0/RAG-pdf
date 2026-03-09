from prompts import ASTRO_AGENT
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

def chat_agent_prompt():
    llm=ChatOpenAI(model="gpt-4o-mini")

    prompt_template = PromptTemplate(
        template=ASTRO_AGENT,
        input_variables=["context","query"]
    )
    prompt_chain = prompt_template | llm
    return prompt_chain








