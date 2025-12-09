//
//  PortalEntity.swift
//  ARPortal
//
//  Custom RealityKit entity for the levitating portal
//

import RealityKit
import UIKit

class PortalEntity {
    
    /// Creates a levitating ellipse portal entity with animations
    static func create() -> Entity {
        let portalGroup = Entity()
        portalGroup.name = "PortalGroup"
        
        // Create main ellipse (torus shape for portal ring)
        let mainRing = createMainRing()
        portalGroup.addChild(mainRing)
        
        // Create inner glow ring
        let innerRing = createInnerRing()
        portalGroup.addChild(innerRing)
        
        // Create center void (dark ellipse)
        let centerVoid = createCenterVoid()
        portalGroup.addChild(centerVoid)
        
        // Create outer glow
        let outerGlow = createOuterGlow()
        portalGroup.addChild(outerGlow)
        
        // Add floating animation
        addFloatingAnimation(to: portalGroup)
        
        // Add rotation animation to main ring
        addRotationAnimation(to: mainRing)
        
        return portalGroup
    }
    
    // MARK: - Portal Components
    
    private static func createMainRing() -> ModelEntity {
        // Create torus mesh (RealityKit doesn't have torus, so we use a custom approach)
        // For simplicity, using a flattened cylinder ring effect
        let mesh = MeshResource.generateBox(
            width: 1.0,
            height: 0.08,
            depth: 1.0,
            cornerRadius: 0.5
        )
        
        // Purple emissive material
        var material = SimpleMaterial()
        material.color = .init(
            tint: UIColor(red: 0.545, green: 0.361, blue: 0.965, alpha: 1.0), // #8B5CF6
            texture: nil
        )
        material.roughness = 0.3
        material.metallic = 0.7
        
        let entity = ModelEntity(mesh: mesh, materials: [material])
        entity.name = "MainRing"
        
        // Make it an ellipse by scaling
        entity.scale = SIMD3<Float>(1.0, 1.0, 0.6)
        
        return entity
    }
    
    private static func createInnerRing() -> ModelEntity {
        let mesh = MeshResource.generateBox(
            width: 0.7,
            height: 0.04,
            depth: 0.7,
            cornerRadius: 0.35
        )
        
        var material = SimpleMaterial()
        material.color = .init(
            tint: UIColor(red: 0.769, green: 0.710, blue: 0.992, alpha: 0.8), // #C4B5FD
            texture: nil
        )
        material.roughness = 0.2
        material.metallic = 0.8
        
        let entity = ModelEntity(mesh: mesh, materials: [material])
        entity.name = "InnerRing"
        entity.scale = SIMD3<Float>(1.0, 1.0, 0.6)
        entity.position.y = 0.02
        
        return entity
    }
    
    private static func createCenterVoid() -> ModelEntity {
        // Flat ellipse for the portal "void" center
        let mesh = MeshResource.generatePlane(width: 0.5, depth: 0.3)
        
        var material = SimpleMaterial()
        material.color = .init(
            tint: UIColor(red: 0.04, green: 0.0, blue: 0.08, alpha: 0.95), // Dark void
            texture: nil
        )
        
        let entity = ModelEntity(mesh: mesh, materials: [material])
        entity.name = "CenterVoid"
        entity.position.y = 0.05
        
        return entity
    }
    
    private static func createOuterGlow() -> ModelEntity {
        let mesh = MeshResource.generateBox(
            width: 1.3,
            height: 0.02,
            depth: 1.3,
            cornerRadius: 0.65
        )
        
        var material = SimpleMaterial()
        material.color = .init(
            tint: UIColor(red: 0.867, green: 0.839, blue: 0.996, alpha: 0.4), // #DDD6FE
            texture: nil
        )
        material.roughness = 0.1
        material.metallic = 0.9
        
        let entity = ModelEntity(mesh: mesh, materials: [material])
        entity.name = "OuterGlow"
        entity.scale = SIMD3<Float>(1.0, 1.0, 0.6)
        entity.position.y = -0.02
        
        return entity
    }
    
    // MARK: - Animations
    
    private static func addFloatingAnimation(to entity: Entity) {
        // Create up-down floating animation
        let duration: TimeInterval = 2.0
        let amplitude: Float = 0.05
        
        // Use Transform animation
        let startTransform = entity.transform
        var upTransform = startTransform
        upTransform.translation.y += amplitude
        
        // Animate up
        entity.move(
            to: upTransform,
            relativeTo: entity.parent,
            duration: duration,
            timingFunction: .easeInOut
        )
        
        // Loop animation using a timer
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            self.continueFloatingAnimation(entity: entity, goingUp: false, amplitude: amplitude, duration: duration)
        }
    }
    
    private static func continueFloatingAnimation(entity: Entity, goingUp: Bool, amplitude: Float, duration: TimeInterval) {
        var transform = entity.transform
        transform.translation.y += goingUp ? amplitude : -amplitude
        
        entity.move(
            to: transform,
            relativeTo: entity.parent,
            duration: duration,
            timingFunction: .easeInOut
        )
        
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            self.continueFloatingAnimation(entity: entity, goingUp: !goingUp, amplitude: amplitude, duration: duration)
        }
    }
    
    private static func addRotationAnimation(to entity: Entity) {
        // Slow rotation around Y axis
        let duration: TimeInterval = 10.0
        
        var transform = entity.transform
        transform.rotation = simd_quatf(angle: .pi * 2, axis: SIMD3<Float>(0, 1, 0))
        
        entity.move(
            to: transform,
            relativeTo: entity.parent,
            duration: duration,
            timingFunction: .linear
        )
        
        // Loop
        DispatchQueue.main.asyncAfter(deadline: .now() + duration) {
            entity.transform.rotation = simd_quatf(angle: 0, axis: SIMD3<Float>(0, 1, 0))
            self.addRotationAnimation(to: entity)
        }
    }
}
