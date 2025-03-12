from rest_framework_simplejwt.tokens import AccessToken
from django.http import JsonResponse

def validate_token(view_func):
    def _wrapped_view(request, *args, **kwargs):
        token = request.headers.get('Authorization', None)
        if not token:
            return JsonResponse({"error": "No token provided"}, status=401)
        
        try:
            token = token.split(' ')[1]  # Assuming the token is in the format "Bearer <token>"
            AccessToken(token)
        except Exception as e:
            return JsonResponse({"error": "Invalid token"}, status=401)
        
        return view_func(request, *args, **kwargs)
    
    return _wrapped_view