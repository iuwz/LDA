# backend/app/utils/security.py

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security, HTTPException, status

bearer_scheme = HTTPBearer()

async def get_token_credentials(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)
):
    """
    This dependency declares a Bearer auth scheme for the OpenAPI docs.
    Any route that includes this dependency will show a lock icon in Swagger,
    and the "Authorize" button will appear so you can enter a Bearer token.
    
    Typically, you'd decode/verify the token here. However, since you use a
    custom JWT middleware, you can just return credentials or do minimal checks.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    # credentials.scheme == "Bearer"
    # credentials.credentials == actual token string
    return credentials.credentials
