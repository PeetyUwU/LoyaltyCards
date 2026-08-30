from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.user_settings import UserSettings
from app.schemas.user import UserOut, UserCreate, UserUpdate, PasswordChange, PasswordReset, AdminUserOut
from app.deps import get_current_user, require_role
from app.security import hash_password, verify_password


router = APIRouter()


@router.get("/users/", response_model=list[UserOut])
async def list_users(
    q: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(User).where(User.id != current_user.id)
    if q:
        query = query.where(User.username.ilike(f"%{q}%"))

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    users = result.scalars().all()
    return users


@router.post("/users/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    role_name: str = "user",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    existing = await db.execute(
        select(User).where((User.username == user_in.username) | (User.email == user_in.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username or email already registered")

    role_result = await db.execute(select(Role).where(Role.role_name == role_name))
    role = role_result.scalar_one_or_none()
    if role is None:
        raise HTTPException(status_code=400, detail=f"Role '{role_name}' does not exist")

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


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    role_result = await db.execute(select(Role).where(Role.id == user.role_id))
    role = role_result.scalar_one_or_none()
    if role and role.role_name == "owner":
        owner_role_result = await db.execute(select(Role).where(Role.role_name == "owner"))
        owner_role = owner_role_result.scalar_one_or_none()
        owner_count_result = await db.execute(
            select(func.count()).select_from(User).where(User.role_id == owner_role.id)
        )
        if owner_count_result.scalar_one() <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete the last owner")

    await db.delete(user)
    await db.commit()
    
@router.patch("/users/{user_id}/enabled", response_model=UserOut)
async def set_user_enabled(
    user_id: int,
    is_active: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot disable your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = is_active
    await db.commit()
    await db.refresh(user)
    return user

@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = user_in.model_dump(exclude_unset=True)

    if "username" in update_data or "email" in update_data:
        existing = await db.execute(
            select(User).where(
                User.id != user_id,
                (User.username == update_data.get("username", user.username))
                | (User.email == update_data.get("email", user.email)),
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email already in use")

    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user

@router.patch("/users/me/change", response_model=UserOut)
async def update_own_profile(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = user_in.model_dump(exclude_unset=True)

    if "username" in update_data or "email" in update_data:
        existing = await db.execute(
            select(User).where(
                User.id != current_user.id,
                (User.username == update_data.get("username", current_user.username))
                | (User.email == update_data.get("email", current_user.email)),
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email already in use")

    for key, value in update_data.items():
        setattr(current_user, key, value)

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/users/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_own_password(
    body: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    current_user.password_hash = hash_password(body.new_password)
    current_user.token_version += 1
    db.add(current_user)
    await db.commit()


@router.post("/users/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def admin_reset_password(
    user_id: int,
    body: PasswordReset,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(body.new_password)
    await db.commit()

@router.get("/users/admin", response_model=list[AdminUserOut])
async def list_users_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("owner", "admin")),
):
    offset = (page - 1) * limit
    query = (
        select(User, Role.role_name)
        .join(Role, Role.id == User.role_id)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role_name": role_name,
            "is_active": u.is_active,
        }
        for u, role_name in rows
    ]