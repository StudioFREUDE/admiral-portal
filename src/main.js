/**
 * AR Portal Web App - Main Application Logic
 * Handles GPS tracking, distance calculation, and portal visibility
 */

// =============================================================================
// CONFIGURATION - Set your portal coordinates here
// =============================================================================
const CONFIG = {
    portal: {
        latitude: 0,            // Will be set to current location
        longitude: 0,           // Will be set to current location
        altitude: 0,            // Altitude above ground (meters)
        activationRadius: 50,   // Distance in meters to show portal
        heightAboveGround: 1.5  // How high portal floats above ground
    },
    gps: {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000
    },
    // For testing: automatically set portal to user's current location
    autoSetToCurrentLocation: true,
    debug: false
};

// =============================================================================
// STATE
// =============================================================================
let state = {
    userPosition: null,
    heading: null,
    distanceToPortal: null,
    isPortalVisible: false,
    watchId: null,
    hasPermissions: false
};

// =============================================================================
// DOM ELEMENTS
// =============================================================================
const elements = {
    loadingScreen: null,
    loadingStatus: null,
    permissionError: null,
    errorMessage: null,
    retryBtn: null,
    distanceHud: null,
    distanceValue: null,
    distanceStatus: null,
    compassArrow: null,
    debugPanel: null,
    debugCoords: null,
    debugHeading: null,
    debugAccuracy: null,
    debugPortal: null,
    portal: null,
    arScene: null
};

// =============================================================================
// INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Cache DOM elements
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.loadingStatus = document.getElementById('loading-status');
    elements.permissionError = document.getElementById('permission-error');
    elements.errorMessage = document.getElementById('error-message');
    elements.retryBtn = document.getElementById('retry-btn');
    elements.distanceHud = document.getElementById('distance-hud');
    elements.distanceValue = document.getElementById('distance-value');
    elements.distanceStatus = document.getElementById('distance-status');
    elements.compassArrow = document.getElementById('compass-arrow');
    elements.debugPanel = document.getElementById('debug-panel');
    elements.debugCoords = document.getElementById('debug-coords');
    elements.debugHeading = document.getElementById('debug-heading');
    elements.debugAccuracy = document.getElementById('debug-accuracy');
    elements.debugPortal = document.getElementById('debug-portal');
    elements.portal = document.getElementById('portal');
    elements.arScene = document.getElementById('ar-scene');

    // Set up event listeners
    elements.retryBtn?.addEventListener('click', requestPermissions);

    // Debug mode toggle
    document.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            CONFIG.debug = !CONFIG.debug;
            elements.debugPanel?.classList.toggle('hidden', !CONFIG.debug);
        }
    });

    // Double-tap to toggle debug on mobile
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) {
            CONFIG.debug = !CONFIG.debug;
            elements.debugPanel?.classList.toggle('hidden', !CONFIG.debug);
        }
        lastTap = now;
    });

    // Wait for A-Frame scene to load
    elements.arScene?.addEventListener('loaded', () => {
        console.log('A-Frame scene loaded');
        updatePortalCoordinates();
        requestPermissions();
    });

    // Fallback if scene already loaded
    if (elements.arScene?.hasLoaded) {
        updatePortalCoordinates();
        requestPermissions();
    }
}

// =============================================================================
// PORTAL COORDINATE MANAGEMENT
// =============================================================================
function updatePortalCoordinates() {
    if (elements.portal) {
        elements.portal.setAttribute('gps-new-entity-place', {
            latitude: CONFIG.portal.latitude,
            longitude: CONFIG.portal.longitude
        });
        console.log(`Portal coordinates set to: ${CONFIG.portal.latitude}, ${CONFIG.portal.longitude}`);
    }
}

/**
 * Set new portal coordinates programmatically
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
export function setPortalCoordinates(lat, lng) {
    CONFIG.portal.latitude = lat;
    CONFIG.portal.longitude = lng;
    updatePortalCoordinates();
    console.log(`Portal moved to: ${lat}, ${lng}`);
}

/**
 * Set portal to current user location (useful for testing)
 */
export function setPortalToCurrentLocation() {
    if (state.userPosition) {
        setPortalCoordinates(state.userPosition.latitude, state.userPosition.longitude);
    } else {
        console.warn('User position not available yet');
    }
}

// Expose functions globally for console access
window.setPortalCoordinates = setPortalCoordinates;
window.setPortalToCurrentLocation = setPortalToCurrentLocation;
window.CONFIG = CONFIG;

// =============================================================================
// PERMISSIONS
// =============================================================================
async function requestPermissions() {
    updateLoadingStatus('Requesting camera access...');

    try {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        // Stop the stream - AR.js will create its own
        stream.getTracks().forEach(track => track.stop());

        updateLoadingStatus('Requesting location access...');

        // Request location permission
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, CONFIG.gps);
        });

        state.hasPermissions = true;
        state.userPosition = position.coords;

        // Auto-set portal to current location for testing
        if (CONFIG.autoSetToCurrentLocation) {
            CONFIG.portal.latitude = position.coords.latitude;
            CONFIG.portal.longitude = position.coords.longitude;
            console.log(`Portal auto-set to current location: ${position.coords.latitude}, ${position.coords.longitude}`);
        }

        // Start the AR experience
        startARExperience();

    } catch (error) {
        console.error('Permission error:', error);
        showPermissionError(error);
    }
}

