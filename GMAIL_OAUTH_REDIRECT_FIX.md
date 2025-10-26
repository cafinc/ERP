# Gmail OAuth - Redirect URI Mismatch Fix

## ERROR:
```
Error 400: redirect_uri_mismatch
```

## CAUSE:
The redirect URI configured in the backend doesn't match what's registered in Google Cloud Console.

## CURRENT CONFIGURATION:

**Backend Redirect URI (in .env):**
```
GOOGLE_REDIRECT_URI=https://map-measure-admin.preview.emergentagent.com/api/gmail/oauth/callback
```

**This URI must be registered in Google Cloud Console**

## FIX STEPS:

### Option 1: Update Google Cloud Console (RECOMMENDED)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID for this project
3. Click "Edit"
4. Under "Authorized redirect URIs", add:
   ```
   https://map-measure-admin.preview.emergentagent.com/api/gmail/oauth/callback
   ```
5. Click "Save"
6. Wait 5 minutes for changes to propagate
7. Try connecting Gmail again

### Option 2: Use Existing Redirect URI

If you already have a redirect URI registered (like `http://localhost:8001/...`), update the backend:

1. Check what redirect URIs are registered in Google Console
2. Update `/app/backend/.env`:
   ```
   GOOGLE_REDIRECT_URI=<your-registered-uri>
   ```
3. Restart backend: `sudo supervisorctl restart backend`

## COMMON REGISTERED URIs:

Check if any of these are registered:
- `http://localhost:8001/api/gmail/oauth/callback`
- `http://localhost:3000/api/gmail/oauth/callback`
- `https://map-measure-admin.preview.emergentagent.com/api/gmail/oauth/callback`
- `https://yourdomain.com/api/gmail/oauth/callback`

## VERIFICATION:

After updating Google Console, test the OAuth flow:
1. Navigate to Gmail page
2. Look for "Connect Gmail" button
3. Click and follow OAuth flow
4. Should redirect back successfully

## NOTES:

- The redirect URI must match EXACTLY (including http/https, port, path)
- Changes in Google Console can take 5-10 minutes to propagate
- For production, use HTTPS redirect URIs only
- For local development, http://localhost is allowed

## CURRENT BACKEND ENDPOINT:

The backend is listening for OAuth callbacks at:
```
POST /api/gmail/oauth/callback
```

This endpoint handles:
1. Receives authorization code from Google
2. Exchanges code for access token
3. Stores Gmail connection in database
4. Redirects user back to app

## TROUBLESHOOTING:

If still getting error after updating:
1. Clear browser cache
2. Wait 10 minutes for Google to propagate changes
3. Check Google Console shows the exact URI
4. Verify no typos in the URI
5. Try incognito window

---

**ACTION REQUIRED**: Update Google Cloud Console with the correct redirect URI
