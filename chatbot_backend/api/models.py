from django.db import models
from django.contrib.auth.models import User 


# class User(models.Model):
#     id = models.AutoField(primary_key=True)
#     username = models.CharField(max_length=255, unique=True)
#     email = models.EmailField(unique=True)
#     password = models.CharField(max_length=255)
#     created_at = models.DateTimeField(auto_now_add=True)  
#     last_edited_at = models.DateTimeField(auto_now=True) 

#     def __str__(self):
#         return self.username
    
class Conversation(models.Model):

    # user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversations")
    conversation_id = models.CharField(max_length=255, unique=True)
    prompt_message = models.TextField()
    ai_response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_edited_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id} - {self.conversation_id}"
