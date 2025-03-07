import os
from dotenv import load_dotenv
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Conversation
import json
import uuid
# import openai
from openai.types.chat import ChatCompletion
from openai import OpenAI

load_dotenv()
# # openai.api_key = os.getenv("OPENAI_API_KEY")
# OpenAI.api_key = os.getenv('OPENAI_API_KEY')  
client = OpenAI(
    api_key = os.getenv('OPENAI_API_KEY')  

    )
@csrf_exempt  # Disable CSRF protection for this view
def chat(request):
    if request.method == "POST":
        try:
            # Parse JSON request body
            data = json.loads(request.body.decode('utf-8'))
            user_message = data.get('message')
            # Get user message from the request
            # user_message = request.POST.get('message')
            
            if not user_message:
                return JsonResponse({"error": "No message provided"}, status=400)

            # Call OpenAI API for a response to the user input
            
            # response = openai.Completion.create(
            # response = OpenAI.ChatCompletion.create(
            response = client.chat.completions.create( 
                # engine="text-davinci-003",  
                # prompt=user_message,
                model="gpt-3.5-turbo", 
                messages=[{"role": "user", "content": user_message}],
                max_tokens=200,
                temperature=0.7

            )
            
            # Extract AI response from OpenAI API
            ai_response = response.choices[0].text.strip()
            # ai_response = response['choices'][0]['message']['content']

            # Save the conversation in the database
            conversation = Conversation.objects.create(
                conversation_id=str(uuid.uuid4()),
                user_message=user_message,
                ai_response=ai_response
            )

            # Return the AI response along with conversation ID
            return JsonResponse({
                "ai_response": ai_response,
                "conversation_id": conversation.id
            })

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

@csrf_exempt
def conversation_history(request):
    if request.method == "GET":
        # Retrieve all conversations, ordered by creation date
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