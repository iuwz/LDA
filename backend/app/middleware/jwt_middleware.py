from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.utils.jwt_utils import decode_access_token
import logging

logger = logging.getLogger(__name__)

class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            # Extract the Authorization header
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    # Decode the JWT token
                    payload = decode_access_token(token)
                    # Assume "sub" contains the user_id
                    request.state.user_id = payload.get("sub")
                    logger.info(f"Extracted user_id: {request.state.user_id}")
                except Exception as e:
                    logger.warning(f"Invalid token: {e}")
                    request.state.user_id = None
            else:
                # If no token is provided, set user_id to None
                request.state.user_id = None
        except Exception as e:
            logger.error(f"Error in JWTMiddleware: {e}")
            request.state.user_id = None

        # Pass control to the next middleware or route handler
        response = await call_next(request)
        return response
