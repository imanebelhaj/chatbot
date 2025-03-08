from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='chat'),
    # path('history/', views.conversation_history, name='conversation_history'),
    # path('login', views.login, name='login'),
    # path('register', views.register, name='register'),
    # path('logout', views.logout, name='logout'),
]
