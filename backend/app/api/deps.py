from fastapi import Header, HTTPException, Depends
from typing import Optional
from app.database.supabase import supabase

def get_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")
    return authorization.split(" ")[1]

def get_current_user(token: str = Depends(get_token)):
    try:
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user_id = response.user.id
        # Fetch the user's profile to get the role
        profile_response = supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        if not profile_response.data:
            return {"id": user_id, "role": "user", "email": response.user.email}
            
        profile = profile_response.data[0]
        return {
            "id": user_id,
            "role": profile.get("role", "user"),
            "email": response.user.email
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

def get_current_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user
