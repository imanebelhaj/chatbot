import os
import json
import uuid
from django.http import JsonResponse
from .models import Conversation
from dotenv import load_dotenv
from django.views.decorators.csrf import csrf_exempt
from huggingface_hub import InferenceClient

# Load environment variables from .env file
load_dotenv()

# Retrieve the Hugging Face API token from .env file
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

if not HUGGINGFACE_API_KEY:
    raise ValueError("Hugging Face API key is missing in .env file")

# Initialize the Hugging Face InferenceClient with API key
client = InferenceClient(
    provider="hf-inference",
    api_key=HUGGINGFACE_API_KEY
)

# Define the model you want to use
MODEL = "meta-llama/Llama-2-7b-chat-hf"

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

            # Prepare the message for the Llama-2 model
            messages = [
                {
                    "role": "user",
                    "content": prompt_message
                }
            ]

            # Query the Llama model using the InferenceClient
            completion = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                max_tokens=500,
            )

            # Extract the AI response
            ai_response = completion.choices[0].message

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
