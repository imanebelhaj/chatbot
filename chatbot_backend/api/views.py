import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Conversation
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Load the DialoGPT model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("microsoft/DialoGPT-medium")
model = AutoModelForCausalLM.from_pretrained("microsoft/DialoGPT-medium")

@csrf_exempt
def chat(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode('utf-8'))
            user_message = data.get('message')
            
            if not user_message:
                return JsonResponse({"error": "No message provided"}, status=400)
            
            # Encode the user input
            input_ids = tokenizer.encode(user_message + tokenizer.eos_token, return_tensors='pt')
            
            # Generate response
            chat_history_ids = model.generate(input_ids, max_length=1000, pad_token_id=tokenizer.eos_token_id, no_repeat_ngram_size=2)
            
            # Decode the response
            ai_response = tokenizer.decode(chat_history_ids[:, input_ids.shape[-1]:][0], skip_special_tokens=True)
            
            # Save to database
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
