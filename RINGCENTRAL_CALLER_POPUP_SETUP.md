# RingCentral Caller Popup Widget - Setup Guide

## Overview
The Caller Popup Widget provides real-time notifications for incoming calls in the Next.js web admin dashboard. When a call comes in, a popup appears with caller information and automatically matches the caller to existing customers in your database.

## Architecture

### Backend Components
1. **Webhook Endpoint** (`/api/webhooks/ringcentral`)
   - Receives webhook events from RingCentral
   - Processes incoming call events
   - Stores active calls in MongoDB

2. **Server-Sent Events (SSE) Stream** (`/api/ringcentral/call-stream`)
   - Pushes real-time call notifications to connected web clients
   - Polls active calls every 2 seconds
   - Sends heartbeat messages when no active calls

3. **Active Calls Endpoint** (`/api/ringcentral/active-calls`)
   - Returns list of currently active/ringing calls
   - Used for initial load and manual refresh

### Frontend Components
1. **CallPopup Component** (`/web-admin/components/CallPopup.tsx`)
   - Connects to SSE stream for real-time updates
   - Displays floating notification for incoming calls
   - Shows caller info and customer match (if found)
   - Auto-dismisses after 30 seconds
   - Actions: View Customer, Dismiss

2. **DashboardLayout Integration**
   - CallPopup is integrated into the main dashboard layout
   - Appears on all pages when user is logged in

## Setup Instructions

### 1. RingCentral App Configuration

