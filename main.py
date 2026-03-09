from RAG.utils_rag import chunks_pdf, save_chroma, run_retriever
from agents.prompts_templates import chat_agent_prompt


def main():

    chunks = chunks_pdf()
    retriever = save_chroma(chunks)
    query = "What is the main topic of the documents?"
    context = run_retriever(query, retriever)
    agent = chat_agent_prompt()
    result = agent.invoke({"context":context,"query":query})
    print(result.content)



if __name__ == "__main__":
    main()
