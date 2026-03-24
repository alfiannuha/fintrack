#!/bin/bash

# FinTrack API Test Script
BASE_URL="http://localhost:8080/api/v1"

echo "=== FinTrack API Test ==="
echo ""

# 1. Health Check
echo "1. Health Check..."
curl -s "$BASE_URL/../health" | jq .
echo ""

# 2. Register new user
echo "2. Register new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq .
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.access_token')
WALLET_CODE=$(echo "$REGISTER_RESPONSE" | jq -r '.wallet.code')
echo ""
echo "Wallet Code: $WALLET_CODE"
echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo ""

# 3. Login
echo "3. Login with registered user..."
# Extract email from register response
EMAIL=$(echo "$REGISTER_RESPONSE" | jq -r '.user.email')
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"password123\"
  }")

echo "$LOGIN_RESPONSE" | jq .
echo ""

# 4. Test protected endpoint (will be added in Phase 2)
echo "4. Test authenticated request..."
echo "Access Token obtained: ${#ACCESS_TOKEN} characters"
echo ""

echo "=== All tests completed ==="
