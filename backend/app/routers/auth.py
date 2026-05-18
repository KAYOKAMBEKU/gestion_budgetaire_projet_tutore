from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import AuthUser, LoginResponse
from app.security.jwt import create_access_token, decode_access_token
from app.security.password import verify_password
from app.services.user_service import get_user_by_email

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def build_auth_user(user: User) -> AuthUser:
    roles = [role.nom_role for role in user.roles]
    permissions = sorted({permission.code for role in user.roles for permission in role.permissions})
    return AuthUser(
        id=user.id,
        nom=user.nom,
        prenom=user.prenom,
        email=user.email,
        statut=user.statut,
        date_creation=user.date_creation,
        roles=roles,
        permissions=permissions,
    )


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or user.statut != "actif":
        return None
    if not verify_password(password, user.mot_de_passe):
        return None
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentification invalide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = decode_access_token(token)
    if email is None:
        raise credentials_exception
    user = get_user_by_email(db, email)
    if user is None:
        raise credentials_exception
    return user


@router.post("/login", response_model=LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        subject=user.email,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return LoginResponse(access_token=access_token, user=build_auth_user(user))


@router.get("/me", response_model=AuthUser)
def read_current_user(current_user: User = Depends(get_current_user)):
    return build_auth_user(current_user)
