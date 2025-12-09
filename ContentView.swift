//
//  ContentView.swift
//  ARPortal
//
//  Main UI container with AR view and status overlay
//

import SwiftUI
import RealityKit

struct ContentView: View {
    @State private var statusMessage = "Searching for floor..."
    @State private var isPortalPlaced = false
    
    var body: some View {
        ZStack {
            // AR View
            ARViewContainer(
                statusMessage: $statusMessage,
                isPortalPlaced: $isPortalPlaced
            )
            .edgesIgnoringSafeArea(.all)
            
            // Status Overlay
            VStack {
                Spacer()
                
                // Status Card
                HStack {
                    if isPortalPlaced {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    } else {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    }
                    
                    Text(statusMessage)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(
                    Capsule()
                        .fill(.ultraThinMaterial)
                        .shadow(color: .black.opacity(0.3), radius: 10, y: 5)
                )
                .padding(.bottom, 50)
            }
        }
    }
}

#Preview {
    ContentView()
}
