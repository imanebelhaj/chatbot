import json
import uuid
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Conversation
import os

# Hugging Face Inference API URL
API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-llm-7b-chat"

# Your Hugging Face API key (stored as an environment variable)
API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Define headers with the API key for authentication
headers = {
    "Authorization": f"Bearer {API_KEY}"
}

@csrf_exempt
def chat(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            user_message = data.get('message')
            
            if not user_message:
                return JsonResponse({"error": "No message provided"}, status=400)
            
            # Prepare the payload
            payload = {
                "inputs": user_message
            }
            
            # Send the request to the Hugging Face API
            response = requests.post(API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                return JsonResponse({"error": "Failed to get a response from the model", "details": response.json()}, status=500)
            
            ai_response = response.json()[0]['generated_text']  # Extract AI response from the API response
            
            # Save conversation
            conversation_record = Conversation.objects.create(
                conversation_id=str(uuid.uuid4()),
                prompt_message=user_message,
                ai_response=ai_response
            )
            
            return JsonResponse({
                "ai_response": ai_response,
                "conversation_id": conversation_record.id
            })
        
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "Invalid request method"}, status=400)

@csrf_exempt
def conversation_history(request):
    if request.method == "GET":
        conversations = Conversation.objects.all().order_by('-created_at')
        
        conversation_list = [
            {
                "conversation_id": conv.conversation_id,
                "prompt_message": conv.prompt_message,
                "ai_response": conv.ai_response,
                "created_at": conv.created_at,
                "last_edited_at": conv.last_edited_at
            }
            for conv in conversations
        ]
        
        return JsonResponse({"conversations": conversation_list})
    
    return JsonResponse({"error": "Invalid request method"}, status=400)
