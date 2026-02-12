//
//  AuthStore.swift
//  life-tracker-ios
//

import Combine
import Foundation
import Supabase

@MainActor
final class AuthStore: ObservableObject {
    @Published var session: Session?
    @Published var currentUser: User?
    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var successMessage: String?

    private var authStateTask: Task<Void, Never>?

    init() {
        authStateTask = Task { [weak self] in
            guard let client = SupabaseClientFactory.client else {
                await MainActor.run { self?.isLoading = false }
                return
            }
            do {
                let session = try await client.auth.session
                await MainActor.run {
                    self?.session = session
                    self?.currentUser = session.user
                    self?.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self?.session = nil
                    self?.currentUser = nil
                    self?.isLoading = false
                }
            }

            for await state in client.auth.authStateChanges {
                await MainActor.run {
                    self?.session = state.session
                    self?.currentUser = state.session?.user
                }
            }
        }
    }

    deinit {
        authStateTask?.cancel()
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        successMessage = nil
        guard let client = SupabaseClientFactory.client else {
            errorMessage = "Supabase not configured. In Xcode: Edit Scheme → Run → Arguments → Environment Variables, add SUPABASE_URL and SUPABASE_ANON_KEY. See SUPABASE_SETUP.md in the project."
            return
        }
        do {
            _ = try await client.auth.signIn(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signUp(email: String, password: String) async {
        errorMessage = nil
        successMessage = nil
        guard let client = SupabaseClientFactory.client else {
            errorMessage = "Supabase not configured. In Xcode: Edit Scheme → Run → Arguments → Environment Variables, add SUPABASE_URL and SUPABASE_ANON_KEY. See SUPABASE_SETUP.md in the project."
            return
        }
        do {
            _ = try await client.auth.signUp(email: email, password: password)
            successMessage = "Check your email to confirm your account."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        errorMessage = nil
        successMessage = nil
        guard let client = SupabaseClientFactory.client else { return }
        try? await client.auth.signOut()
    }

    func clearMessages() {
        errorMessage = nil
        successMessage = nil
    }
}
