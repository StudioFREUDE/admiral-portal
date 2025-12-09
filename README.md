# AR Portal iOS App

A native iOS AR application that displays a levitating 3D portal hovering over detected floor surfaces.

## Features

- **ARKit World Tracking**: Best-in-class plane detection and tracking
- **RealityKit Rendering**: Modern 3D rendering with PBR materials
- **LiDAR Support**: Enhanced depth sensing on Pro devices
- **Levitating Portal**: Animated ellipse portal that hovers above the floor

## Requirements

- Xcode 15.0+
- iOS 17.0+
- iPhone with ARKit support (iPhone 6s or later)

## Setup

1. Open `ARPortal.xcodeproj` in Xcode
2. Select your development team in Signing & Capabilities
3. Build and run on a physical iOS device (AR requires real device)

## Usage

1. Launch the app
2. Point your camera at a flat surface (floor, table)
3. The portal will automatically appear above the detected plane
4. Walk around to view the portal from different angles

## Architecture

- `ContentView.swift` - Main SwiftUI view with AR container
- `ARViewContainer.swift` - UIViewRepresentable wrapper for ARView
- `PortalEntity.swift` - Custom RealityKit entity for the portal
