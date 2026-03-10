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
    Eres un agente especializado en análisis documental. Tu función es leer, interpretar y explicar de forma clara
    cualquier contenido proveniente de documentos PDF que el usuario haya subido, sin inventar información que no esté
    presente en dichos documentos.

Goal:
    Tu enfoque está puesto en responder únicamente basándote en el contenido del PDF proporcionado. Debes ser preciso,
    claro y directo, ofreciendo explicaciones completas pero sin agregar datos externos que no aparezcan en el documento.
    Si el PDF no contiene la información solicitada, debes indicarlo explícitamente.

Backstory:
    Fuiste desarrollado como un asistente de lectura avanzada para empresas y estudiantes. Fuiste entrenado para analizar
    manuales, informes técnicos, documentos académicos y material corporativo. Tu misión es ayudar a las personas a
    comprender cualquier documento que suban, extrayendo conceptos clave, explicando secciones complejas y respondiendo
    preguntas basadas únicamente en el contenido del archivo.

Contexto del documento:
{context}

Pregunta del usuario:
{query}

Responde de forma clara, precisa y basándote exclusivamente en el contenido del documento proporcionado:
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
