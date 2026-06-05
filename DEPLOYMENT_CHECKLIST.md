# Multi-Website Integration Checklist

## Backend Setup Verification ✓

- [x] Django REST Framework installed
- [x] Token authentication configured
- [x] CORS enabled and configured
- [x] All auth endpoints working (login, signup, logout, me)
- [x] SQLite database initialized with migrations applied
- [x] Static files configured (WhiteNoise)

## Local Development Testing

### Terminal 1: Start Backend
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```
✓ Backend available at: `http://localhost:8000`

### Terminal 2: Start Nexus Website
```bash
npm run dev
```
✓ Nexus available at: `http://localhost:5173`

### Terminal 3: Start Other Website
```bash
# In your other website's directory
npm run dev  # or yarn dev / npm start
```
✓ Other website available at: `http://localhost:3000` (or different port)

## Test Connectivity

### Step 1: Test Backend Health
```bash
curl http://localhost:8000/api/health/
# Should return: {"status": "OK"}
```

### Step 2: Test CORS
From browser console of OTHER WEBSITE:
```javascript
fetch('http://localhost:8000/api/health/')
  .then(r => r.json())
  .then(data => console.log('CORS works!', data))
  .catch(err => console.error('CORS error:', err))
```

### Step 3: Test Authentication
```javascript
// From other website, signup
const signupResponse = await fetch('http://localhost:8000/api/auth/signup/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    full_name: 'Test User'
  })
});
const data = await signupResponse.json();
console.log('Token:', data.token);
localStorage.setItem('nexus-auth-token', data.token);

// Then login with same credentials
const loginResponse = await fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});
const loginData = await loginResponse.json();
console.log('Same token?', loginData.token === data.token);
```

## Production Deployment

### 1. Backend Deployment (Choose one)

#### Option A: Heroku
```bash
# Install Heroku CLI
# heroku login
# heroku create your-app-name
git push heroku main
```

#### Option B: Railway.app
```bash
# Sign up at railway.app
# Connect GitHub repo
# Set environment variables in dashboard
```

#### Option C: AWS / DigitalOcean / Linode
```bash
# SSH into server
sudo apt update && sudo apt install python3-pip python3-venv
git clone your-repo
cd your-repo/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
gunicorn nexus_backend.wsgi:application --bind 0.0.0.0:8000
```

#### Option D: Docker
```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend .
CMD ["gunicorn", "nexus_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### 2. Environment Variables for Production

Set these on your hosting platform:

```
SECRET_KEY=generate-secure-key-with-secrets.token_urlsafe()
DEBUG=false
ALLOWED_HOSTS=backend.yourapp.com,api.yourapp.com
CORS_ALLOWED_ORIGINS=https://nexus.yourapp.com,https://other-website.com,https://www.other-website.com
DATABASE_URL=postgresql://user:password@host/dbname
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-specific-password
OTP_SECRET=generate-secure-key
```

### 3. Deploy Frontend

**Nexus Website:**
```bash
npm run build
# Deploy dist/ to Vercel/Netlify/GitHub Pages
```

**Other Website:**
```bash
npm run build
# Deploy to your hosting
```

Set environment variable to point to production backend:
```
VITE_API_BASE_URL=https://backend.yourapp.com
REACT_APP_API_URL=https://backend.yourapp.com
```

## Security Checklist

- [ ] SECRET_KEY is unique and secure
- [ ] DEBUG=false in production
- [ ] ALLOWED_HOSTS is correctly configured
- [ ] CORS_ALLOWED_ORIGINS doesn't include `*` (specific domains only)
- [ ] HTTPS enforced (set `SECURE_SSL_REDIRECT=true`)
- [ ] CSRF protection enabled for cookie-based clients
- [ ] Passwords hashed and salted (Django default)
- [ ] Rate limiting configured (optional: django-ratelimit)
- [ ] Database backups enabled
- [ ] Error logs monitored (Sentry integration optional)
- [ ] API keys/tokens never in code (use environment variables)

## Monitoring

### Logs
```bash
# View backend logs (depends on hosting)
heroku logs --tail
# or
tail -f /var/log/django.log
```

### Errors
Monitor for:
- 401 Unauthorized → Token issues
- 403 Forbidden → Permission issues
- 500 Server Error → Backend crash
- CORS errors → Configuration issue

### Performance
Track:
- API response time
- Database query performance
- Number of active connections

## Rollback Plan

If something breaks in production:

1. **Database corruption?**
   - Restore from backup
   
2. **Code bug?**
   - Revert to previous commit
   ```bash
   git revert <commit-hash>
   git push heroku main
   ```

3. **Both websites broken?**
   - Both websites handle gracefully by checking token validity
   - Users will be redirected to login page

## Testing Both Websites Together

### Scenario 1: User signs up on Website A, logs in on Website B
1. Open Website A: `http://localhost:5173`
2. Signup as `test@example.com`
3. Copy token from localStorage: `localStorage.getItem('nexus-auth-token')`
4. Open Website B: `http://localhost:3000`
5. Manually set token: `localStorage.setItem('nexus-auth-token', 'paste-token-here')`
6. Should see same user profile on both sites

### Scenario 2: Shared data access
1. Create announcement on Website A admin panel
2. Fetch same data on Website B: `GET /api/announcements/`
3. Should see announcement on both sites

### Scenario 3: Different domains (staging)
1. Deploy Website A to: `https://nexus-staging.yourapp.com`
2. Deploy Website B to: `https://partner-staging.yourapp.com`
3. Both point to: `https://backend-staging.yourapp.com`
4. Test login/data sharing across domains

## Troubleshooting Production

| Problem | Diagnosis | Fix |
|---------|-----------|-----|
| Website A can't reach backend | Check CORS_ALLOWED_ORIGINS | Add domain to env vars |
| Website B can reach backend but gets 401 | Check Authorization header | Verify token format: `Token xxx` |
| Data syncing issues | Check database consistency | Run migrations: `python manage.py migrate` |
| Performance slow | Check database queries | Add database indexes |
| Email not sending | Check EMAIL_HOST settings | Verify SMTP credentials |

## Success Indicators

✅ Both websites share the same user database
✅ Users can login on one site and see authenticated data on the other
✅ API responses include correct user roles
✅ CORS requests work without errors
✅ Tokens persist and authenticate properly
✅ All data operations (CRUD) work on both sites
✅ No console errors on either frontend

You're ready to go! 🚀
