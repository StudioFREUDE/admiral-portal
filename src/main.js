/**
 * AR Portal Web App - Main Application Logic
 * Simple tap-to-place AR portal experience
 */

// =============================================================================
// CONFIGURATION
// =============================================================================
const CONFIG = {
    portal: {
        distanceFromCamera: 2.5,  // Meters in front of camera when placed
        heightFromGround: 0       // Portal sits on the ground
    },
    debug: false
};

// =============================================================================
// STATE
// =============================================================================
let state = {
    isARActive: false,
    isPortalPlaced: false,
    portalPosition: { x: 0, y: 0, z: -3 }
};

// =============================================================================
// DOM ELEMENTS
// =============================================================================
const elements = {};

// =============================================================================
// INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Cache DOM elements
    elements.startScreen = document.getElementById('start-screen');
    elements.startBtn = document.getElementById('start-btn');
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.loadingStatus = document.getElementById('loading-status');
    elements.permissionError = document.getElementById('permission-error');
    elements.errorMessage = document.getElementById('error-message');
    elements.retryBtn = document.getElementById('retry-btn');
    elements.placementUI = document.getElementById('placement-ui');
    elements.portalHud = document.getElementById('portal-hud');
    elements.resetBtn = document.getElementById('reset-btn');
    elements.arScene = document.getElementById('ar-scene');
    elements.portal = document.getElementById('portal');
    elements.camera = document.getElementById('ar-camera');

    // Set up event listeners
    elements.startBtn?.addEventListener('click', startExperience);
    elements.retryBtn?.addEventListener('click', startExperience);
    elements.resetBtn?.addEventListener('click', resetPortal);

    // Handle scene tap for portal placement
    elements.arScene?.addEventListener('click', handleSceneTap);
    elements.arScene?.addEventListener('touchend', handleSceneTap);

    console.log('AR Portal initialized');
}

// =============================================================================
// START EXPERIENCE
// =============================================================================
async function startExperience() {
    elements.startScreen?.classList.add('hidden');
    elements.loadingScreen?.classList.remove('hidden');

    try {
        updateLoadingStatus('Requesting camera access...');

        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        // Stop the test stream - AR.js will create its own
        stream.getTracks().forEach(track => track.stop());

        updateLoadingStatus('Starting AR...');

        // Show AR scene
        elements.arScene?.classList.remove('hidden');

        // Wait for scene to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Hide loading, show placement UI
        elements.loadingScreen?.classList.add('hidden');
        elements.placementUI?.classList.remove('hidden');

        state.isARActive = true;

        // Auto-place portal after a short delay for better UX
        setTimeout(() => {
            if (!state.isPortalPlaced) {
                placePortalInFront();
            }
        }, 1500);

    } catch (error) {
        console.error('Start error:', error);
        showPermissionError(error);
    }
}

// =============================================================================
// PORTAL PLACEMENT
// =============================================================================
function handleSceneTap(event) {
    // Prevent double handling
    if (event.type === 'touchend') {
        event.preventDefault();
    }

    if (!state.isARActive) return;

    placePortalInFront();
}

function placePortalInFront() {
    if (!elements.portal || !elements.camera) return;

    // Get camera's world direction
    const camera = elements.camera;
    const cameraObject = camera.object3D;

    // Calculate position in front of camera
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(cameraObject.quaternion);

    // Position portal at fixed distance in front, at ground level
    const distance = CONFIG.portal.distanceFromCamera;
    const portalX = cameraObject.position.x + direction.x * distance;
    const portalY = CONFIG.portal.heightFromGround; // On the ground
    const portalZ = cameraObject.position.z + direction.z * distance;

    // Set portal position
    elements.portal.setAttribute('position', {
        x: portalX,
        y: portalY,
        z: portalZ
    });

    // Make portal visible
    elements.portal.setAttribute('visible', true);

    // Update state
    state.isPortalPlaced = true;
    state.portalPosition = { x: portalX, y: portalY, z: portalZ };

    // Update UI
    elements.placementUI?.classList.add('hidden');
    elements.portalHud?.classList.remove('hidden');

    console.log(`Portal placed at: ${portalX.toFixed(2)}, ${portalY.toFixed(2)}, ${portalZ.toFixed(2)}`);
}

function resetPortal() {
    if (!elements.portal) return;

    // Hide portal
    elements.portal.setAttribute('visible', false);
    state.isPortalPlaced = false;

    // Show placement UI
    elements.portalHud?.classList.add('hidden');
    elements.placementUI?.classList.remove('hidden');

    console.log('Portal reset');
}

// =============================================================================
// ERROR HANDLING
// =============================================================================
function showPermissionError(error) {
    elements.loadingScreen?.classList.add('hidden');
    elements.permissionError?.classList.remove('hidden');

    let message = 'An error occurred. Please try again.';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message = 'Camera access is required. Please enable it in your browser settings and try again.';
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
