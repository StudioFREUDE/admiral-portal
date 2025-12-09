/**
 * AR Portal - Zappar + Three.js Implementation
 * Uses Instant World Tracking for cross-platform AR
 */

import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';

// =============================================================================
// DOM ELEMENTS
// =============================================================================
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const placementUI = document.getElementById('placement-ui');
const portalHud = document.getElementById('portal-hud');
const resetBtn = document.getElementById('reset-btn');
const container = document.getElementById('canvas-container');

// =============================================================================
// STATE
// =============================================================================
let hasPlaced = false;
let renderer, scene, camera, instantTracker, portalGroup;

// =============================================================================
// PORTAL CREATION
// =============================================================================
function createPortal() {
    const group = new THREE.Group();

    // Portal colors
    const primaryColor = 0x8B5CF6;
    const secondaryColor = 0xC4B5FD;
    const accentColor = 0xDDD6FE;
    const darkColor = 0x0a0015;

    // Main ring (torus)
    const mainRingGeometry = new THREE.TorusGeometry(1, 0.08, 32, 64);
    const mainRingMaterial = new THREE.MeshStandardMaterial({
        color: primaryColor,
        emissive: primaryColor,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
        metalness: 0.3,
        roughness: 0.4
    });
    const mainRing = new THREE.Mesh(mainRingGeometry, mainRingMaterial);
    mainRing.name = 'mainRing';
    group.add(mainRing);

    // Inner ring
    const innerRingGeometry = new THREE.TorusGeometry(0.75, 0.04, 24, 48);
    const innerRingMaterial = new THREE.MeshStandardMaterial({
        color: secondaryColor,
        emissive: secondaryColor,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.name = 'innerRing';
    group.add(innerRing);

    // Outer glow ring
    const outerRingGeometry = new THREE.TorusGeometry(1.2, 0.02, 16, 48);
    const outerRingMaterial = new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.name = 'outerRing';
    group.add(outerRing);

    // Portal center (dark void)
    const centerGeometry = new THREE.CircleGeometry(0.65, 32);
    const centerMaterial = new THREE.MeshBasicMaterial({
        color: darkColor,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.name = 'center';
    group.add(center);

    // Swirl effect
    const swirlGeometry = new THREE.CircleGeometry(0.55, 32);
    const swirlMaterial = new THREE.MeshBasicMaterial({
        color: primaryColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    const swirl = new THREE.Mesh(swirlGeometry, swirlMaterial);
    swirl.name = 'swirl';
    swirl.position.z = 0.01;
    group.add(swirl);

    // Floating particles
    const particleGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const particleMaterial = new THREE.MeshStandardMaterial({
        color: secondaryColor,
        emissive: secondaryColor,
        emissiveIntensity: 0.8
    });

    for (let i = 0; i < 5; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
        const angle = (i / 5) * Math.PI * 2;
        particle.position.set(
            Math.cos(angle) * 1.1,
            Math.sin(angle) * 1.1,
            0
        );
        particle.userData.angle = angle;
        particle.userData.radius = 1.1;
        particle.name = `particle${i}`;
        group.add(particle);
    }

    return group;
}

// =============================================================================
// ANIMATION
// =============================================================================
function animatePortal(time) {
    if (!portalGroup) return;

    const t = time * 0.001; // Convert to seconds

    // Rotate main ring
    const mainRing = portalGroup.getObjectByName('mainRing');
    if (mainRing) {
        mainRing.rotation.z = t * 0.5;
    }

    // Pulse inner ring
    const innerRing = portalGroup.getObjectByName('innerRing');
    if (innerRing) {
        const scale = 1 + Math.sin(t * 2) * 0.05;
        innerRing.scale.set(scale, scale, 1);
    }

    // Rotate swirl
    const swirl = portalGroup.getObjectByName('swirl');
    if (swirl) {
        swirl.rotation.z = -t;
    }

    // Pulse outer ring opacity
    const outerRing = portalGroup.getObjectByName('outerRing');
    if (outerRing) {
        outerRing.material.opacity = 0.3 + Math.sin(t * 3) * 0.3;
    }

    // Animate particles
    for (let i = 0; i < 5; i++) {
        const particle = portalGroup.getObjectByName(`particle${i}`);
        if (particle) {
            const angle = particle.userData.angle + t * 0.5;
            const radius = particle.userData.radius + Math.sin(t * 2 + i) * 0.1;
            particle.position.x = Math.cos(angle) * radius;
            particle.position.y = Math.sin(angle) * radius;
            particle.position.z = Math.sin(t * 3 + i) * 0.2;
        }
    }

    // Gentle floating motion for whole portal
    portalGroup.position.y = Math.sin(t) * 0.05;
}

// =============================================================================
// INITIALIZATION
// =============================================================================
async function initAR() {
    // Check Zappar compatibility
    if (!ZapparThree.browserIncompatible()) {
        ZapparThree.permissionDeniedUI();
    }

    // Create renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Request camera permission
    ZapparThree.permissionRequestUI().then((granted) => {
        if (!granted) {
            ZapparThree.permissionDeniedUI();
            return;
        }
        startScene();
    });
}

function startScene() {
    // Create scene
    scene = new THREE.Scene();

    // Create Zappar camera
    camera = new ZapparThree.Camera();

    // Add camera background (shows device camera feed)
    const cameraBackground = new ZapparThree.CameraEnvironmentMap();
    scene.background = camera.backgroundTexture;
    scene.environment = cameraBackground.environmentMap;

    // Create Instant World Tracker
    instantTracker = new ZapparThree.InstantWorldTracker();

    // Create portal
    portalGroup = createPortal();
    portalGroup.visible = false;

    // Add portal to tracker's anchor
    instantTracker.anchor.add(portalGroup);

    // Add the tracker anchor to the scene
    scene.add(instantTracker.anchor);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 1);
    instantTracker.anchor.add(directionalLight);

    // Handle window resize
    window.addEventListener('resize', onResize);

    // Handle tap to place
    renderer.domElement.addEventListener('click', onTap);
    renderer.domElement.addEventListener('touchstart', onTap);

    // Start animation loop
    animate();

    // Show placement UI
    placementUI.classList.remove('hidden');

    console.log('Zappar AR initialized');
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================
function onTap(event) {
    event.preventDefault();

    if (!hasPlaced) {
        // Place the portal
        instantTracker.setAnchorPoseFromCameraOffset(0, 0, -3);
        portalGroup.visible = true;
        hasPlaced = true;

        // Update UI
        placementUI.classList.add('hidden');
        portalHud.classList.remove('hidden');

        console.log('Portal placed');
    }
}

function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// =============================================================================
// RESET
// =============================================================================
function resetPortal() {
    hasPlaced = false;
    portalGroup.visible = false;

    // Update UI
    portalHud.classList.add('hidden');
    placementUI.classList.remove('hidden');

    console.log('Portal reset');
}

// =============================================================================
// ANIMATION LOOP
// =============================================================================
function animate(time) {
    requestAnimationFrame(animate);

    // Update camera from device
    camera.updateFrame(renderer);

    // Animate portal
    if (hasPlaced) {
        animatePortal(time);
    }

    // Render
    renderer.render(scene, camera);
}

// =============================================================================
// START
// =============================================================================
startBtn.addEventListener('click', () => {
    startOverlay.classList.add('hidden');
    initAR();
});

resetBtn.addEventListener('click', resetPortal);

console.log('AR Portal ready');
