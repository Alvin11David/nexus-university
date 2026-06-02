from __future__ import annotations

import json
import os
from typing import Optional, Tuple

import firebase_admin
from django.contrib.auth import get_user_model
from firebase_admin import auth as fb_auth, credentials
from rest_framework import authentication, exceptions


def _ensure_firebase_app() -> None:
    if firebase_admin._apps:
        return

    # Support either a JSON string in FIREBASE_SERVICE_ACCOUNT_JSON or a file path
    json_env = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    cred_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    try:
        if json_env:
            data = json.loads(json_env)
            cred = credentials.Certificate(data)
            firebase_admin.initialize_app(cred)
        elif cred_file:
            cred = credentials.Certificate(cred_file)
            firebase_admin.initialize_app(cred)
        else:
            # Try default application credentials
            firebase_admin.initialize_app()
    except Exception:
        # If initialization fails, we'll let verify_id_token raise informative errors later
        return


class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request) -> Optional[Tuple[object, None]]:
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise exceptions.AuthenticationFailed("Invalid authorization header.")

        id_token = parts[1]

        try:
            _ensure_firebase_app()
            decoded = fb_auth.verify_id_token(id_token)
        except Exception as exc:
            raise exceptions.AuthenticationFailed("Invalid or expired Firebase token.") from exc

        uid = decoded.get("uid")
        email = decoded.get("email") or ""

        User = get_user_model()
        user, _ = User.objects.get_or_create(username=uid, defaults={"email": email, "is_active": True})
        if email and user.email != email:
            user.email = email
            user.save(update_fields=["email"])  # keep email in sync

        return (user, None)

    def authenticate_header(self, request) -> str:
        return "Bearer"
