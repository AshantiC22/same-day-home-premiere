from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()

def hash_password(plain):
    return ph.hash(plain)

def verify_password(plain, hashed):
    try:
        return ph.verify(hashed,plain)
    except VerifyMismatchError:
        return False