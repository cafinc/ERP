# Authentication Endpoints
# This file contains all new authentication endpoints for email/password and Google OAuth

import bcrypt
import secrets
import httpx
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Response, Request
from bson import ObjectId
from passlib.context import CryptContext

# Initialize passlib context for password hashing
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Password hashing utilities
def hash_password(password: str) -> str:
    """Hash a password using passlib/bcrypt"""
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash using passlib"""
    return pwd_context.verify(password, hashed)

def generate_session_token() -> str:
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)

def generate_reset_token() -> str:
    """Generate a password reset token"""
    return secrets.token_urlsafe(32)

async def email_login_endpoint(db, email_service, request_data):
    """Handle email/password login"""
    try:
        print(f"[DEBUG] Login attempt for email: {request_data.email}")
        
        # Find user by email
        user_doc = await db.users.find_one({"email": request_data.email})
        
        if not user_doc:
            print(f"[DEBUG] User not found: {request_data.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        print(f"[DEBUG] User found: {user_doc.get('email')}")
        
        # Check if user has a password set
        if not user_doc.get("password_hash"):
            print(f"[DEBUG] No password_hash found")
            raise HTTPException(status_code=401, detail="This account uses a different login method")
        
        print(f"[DEBUG] Password hash exists, verifying...")
        print(f"[DEBUG] Request password length: {len(request_data.password)}")
        print(f"[DEBUG] Request password repr: {repr(request_data.password)}")
        print(f"[DEBUG] Hash from DB: {user_doc['password_hash'][:40]}...")
        
        # Verify password
        verify_result = verify_password(request_data.password, user_doc["password_hash"])
        print(f"[DEBUG] Password verification result: {verify_result}")
        
        if not verify_result:
            print(f"[DEBUG] Password verification failed")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if user is active
        if not user_doc.get("active", True):
            raise HTTPException(status_code=403, detail="Account is disabled")
        
        # Generate session token
        session_token = generate_session_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        # Store session
        session_doc = {
            "user_id": str(user_doc["_id"]),
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_sessions.insert_one(session_doc)
        
        # Prepare user response (remove password_hash)
        user_doc["id"] = str(user_doc.pop("_id"))
        user_doc.pop("password_hash", None)
        
        return {
            "user": user_doc,
            "session_token": session_token
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

async def forgot_password_endpoint(db, email_service, request_data):
    """Handle forgot password request"""
    try:
        # Find user by email
        user_doc = await db.users.find_one({"email": request_data.email})
        
        if not user_doc:
            # Don't reveal if email exists or not
            return {"message": "If this email is registered, you will receive a password reset link"}
        
        # Generate reset token
        reset_token = generate_reset_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Store reset token
        reset_doc = {
            "user_id": str(user_doc["_id"]),
            "token": reset_token,
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.now(timezone.utc)
        }
        await db.password_reset_tokens.insert_one(reset_doc)
        
        # Send reset email
        reset_link = f"https://yourapp.com/reset-password?token={reset_token}"
        email_body = f"""
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p><a href="{reset_link}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        """
        
        try:
            await email_service.send_html_email(
                to_email=request_data.email,
                subject="Password Reset Request - CAF Property Services",
                html_body=email_body
            )
        except Exception as e:
            print(f"Failed to send reset email: {str(e)}")
        
        return {"message": "If this email is registered, you will receive a password reset link"}
    
    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process request")

async def reset_password_endpoint(db, request_data):
    """Handle password reset"""
    try:
        # Find valid reset token
        reset_doc = await db.password_reset_tokens.find_one({
            "token": request_data.token,
            "used": False,
            "expires_at": {"$gt": datetime.now(timezone.utc)}
        })
        
        if not reset_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        # Hash new password
        password_hash = hash_password(request_data.new_password)
        
        # Update user password
        await db.users.update_one(
            {"_id": ObjectId(reset_doc["user_id"])},
            {"$set": {"password_hash": password_hash}}
        )
        
        # Mark token as used
        await db.password_reset_tokens.update_one(
            {"_id": reset_doc["_id"]},
            {"$set": {"used": True}}
        )
        
        return {"message": "Password reset successful"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

async def google_oauth_session_endpoint(db, session_id_header):
    """Process Google OAuth session from Emergent"""
    try:
        if not session_id_header:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        # Call Emergent OAuth API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id_header}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            session_data = response.json()
        
        # Find or create user
        user_doc = await db.users.find_one({"email": session_data["email"]})
        
        if not user_doc:
            # Create new user from Google OAuth
            new_user = {
                "name": session_data.get("name", session_data["email"].split("@")[0]),
                "email": session_data["email"],
                "phone": None,
                "picture": session_data.get("picture"),
                "password_hash": None,  # OAuth users don't have passwords
                "role": "customer",  # Default role
                "active": True,
                "created_at": datetime.now(timezone.utc)
            }
            result = await db.users.insert_one(new_user)
            user_doc = await db.users.find_one({"_id": result.inserted_id})
        
        # Store session
        session_token = session_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session_doc = {
            "user_id": str(user_doc["_id"]),
            "session_token": session_token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc)
        }
        
        # Delete old sessions for this user
        await db.user_sessions.delete_many({"user_id": str(user_doc["_id"])})
        await db.user_sessions.insert_one(session_doc)
        
        # Prepare user response
        user_doc["id"] = str(user_doc.pop("_id"))
        user_doc.pop("password_hash", None)
        
        return {
            "user": user_doc,
            "session_token": session_token
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"OAuth session error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process OAuth session")

async def get_current_user_endpoint(db, request: Request):
    """Get current authenticated user"""
    try:
        # Try to get session token from cookie first, then Authorization header
        session_token = request.cookies.get("session_token")
        
        print(f"[DEBUG] Cookie token: {session_token[:20] if session_token else 'NONE'}...")
        
        if not session_token:
            auth_header = request.headers.get("Authorization")
            print(f"[DEBUG] Authorization header: {auth_header}")
            if auth_header and auth_header.startswith("Bearer "):
                session_token = auth_header[7:]
                print(f"[DEBUG] Extracted token from header: {session_token[:20] if session_token else 'NONE'}...")
        
        print(f"[DEBUG] Final session token: {session_token[:20] if session_token else 'NONE'}...")
        
        if not session_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Find session
        session_doc = await db.user_sessions.find_one({
            "session_token": session_token
        })
        
        print(f"[DEBUG] Session found: {bool(session_doc)}")
        
        # Check if session exists
        if not session_doc:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        # Check expiry (handle both timezone-aware and naive datetimes)
        expires_at = session_doc.get("expires_at")
        if expires_at:
            now = datetime.now(timezone.utc)
            # Make expires_at timezone-aware if it's naive
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            if expires_at < now:
                raise HTTPException(status_code=401, detail="Session expired")
        
        # Get user
        user_doc = await db.users.find_one({"_id": ObjectId(session_doc["user_id"])})
        
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare user response
        user_doc["id"] = str(user_doc.pop("_id"))
        user_doc.pop("password_hash", None)
        
        return user_doc
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get current user error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get user")

async def logout_endpoint(db, request: Request, response: Response):
    """Logout user by deleting session"""
    try:
        # Try to get session token
        session_token = request.cookies.get("session_token")
        
        if not session_token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                session_token = auth_header[7:]
        
        if session_token:
            # Delete session
            await db.user_sessions.delete_one({"session_token": session_token})
        
        # Clear cookie
        response.delete_cookie("session_token")
        
        return {"message": "Logged out successfully"}
    
    except Exception as e:
        print(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to logout")
