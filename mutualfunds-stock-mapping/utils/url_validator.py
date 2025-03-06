import validators
from typing import Tuple

def validate_url(url: str) -> Tuple[bool, str]:
    """
    Validate if the provided URL is valid and belongs to either MoneyControl or Advisorkhoj.
    
    Args:
        url (str): The URL to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, message)
    """
    if not validators.url(url):
        return False, "Invalid URL format"
    
    if "moneycontrol.com" in url:
        return True, "Valid MoneyControl URL"
    elif "advisorkhoj.com" in url:
        return True, "Valid Advisorkhoj URL"
    else:
        return False, "URL must be from either MoneyControl or Advisorkhoj" 