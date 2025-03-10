from django.db import models
from django.contrib.auth.models import User
import uuid
import os

def upload_path(instance, filename):
    # Files will be uploaded to MEDIA_ROOT/user_<id>/<conversation_id>/<filename>
    return f'user_{instance.message.conversation.user.id}/{instance.message.conversation.conversation_id}/{filename}'

class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    conversation_id = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_edited_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Conversation {self.conversation_id} by {self.user.username}"

class Message(models.Model):
    conversation = models.ForeignKey('Conversation', related_name='messages', on_delete=models.CASCADE)
    user_message = models.TextField()  # Store user prompt
    ai_response = models.TextField()  # Store AI response
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Message in conversation {self.conversation.conversation_id} at {self.created_at}"

class FileAttachment(models.Model):
    message = models.ForeignKey(Message, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to=upload_path)
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"File {self.file_name} attached to message {self.message.id}"
    
    @property
    def file_extension(self):
        return os.path.splitext(self.file_name)[1].lower()
    
    @property
    def file_category(self):
        ext = self.file_extension
        if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg']:
            return 'image'
        elif ext in ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf']:
            return 'document'
        elif ext in ['.zip', '.rar', '.7z', '.tar', '.gz']:
            return 'archive'
        elif ext in ['.mp3', '.wav', '.ogg', '.flac']:
            return 'audio'
        elif ext in ['.mp4', '.mov', '.avi', '.mkv', '.wmv']:
            return 'video'
        else:
            return 'other'