# backend/app/middleware/jwt_middleware.py

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.utils.jwt_utils import decode_access_token

class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        token = None
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(None, 1)[1].strip()
        else:
            token = request.cookies.get("access_token")    # ← look in cookie

        if token:
            payload = decode_access_token(token)
            request.state.user_id = payload.get("sub") if payload else None
        else:
            request.state.user_id = None

        return await call_next(request)
