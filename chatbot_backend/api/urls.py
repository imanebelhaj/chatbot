from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='chat'),
    path('chat_history/<str:conversation_id>/', views.get_chat_history, name='get_chat_history'),
    path('login/', views.login_view, name='login_view'),
    path('register/', views.register, name='register'),
    path('logout/', views.logout_view, name='logout_view'),
    path('refresh/', views.refresh_token, name='refresh_token'),
    path('history2/', views.get_chat_history2, name='get_chat_history2'),
    path('profile/', views.get_profile, name='get_profile'),
    path('conversation_delete/<str:conversation_id>/', views.delete_conversation, name='delete_conversation'),
    path('delete_profile/', views.delete_profile, name='delete_profile'),
]
