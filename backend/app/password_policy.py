# app/password_policy.py
import re
from typing import List, Tuple
from app.config import settings

class PasswordPolicy:
    @classmethod
    def validate(cls, password: str) -> Tuple[bool, List[str]]:
        """Validate password against security policy."""
        errors = []
        
        # Check minimum length
        if len(password) < settings.password_min_length:
            errors.append(f"Password must be at least {settings.password_min_length} characters long")
        
        # Check uppercase
        if settings.require_uppercase and not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        
        # Check lowercase (always required)
        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")
        
        # Check numbers
        if settings.require_numbers and not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one number")
        
        # Check special characters
        if settings.require_special_chars and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        
        return len(errors) == 0, errors
    
    @classmethod
    def get_requirements(cls) -> str:
        """Get human-readable password requirements."""
        requirements = []
        requirements.append(f"At least {settings.password_min_length} characters")
        if settings.require_uppercase:
            requirements.append("At least one uppercase letter")
        requirements.append("At least one lowercase letter")
        if settings.require_numbers:
            requirements.append("At least one number")
        if settings.require_special_chars:
            requirements.append("At least one special character")
        return ", ".join(requirements)