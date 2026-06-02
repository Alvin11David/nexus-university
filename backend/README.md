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
- `DEFAULT_FROM_EMAIL`
- `OTP_SECRET`
