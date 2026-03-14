def validate_positive_quantity(quantity):
    """Ensure quantity is greater than 0"""
    if quantity is None or not isinstance(quantity, (int, float)):
        return False, "Quantity must be a number"
    if quantity <= 0:
        return False, "Quantity must be positive"
    return True, ""

def validate_string_presence(field_name, value):
    """Ensure string is present and not empty"""
    if not value or not isinstance(value, str) or not value.strip():
        return False, f"{field_name} is required"
    return True, ""
