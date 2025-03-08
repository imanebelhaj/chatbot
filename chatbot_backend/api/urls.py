from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='chat'),
    path('history/', views.get_chat_history, name='get_chat_history'),
    # path('login', views.login_user, name='login_user'),
    # path('register', views.register, name='register'),
    # path('logout', views.logout, name='logout'),
]
