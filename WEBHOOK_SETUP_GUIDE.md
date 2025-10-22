# Webhook Setup Guide
## Real-Time Communication Center Integration

Your Communication Center now has webhook listeners that automatically receive incoming SMS, phone calls, and emails in real-time!

---

## 🎯 What's Been Built

### Backend Webhook Endpoints:
- ✅ `/api/webhooks/ringcentral/sms` - Receives incoming SMS
- ✅ `/api/webhooks/ringcentral/call` - Receives call notifications  
- ✅ `/api/webhooks/gmail/push` - Receives incoming emails
- ✅ `/api/webhooks/health` - Health check endpoint

### Features:
- Automatic customer matching by phone/email
- Real-time saving to communications database
- Webhook signature verification for security
- Handles validation tokens (first-time setup)

---

## 📞 RingCentral Webhook Setup

### Step 1: Get Your Webhook URL
Your webhook URL is: `https://YOUR_DOMAIN.com/api/webhooks/ringcentral/sms`

Replace `YOUR_DOMAIN.com` with your actual deployed domain.

### Step 2: Create Webhook in RingCentral Dashboard

1. **Log in to RingCentral Developer Portal**
   - Go to: https://developers.ringcentral.com/
   - Navigate to "My Apps" or "Console"

2. **Create or Select Your App**
   - If you haven't created an app yet, create one
   - Note your Client ID and Client Secret

3. **Configure Webhooks**
   - Go to "Webhooks" or "Notifications" section
   - Click "Add Webhook" or "Create Subscription"

4. **SMS Webhook Configuration:**
   ```
   Event Type: Instant Message Notifications
   OR
   Event Filter: /restapi/v1.0/account/~/extension/~/message-store
   
   Delivery Mode: Webhook
   Address: https://YOUR_DOMAIN.com/api/webhooks/ringcentral/sms
   ```

5. **Call Webhook Configuration:**
   ```
   Event Type: Telephony Sessions Notifications
   OR  
   Event Filter: /restapi/v1.0/account/~/extension/~/telephony/sessions
   
   Delivery Mode: Webhook
   Address: https://YOUR_DOMAIN.com/api/webhooks/ringcentral/call
   ```

6. **Webhook Validation:**
   - RingCentral will send a validation request with a `Validation-Token` header
   - Our webhook automatically handles this and responds correctly
   - You should see "Webhook verified" status

### Step 3: Set Environment Variables

Add these to your `/app/backend/.env` file:

```bash
RINGCENTRAL_CLIENT_ID=your_client_id_here
RINGCENTRAL_CLIENT_SECRET=your_client_secret_here
RINGCENTRAL_WEBHOOK_SECRET=your_webhook_secret_here
```

The webhook secret is used to verify that requests are really from RingCentral.

### Step 4: Test It!

1. Send an SMS to your RingCentral number from a customer's phone
2. Check your backend logs: `tail -f /var/log/supervisor/backend.out.log`
3. You should see: "Incoming SMS saved: [phone] -> [your_number]"
4. The SMS will instantly appear in the Communication Center!

---

## 📧 Gmail Webhook Setup (Cloud Pub/Sub)

Gmail webhooks use Google Cloud Pub/Sub for push notifications.

### Step 1: Set Up Google Cloud Pub/Sub

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/

2. **Enable APIs**
   - Enable "Gmail API"
   - Enable "Cloud Pub/Sub API"

3. **Create a Pub/Sub Topic**
   ```
   Topic Name: gmail-push-notifications
   ```

4. **Create a Push Subscription**
   ```
   Subscription Name: gmail-webhook-subscription
   Delivery Type: Push
   Endpoint URL: https://YOUR_DOMAIN.com/api/webhooks/gmail/push
   ```

5. **Grant Permissions**
   - Give `gmail-api-push@system.gserviceaccount.com` the "Pub/Sub Publisher" role on your topic

### Step 2: Enable Gmail Push for Your App

