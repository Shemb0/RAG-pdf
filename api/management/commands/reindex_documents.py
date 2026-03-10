import os
import shutil

from django.conf import settings
from django.core.management.base import BaseCommand

from api.models import Document
from api.rag_service import index_pdf_from_bytes


class Command(BaseCommand):
    help = 'Re-indexa todos los PDFs de PostgreSQL en ChromaDB'

    def handle(self, *args, **kwargs):
        # 1. Borrar ChromaDB
        if os.path.exists(settings.CHROMA_DIR):
            shutil.rmtree(settings.CHROMA_DIR)
            self.stdout.write('ChromaDB borrado.')

        # 2. Re-indexar cada documento
        docs = Document.objects.all()
        if not docs.exists():
            self.stdout.write('No hay documentos en la base de datos.')
            return

        for doc in docs:
            self.stdout.write(f'Indexando {doc.name}...')
            doc.is_indexed = False
            doc.save()
            try:
                chunks = index_pdf_from_bytes(bytes(doc.file), doc.name)
                doc.is_indexed = True
                doc.save()
                self.stdout.write(f'  → {chunks} chunks indexados')
            except Exception as e:
                self.stdout.write(f'  → Error: {e}')

        self.stdout.write('Listo!')