function showPermissionError(error) {
    elements.loadingScreen?.classList.add('hidden');
    elements.permissionError?.classList.remove('hidden');

    let message = 'An error occurred. Please try again.';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message = 'Camera and location access are required. Please enable them in your browser settings and try again.';
    } else if (error.code === 1) { // GeolocationPositionError.PERMISSION_DENIED
        message = 'Location access was denied. Please enable location services and try again.';
    } else if (error.code === 2) { // GeolocationPositionError.POSITION_UNAVAILABLE
        message = 'Unable to determine your location. Please ensure GPS is enabled.';
    } else if (error.code === 3) { // GeolocationPositionError.TIMEOUT
        message = 'Location request timed out. Please try again.';
    }

    if (elements.errorMessage) {
        elements.errorMessage.textContent = message;
    }
}

function updateLoadingStatus(status) {
    if (elements.loadingStatus) {
        elements.loadingStatus.textContent = status;
    }
}

// =============================================================================
// AR EXPERIENCE
// =============================================================================
function startARExperience() {
    console.log('Starting AR experience');
    updateLoadingStatus('Starting AR...');

    // Hide loading screen
    elements.loadingScreen?.classList.add('hidden');

    // Show distance HUD
    elements.distanceHud?.classList.remove('hidden');

    // Start GPS tracking
    startGPSTracking();

    // Start device orientation tracking
    startOrientationTracking();
}

// =============================================================================
// GPS TRACKING
// =============================================================================
function startGPSTracking() {
    if (!navigator.geolocation) {
        console.error('Geolocation not supported');
        return;
    }

    // Watch position
    state.watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        CONFIG.gps
    );

    console.log('GPS tracking started');
}

function handlePositionUpdate(position) {
    state.userPosition = position.coords;

    // Calculate distance to portal
    state.distanceToPortal = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        CONFIG.portal.latitude,
        CONFIG.portal.longitude
    );

    // Update UI
    updateDistanceUI();

    // Update portal visibility
    updatePortalVisibility();

    // Update debug info
    updateDebugInfo(position);
}

function handlePositionError(error) {
    console.error('GPS error:', error);
    updateDebugInfo(null, error);
}

// =============================================================================
// ORIENTATION TRACKING
// =============================================================================
function startOrientationTracking() {
    // Check if DeviceOrientationEvent is supported
    if (window.DeviceOrientationEvent) {
        // iOS 13+ requires permission request
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // We'll request this on user interaction
            document.addEventListener('click', requestOrientationPermission, { once: true });
            document.addEventListener('touchstart', requestOrientationPermission, { once: true });
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    }
}

async function requestOrientationPermission() {
    try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    } catch (error) {
        console.warn('Orientation permission denied:', error);
    }
}

function handleOrientation(event) {
    if (event.alpha !== null) {
        state.heading = event.alpha;
        updateCompass();
    }
}

function updateCompass() {
    if (!state.userPosition || !state.heading || !elements.compassArrow) return;

    // Calculate bearing to portal
    const bearing = calculateBearing(
        state.userPosition.latitude,
        state.userPosition.longitude,
        CONFIG.portal.latitude,
        CONFIG.portal.longitude
    );

    // Adjust for device heading
    const rotation = bearing - state.heading;
    elements.compassArrow.style.transform = `rotate(${rotation}deg)`;
}

// =============================================================================
// DISTANCE & BEARING CALCULATIONS
// =============================================================================
/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Calculate bearing from point 1 to point 2
 * @returns Bearing in degrees (0-360)
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360;
}

// =============================================================================
// UI UPDATES
// =============================================================================
function updateDistanceUI() {
    if (!elements.distanceValue || !elements.distanceStatus) return;

    const distance = state.distanceToPortal;

    if (distance === null) {
        elements.distanceValue.textContent = '--';
        elements.distanceStatus.textContent = 'Locating...';
        return;
    }

    // Format distance
    if (distance < 1000) {
        elements.distanceValue.textContent = `${Math.round(distance)}m`;
    } else {
        elements.distanceValue.textContent = `${(distance / 1000).toFixed(1)}km`;
    }

    // Update status based on distance
    if (distance <= CONFIG.portal.activationRadius) {
        elements.distanceStatus.textContent = '🌀 Portal Active!';
        elements.distanceValue.classList.add('active');
    } else if (distance <= CONFIG.portal.activationRadius * 2) {
        elements.distanceStatus.textContent = 'Almost there...';
        elements.distanceValue.classList.remove('active');
    } else {
        elements.distanceStatus.textContent = 'Navigate to portal';
        elements.distanceValue.classList.remove('active');
    }
}

function updatePortalVisibility() {
    if (!elements.portal) return;

    const shouldBeVisible = state.distanceToPortal !== null &&
        state.distanceToPortal <= CONFIG.portal.activationRadius;

    if (shouldBeVisible !== state.isPortalVisible) {
        state.isPortalVisible = shouldBeVisible;
        elements.portal.setAttribute('visible', shouldBeVisible);

        console.log(`Portal visibility: ${shouldBeVisible ? 'VISIBLE' : 'HIDDEN'} (distance: ${Math.round(state.distanceToPortal)}m)`);
    }
}

function updateDebugInfo(position, error = null) {
    if (!CONFIG.debug) return;

    if (position) {
        const coords = position.coords;
        elements.debugCoords.textContent = `Coords: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        elements.debugAccuracy.textContent = `Accuracy: ±${Math.round(coords.accuracy)}m`;
    }

    if (state.heading !== null) {
        elements.debugHeading.textContent = `Heading: ${Math.round(state.heading)}°`;
    }

    elements.debugPortal.textContent = `Portal: ${state.isPortalVisible ? 'Visible' : 'Hidden'} (${Math.round(state.distanceToPortal || 0)}m)`;

    if (error) {
        elements.debugCoords.textContent = `GPS Error: ${error.message}`;
    }
}

// =============================================================================
// CLEANUP
// =============================================================================
window.addEventListener('beforeunload', () => {
    if (state.watchId !== null) {
        navigator.geolocation.clearWatch(state.watchId);
    }
});
