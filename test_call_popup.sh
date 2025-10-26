#!/bin/bash

# Test script to simulate RingCentral incoming call webhook

echo "==================================="
echo "RingCentral Caller Popup Widget Test"
echo "==================================="
echo ""

# Backend URL
API_URL="https://service-history-app.preview.emergentagent.com/api"

echo "1. Testing webhook endpoint with simulated incoming call..."
curl -X POST "${API_URL}/webhooks/ringcentral" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "test-uuid-123",
    "event": "/restapi/v1.0/account/~/extension/~/presence",
    "timestamp": "2025-01-19T00:50:00.000Z",
    "subscriptionId": "test-subscription-id",
    "body": {
      "extensionId": "12345678",
      "telephonyStatus": "Ringing",
      "sessionId": "test-session-' $(date +%s) '",
      "from": {
        "phoneNumber": "+15551234567",
        "name": "John Snow"
      },
      "to": {
        "phoneNumber": "+15879876543"
      },
      "direction": "Inbound"
    }
  }'

echo -e "\n\n2. Checking active calls..."
sleep 2
curl -X GET "${API_URL}/ringcentral/active-calls"

echo -e "\n\n3. Testing SSE stream (will timeout after 5 seconds)..."
timeout 5 curl -N "${API_URL}/ringcentral/call-stream" || echo "Stream test complete"

echo -e "\n\n==================================="
echo "Test complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Open web admin: https://service-history-app.preview.emergentagent.com"
echo "2. Log in to the dashboard"
echo "3. Run this script again to see the call popup appear"
echo ""
echo "To set up real RingCentral webhooks:"
echo "1. Go to RingCentral Developer Portal"
echo "2. Create a webhook subscription"
echo "3. Use URL: ${API_URL}/webhooks/ringcentral"
echo "4. Subscribe to: Presence events (telephonyStatus changes)"
echo ""
