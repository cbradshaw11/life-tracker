//
//  ProfileView.swift
//  life-tracker-ios
//

import Auth
import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authStore: AuthStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("Profile")
                    .font(.title.bold())

                Group {
                    if let email = authStore.currentUser?.email {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Email")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Text(email)
                                .font(.body)
                        }
                    }
                    if let name = authStore.currentUser?.userMetadata["full_name"] as? String, !name.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Name")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Text(name)
                                .font(.body)
                        }
                    }
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))

                Text("Account")
                    .font(.headline)
                Button("Sign out", role: .destructive) {
                    Task { await authStore.signOut() }
                }
                .buttonStyle(.bordered)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthStore())
}
