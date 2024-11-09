from fastapi import Request, HTTPException
import secrets

# In-memory set to store valid CSRF tokens (use a secure store in production)
csrf_tokens = set()

def generate_csrf_token():
    token = secrets.token_urlsafe(32)
    csrf_tokens.add(token)
    return token

def validate_csrf_token(token: str) -> bool:
    if token in csrf_tokens:
        # Optionally remove the token to prevent reuse
        csrf_tokens.remove(token)
        return True
    return False

async def csrf_middleware(request: Request, call_next):
    if request.method in ["POST", "PUT", "DELETE"]:
        token = request.headers.get("X-CSRF-Token")
        if not validate_csrf_token(token):
            raise HTTPException(status_code=403, detail="Invalid CSRF token")
    response = await call_next(request)
    return response