#!/bin/bash

# FinTrack PWA - Quick Deploy Script
# This script helps you deploy to Vercel + Railway

set -e

echo "🚀 FinTrack PWA - Production Deployment"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Git repository not initialized. Initializing...${NC}"
    git init
    git add .
    git commit -m "Initial commit - FinTrack PWA"
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI not found. Install with: npm install -g @railway/cli${NC}"
    RAILWAY_CLI=false
else
    RAILWAY_CLI=true
    echo -e "${GREEN}✓ Railway CLI found${NC}"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Vercel CLI not found. Install with: npm install -g vercel${NC}"
    VERCEL_CLI=false
else
    VERCEL_CLI=true
    echo -e "${GREEN}✓ Vercel CLI found${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 1: Push to GitHub${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Please make sure your code is pushed to GitHub."
echo "Repository should be at: https://github.com/YOUR_USERNAME/fintrack"
echo ""
read -p "Press Enter after you've pushed to GitHub..."

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 2: Deploy Backend to Railway${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$RAILWAY_CLI" = true ]; then
    echo "Deploying backend to Railway..."
    cd backend
    railway login
    railway init
    echo ""
    echo -e "${YELLOW}Setting environment variables...${NC}"
    read -p "Enter your MongoDB URI: " MONGO_URI
    read -p "Enter JWT Secret (min 32 chars): " JWT_SECRET
    read -p "Enter database name (default: fintrack_prod): " DB_NAME
    DB_NAME=${DB_NAME:-fintrack_prod}
    
    railway variables set MONGO_URI="$MONGO_URI"
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set DB_NAME="$DB_NAME"
    railway variables set GIN_MODE="release"
    railway variables set CORS_ORIGIN="https://your-domain.vercel.app"
    
    echo ""
    echo -e "${GREEN}Deploying...${NC}"
    railway up
    
    BACKEND_URL=$(railway domain | grep -o 'https://[^ ]*')
    echo ""
    echo -e "${GREEN}✓ Backend deployed to: $BACKEND_URL${NC}"
    cd ..
else
    echo -e "${BLUE}Please deploy backend manually:${NC}"
    echo "1. Go to https://railway.app"
    echo "2. Login with GitHub"
    echo "3. New Project → Deploy from GitHub repo"
    echo "4. Select your fintrack repository"
    echo "5. Set environment variables:"
    echo "   - MONGO_URI"
    echo "   - JWT_SECRET"
    echo "   - DB_NAME=fintrack_prod"
    echo "   - GIN_MODE=release"
    echo "   - CORS_ORIGIN=(will set after Vercel deploy)"
    echo ""
    read -p "Enter your Railway backend URL: " BACKEND_URL
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 3: Deploy Frontend to Vercel${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ "$VERCEL_CLI" = true ]; then
    echo "Deploying frontend to Vercel..."
    cd frontend
    vercel login
    echo ""
    echo -e "${YELLOW}Setting environment variables...${NC}"
    echo "NEXT_PUBLIC_API_URL=$BACKEND_URL/api/v1"
    vercel --env NEXT_PUBLIC_API_URL="$BACKEND_URL/api/v1" --prod
    
    FRONTEND_URL=$(vercel --ls | head -n 1)
    echo ""
    echo -e "${GREEN}✓ Frontend deployed to: $FRONTEND_URL${NC}"
    cd ..
else
    echo -e "${BLUE}Please deploy frontend manually:${NC}"
    echo "1. Go to https://vercel.com"
    echo "2. Login with GitHub"
    echo "3. Add New Project → Import fintrack repository"
    echo "4. Configure:"
    echo "   - Root Directory: frontend"
    echo "   - Build Command: cd frontend && pnpm install && pnpm run build"
    echo "5. Add environment variable:"
    echo "   - NEXT_PUBLIC_API_URL=$BACKEND_URL/api/v1"
    echo ""
    read -p "Enter your Vercel frontend URL: " FRONTEND_URL
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Step 4: Update CORS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Backend CORS_ORIGIN needs to be updated with: $FRONTEND_URL"
echo ""

if [ "$RAILWAY_CLI" = true ]; then
    railway variables set CORS_ORIGIN="$FRONTEND_URL"
    echo -e "${GREEN}✓ CORS updated${NC}"
else
    echo "Please update CORS_ORIGIN in Railway Dashboard to: $FRONTEND_URL"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Visit $FRONTEND_URL"
echo "2. Test registration and login"
echo "3. Create a test transaction"
echo "4. Verify dashboard shows data"
echo "5. (Optional) Setup custom domain"
echo ""
echo -e "${YELLOW}Need help? Check DEPLOYMENT_GUIDE.md for troubleshooting${NC}"
echo ""
