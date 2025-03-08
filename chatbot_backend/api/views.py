import os
import json
import uuid
from django.http import JsonResponse
from .models import Conversation
from dotenv import load_dotenv
from django.views.decorators.csrf import csrf_exempt
# from huggingface_hub import InferenceClient
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token

load_dotenv()

from openai import OpenAI

client2 = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key= os.getenv("KEY"),
)

@csrf_exempt
def chat(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "You must be logged in to interact with the chat."}, status=401)
        
        try:
            body = json.loads(request.body)
            prompt_message = body.get("prompt_message", "")

            if not prompt_message:
                return JsonResponse({"error": "No prompt message provided"}, status=400)

            # Preparing payload for AI
            payload = {
                "inputs": prompt_message,
                "parameters": {"max_length": 500},
            }

            response = client2.chat.completions.create(
                extra_headers={"HTTP-Referer": "", "X-Title": "",},
                extra_body={},
                model="deepseek/deepseek-chat:free",
                messages=[{"role": "user", "content": payload["inputs"]}],
            )

            ai_response = response.choices[0].message.content
            conversation_id = str(uuid.uuid4())

            # Save conversation to database with the logged-in user
            conversation = Conversation.objects.create(
                user=request.user,  # Associate conversation with logged-in user
                conversation_id=conversation_id,
                prompt_message=prompt_message,
                ai_response=ai_response,
            )

            return JsonResponse({"conversation_id": conversation_id, "ai_response": ai_response}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method. Please use POST."}, status=400)


@csrf_exempt
def get_chat_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "You must be logged in to access your chat history."}, status=401)

    if request.method == "POST":
        try:
            # Get the user's conversations
            conversations = Conversation.objects.filter(user=request.user)

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


#user register
@csrf_exempt
def register(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            email = data.get("email")
            password = data.get("password")

            if not username or not email or not password:
                return JsonResponse({"error": "All fields are required"}, status=400)

            if User.objects.filter(username=username).exists():
                return JsonResponse({"error": "Username already taken"}, status=400)

            user = User.objects.create_user(username=username, email=email, password=password)
            return JsonResponse({"message": "User registered successfully"}, status=201)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method. Use POST."}, status=400)


#user login
@csrf_exempt
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)  # Logs in the user
                return JsonResponse({"message": "Login successful"}, status=200)
            else:
                return JsonResponse({"error": "Invalid credentials"}, status=401)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method. Use POST."}, status=400)

@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully"}, status=200)