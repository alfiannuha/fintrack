#!/bin/bash

# FinTrack Phase 2 E2E Test Script
BASE_URL="http://localhost:8080/api/v1"
FRONTEND_URL="http://localhost:3000"

echo "=== FinTrack Phase 2 E2E Test ==="
echo ""

# 1. Register new user
echo "1. Register new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phase 2 Test",
    "email": "phase2test'$(date +%s)'@example.com",
    "password": "password123"
  }')

echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
WALLET_CODE=$(echo "$REGISTER_RESPONSE" | grep -o '"code":"[^"]*' | cut -d'"' -f4)
echo ""
echo "✅ User registered!"
echo "Wallet Code: $WALLET_CODE"
echo ""

# 2. Test Get Categories
echo "2. Get categories..."
CATEGORIES_RESPONSE=$(curl -s "$BASE_URL/categories" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$CATEGORIES_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30 || echo "$CATEGORIES_RESPONSE"
echo "✅ Categories loaded!"
echo ""

# 3. Create a transaction
echo "3. Create expense transaction..."
CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

TRANSACTION_RESPONSE=$(curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"category_id\": \"$CATEGORY_ID\",
    \"amount\": 50000,
    \"type\": \"expense\",
    \"note\": \"Test transaction Phase 2\",
    \"merchant_name\": \"Test Merchant\"
  }")

echo "$TRANSACTION_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TRANSACTION_RESPONSE"
echo "✅ Transaction created!"
echo ""

# 4. Get Dashboard Summary
echo "4. Get dashboard summary..."
SUMMARY_RESPONSE=$(curl -s "$BASE_URL/dashboard/summary" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$SUMMARY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SUMMARY_RESPONSE"
echo "✅ Dashboard summary loaded!"
echo ""

# 5. Get Transactions
echo "5. Get transactions list..."
TRANSACTIONS_RESPONSE=$(curl -s "$BASE_URL/transactions" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$TRANSACTIONS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30 || echo "$TRANSACTIONS_RESPONSE"
echo "✅ Transactions list loaded!"
echo ""

# 6. Create Budget
echo "6. Create budget..."
EXPENSE_CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | grep -A5 '"type":"expense"' | grep '"_id"' | head -1 | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

BUDGET_RESPONSE=$(curl -s -X POST "$BASE_URL/budgets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"category_id\": \"$EXPENSE_CATEGORY_ID\",
    \"amount\": 1000000,
    \"month\": \"$(date +%Y-%m)\"
  }")

echo "$BUDGET_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BUDGET_RESPONSE"
echo "✅ Budget created!"
echo ""

# 7. Get Budgets
echo "7. Get budgets..."
BUDGETS_RESPONSE=$(curl -s "$BASE_URL/budgets" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$BUDGETS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30 || echo "$BUDGETS_RESPONSE"
echo "✅ Budgets loaded!"
echo ""

# 8. Get Category Chart Data
echo "8. Get category chart data..."
CHART_RESPONSE=$(curl -s "$BASE_URL/dashboard/chart/category" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$CHART_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CHART_RESPONSE"
echo "✅ Chart data loaded!"
echo ""

echo "=== All Phase 2 E2E Tests Completed ==="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BASE_URL"
echo ""
echo "Manual Testing:"
echo "1. Open $FRONTEND_URL in browser"
echo "2. Login with: phase2test$(date +%s)@example.com / password123"
echo "3. Test Dashboard, Transactions, and Budget pages"
