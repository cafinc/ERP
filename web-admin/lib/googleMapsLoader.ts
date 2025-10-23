// Google Maps Script Loader - Singleton pattern
// This ensures Google Maps is only loaded once across the entire application

let isLoading = false;
let isLoaded = false;
const callbacks: (() => void)[] = [];

export const loadGoogleMapsScript = (callback?: () => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already loaded, call callback immediately
    if (isLoaded && (window as any).google) {
      if (callback) callback();
      resolve();
      return;
    }

    // If currently loading, queue the callback
    if (isLoading) {
      if (callback) callbacks.push(callback);
      callbacks.push(() => resolve());
      return;
    }

    // Start loading
    isLoading = true;
    if (callback) callbacks.push(callback);
    callbacks.push(() => resolve());

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      const error = new Error('Google Maps API key not configured');
      console.error(error);
      isLoading = false;
      reject(error);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      isLoaded = true;
      isLoading = false;
      callbacks.forEach(cb => cb());
      callbacks.length = 0;
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      callbacks.forEach(cb => cb());
      callbacks.length = 0;
    };

    script.onerror = () => {
      isLoading = false;
      const error = new Error('Failed to load Google Maps');
      console.error(error);
      callbacks.length = 0;
      reject(error);
    };

    document.head.appendChild(script);
  });
};

export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded && !!(window as any).google;
};
