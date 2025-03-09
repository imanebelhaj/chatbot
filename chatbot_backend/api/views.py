import os
import json
import uuid
from django.http import JsonResponse
from .models import Conversation, Message
from dotenv import load_dotenv
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

load_dotenv()

from openai import OpenAI

client2 = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("KEY"),
)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "You must be logged in to interact with the chat."}, status=401)

        try:
            body = json.loads(request.body)
            prompt_message = body.get("prompt_message", "")
            conversation_id = body.get("conversation_id", None)  # Get conversation_id if provided

            if not prompt_message:
                return JsonResponse({"error": "No prompt message provided"}, status=400)

            # If a conversation_id is provided, attempt to retrieve the existing conversation
            if conversation_id:
                conversation = Conversation.objects.filter(conversation_id=conversation_id, user=request.user).first()
                if not conversation:
                    return JsonResponse({"error": "Conversation not found or you are not authorized to continue this conversation."}, status=404)
            else:
                # If no conversation_id is provided, create a new conversation
                conversation_id = str(uuid.uuid4())  # New conversation ID
                conversation = Conversation.objects.create(user=request.user, conversation_id=conversation_id)

            # Preparing payload for AI
            payload = {
                "inputs": prompt_message,
                "parameters": {"max_length": 500},
            }

            # Sending message to AI and receiving a response
            response = client2.chat.completions.create(
                extra_headers={"HTTP-Referer": "", "X-Title": ""},
                extra_body={},
                model="deepseek/deepseek-chat:free",
                messages=[{"role": "user", "content": payload["inputs"]}],
            )

            ai_response = response.choices[0].message.content

            # Save the user message and AI response in the Message model
            Message.objects.create(
                conversation=conversation,
                user_message=prompt_message,
                ai_response=ai_response
            )

            return JsonResponse({"conversation_id": conversation_id, "ai_response": ai_response}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method. Please use POST."}, status=400)





@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_chat_history(request):
    if request.method == "POST":
        try:
            conversations = Conversation.objects.filter(user=request.user)

            chat_history = []
            for convo in conversations:
                # Get all messages in the conversation
                messages = []
                for message in convo.messages.all():  # Using related_name='messages' in the Message model
                    messages.append({
                        "user_message": message.user_message,
                        "ai_response": message.ai_response,
                        "created_at": message.created_at,
                    })

                chat_history.append({
                    "conversation_id": convo.conversation_id,
                    "messages": messages,
                    "created_at": convo.created_at,
                })

            return JsonResponse({"chat_history": chat_history}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method. Please use POST."}, status=400)




# User registration view
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


# User login view (JWT-based)
@csrf_exempt
def login_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            user = authenticate(request, username=username, password=password)

            if user is not None:
                # Create JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                return JsonResponse({
                    "message": "Login successful",
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }, status=200)

            else:
                return JsonResponse({"error": "Invalid credentials"}, status=401)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method. Use POST."}, status=400)


# User logout view
@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully"}, status=200)



#refresh token (JWT-based)
@csrf_exempt
@api_view(['POST'])
def refresh_token(request):
    refresh_token = request.COOKIES.get('refresh_token')
    if not refresh_token:
        return JsonResponse({"error": "No refresh token provided"}, status=401)

    try:
        # Validate and refresh the token
        refresh = RefreshToken(refresh_token)
        new_access_token = str(refresh.access_token)

        return JsonResponse({
            "access_token": new_access_token,
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
