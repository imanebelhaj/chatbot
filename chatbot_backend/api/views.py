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

# print(Message.objects.all())

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
            print(f"Saving message: {prompt_message}, AI response: {ai_response}")


            return JsonResponse({"conversation_id": conversation_id, "ai_response": ai_response}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method. Please use POST."}, status=400)



@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_history(request, conversation_id):
    if request.method == "GET":
        try:
            # Retrieve the conversation with related messages for the authenticated user
            conversation = Conversation.objects.prefetch_related('messages').filter(
                conversation_id=conversation_id, user=request.user
            ).first()

            if not conversation:
                return JsonResponse({"error": "Conversation not found or unauthorized."}, status=404)

            # Retrieve all messages ordered chronologically
            messages = [
                {
                    "user_message": msg.user_message,
                    "ai_response": msg.ai_response,
                    "created_at": msg.created_at.isoformat(),
                }
                for msg in conversation.messages.all().order_by('created_at')
            ]

            # Get the first message to use as a title (if available)
            first_message = conversation.messages.first()
            title = ' '.join(first_message.user_message.split()[:4]) if first_message else "Untitled Conversation"

            return JsonResponse({
                "conversation_id": conversation.conversation_id,
                "title": title,
                "messages": messages,
                "created_at": conversation.created_at.isoformat()
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)



#this is the view to get the chat history titles and id for 
#the navbar but also the messages that i ws aiming to use but eneded 
# making another function specifically for that
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_chat_history2(request):
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

                # Extract the first three words from the first message of the conversation
                first_prompt = convo.messages.first().user_message if convo.messages.exists() else ""
                first_prompt_title = ' '.join(first_prompt.split()[:4])

                chat_history.append({
                    "conversation_id": convo.conversation_id,
                    "title": first_prompt_title,
                    "messages": messages,
                    "created_at": convo.created_at,
                })

            return JsonResponse({"chat_history": chat_history}, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method. Please use POST."}, status=400)

#delete conversation view
@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
    """Delete a specific conversation belonging to the authenticated user."""
    try:
        conversation = Conversation.objects.filter(conversation_id=conversation_id, user=request.user).first()
        if not conversation:
            return JsonResponse({"error": "Conversation not found or unauthorized."}, status=404)

        conversation.delete()
        return JsonResponse({"message": "Conversation deleted successfully."}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


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
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                response = JsonResponse({
                    "message": "Login successful",
                    "access_token": access_token,
                    "refresh_token": refresh_token  # Optionally include this in JSON as well
                }, status=200)
                # Set the refresh token as an HTTP-only cookie
                response.set_cookie(
                    "refresh_token",
                    refresh_token,
                    httponly=True,
                    secure=False,  # Use True in production with HTTPS
                    samesite="Lax"
                )
                return response
            else:
                return JsonResponse({"error": "Invalid credentials"}, status=401)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method. Use POST."}, status=400)


# User logout view (jwt-based)
@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully"}, status=200)



#refresh token (JWT-based)
@csrf_exempt
@api_view(['POST'])
def refresh_token(request):
    data = json.loads(request.body)
    refresh_token = data.get("refresh_token")
    if not refresh_token:
        return JsonResponse({"error": "No refresh token provided"}, status=401)
    try:
        refresh = RefreshToken(refresh_token)
        new_access_token = str(refresh.access_token)
        return JsonResponse({"access_token": new_access_token}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



# Get the authenticated user's profile
@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Retrieve the authenticated user's profile."""
    try:
        user = request.user
        return JsonResponse({
            "username": user.username,
            "email": user.email,
            "date_joined": user.date_joined.isoformat()
        }, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


#delete the authenticated user's profile
@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile(request):
    """Delete the authenticated user's account and associated data."""
    try:
        user = request.user
        user.delete()
        return JsonResponse({"message": "User profile deleted successfully."}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

