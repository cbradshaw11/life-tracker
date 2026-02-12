//
//  EntriesService.swift
//  life-tracker-ios
//

import Foundation
import Supabase

struct EntriesService {
    private let client: SupabaseClient?

    init(client: SupabaseClient? = SupabaseClientFactory.client) {
        self.client = client
    }

    private func requireClient() throws -> SupabaseClient {
        guard let client else {
            throw NSError(domain: "LifeTracker", code: -1, userInfo: [NSLocalizedDescriptionKey: "Supabase is not configured. Set your project URL and anon key in SupabaseConfig."])
        }
        return client
    }

    func getEntries(userId: String) async throws -> [Entry] {
        let client = try requireClient()
        let response: [EntryRow] = try await client
            .from("entries")
            .select("id, date, track_type_id, value, note, metadata")
            .eq("user_id", value: userId)
            .order("date", ascending: true)
            .execute()
            .value
        return response.map { mapRow($0) }
    }

    func addEntry(userId: String, entry: NewEntry) async throws -> Entry {
        let client = try requireClient()
        let payload = EntryInsert(
            user_id: userId,
            date: entry.date,
            track_type_id: entry.trackTypeId,
            value: entry.value,
            note: entry.note,
            metadata: entry.metadata
        )
        let response: EntryRow = try await client
            .from("entries")
            .insert(payload)
            .select("id, date, track_type_id, value, note, metadata")
            .single()
            .execute()
            .value
        return mapRow(response)
    }

    func updateEntry(userId: String, id: String, updates: EntryUpdates) async throws -> Entry? {
        let client = try requireClient()
        let payload = EntryUpdatePayload(
            date: updates.date,
            track_type_id: updates.trackTypeId,
            value: updates.value,
            note: updates.note,
            metadata: updates.metadata
        )
        if payload.isEmpty { return try await getEntries(userId: userId).first { $0.id == id } }
        let response: EntryRow? = try await client
            .from("entries")
            .update(payload)
            .eq("id", value: id)
            .eq("user_id", value: userId)
            .select("id, date, track_type_id, value, note, metadata")
            .single()
            .execute()
            .value
        return response.map { mapRow($0) }
    }

    func deleteEntry(userId: String, id: String) async throws -> Bool {
        let client = try requireClient()
        try await client
            .from("entries")
            .delete()
            .eq("id", value: id)
            .eq("user_id", value: userId)
            .execute()
        return true
    }
}

// MARK: - DTOs and mapping

private struct EntryRow: Codable {
    let id: String
    let date: String
    let track_type_id: String
    let value: Double?
    let note: String?
    let metadata: [String: String]?
}

private func mapRow(_ row: EntryRow) -> Entry {
    Entry(
        id: row.id,
        date: row.date,
        trackTypeId: row.track_type_id,
        value: row.value,
        note: row.note,
        metadata: row.metadata.flatMap { $0.isEmpty ? nil : $0 }
    )
}

struct NewEntry {
    var date: String
    var trackTypeId: String
    var value: Double?
    var note: String?
    var metadata: [String: String]?
}

struct EntryUpdates {
    var date: String?
    var trackTypeId: String?
    var value: Double?
    var note: String?
    var metadata: [String: String]?
}

private struct EntryInsert: Encodable {
    let user_id: String
    let date: String
    let track_type_id: String
    let value: Double?
    let note: String?
    let metadata: [String: String]?
}

private struct EntryUpdatePayload: Encodable {
    let date: String?
    let track_type_id: String?
    let value: Double?
    let note: String?
    let metadata: [String: String]?

    var isEmpty: Bool {
        date == nil && track_type_id == nil && value == nil && note == nil && metadata == nil
    }

    enum CodingKeys: String, CodingKey {
        case date, note, metadata
        case track_type_id, value
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(date, forKey: .date)
        try c.encodeIfPresent(track_type_id, forKey: .track_type_id)
        try c.encodeIfPresent(value, forKey: .value)
        try c.encodeIfPresent(note, forKey: .note)
        try c.encodeIfPresent(metadata, forKey: .metadata)
    }
}
