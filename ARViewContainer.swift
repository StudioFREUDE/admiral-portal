//
//  ARViewContainer.swift
//  ARPortal
//
//  SwiftUI wrapper for RealityKit ARView with plane detection
//

import SwiftUI
import RealityKit
import ARKit
import Combine

struct ARViewContainer: UIViewRepresentable {
    @Binding var statusMessage: String
    @Binding var isPortalPlaced: Bool
    
    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)
        
        // Configure AR session for best tracking
        let configuration = ARWorldTrackingConfiguration()
        
        // Enable horizontal plane detection (floors)
        configuration.planeDetection = [.horizontal]
        
        // Enable Scene Reconstruction for LiDAR devices (if available)
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            configuration.sceneReconstruction = .mesh
        }
        
        // Enable environment texturing for realistic lighting
        configuration.environmentTexturing = .automatic
        
        // Enable frame semantics for depth if available
        if ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth) {
            configuration.frameSemantics.insert(.sceneDepth)
        }
        
        // Run the session
        arView.session.run(configuration)
        
        // Set delegate for plane detection callbacks
        arView.session.delegate = context.coordinator
        
        // Store reference for coordinator
        context.coordinator.arView = arView
        
        // Enable debug options (can be disabled for production)
        // arView.debugOptions = [.showAnchorOrigins, .showAnchorGeometry]
        
        return arView
    }
    
    func updateUIView(_ uiView: ARView, context: Context) {
        // Updates handled by coordinator
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    // MARK: - Coordinator
    
    class Coordinator: NSObject, ARSessionDelegate {
        var parent: ARViewContainer
        var arView: ARView?
        var portalAnchor: AnchorEntity?
        var hasPlacedPortal = false
        var cancellables = Set<AnyCancellable>()
        
        init(_ parent: ARViewContainer) {
            self.parent = parent
        }
        
        // Called when new anchors are added (planes detected)
        func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
            guard !hasPlacedPortal else { return }
            
            for anchor in anchors {
                if let planeAnchor = anchor as? ARPlaneAnchor,
                   planeAnchor.alignment == .horizontal {
                    
                    // Check if plane is large enough (at least 0.5m x 0.5m)
                    let extent = planeAnchor.planeExtent
                    if extent.width > 0.5 && extent.height > 0.5 {
                        placePortal(on: planeAnchor)
                        break
                    }
                }
            }
        }
        
        // Called when anchors are updated
        func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
            guard !hasPlacedPortal else { return }
            
            for anchor in anchors {
                if let planeAnchor = anchor as? ARPlaneAnchor,
                   planeAnchor.alignment == .horizontal {
                    
                    let extent = planeAnchor.planeExtent
                    if extent.width > 0.5 && extent.height > 0.5 {
                        placePortal(on: planeAnchor)
                        break
                    }
                }
            }
        }
        
        private func placePortal(on planeAnchor: ARPlaneAnchor) {
            guard let arView = arView, !hasPlacedPortal else { return }
            hasPlacedPortal = true
            
            // Create anchor at plane center
            let anchorEntity = AnchorEntity(anchor: planeAnchor)
            
            // Create portal entity
            let portalEntity = PortalEntity.create()
            
            // Position portal above the plane (levitating)
            portalEntity.position = SIMD3<Float>(0, 0.5, 0) // 0.5m above ground
            
            // Add portal to anchor
            anchorEntity.addChild(portalEntity)
            
            // Add to scene
            arView.scene.addAnchor(anchorEntity)
            
            // Store reference
            portalAnchor = anchorEntity
            
            // Update UI
            DispatchQueue.main.async {
                self.parent.statusMessage = "Portal Active"
                self.parent.isPortalPlaced = true
            }
            
            print("✅ Portal placed at plane: \(planeAnchor.identifier)")
        }
    }
}
