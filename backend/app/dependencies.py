from fastapi import Header, HTTPException, status

def require_admin_role(x_user_role: str = Header("patient", alias="X-User-Role")):
    """
    Reads X-User-Role header sent by the frontend on every request.
    Raises 403 if the caller is not an admin.
    """
    if x_user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required.",
        )
