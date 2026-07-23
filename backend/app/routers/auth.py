from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=schemas.User, summary="Register a new user account")
def register(request: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_by_name = crud.get_user_by_name(db, request.name)
    existing_by_email = crud.get_user_by_email(db, request.email)
    if existing_by_name or existing_by_email:
        raise HTTPException(
            status_code=400, detail="Username or email is already registered."
        )
    user = crud.create_user(db, request, role_name=(request.role.lower() if request.role else "patient"))
    return user

@router.post("/login", summary="Login with username and password")
def login(request: schemas.UserLogin, db: Session = Depends(get_db)):
    # --- HARDCODED BYPASS FOR TESTING WHEN SUPABASE IS DOWN ---
    if request.username == "admin" and request.password == "admin":
        from app.services.auth_service import create_access_token
        access_token = create_access_token(data={"sub": "999", "role": "admin"})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": 999,
                "name": "Salus Admin",
                "email": "admin@medai.com",
                "role": "admin",
            }
        }
    # --------------------------------------------------------

    db_user = crud.get_user_by_name(db, request.username)
    if not db_user:
        db_user = crud.get_user_by_email(db, request.username)

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="Username is not registered. Please sign up.",
        )

    if db_user.password != request.password:
        raise HTTPException(
            status_code=401, detail="Incorrect password. Please try again."
        )

    role_name = db_user.role.role_name if db_user.role else "patient"

    from app.services.auth_service import create_access_token

    access_token = create_access_token(data={"sub": str(db_user.id), "role": role_name})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": role_name,
        }
    }
