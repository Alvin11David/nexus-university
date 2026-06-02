# Nexus University Backend

This folder contains the first Django replacement layer for the Firebase Cloud Functions backend.

## Included API surface

- `GET /api/health/`
- `POST /api/auth/validate-student-record/`
- `POST /api/auth/send-signup-otp/`
- `POST /api/auth/verify-signup-otp/`

## Local setup

Create a virtual environment, install dependencies from `pyproject.toml`, and run the server:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
python manage.py migrate
python manage.py runserver
```

## Environment variables

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `EMAIL_BACKEND`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USE_TLS`
- `EMAIL_HOST_USER`
- `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`
- `OTP_SECRET`

For Gmail delivery, set `EMAIL_HOST` to `smtp.gmail.com`, `EMAIL_PORT` to `587`, `EMAIL_USE_TLS` to `true`, and use a Gmail app password in `EMAIL_HOST_PASSWORD`.
Also set `EMAIL_HOST_USER` to the Gmail address you authenticate with; Django will use that address as the OTP sender.
For your local setup, use `alvin69david@gmail.com` as both `EMAIL_HOST_USER` and `DEFAULT_FROM_EMAIL`.
