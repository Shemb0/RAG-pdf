import os
import io
import tempfile
from django.conf import settings
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

ASTRO_AGENT = """
Role:
    Eres un agente especializado en astronomía encargado de ayudar a la gente a capacitarse y facilitar su estudio.
Goal:
    Tu enfoque está puesto en ser conciso pero eficaz al responder, brindando información clara sin dejar conceptos incompletos.
Backstory:
    Fuiste desarrollada en un observatorio astronómico internacional y entrenada con datos de telescopios espaciales como Hubble,
    James Webb y misiones planetarias. Aprendiste a explicar fenómenos como agujeros negros, exoplanetas, supernovas y evolución
    estelar de forma clara y precisa. Tu misión es ayudar a cualquier persona a comprender el universo, desde conceptos básicos
    hasta investigaciones avanzadas. Siempre respondes con rigor científico, evitando especulaciones sin evidencia y aclarando
    cuando un tema aún está en estudio.

Contexto de los documentos:
{context}

Pregunta del usuario:
{query}

Responde de forma clara, concisa y científicamente precisa:
"""

_retriever = None


def get_retriever():
    global _retriever
    chroma_dir = settings.CHROMA_DIR
    if os.path.exists(chroma_dir) and os.listdir(chroma_dir):
        embeddings = OpenAIEmbeddings()
        db = Chroma(persist_directory=chroma_dir, embedding_function=embeddings)
        _retriever = db.as_retriever(search_kwargs={"k": 3})
    return _retriever


def index_pdf_from_bytes(pdf_bytes: bytes, filename: str):
    """Index a PDF from bytes into Chroma vector store."""
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        loader = PyPDFLoader(tmp_path)
        documents = loader.load()

        splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=800,
            chunk_overlap=100,
            add_start_index=True,
        )
        chunks = splitter.split_documents(documents)

        chroma_dir = settings.CHROMA_DIR
        embeddings = OpenAIEmbeddings()

        if os.path.exists(chroma_dir) and os.listdir(chroma_dir):
            db = Chroma(persist_directory=chroma_dir, embedding_function=embeddings)
            db.add_documents(chunks)
        else:
            db = Chroma.from_documents(
                chunks,
                embedding=embeddings,
                persist_directory=chroma_dir,
            )

        global _retriever
        _retriever = db.as_retriever(search_kwargs={"k": 3})
        return len(chunks)
    finally:
        os.unlink(tmp_path)


def chat_with_rag(query: str, chat_history: list = None) -> str:
    """Run a RAG query and return the AI response."""
    retriever = get_retriever()

    context = ""
    if retriever:
        results = retriever.invoke(query)
        context = "\n\n".join([d.page_content for d in results])

    llm = ChatOpenAI(model="gpt-4o-mini")
    prompt_template = PromptTemplate(
        template=ASTRO_AGENT,
        input_variables=["context", "query"],
    )
    chain = prompt_template | llm
    result = chain.invoke({"context": context, "query": query})
    return result.content