1. Go to [RingCentral Developer Portal](https://developers.ringcentral.com/)
2. Navigate to your app or create a new one
3. Configure the following permissions:
   - **Read Call Log** - Required for call logs
   - **Read Presence** - Required for real-time call events
   - **Webhook Subscriptions** - Required for webhooks
   - **ReadAccounts** - Required for account info

4. Get your credentials:
   - Client ID
   - Client Secret
   - JWT Token (for server-to-server auth)
   - Account ID

### 2. Backend Environment Variables

Add these to `/app/backend/.env`:

```env
# RingCentral Configuration
RINGCENTRAL_CLIENT_ID=your_client_id_here
RINGCENTRAL_CLIENT_SECRET=your_client_secret_here
RINGCENTRAL_JWT_TOKEN=your_jwt_token_here
RINGCENTRAL_ACCOUNT_ID=your_account_id_here
RINGCENTRAL_SERVER_URL=https://platform.ringcentral.com
RINGCENTRAL_REDIRECT_URI=https://admin-dashboard-374.preview.emergentagent.com/api/auth/ringcentral/callback
```

### 3. Create Webhook Subscription

#### Option A: Using RingCentral Developer Portal
1. Go to your app's webhook settings
2. Create a new webhook subscription
3. Use this webhook URL:
   ```
   https://admin-dashboard-374.preview.emergentagent.com/api/webhooks/ringcentral
   ```
4. Subscribe to these events:
   - **Presence** - `/restapi/v1.0/account/~/extension/~/presence`
   - Subscribe to `telephonyStatus` changes

#### Option B: Using API (Python Script)

```python
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Get access token using JWT
auth_response = requests.post(
    'https://platform.ringcentral.com/restapi/oauth/token',
    auth=(
        os.getenv('RINGCENTRAL_CLIENT_ID'),
        os.getenv('RINGCENTRAL_CLIENT_SECRET')
    ),
    data={
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': os.getenv('RINGCENTRAL_JWT_TOKEN')
    }
)

access_token = auth_response.json()['access_token']

# Create webhook subscription
webhook_response = requests.post(
    'https://platform.ringcentral.com/restapi/v1.0/subscription',
    headers={
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    },
    json={
        'eventFilters': [
            '/restapi/v1.0/account/~/extension/~/presence?detailedTelephonyState=true'
        ],
        'deliveryMode': {
            'transportType': 'WebHook',
            'address': 'https://admin-dashboard-374.preview.emergentagent.com/api/webhooks/ringcentral'
        },
        'expiresIn': 630720000  # Max: 20 years
    }
)

print("Webhook created:", webhook_response.json())
```

### 4. Testing the System

#### Manual Test with cURL

```bash
# Simulate incoming call
curl -X POST "https://admin-dashboard-374.preview.emergentagent.com/api/webhooks/ringcentral" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "/restapi/v1.0/account/~/extension/~/presence",
    "body": {
      "telephonyStatus": "Ringing",
      "sessionId": "test-session-123",
      "from": {
        "phoneNumber": "+14165551234",
        "name": "Test Caller"
      },
      "to": {
        "phoneNumber": "+15879876543"
      },
      "direction": "Inbound"
    }
  }'

# Check active calls
curl "https://admin-dashboard-374.preview.emergentagent.com/api/ringcentral/active-calls"
```

#### Test Script

```bash
chmod +x /app/test_call_popup.sh
/app/test_call_popup.sh
```

### 5. Verify Frontend Integration

1. Open web admin: https://admin-dashboard-374.preview.emergentagent.com
2. Log in to the dashboard
3. The CallPopup component will automatically connect to the SSE stream
4. Trigger a test call using the cURL command above
5. You should see a popup notification in the top-right corner

## How It Works

### Call Flow

1. **Incoming Call Event**
   - RingCentral sends webhook to `/api/webhooks/ringcentral`
   - Webhook handler extracts call information
   - System attempts to match phone number to existing customer
   - Call info stored in MongoDB `active_calls` collection

2. **Real-Time Notification**
   - Frontend connects to SSE endpoint on page load
   - Backend polls `active_calls` collection every 2 seconds
   - New calls with status='ringing' are pushed to connected clients
   - Frontend displays popup with call details

3. **Customer Matching**
   - Phone number is cleaned (removes +1, dashes, spaces, parentheses)
   - MongoDB query searches customer records for matching phone
   - If match found, customer name and email displayed in popup
   - If no match, shows "New caller - not in database"

4. **Call Dismissal**
   - User can manually dismiss the popup
   - Popup auto-dismisses after 30 seconds
   - When call status changes to 'Disconnected' or 'NoCall', removed from active_calls

### Data Flow Diagram

```
RingCentral → Webhook Endpoint → MongoDB (active_calls)
                                      ↓
                                 SSE Endpoint (polls every 2s)
                                      ↓
                                 Frontend (EventSource)
                                      ↓
                                 CallPopup Component
```

## Troubleshooting

### Popup Not Appearing

1. **Check SSE Connection**
   - Open browser DevTools → Network tab
   - Look for connection to `/api/ringcentral/call-stream`
   - Should show "EventStream" type
   - Should remain connected (not closed)

2. **Check Active Calls**
   ```bash
   curl https://admin-dashboard-374.preview.emergentagent.com/api/ringcentral/active-calls
   ```
   - Should return calls with status='ringing'

3. **Check Browser Console**
   - Look for "Call stream connected" message
   - Check for any JavaScript errors

### Webhook Not Receiving Events

1. **Verify Webhook URL**
   - Check RingCentral developer portal
   - Webhook URL must be publicly accessible
   - Must use HTTPS

2. **Check Webhook Subscription**
   - Verify subscription is active
   - Check event filters include presence events
   - Verify telephonyStatus is in the subscription

3. **Check Backend Logs**
   ```bash
   tail -f /var/log/supervisor/backend.err.log | grep -i webhook
   ```

### Customer Not Matching

1. **Check Phone Format**
   - Phone must be stored in customer record
   - Various formats supported: +14165551234, (416) 555-1234, etc.

2. **Test Regex Matching**
   - Check MongoDB query for customer matching
   - Verify phone number is properly escaped for regex

## API Reference

### POST `/api/webhooks/ringcentral`
Receives webhook events from RingCentral.

**Request Body:**
```json
{
  "event": "/restapi/v1.0/account/~/extension/~/presence",
  "body": {
    "telephonyStatus": "Ringing",
    "sessionId": "unique-session-id",
    "from": {
      "phoneNumber": "+14165551234",
      "name": "Caller Name"
    },
    "to": {
      "phoneNumber": "+15879876543"
    },
    "direction": "Inbound"
  }
}
```

**Response:**
```json
{
  "status": "success"
}
```

### GET `/api/ringcentral/call-stream`
Server-Sent Events stream for real-time call notifications.

**SSE Event Types:**
- `connected`: Initial connection established
- `call`: New incoming call
- `heartbeat`: Keep-alive message (no active calls)
- `error`: Error occurred

**Call Event Data:**
```json
{
  "type": "call",
  "call": {
    "id": "68f4352898bd3935fcc83293",
    "session_id": "call-session-789",
    "from_number": "+14165551234",
    "from_name": "Sarah Customer",
    "to_number": "+15879876543",
    "direction": "Inbound",
    "status": "ringing",
    "timestamp": "2025-10-19T00:47:36.827000",
    "customer_id": "68e8929ff0f6291c7d863496",
    "customer_name": "Sarah Customer",
    "customer_email": "sarah@example.com"
  }
}
```

### GET `/api/ringcentral/active-calls`
Returns list of currently active calls.

**Response:**
```json
{
  "calls": [
    {
      "id": "68f4352898bd3935fcc83293",
      "session_id": "call-session-789",
      "from_number": "+14165551234",
      "from_name": "Sarah Customer",
      "to_number": "+15879876543",
      "direction": "Inbound",
      "status": "ringing",
      "timestamp": "2025-10-19T00:47:36.827000",
      "customer_id": "68e8929ff0f6291c7d863496",
      "customer_name": "Sarah Customer",
      "customer_email": "sarah@example.com"
    }
  ]
}
```

## Future Enhancements

- [ ] Click-to-dial functionality
- [ ] Call recording integration
- [ ] Call history/analytics dashboard
- [ ] SMS integration with popup
- [ ] Call transfer/hold controls
- [ ] Multi-user call routing
- [ ] Custom ringtones/alerts
- [ ] Mobile push notifications (for Expo app)
- [ ] Call notes and disposition
- [ ] CRM integration (create customer from popup)

## Security Considerations

1. **Webhook Verification**
   - Consider implementing webhook signature verification
   - RingCentral provides signature in request headers

2. **Authentication**
   - SSE endpoint should require authentication
   - Currently accessible to all logged-in users

3. **Rate Limiting**
   - Consider implementing rate limiting on webhook endpoint
   - Protect against webhook spam/DDoS

4. **Data Privacy**
   - Call data contains PII (phone numbers, names)
   - Ensure compliance with privacy regulations
   - Consider data retention policies

## Support

For issues or questions:
- Check backend logs: `/var/log/supervisor/backend.err.log`
- Check RingCentral webhook logs in developer portal
- Test endpoints manually with cURL
- Verify environment variables are set correctly
