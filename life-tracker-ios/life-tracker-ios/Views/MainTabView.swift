//
//  MainTabView.swift
//  life-tracker-ios
//

import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            CalendarTabView()
                .tabItem { Label("Calendar", systemImage: "calendar") }
            SettingsView()
                .tabItem { Label("Entry Types", systemImage: "list.bullet") }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.circle") }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(DataStore())
        .environmentObject(AuthStore())
}
