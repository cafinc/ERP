# Google Maps Integration Setup Guide

## Overview
This guide walks you through integrating Google Maps into your Snow Removal Business Tracking app. Google Maps will provide enhanced mapping capabilities with street data, satellite imagery, and better performance.

## Step 1: Get Google Maps API Key

### 1.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 1.2 Create or Select a Project
- Click "Select a project" → "New Project"
- Name it "Snow Removal App" or use existing project
- Click "Create"

### 1.3 Enable Required APIs
Navigate to "APIs & Services" → "Library" and enable these APIs:

**Required APIs:**
- **Maps JavaScript API** (for web maps)
- **Maps SDK for Android** (for Android app)  
- **Maps SDK for iOS** (for iOS app)
- **Geocoding API** (for address lookup - optional but recommended)

### 1.4 Create API Key
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "API Key"
- Copy the generated API key (save it securely)

### 1.5 Secure the API Key (Recommended)
- Click on the created API key to edit it
- Under "Application restrictions":
  - For production: Choose "HTTP referrers" and add your domains
  - For development: Choose "None" (less secure but easier for testing)
- Under "API restrictions": Select the APIs you enabled above
- Click "Save"

## Step 2: Add API Key to Your App

### 2.1 Add to Environment Variables
Add your API key to `/app/frontend/.env`:

```bash
# Add this line to your .env file
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 2.2 Restart the Application
After adding the API key, restart both frontend and backend:

```bash
# In your terminal
sudo supervisorctl restart expo
sudo supervisorctl restart backend
```

## Step 3: Configuration (Optional)

### 3.1 Adjust Default Location
Edit `/app/frontend/config/maps.ts` to set your business location:

```typescript
DEFAULT_REGION: {
  latitude: 43.6532,  // Your business latitude
  longitude: -79.3832, // Your business longitude
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
},
```

### 3.2 Customize Settings
You can modify:
- Geofence radius (default: 100 meters)
- Tracking interval (default: 30 seconds)
- Distance filter (default: 10 meters)

## Step 4: Features Enabled

Once configured, you'll get:

### 🗺️ **Enhanced Mapping**
- High-quality Google Maps with street data
- Satellite view toggle
- Real-time traffic information
- Better performance and accuracy

### 📍 **GPS Tracking**  
- Crew location markers with status (active/idle/offline)
- Route polylines showing movement history
- Geofencing circles around service sites
- Custom markers for different entities

### 🎛️ **Interactive Controls**
- Map type toggle (standard/satellite)
- Fit to coordinates button
- Center on location button
- Zoom and pan gestures

### 📊 **Admin Features**
- View all crew locations simultaneously
- Live crew status monitoring
- Route analytics and history
- Site management with visual markers

## Step 5: Verification

### 5.1 Check GPS Tracking Screen
1. Navigate to the GPS tab in your app
2. You should see Google Maps instead of configuration message
3. Try the map controls (zoom, pan, toggle view)

### 5.2 Test Crew Tracking (Admin)
1. Go to Dashboard → "Live Tracking" 
2. View crew locations on the map
3. Test geofencing and route visualization

### 5.3 Mobile Testing
- Test on both iOS and Android devices
- Verify location permissions work correctly
- Check GPS tracking accuracy

## Troubleshooting

### Issue: "Google Maps Setup Required" message
**Solution:** 
- Verify API key is added to `.env` file
- Restart the application
- Check API key has correct permissions

### Issue: Maps not loading on mobile
**Solution:**
- Ensure required APIs are enabled in Google Cloud
- Verify API key restrictions allow your app
- Check device location permissions

### Issue: "This page can't load Google Maps correctly"
**Solution:**
- Check API key is valid and not expired
- Verify billing is enabled on Google Cloud project
- Ensure daily quota is not exceeded

### Issue: No crew locations showing
**Solution:**
- Create GPS location data by testing tracking features
- Check backend GPS endpoints are working
- Verify crew members have location permissions

## Cost Considerations

Google Maps pricing (as of 2025):
- **Maps loads:** $7 per 1,000 loads
- **Static maps:** $2 per 1,000 requests  
- **Geocoding:** $5 per 1,000 requests

**Free tier:** $200 credit per month (covers ~28,000 map loads)

For a small snow removal business, you'll likely stay within the free tier.

## Support

If you need help:
1. Check the configuration in `/app/frontend/config/maps.ts`
2. Review Google Cloud Console for API usage
3. Test with a fresh API key if issues persist
4. Verify all required APIs are enabled

## Security Best Practices

1. **Restrict API Key:** Always set appropriate restrictions
2. **Monitor Usage:** Check Google Cloud Console regularly
3. **Rotate Keys:** Change API keys periodically
4. **Environment Variables:** Never commit API keys to version control

---

**Ready to use Google Maps!** 🎉

Your snow removal app now has professional-grade mapping capabilities that will enhance operational efficiency and provide better visibility into crew operations.