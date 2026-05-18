from pydantic import BaseModel

from app.schemas.user import UserResponse


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthUser(UserResponse):
    roles: list[str] = []
    permissions: list[str] = []


class LoginResponse(Token):
    user: AuthUser
