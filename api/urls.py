from django.urls import path
from . import views

urlpatterns = [
    path('documents/', views.DocumentListView.as_view(), name='documents'),
    path('documents/<int:pk>/', views.DocumentDetailView.as_view(), name='document-detail'),
    path('sessions/', views.ChatSessionListView.as_view(), name='sessions'),
    path('sessions/<int:pk>/', views.ChatSessionDetailView.as_view(), name='session-detail'),
    path('sessions/<int:session_id>/chat/', views.ChatView.as_view(), name='chat'),
]
