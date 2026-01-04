#!/bin/bash

# Firebase Setup Script for MTN Payment Integration
# Run this script to set up everything automatically

echo "🚀 Starting Firebase Setup for MTN Payment Integration..."

# Step 1: Install dependencies
echo ""
echo "📦 Installing dependencies..."
cd functions
npm install axios dotenv
npm install

cd ..

# Step 2: Login to Firebase
echo ""
echo "🔐 Logging into Firebase..."
firebase login

# Step 3: Select project
echo ""
echo "📋 Selecting Firebase project..."
firebase projects:list
echo "Enter your project ID:"
read PROJECT_ID
firebase use $PROJECT_ID

# Step 4: Get MTN credentials
echo ""
echo "🔑 Setting up MTN API credentials..."
echo "Enter your MTN API URL (e.g., https://api.mtn.com/v2):"
read MTN_API_URL
echo "Enter your MTN API Key:"
read MTN_API_KEY
echo "Enter your MTN Subscription Key:"
read MTN_SUBSCRIPTION_KEY
echo "Enter your MTN Collection Account ID:"
read MTN_COLLECTION_ACCOUNT

# Step 5: Set environment variables
echo ""
echo "⚙️  Setting environment variables in Firebase..."
firebase functions:config:set \
  mtn.api_url="$MTN_API_URL" \
  mtn.api_key="$MTN_API_KEY" \
  mtn.subscription_key="$MTN_SUBSCRIPTION_KEY" \
  mtn.collection_account="$MTN_COLLECTION_ACCOUNT"

# Step 6: Build functions
echo ""
echo "🔨 Building Cloud Functions..."
npm run build --prefix functions

# Step 7: Deploy
echo ""
echo "☁️  Deploying to Firebase..."
firebase deploy --only functions

# Step 8: Show deployment info
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Your Cloud Functions URLs:"
firebase functions:list

echo ""
echo "🎯 Next steps:"
echo "1. Copy the mtnPaymentCallback URL from above"
echo "2. Register it in MTN Developer Portal as your webhook"
echo "3. Test the payment flow in your app"
echo "4. Monitor logs with: firebase functions:log"
