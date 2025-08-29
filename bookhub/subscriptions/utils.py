import requests
from django.conf import settings

PAYSTACK_SECRET = settings.PAYSTACK_SECRET_KEY
BASE_URL = "https://api.paystack.co"

def initialize_transaction(email, amount=0, callback_url=None, metadata=None):
    """Initialize transaction (amount in kobo)."""
    url = f"{BASE_URL}/transaction/initialize"
    headers = {"Authorization": f"Bearer {PAYSTACK_SECRET}"}
    data = {"email": email, "amount": amount}
    if callback_url:
        data["callback_url"] = callback_url

    if metadata:
        data["metadata"] = metadata
        
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        print(f"Paystack API error: {e}")
        return {"status": False, "message": str(e)}
    
    
def verify_transaction(reference):
    """Verify transaction and extract authorization code."""
    url = f"{BASE_URL}/transaction/verify/{reference}"
    headers = {"Authorization": f"Bearer {PAYSTACK_SECRET}"}
    
    try:
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        print(f"Paystack verification error: {e}")
        return {"status": False, "message": str(e)}


def charge_authorization(authorization_code, email, amount):
    """Charge a saved authorization code."""
    url = f"{BASE_URL}/transaction/charge_authorization"
    headers = {"Authorization": f"Bearer {PAYSTACK_SECRET}"}
    data = {"authorization_code": authorization_code, "email": email, "amount": amount}
    
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        print(f"Paystack charge error: {e}")
        return {"status": False, "message": str(e)}

def refund_transaction(transaction_id):
    """Refund a transaction by Paystack transaction ID."""
    url = f"{BASE_URL}/refund"
    headers = {"Authorization": f"Bearer {PAYSTACK_SECRET}"}
    data = {"transaction": transaction_id}
    
    try:
        resp = requests.post(url, headers=headers, json=data, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        print(f"Paystack refund error: {e}")
        return {"status": False, "message": str(e)}
    