In your app's OAuth consent screen:
```
Scopes needed:
- https://www.googleapis.com/auth/gmail.readonly
- https://www.googleapis.com/auth/gmail.modify
```

### Step 3: Watch Gmail Mailbox (Per User)

For each user who connects Gmail, you need to "watch" their mailbox:

```bash
POST https://gmail.googleapis.com/gmail/v1/users/me/watch
Authorization: Bearer [USER_ACCESS_TOKEN]
Content-Type: application/json

{
  "topicName": "projects/YOUR_PROJECT_ID/topics/gmail-push-notifications",
  "labelIds": ["INBOX"]
}
```

This tells Gmail to send push notifications when new emails arrive.

### Step 4: Renew Watch Periodically

Gmail watch subscriptions expire after 7 days. You need to renew them:
- Set up a cron job to call the watch endpoint every 6 days
- Or handle it when the webhook stops receiving notifications

### Step 5: Test It!

1. Send an email to the connected Gmail account
2. Check backend logs: `tail -f /var/log/supervisor/backend.out.log`
3. You should see: "Gmail push notification received for [email]"
4. Email appears instantly in Communication Center!

---

## 🔒 Security Best Practices

### RingCentral Webhook Security:
- Webhooks include an `X-RingCentral-Signature` header
- Our code verifies this signature using your webhook secret
- Prevents unauthorized webhook calls

### Gmail Webhook Security:
- Google Cloud verifies your domain ownership
- Push subscriptions require authenticated setup
- Pub/Sub messages are cryptographically signed

### General:
- Always use HTTPS for webhook URLs
- Keep your webhook secrets safe in environment variables
- Monitor webhook logs for suspicious activity

---

## 🧪 Testing Webhooks Locally

For local development, you can use **ngrok** to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local backend
ngrok http 8001

# You'll get a URL like: https://abc123.ngrok.io
# Use this as your webhook URL: https://abc123.ngrok.io/api/webhooks/ringcentral/sms
```

---

## 📊 Monitoring Webhooks

### Check Webhook Health:
```bash
curl https://YOUR_DOMAIN.com/api/webhooks/health
```

### View Webhook Logs:
```bash
tail -f /var/log/supervisor/backend.out.log | grep -i webhook
```

### Test RingCentral Webhook Manually:
```bash
curl -X POST https://YOUR_DOMAIN.com/api/webhooks/ringcentral/sms \
  -H "Content-Type: application/json" \
  -H "Validation-Token: test123" \
  -d '{}'
```

---

## 🎉 What Happens After Setup

Once webhooks are configured:

1. **Customer sends SMS** → Instantly appears in Communication Center
2. **Customer calls** → Call log automatically created
3. **Customer emails** → Email shows up in real-time
4. **Staff replies** → Sent via RingCentral/Gmail
5. **Everything synced** → Complete conversation history in one place

---

## 🆘 Troubleshooting

### Webhooks Not Receiving Data:

1. **Check webhook URLs are correct**
   - Must be publicly accessible
   - Must use HTTPS in production

2. **Verify environment variables**
   ```bash
   # Check if set
   echo $RINGCENTRAL_WEBHOOK_SECRET
   ```

3. **Check backend logs**
   ```bash
   tail -100 /var/log/supervisor/backend.err.log
   ```

4. **Test webhook endpoint directly**
   ```bash
   curl -X GET https://YOUR_DOMAIN.com/api/webhooks/health
   ```

### RingCentral Issues:
- Verify app has proper permissions
- Check webhook status in RC dashboard
- Ensure validation token was handled correctly

### Gmail Issues:
- Confirm Pub/Sub topic and subscription are created
- Verify service account permissions
- Check that mailbox watch is active (expires after 7 days)
- Ensure Gmail API is enabled

---

## 📞 Need Help?

If webhooks aren't working:
1. Check this guide carefully
2. Review backend logs for error messages
3. Test with ngrok for local debugging
4. Verify all credentials and secrets are set

Your Communication Center is now ready for real-time, two-way communication! 🚀
