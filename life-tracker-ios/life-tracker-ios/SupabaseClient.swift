//
//  SupabaseClient.swift
//  life-tracker-ios
//

import Foundation
import Supabase

enum SupabaseClientFactory {
    private static var _client: SupabaseClient?

    static var client: SupabaseClient? {
        if _client == nil && SupabaseConfig.isConfigured {
            guard let url = URL(string: SupabaseConfig.url) else { return nil }
            _client = SupabaseClient(
                supabaseURL: url,
                supabaseKey: SupabaseConfig.anonKey
            )
        }
        return _client
    }

    /// Reset client (e.g. after config change)
    static func reset() {
        _client = nil
    }
}
