from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Document, ChatSession, Message
from .serializers import (
    DocumentSerializer,
    ChatSessionSerializer,
    ChatSessionListSerializer,
    MessageSerializer,
)
from .rag_service import index_pdf_from_bytes, chat_with_rag


# ── Documents ──────────────────────────────────────────────────────────────────

class DocumentListView(APIView):
    def get(self, request):
        docs = Document.objects.all()
        return Response(DocumentSerializer(docs, many=True).data)

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.endswith('.pdf'):
            return Response({'error': 'Only PDF files are allowed'}, status=status.HTTP_400_BAD_REQUEST)

        pdf_bytes = file.read()
        doc = Document.objects.create(
            name=file.name,
            file=pdf_bytes,
            file_size=len(pdf_bytes),
            is_indexed=False,
        )

        try:
            chunks_count = index_pdf_from_bytes(pdf_bytes, file.name)
            doc.is_indexed = True
            doc.save()
            return Response(
                {**DocumentSerializer(doc).data, 'chunks_indexed': chunks_count},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {**DocumentSerializer(doc).data, 'warning': str(e)},
                status=status.HTTP_201_CREATED,
            )


class DocumentDetailView(APIView):
    def delete(self, request, pk):
        doc = get_object_or_404(Document, pk=pk)
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Chat Sessions ──────────────────────────────────────────────────────────────

class ChatSessionListView(APIView):
    def get(self, request):
        sessions = ChatSession.objects.all()
        return Response(ChatSessionListSerializer(sessions, many=True).data)

    def post(self, request):
        title = request.data.get('title', 'Nueva conversación')
        session = ChatSession.objects.create(title=title)
        return Response(ChatSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class ChatSessionDetailView(APIView):
    def get(self, request, pk):
        session = get_object_or_404(ChatSession, pk=pk)
        return Response(ChatSessionSerializer(session).data)

    def delete(self, request, pk):
        session = get_object_or_404(ChatSession, pk=pk)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        session = get_object_or_404(ChatSession, pk=pk)
        title = request.data.get('title')
        if title:
            session.title = title
            session.save()
        return Response(ChatSessionListSerializer(session).data)


# ── Messages / Chat ────────────────────────────────────────────────────────────

class ChatView(APIView):
    def post(self, request, session_id):
        session = get_object_or_404(ChatSession, pk=session_id)
        user_message = request.data.get('message', '').strip()

        if not user_message:
            return Response({'error': 'Empty message'}, status=status.HTTP_400_BAD_REQUEST)

        # Save user message
        Message.objects.create(session=session, role='user', content=user_message)

        # Build history for context
        history = list(session.messages.values('role', 'content'))

        try:
            ai_response = chat_with_rag(user_message, history)
        except Exception as e:
            ai_response = f"Error al procesar la consulta: {str(e)}"

        # Save AI message
        ai_msg = Message.objects.create(session=session, role='assistant', content=ai_response)

        # Auto-title session on first message
        if session.messages.count() == 2 and session.title == 'Nueva conversación':
            session.title = user_message[:60]
            session.save()

        return Response(MessageSerializer(ai_msg).data, status=status.HTTP_201_CREATED)



