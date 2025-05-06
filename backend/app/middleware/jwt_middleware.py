# backend/app/middleware/jwt_middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.utils.jwt_utils import decode_access_token


class JWTMiddleware(BaseHTTPMiddleware):
    """
    • Looks for Bearer … or the `access_token` cookie.
    • Adds request.state.user_id when a token is valid.
    • **Allows OPTIONS pre‑flight to pass straight through**
      so CORS headers are added by CORSMiddleware.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method == "OPTIONS":          # let CORS answer pre‑flights
            return await call_next(request)

        token: str | None = None

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(None, 1)[1].strip()
        else:
            token = request.cookies.get("access_token")

        if token:
            payload = decode_access_token(token)
            request.state.user_id = payload.get("sub") if payload else None
        else:
            request.state.user_id = None

        return await call_next(request)
