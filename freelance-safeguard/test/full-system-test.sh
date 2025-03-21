#!/bin/bash
# FreelanceShield Full System Test Script
# This script runs a comprehensive test of the FreelanceShield platform
# including Solana programs, frontend, and integration tests

# Color codes for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}FreelanceShield Full System Test${NC}"
echo -e "${BLUE}=========================================${NC}"

# Function to check if a command was successful
check_status() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
    if [ "$1" == "critical" ]; then
      echo -e "${RED}Critical error. Stopping tests.${NC}"
      exit 1
    fi
  fi
}

# 1. Verify Solana Programs
echo -e "\n${YELLOW}1. Verifying Solana Programs on Devnet${NC}"

echo -e "\n${BLUE}Running Solana program tests...${NC}"
npm run test:solana
check_status "critical"

# 2. Start the Frontend Application
echo -e "\n${YELLOW}2. Starting the Frontend Application${NC}"

# Kill any existing processes on port 5173 (Vite default)
echo -e "\n${BLUE}Checking for existing processes on port 5173...${NC}"
if lsof -i:5173 >/dev/null; then
  echo -e "${BLUE}Killing existing process on port 5173...${NC}"
  kill -9 $(lsof -t -i:5173) 2>/dev/null || true
fi

# Start the frontend in the background
echo -e "\n${BLUE}Starting the frontend application...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for the frontend to start
echo -e "${BLUE}Waiting for frontend to start (10 seconds)...${NC}"
sleep 10

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
  echo -e "${GREEN}✓ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
else
  echo -e "${RED}✗ Frontend failed to start${NC}"
  exit 1
fi

# 3. Run Integration Tests
echo -e "\n${YELLOW}3. Running Integration Tests${NC}"

# Test Demo Mode
echo -e "\n${BLUE}Testing Demo Mode...${NC}"
echo -e "${BLUE}Checking if Demo Mode UI loads correctly...${NC}"
curl -s http://localhost:5173/testnet-demo > /dev/null
check_status

# 4. Test Wallet Connection
echo -e "\n${YELLOW}4. Testing Wallet Connection${NC}"
echo -e "${BLUE}This requires manual verification with a browser${NC}"
echo -e "${BLUE}Please open http://localhost:5173 in your browser${NC}"
echo -e "${BLUE}and test connecting your Solana wallet.${NC}"

# 5. Test Core Features
echo -e "\n${YELLOW}5. Testing Core Features${NC}"
echo -e "${BLUE}Running unit tests for core features...${NC}"
npm run test
check_status

# 6. Performance Testing
echo -e "\n${YELLOW}6. Running Performance Tests${NC}"
echo -e "${BLUE}Testing page load times...${NC}"

# Simple performance test using curl
echo -e "${BLUE}Testing homepage load time...${NC}"
time curl -s -o /dev/null http://localhost:5173/
check_status

echo -e "${BLUE}Testing dashboard load time...${NC}"
time curl -s -o /dev/null http://localhost:5173/dashboard
check_status

echo -e "${BLUE}Testing testnet demo load time...${NC}"
time curl -s -o /dev/null http://localhost:5173/testnet-demo
check_status

# 7. Cleanup
echo -e "\n${YELLOW}7. Cleaning Up${NC}"
echo -e "${BLUE}Stopping frontend server (PID: $FRONTEND_PID)...${NC}"
kill -9 $FRONTEND_PID 2>/dev/null || true
echo -e "${GREEN}✓ Frontend server stopped${NC}"

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "${BLUE}Please review the test results and manually verify any UI-specific features.${NC}"
echo -e "${BLUE}For full testing, please follow the manual testing checklist in the docs.${NC}"
