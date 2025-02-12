# backend/app/middleware/jwt_middleware.py

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import logging

from app.utils.jwt_utils import decode_access_token

logger = logging.getLogger(__name__)

class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = decode_access_token(token)
                if payload:
                    # Example: store user’s email in request.state.user_id
                    request.state.user_id = payload.get("sub")
                else:
                    request.state.user_id = None
            else:
                request.state.user_id = None
        except Exception as e:
            logger.error(f"Error in JWTMiddleware: {e}")
            request.state.user_id = None

        response = await call_next(request)
        return response
