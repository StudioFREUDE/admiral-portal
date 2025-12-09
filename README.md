# AR Portal Web App

A GPS-based augmented reality web application that displays a levitating 3D portal when users are at predefined coordinates. Works on both Android and iOS browsers.

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Access the App
1. Open https://localhost:5173/ in your browser
2. **Important**: Accept the self-signed certificate warning (click "Advanced" → "Proceed to localhost")
3. Grant camera and location permissions when prompted

### Mobile Testing
1. Ensure your phone is on the same network as your computer
2. Find your computer's local IP (shown in terminal, e.g., `https://192.168.x.x:5173/`)
3. Open that URL on your mobile browser
4. Accept the security warning for the self-signed certificate

## 📍 Setting Portal Coordinates

Edit `src/main.js` to set your portal location:

```javascript
const CONFIG = {
    portal: {
        latitude: 52.5200,      // Your target latitude
        longitude: 13.4050,     // Your target longitude
        altitude: 0,
        activationRadius: 50,   // Distance in meters to show portal
        heightAboveGround: 1.5
    }
};
```

### Set Coordinates from Console (for testing)

While the app is running, open browser DevTools and use:

```javascript
// Set portal to specific coordinates
setPortalCoordinates(48.8584, 2.2945);

// Set portal to your current location (for testing)
setPortalToCurrentLocation();

// Adjust activation radius
CONFIG.portal.activationRadius = 100; // 100 meters
```

## 🎮 Features

- **GPS-Based AR**: Portal appears when you're within range of target coordinates
- **Cross-Platform**: Works on Android Chrome and iOS Safari
- **Distance HUD**: Shows real-time distance to the portal
- **Compass**: Points in the direction of the portal
- **Animated Portal**: Levitating ellipse with glowing effects
- **Debug Mode**: Press `D` on keyboard or double-tap on mobile

## 📱 Platform Support

| Platform | Browser | Status |
|----------|---------|--------|
| Android | Chrome | ✅ Full AR support |
| Android | Firefox | ✅ Works |
| iOS | Safari | ⚠️ Works with limitations* |
| Desktop | Chrome | For testing only |

*iOS Safari does not support full WebXR AR, but AR.js provides a camera-based fallback that works.

## 🔧 Technical Stack

- **A-Frame 1.5** - 3D/VR/AR framework
- **AR.js 3.4+** - WebAR with location-based features
- **Vite** - Modern build tool with HMR
- **Vanilla JS** - No framework overhead

## 🐛 Troubleshooting

### Portal not appearing?
1. Check you're within the activation radius (default 50m)
2. Ensure GPS is enabled and accurate
3. Press `D` to enable debug mode and check distance

### Camera not working?
1. Ensure you're using HTTPS (required for camera access)
2. Check browser permissions for camera and location
3. On iOS, make sure Safari has location access enabled

### Inaccurate positioning?
- GPS typically has 2-50m accuracy
- Move outdoors for better signal
- Wait for GPS to stabilize (accuracy shown in debug mode)

## 📜 License

ISC
