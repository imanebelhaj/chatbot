import os
import json
import uuid
from django.http import JsonResponse
from .models import Conversation, Message, FileAttachment
from dotenv import load_dotenv
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import mimetypes
from .decorators import validate_token


load_dotenv()

from openai import OpenAI

client2 = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("KEY"),
)

# print(Message.objects.all())

#for file support
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@validate_token
def chat(request):
    parser_classes = (MultiPartParser, FormParser)
    
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "You must be logged in to interact with the chat."}, status=401)

        try:
            # Handle form data and files
            prompt_message = request.POST.get("prompt_message", "")
            conversation_id = request.POST.get("conversation_id", None)
            files = request.FILES.getlist('files')
            
            if not prompt_message and not files:
                return JsonResponse({"error": "No prompt message or files provided"}, status=400)

            # If a conversation_id is provided, attempt to retrieve the existing conversation
            if conversation_id:
                conversation = Conversation.objects.filter(conversation_id=conversation_id, user=request.user).first()
                if not conversation:
                    return JsonResponse({"error": "Conversation not found or you are not authorized to continue this conversation."}, status=404)
            else:
                # If no conversation_id is provided, create a new conversation
                conversation_id = str(uuid.uuid4())  # New conversation ID
                conversation = Conversation.objects.create(user=request.user, conversation_id=conversation_id)

            # Preparing payload for AI - include file information if files are uploaded
            ai_input = prompt_message
            
            if files:
                file_info = []
                for file in files:
                    file_info.append(f"[File: {file.name}, Type: {file.content_type}, Size: {file.size} bytes]")
                
                if file_info:
                    ai_input += "\n\nAttached files:\n" + "\n".join(file_info)

            # Sending message to AI and receiving a response
            response = client2.chat.completions.create(
                extra_headers={"HTTP-Referer": "", "X-Title": ""},
                extra_body={},
                model="deepseek/deepseek-chat:free",
                messages=[{"role": "user", "content": ai_input}],
            )

            ai_response = response.choices[0].message.content

            # Save the user message and AI response in the Message model
            message = Message.objects.create(
                conversation=conversation,
                user_message=prompt_message,
                ai_response=ai_response
            )
            
            # Process and save files
            saved_files = []
            for file in files:
                # Validate file type
                file_ext = os.path.splitext(file.name)[1].lower()
                valid_extensions = [
                    # Images
                    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg',
                    # Documents
                    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf',
                    # Archives
                    '.zip', '.rar', '.7z', '.tar', '.gz',
                    # Audio
                    '.mp3', '.wav', '.ogg', '.flac',
                    # Video
                    '.mp4', '.mov', '.avi', '.mkv', '.wmv'
                ]
                
                if file_ext not in valid_extensions:
                    return JsonResponse({
                        "error": f"File type {file_ext} is not supported. Supported types: {', '.join(valid_extensions)}"
                    }, status=400)
                
                # Get file type from MIME or extension
                file_type = file.content_type or mimetypes.guess_type(file.name)[0] or "application/octet-stream"
                
                # Save the file attachment
                attachment = FileAttachment.objects.create(
                    message=message,
                    file=file,
                    file_name=file.name,
                    file_type=file_type
                )
                
                saved_files.append({
                    "id": str(attachment.id),
                    "file_name": attachment.file_name,
                    "file_type": attachment.file_type,
                    "file_url": request.build_absolute_uri(settings.MEDIA_URL + str(attachment.file)),
                    "file_category": attachment.file_category
                })

            return JsonResponse({
                "conversation_id": conversation_id, 
                "ai_response": ai_response,
                "files": saved_files
            }, status=200)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method. Please use POST."}, status=400)



#this is the view to get the chat history titles and id for 
#the navbar but also the messages that i was aiming to use but eneded 
# making another function specifically for that
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@validate_token
def get_chat_history2(request):
    if request.method == "POST":
        try:
            conversations = Conversation.objects.filter(user=request.user).order_by('-created_at')

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

#this is the view to get the chat history for a specific conversation with file attachements support
@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@validate_token
def get_chat_history(request, conversation_id):
    if request.method == "GET":
        try:
            # Retrieve the conversation with related messages for the authenticated user
            conversation = Conversation.objects.prefetch_related('messages', 'messages__attachments').filter(
                conversation_id=conversation_id, user=request.user
            ).first()

            if not conversation:
                return JsonResponse({"error": "Conversation not found or unauthorized."}, status=404)

            # Retrieve all messages ordered chronologically
            messages = []
            for msg in conversation.messages.all().order_by('created_at'):
                # Get file attachments for this message
                attachments = []
                for attachment in msg.attachments.all():
                    attachments.append({
                        "id": str(attachment.id),
                        "file_name": attachment.file_name,
                        "file_type": attachment.file_type,
                        "file_url": request.build_absolute_uri(settings.MEDIA_URL + str(attachment.file)),
                        "file_category": attachment.file_category,
                        "uploaded_at": attachment.uploaded_at.isoformat()
                    })
                
                messages.append({
                    "id": msg.id,
                    "user_message": msg.user_message,
                    "ai_response": msg.ai_response,
                    "created_at": msg.created_at.isoformat(),
                    "attachments": attachments
                })

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


#delete conversation view
@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@validate_token
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
                # print(f"generated access token: {access_token}")
                # print(f"generated refresh token: {refresh_token}")
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
@api_view(['POST'])
def refresh_token(request):
    data = json.loads(request.body)
    refresh_token = data.get("refresh_token")
    if not refresh_token:
        print("No refresh token provided")
        return JsonResponse({"error": "No refresh token provided"}, status=401)
    try:
        print(f"Received refresh token: {refresh_token}")
        refresh = RefreshToken(refresh_token)
        new_access_token = str(refresh.access_token)
        return JsonResponse({"access_token": new_access_token}, status=200)
    except Exception as e:
        print(f"Error refreshing token: {e}")
        return JsonResponse({"error": str(e)}, status=500)



# Get the authenticated user's profile
@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@validate_token
def get_profile(request):
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
@validate_token
def delete_profile(request):
    try:
        user = request.user
        user.delete()
        return JsonResponse({"message": "User profile deleted successfully."}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)







#chat function before adding file support
#its unused now but keeping it for reference
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@validate_token
def chat2(request):
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


#this is the view to get the chat history bedore file attachements support
#also unused now but keeping it for reference
@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@validate_token
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

