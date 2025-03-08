from django.db import models
from django.contrib.auth.models import User 
from django.contrib.auth.models import AbstractUser
import uuid



class Message(models.Model):
    conversation = models.ForeignKey('Conversation', related_name='messages', on_delete=models.CASCADE)
    user_message = models.TextField()  # Store user prompt
    ai_response = models.TextField()  # Store AI response
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message in conversation {self.conversation.conversation_id} at {self.created_at}"
    
class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    conversation_id = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_edited_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.conversation_id} by {self.user.username}"
