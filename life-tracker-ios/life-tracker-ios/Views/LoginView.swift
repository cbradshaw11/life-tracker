//
//  LoginView.swift
//  life-tracker-ios
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authStore: AuthStore
    @State private var mode: AuthMode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false

    enum AuthMode {
        case signIn, signUp
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Life Tracker")
                    .font(.title.bold())
                    .padding(.bottom, 8)

                Picker("Mode", selection: $mode) {
                    Text("Sign in").tag(AuthMode.signIn)
                    Text("Sign up").tag(AuthMode.signUp)
                }
                .pickerStyle(.segmented)
                .onChange(of: mode) { _, _ in
                    authStore.clearMessages()
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Email")
                        .font(.subheadline.weight(.medium))
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                        .textFieldStyle(.roundedBorder)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Password")
                        .font(.subheadline.weight(.medium))
                    SecureField("Password", text: $password)
                        .textContentType(mode == .signIn ? .password : .newPassword)
                        .textFieldStyle(.roundedBorder)
                    if mode == .signUp {
                        Text("At least 6 characters")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                if let error = authStore.errorMessage {
                    Text(error)
                        .font(.subheadline)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                if let message = authStore.successMessage {
                    Text(message)
                        .font(.subheadline)
                        .foregroundStyle(.green)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button {
                    submit()
                } label: {
                    Group {
                        if isLoading {
                            Text("Please wait…")
                        } else {
                            Text(mode == .signIn ? "Sign in" : "Sign up")
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading || email.isEmpty || password.isEmpty)
            }
            .padding(24)
            .frame(maxWidth: 400)
        }
        .scrollDismissesKeyboard(.interactively)
    }

    private func submit() {
        authStore.clearMessages()
        isLoading = true
        Task {
            if mode == .signIn {
                await authStore.signIn(email: email, password: password)
            } else {
                await authStore.signUp(email: email, password: password)
            }
            await MainActor.run { isLoading = false }
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthStore())
}
