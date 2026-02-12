//
//  life_tracker_iosApp.swift
//  life-tracker-ios
//

import SwiftUI

@main
struct life_tracker_iosApp: App {
    @StateObject private var authStore = AuthStore()
    @StateObject private var dataStore = DataStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authStore)
                .environmentObject(dataStore)
        }
    }
}
