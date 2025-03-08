import os
import json
import uuid
from django.http import JsonResponse
from .models import Conversation
from dotenv import load_dotenv
from django.views.decorators.csrf import csrf_exempt
# from huggingface_hub import InferenceClient

load_dotenv()

from openai import OpenAI

client2 = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key= os.getenv("KEY"),
)

@csrf_exempt
def chat(request):
    if request.method == "POST":
        try:
            # Get the prompt message from the request body
            try:
                body = json.loads(request.body)
                prompt_message = body.get("prompt_message", "")
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON format"}, status=400)

            if not prompt_message:
                return JsonResponse({"error": "No prompt message provided"}, status=400)
            
            payload = {
                "inputs": prompt_message,
                "parameters": {
                    "max_length": 500
                }
            }
            print(payload['inputs'])

            response = client2.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": "", 
                    "X-Title": "", 
                },
                extra_body={},
                model="deepseek/deepseek-chat:free",
                messages=[
                    {
                    "role": "user",
                    "content": payload['inputs']
                    }
                ]
            )

            # Extract the AI response
            ai_response = response.choices[0].message.content

            # Create a unique conversation ID
            conversation_id = str(uuid.uuid4())

            # Save the conversation to the database
            conversation = Conversation.objects.create(
                conversation_id=conversation_id,
                prompt_message=prompt_message,
                ai_response=ai_response
            )

            # Return the AI response and conversation ID
            return JsonResponse({
                "conversation_id": conversation_id,
                "ai_response": ai_response
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method. Please use POST."}, status=400)

# Get Chat History
@csrf_exempt
def get_chat_history(request):
    if request.method == "POST":
        try:
            # Get all conversations from the database
            conversations = Conversation.objects.all()

            # Prepare chat history response
            chat_history = []
            for convo in conversations:
                chat_history.append({
                    "conversation_id": convo.conversation_id,
                    "prompt_message": convo.prompt_message,
                    "ai_response": convo.ai_response,
                    "created_at": convo.created_at,
                })

            return JsonResponse({"chat_history": chat_history}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method. Please use POST."}, status=400)
