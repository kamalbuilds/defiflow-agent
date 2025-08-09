#!/bin/bash

echo "🚀 Testing DeFiFlow Agent Endpoints"
echo "===================================="

BASE_URL="http://localhost:3000"

# Test health endpoint
echo "\n📊 Testing Health Check:"
curl -s "${BASE_URL}/health" | python3 -m json.tool

# Test agent status
echo "\n🤖 Testing Agent Status:"
curl -s "${BASE_URL}/api/agent/status" | python3 -m json.tool

# Test yield monitoring
echo "\n💰 Testing Yield Monitor:"
curl -s "${BASE_URL}/api/yield/monitor" | python3 -m json.tool

# Test current positions
echo "\n📈 Testing Current Positions:"
curl -s "${BASE_URL}/api/positions/current" | python3 -m json.tool

# Test rebalancing strategies
echo "\n⚖️ Testing Rebalance Strategies:"
curl -s "${BASE_URL}/api/rebalance/strategies" | python3 -m json.tool

# Test current strategy
echo "\n🎯 Testing Current Strategy:"
curl -s "${BASE_URL}/api/strategy/current" | python3 -m json.tool

echo "\n✅ All tests completed!"