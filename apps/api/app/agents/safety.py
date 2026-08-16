import re
from typing import Tuple

# Common prompt injection triggers
SUSPICIOUS_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"system\s*prompt",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"reveal\s+(your\s+)?(api\s*key|secret|hidden\s*instructions)",
    r"print\s+environment\s+variables",
    r"jailbreak",
    r"bypass\s+safety",
]

SUSPICIOUS_REGEX = re.compile("|".join(SUSPICIOUS_PATTERNS), re.IGNORECASE)


def sanitize_and_check_input(user_input: str) -> Tuple[str, bool]:
    """
    Sanitizes user input and detects potential adversarial prompt injection attempts.
    Returns: (cleaned_input, is_suspicious)
    """
    if not user_input:
        return "", False
    
    cleaned = user_input.strip()
    is_suspicious = bool(SUSPICIOUS_REGEX.search(cleaned))
    
    return cleaned, is_suspicious


def filter_output_for_secrets(output_text: str) -> str:
    """
    Ensures that no internal secrets, keys, or raw system tokens leak in model responses.
    """
    if not output_text:
        return ""
    
    # Redact potential API key formats
    redacted = re.sub(r"sk-[a-zA-Z0-9_-]{20,}", "[REDACTED_SECRET]", output_text)
    redacted = re.sub(r"whsec_[a-zA-Z0-9_-]{20,}", "[REDACTED_SECRET]", redacted)
    redacted = re.sub(r"EAAG[a-zA-Z0-9_-]{30,}", "[REDACTED_SECRET]", redacted)
    
    return redacted
