# AstroRAG - Chat con PDFs de Astronomía

Interfaz web para chatear con una IA especializada en astronomía que consulta tus PDFs vía RAG.

## Stack
- **Backend**: Django + Django REST Framework
- **Frontend**: Next.js (JavaScript) + Tailwind CSS
- **Base de datos**: PostgreSQL
- **IA/RAG**: LangChain + OpenAI + Chroma

---

## Setup

### 1. PostgreSQL
Creá la base de datos:
```sql
CREATE DATABASE pdf_rag_db;
```

### 2. Variables de entorno
Editá `.env` con tus datos:
```
OPENAI_API_KEY=tu_clave
DB_NAME=pdf_rag_db
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432
```

### 3. Backend (Django)
```bash
# Aplicar migraciones
.venv/Scripts/python manage.py migrate

# Crear superusuario (opcional)
.venv/Scripts/python manage.py createsuperuser

# Correr el servidor
.venv/Scripts/python manage.py runserver
```
El backend corre en `http://localhost:8000`

### 4. Frontend (Next.js)
```bash
cd frontend
npm run dev
```
El frontend corre en `http://localhost:3000`

---

## Uso
1. Abrí `http://localhost:3000`
2. Subí un PDF desde el panel izquierdo (se indexa automáticamente)
3. Creá una nueva conversación y empezá a chatear
