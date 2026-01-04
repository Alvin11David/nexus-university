# Firebase Setup Script for MTN Payment Integration
# Windows PowerShell Version
# Run: powershell -ExecutionPolicy Bypass -File setup-firebase.ps1

Write-Host "🚀 Starting Firebase Setup for MTN Payment Integration..." -ForegroundColor Green
Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
Set-Location "functions"
npm install axios dotenv
npm install
Set-Location ..

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Login to Firebase
Write-Host ""
Write-Host "🔐 Logging into Firebase..." -ForegroundColor Cyan
firebase login

# Step 3: Select project
Write-Host ""
Write-Host "📋 Selecting Firebase project..." -ForegroundColor Cyan
firebase projects:list
$PROJECT_ID = Read-Host "Enter your project ID"
firebase use $PROJECT_ID

# Step 4: Get MTN credentials
Write-Host ""
Write-Host "🔑 Setting up MTN API credentials..." -ForegroundColor Cyan
$MTN_API_URL = Read-Host "Enter your MTN API URL (e.g., https://api.mtn.com/v2)"
$MTN_API_KEY = Read-Host "Enter your MTN API Key"
$MTN_SUBSCRIPTION_KEY = Read-Host "Enter your MTN Subscription Key"
$MTN_COLLECTION_ACCOUNT = Read-Host "Enter your MTN Collection Account ID"

# Step 5: Set environment variables
Write-Host ""
Write-Host "⚙️  Setting environment variables in Firebase..." -ForegroundColor Cyan
firebase functions:config:set `
  mtn.api_url="$MTN_API_URL" `
  mtn.api_key="$MTN_API_KEY" `
  mtn.subscription_key="$MTN_SUBSCRIPTION_KEY" `
  mtn.collection_account="$MTN_COLLECTION_ACCOUNT"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set environment variables" -ForegroundColor Red
    exit 1
}

# Step 6: Build functions
Write-Host ""
Write-Host "🔨 Building Cloud Functions..." -ForegroundColor Cyan
npm run build --prefix functions

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Step 7: Deploy
Write-Host ""
Write-Host "☁️  Deploying to Firebase..." -ForegroundColor Cyan
firebase deploy --only functions

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Step 8: Show deployment info
Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Your Cloud Functions:" -ForegroundColor Cyan
firebase functions:list

Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the mtnPaymentCallback URL from above"
Write-Host "2. Register it in MTN Developer Portal as your webhook"
Write-Host "3. Test the payment flow in your app"
Write-Host "4. Monitor logs with: firebase functions:log"
Write-Host ""
Write-Host "💡 Useful commands:" -ForegroundColor Yellow
Write-Host "  firebase functions:log                    # View all logs"
Write-Host "  firebase functions:log --only <function>  # View specific function logs"
Write-Host "  firebase functions:config:get             # View environment variables"
Write-Host "  firebase deploy --only functions          # Deploy functions again"
