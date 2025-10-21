# Gmail API Setup Instructions for Google Cloud Console

## Step 1: Create/Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google Workspace admin account (raymond@cafinc.ca)
3. Click on the project dropdown (top left, next to "Google Cloud")
4. Click "NEW PROJECT"
5. Name it: "CAF Snow Removal App" (or any name you prefer)
6. Click "CREATE"
7. Wait for the project to be created, then select it

## Step 2: Enable Gmail API

1. In the left sidebar, navigate to: **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on **Gmail API** from the results
4. Click the **ENABLE** button
5. Wait for it to enable (takes a few seconds)

## Step 3: Configure OAuth Consent Screen

1. Go to: **APIs & Services** → **OAuth consent screen**
2. Select **Internal** (since you're using Google Workspace)
   - This limits access to users in your cafinc.ca domain only
3. Click **CREATE**

4. Fill in the App Information:
   - **App name**: CAF Snow Removal Management
   - **User support email**: raymond@cafinc.ca (or your support email)
   - **App logo**: (optional - can upload your logo)
   - **Application home page**: Your app URL (or leave blank for now)
   - **Authorized domains**: Add `cafinc.ca`
   - **Developer contact email**: raymond@cafinc.ca

5. Click **SAVE AND CONTINUE**

6. On the **Scopes** page, click **ADD OR REMOVE SCOPES**
7. Add these Gmail scopes:
   - `https://www.googleapis.com/auth/gmail.readonly` (Read emails)
   - `https://www.googleapis.com/auth/gmail.send` (Send emails)
   - `https://www.googleapis.com/auth/gmail.modify` (Mark as read/unread)
   - `https://www.googleapis.com/auth/userinfo.email` (Get user email)
   - `https://www.googleapis.com/auth/userinfo.profile` (Get user profile)
8. Click **UPDATE**
9. Click **SAVE AND CONTINUE**

10. On the **Summary** page, review and click **BACK TO DASHBOARD**

## Step 4: Create OAuth 2.0 Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top
3. Select **OAuth client ID**

4. Configure the OAuth client:
   - **Application type**: Select **Web application**
   - **Name**: "CAF Snow Removal - Gmail Integration"
   
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (for local development)
   - Your production domain (if deployed)

6. Under **Authorized redirect URIs**, add:
   - `http://localhost:8001/api/gmail/oauth/callback` (for local development)
   - Your production backend URL + `/api/gmail/oauth/callback` (if deployed)

7. Click **CREATE**

8. **IMPORTANT**: A dialog will appear with your credentials:
   - **Client ID**: (looks like: xxxxx.apps.googleusercontent.com)
   - **Client Secret**: (random string)
   
   **COPY BOTH VALUES - YOU'LL NEED THEM!**

9. Click **OK**

## Step 5: Save Credentials to .env File

Add these to your `/app/backend/.env` file:

```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8001/api/gmail/oauth/callback
```

**For production, update GOOGLE_REDIRECT_URI to your production backend URL**

## Step 6: Verify Setup

Once you've added the credentials to `.env`:
1. Tell me you're done
2. I'll restart the backend
3. You'll be able to connect your Gmail account from the Settings page

## Important Notes

- **Internal Users Only**: Since you selected "Internal" consent screen, only users with @cafinc.ca emails can connect
- **No Verification Needed**: Internal apps don't require Google verification
- **Shared Email Setup**: For snow@cafinc.ca, one admin needs to:
  1. Log in as that account in a browser
  2. Connect it through the app
  3. All admins will then see those emails

## Security Best Practices

✅ Keep Client Secret confidential (never commit to git)
✅ Only add trusted redirect URIs
✅ Use HTTPS in production
✅ Refresh tokens are stored securely in your MongoDB database

## Troubleshooting

**Error: "Access blocked: Authorization Error"**
- Make sure you selected "Internal" consent screen
- Verify the user email is @cafinc.ca

**Error: "Redirect URI mismatch"**
- Check that the redirect URI in Google Cloud Console exactly matches what's in your .env file
- Include http:// or https://

**Error: "Invalid client"**
- Double-check Client ID and Client Secret in .env file
- Make sure there are no extra spaces

---

Let me know when you've completed these steps and added the credentials to the .env file!
