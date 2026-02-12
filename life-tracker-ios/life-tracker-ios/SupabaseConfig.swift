//
//  SupabaseConfig.swift
//  life-tracker-ios
//
//  Replace the placeholder values below with your Supabase project URL and anon key.
//  Do not commit real keys. Consider adding this file to .gitignore or using
//  SupabaseConfig.example as a template.
//

import Foundation

enum SupabaseConfig {
    private static let placeholderURL = "https://your-project-id.supabase.co"
    private static let placeholderKey = "your-anon-key"

    /// Your Supabase project URL (e.g. https://xxxx.supabase.co). Whitespace is trimmed.
    static var url: String {
        let raw = ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? placeholderURL
        return raw.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Your Supabase anon (publishable) key. Whitespace is trimmed.
    static var anonKey: String {
        let raw = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? placeholderKey
        return raw.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static var isConfigured: Bool {
        !url.isEmpty && url != placeholderURL
            && !anonKey.isEmpty && anonKey != placeholderKey
    }
}
