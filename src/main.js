/**
 * AR Portal Web App - Main Application Logic
 * Camera-based AR with 3D portal overlay
 */

// =============================================================================
// CONFIGURATION
// =============================================================================
const CONFIG = {
    portal: {
        distanceFromCamera: 3,    // Meters in front of camera
        heightFromGround: 0       // Portal sits on ground level
    }
};

// =============================================================================
// STATE
// =============================================================================
let state = {
    isARActive: false,
    cameraStream: null
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
    elements.cameraFeed = document.getElementById('camera-feed');
    elements.startScreen = document.getElementById('start-screen');
    elements.startBtn = document.getElementById('start-btn');
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.loadingStatus = document.getElementById('loading-status');
    elements.permissionError = document.getElementById('permission-error');
    elements.errorMessage = document.getElementById('error-message');
    elements.retryBtn = document.getElementById('retry-btn');
    elements.portalHud = document.getElementById('portal-hud');
    elements.resetBtn = document.getElementById('reset-btn');
    elements.arScene = document.getElementById('ar-scene');
    elements.portal = document.getElementById('portal');
    elements.camera = document.getElementById('ar-camera');
    elements.cameraRig = document.getElementById('camera-rig');

    // Set up event listeners
    elements.startBtn?.addEventListener('click', startExperience);
    elements.retryBtn?.addEventListener('click', startExperience);
    elements.resetBtn?.addEventListener('click', repositionPortal);

    console.log('AR Portal initialized');
}

// =============================================================================
// START EXPERIENCE
// =============================================================================
async function startExperience() {
    elements.startScreen?.classList.add('hidden');
    elements.loadingScreen?.classList.remove('hidden');

    try {
        updateLoadingStatus('Accessing camera...');

        // Request camera with back-facing preference
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });

        state.cameraStream = stream;

        // Display camera feed
        if (elements.cameraFeed) {
            elements.cameraFeed.srcObject = stream;
            await elements.cameraFeed.play();
        }

        updateLoadingStatus('Starting AR...');

        // Show AR scene
        elements.arScene?.classList.remove('hidden');

        // Wait for A-Frame to initialize
        await waitForSceneReady();

        // Hide loading
        elements.loadingScreen?.classList.add('hidden');

        // Position and show portal
        positionPortalInFront();

        // Show HUD
        elements.portalHud?.classList.remove('hidden');

        state.isARActive = true;
        console.log('AR Experience started');

    } catch (error) {
        console.error('Start error:', error);
        showPermissionError(error);
    }
}

// =============================================================================
// SCENE READY
// =============================================================================
function waitForSceneReady() {
    return new Promise((resolve) => {
        const scene = elements.arScene;
        if (!scene) {
            resolve();
            return;
        }

        if (scene.hasLoaded) {
            resolve();
        } else {
            scene.addEventListener('loaded', () => resolve(), { once: true });
            // Fallback timeout
            setTimeout(resolve, 2000);
        }
    });
}

// =============================================================================
// PORTAL POSITIONING
// =============================================================================
function positionPortalInFront() {
    if (!elements.portal) return;

    // Position portal in front of camera, at ground level
    // Camera is at y=1.6, so portal at y=0 is on the ground
    const distance = CONFIG.portal.distanceFromCamera;

    elements.portal.setAttribute('position', {
        x: 0,
        y: -1.6 + CONFIG.portal.heightFromGround,  // Ground level relative to camera
        z: -distance
    });

    // Make portal visible
    elements.portal.setAttribute('visible', true);

    console.log(`Portal positioned ${distance}m ahead`);
}

function repositionPortal() {
    // Get current camera rotation
    if (!elements.camera) return;

    const cameraRotation = elements.camera.getAttribute('rotation');
    const cameraObject = elements.camera.object3D;

    // Get camera's forward direction
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(cameraObject.quaternion);

    // Calculate new position
    const distance = CONFIG.portal.distanceFromCamera;
    const newX = direction.x * distance;
    const newZ = direction.z * distance;

    elements.portal.setAttribute('position', {
        x: newX,
        y: -1.6 + CONFIG.portal.heightFromGround,
        z: newZ
    });

    console.log(`Portal repositioned to: ${newX.toFixed(2)}, ${newZ.toFixed(2)}`);
}

// =============================================================================
// ERROR HANDLING
// =============================================================================
function showPermissionError(error) {
    elements.loadingScreen?.classList.add('hidden');
    elements.permissionError?.classList.remove('hidden');

    let message = 'An error occurred. Please try again.';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message = 'Camera access is required. Please enable it in your browser settings and refresh the page.';
    } else if (error.name === 'NotFoundError') {
        message = 'No camera found. Please use a device with a camera.';
    } else if (error.name === 'NotReadableError') {
        message = 'Camera is in use by another app. Please close other apps and try again.';
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
// CLEANUP
// =============================================================================
window.addEventListener('beforeunload', () => {
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
    }
});
