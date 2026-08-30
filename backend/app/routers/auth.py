from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.user_settings import UserSettings
from app.schemas.user import UserCreate, UserOut, Token
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.models.app_settings import AppSettings

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.username == user_in.username) | (User.email == user_in.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    settings_result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    app_settings = settings_result.scalar_one_or_none()
    if app_settings is not None and not app_settings.registration_enabled and (await db.execute(select(func.count()).select_from(User))).scalar_one() > 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Registration is currently disabled")

    user_count = await db.execute(select(func.count()).select_from(User))
    is_first_user = user_count.scalar_one() == 0

    role_name = "owner" if is_first_user else "user"
    role_result = await db.execute(select(Role).where(Role.role_name == role_name))
    role = role_result.scalar_one_or_none()
    if role is None:
        raise HTTPException(status_code=500, detail="Default role not configured")

    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role_id=role.id,
    )
    db.add(user)
    await db.flush()

    db.add(UserSettings(user_id=user.id))
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled",
        )

    access_token = create_access_token(user.id, user.token_version)
    return Token(access_token=access_token)

@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user