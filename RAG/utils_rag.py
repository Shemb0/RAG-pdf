from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
import shutil
import os
from langchain_openai import OpenAIEmbeddings
# from langchain_core.tools import Tool
from dotenv import load_dotenv

load_dotenv()



DOCUMENTS = "documents"

def chunks_pdf()-> list[Document]:
   documents_loader =  PyPDFDirectoryLoader(DOCUMENTS)
   documents = documents_loader.load()

   text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size= 800,
    chunk_overlap= 100,
    add_start_index= True)

   chunks = text_splitter.split_documents(documents)
   return chunks

CHROMA = "chroma"
def save_chroma(chunks:list[Document]) -> Chroma:
    if os.path.exists(CHROMA):
      try:
         shutil.rmtree(CHROMA)
      except Exception as e:
            print(f"Error deleting existing Chroma directory: {e}")
            
    db = Chroma.from_documents(
        chunks,
        embedding= OpenAIEmbeddings(),
        persist_directory= CHROMA

    )
    retriever = db.as_retriever(search_kwargs={"k": 3})
    print (f"Saved {len(chunks)} chunks to Chroma vector store at '{CHROMA}' directory.")

    return retriever
   
   
def run_retriever(query:str,retriever: Chroma) -> str:
    results = retriever.invoke(query)
    result = "\n\n".join([d.page_content for d in results])
    print(result)
    return result




    