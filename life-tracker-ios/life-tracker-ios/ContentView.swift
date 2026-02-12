//
//  ContentView.swift
//  life-tracker-ios
//

import Auth
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authStore: AuthStore
    @EnvironmentObject var dataStore: DataStore

    private var isLoggedIn: Bool {
        authStore.currentUser != nil
    }

    private var userId: String {
        authStore.currentUser?.id.uuidString ?? ""
    }

    var body: some View {
        mainContent
            .animation(.default, value: isLoggedIn)
            .onAppear {
                dataStore.userId = authStore.currentUser?.id.uuidString
            }
            .onChange(of: userId) { _, newId in
                dataStore.userId = newId.isEmpty ? nil : newId
            }
    }

    @ViewBuilder
    private var mainContent: some View {
        if authStore.isLoading {
            ProgressView("Loading…")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if authStore.currentUser == nil {
            LoginView()
        } else {
            MainTabView()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthStore())
        .environmentObject(DataStore())
}
